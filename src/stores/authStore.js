import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
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

function getGISIdToken() {
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
        resolve(response.id_token);
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
            user: { sub: payload.sub, name: payload.name, email: payload.email, picture: payload.picture },
            isAuthReady: true,
          },
        });
        return;
      } catch { /* fall through */ }
    }
    set({ authState: { isAuthenticated: false, isLoading: false, user: null, isAuthReady: true } });
  },

  signInWithGoogle: async () => {
    try {
      set((s) => ({ authState: { ...s.authState, isLoading: true } }));
      const idToken = await getGISIdToken();
      const data = await api.post('/api/auth/google', { idToken });
      setTokens(data.accessToken, data.refreshToken);
      set({
        authState: {
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          isAuthReady: true,
        },
      });
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
          user: { sub: data.user.sub, name: data.user.name, isGuest: true },
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
      authState: { isAuthenticated: false, isLoading: false, user: null, isAuthReady: true },
    });
  },

  getUser: () => get().authState.user,
  getIsAuthenticated: () => get().authState.isAuthenticated,
  getIsLoading: () => get().authState.isLoading,
}));

export default useAuthStore;
