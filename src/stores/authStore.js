import { createWithEqualityFn } from 'zustand/traditional';
import {
  loadTokens,
  setTokens,
  clearTokens,
  api,
  connectSocket,
  disconnectSocket,
} from '../api-client';

const GIS_CLIENT_ID = import.meta.env.VITE_GIS_CLIENT_ID;
let tokenClient = null;

function initGIS() {
  if (!window.google?.accounts?.oauth2 || tokenClient) return;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GIS_CLIENT_ID,
    scope: 'openid email profile',
    callback: '', // will be set per-call
  });
}

function getGISAccessToken() {
  return new Promise((resolve, reject) => {
    initGIS();
    if (!tokenClient) {
      reject(new Error('GIS not loaded'));
      return;
    }
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.access_token);
      }
    };
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

const useAuthStore = createWithEqualityFn((set, get) => ({
  authState: {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    isAuthReady: false,
    // Admin scopes, resolved from GET /api/auth/verify. These are separate
    // booleans on purpose: `isAdmin` is platform-wide (all users) and
    // `isOrgAdmin` means the user administers at least one organization and so
    // can see just that organization's members.
    isAdmin: false,
    isOrgAdmin: false,
  },

  setAuthState: (updates) => {
    set((s) => ({ authState: { ...s.authState, ...updates } }));
  },

  initializeAuth: () => {
    const tokens = loadTokens();
    if (tokens.accessToken) {
      try {
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        set({
          authState: {
            isAuthenticated: true,
            isLoading: false,
            user: {
              sub: payload.sub,
              uid: payload.sub,
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
              displayName: payload.name,
              photoURL: payload.picture,
              isGuest: payload.isGuest === true,
            },
            // The token itself carries no admin claim, so start pessimistic and
            // let the verify call below upgrade it. Guest tokens can never be
            // admins.
            isAdmin: false,
            isOrgAdmin: false,
            isAuthReady: true,
          },
        });
        get().refreshAdminScopes();
        return;
      } catch { /* fall through */ }
    }
    set({ authState: { isAuthenticated: false, isLoading: false, user: null, isAdmin: false, isOrgAdmin: false, isAuthReady: true } });
  },

  // Ask the server which admin scopes the current session holds. Kept
  // non-blocking so it never delays first paint, and intentionally separate
  // from the auth decision itself: if it fails the user is still signed in,
  // they just don't see the admin entry point.
  refreshAdminScopes: async () => {
    try {
      const data = await api.get('/api/auth/verify');
      set((s) => ({
        authState: {
          ...s.authState,
          isAdmin: data?.isAdmin === true,
          isOrgAdmin: data?.isOrgAdmin === true,
        },
      }));
      return { isAdmin: data?.isAdmin === true, isOrgAdmin: data?.isOrgAdmin === true };
    } catch {
      set((s) => ({ authState: { ...s.authState, isAdmin: false, isOrgAdmin: false } }));
      return { isAdmin: false, isOrgAdmin: false };
    }
  },

  signInWithGoogle: async () => {
    try {
      set((s) => ({ authState: { ...s.authState, isLoading: true } }));
      const accessToken = await getGISAccessToken();
      const data = await api.post('/api/auth/google', { accessToken });
      setTokens(data.accessToken, data.refreshToken);
      set({
        authState: {
          isAuthenticated: true,
          isLoading: false,
          user: { ...data.user, sub: data.user.id, uid: data.user.id, displayName: data.user.display_name, photoURL: data.user.photo_url },
          isAdmin: false,
          isOrgAdmin: false,
          isAuthReady: true,
        },
      });
      await get().refreshAdminScopes();
      connectSocket();
    } catch (err) {
      set((s) => ({ authState: { ...s.authState, isLoading: false } }));
      throw err;
    }
  },

  signInAsGuest: async () => {
    try {
      set((s) => ({ authState: { ...s.authState, isLoading: true } }));
      const data = await api.post('/api/auth/guest');
      setTokens(data.accessToken, data.refreshToken);
      set({
        authState: {
          isAuthenticated: true,
          isLoading: false,
          user: { sub: data.userId, uid: data.userId, name: 'Guest', displayName: 'Guest', photoURL: null, isGuest: true },
          isAdmin: false,
          isOrgAdmin: false,
          isAuthReady: true,
        },
      });
      connectSocket();
    } catch (err) {
      set((s) => ({ authState: { ...s.authState, isLoading: false } }));
      throw err;
    }
  },

  signOut: () => {
    clearTokens();
    disconnectSocket();
    set({
      authState: {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        isAdmin: false,
        isOrgAdmin: false,
        isAuthReady: true,
      },
    });
  },

  getUser: () => get().authState.user,
  getIsAuthenticated: () => get().authState.isAuthenticated,
  getIsLoading: () => get().authState.isLoading,
}));

export default useAuthStore;
