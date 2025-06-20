import { create } from 'zustand';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import {
  validateAuthToken,
  handlePostLoginRedirect,
  handleUrlAuth,
} from '../services/authService';

const useAuthStore = create((set, get) => ({
  // Auth state
  authState: {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    connectionState: 'unknown',
    isAuthReady: false,
    isCheckingUrlAuth: true,
  },

  // Internal state
  hasAttemptedUrlAuth: false,
  connectionMonitor: null,
  unsubscribe: null,

  // Actions
  setAuthState: (updates) => {
    set((state) => ({
      authState: {
        ...state.authState,
        ...updates,
      },
    }));
  },

  updateAuthProperty: (property, value) => {
    set((state) => ({
      authState: {
        ...state.authState,
        [property]: value,
      },
    }));
  },

  setHasAttemptedUrlAuth: (value) => {
    set({ hasAttemptedUrlAuth: value });
  },

  setConnectionMonitor: (monitor) => {
    set({ connectionMonitor: monitor });
  },

  setUnsubscribe: (unsubscribeFn) => {
    set({ unsubscribe: unsubscribeFn });
  },

  // Auth actions
  initializeAuth: () => {
    const state = get();

    // Monitor Firebase connection status
    const monitorConnection = () => {
      if (window.firebase && window.firebase.database) {
        const connRef = window.firebase.database().ref('.info/connected');
        const connectionHandler = (snap) => {
          const isConnected = snap.val() === true;
          state.updateAuthProperty(
            'connectionState',
            isConnected ? 'connected' : 'disconnected'
          );

          if (!isConnected) {
            console.log('Firebase connection lost, preparing for reconnection');
          }
        };

        connRef.on('value', connectionHandler);
        return connectionHandler;
      }
      return null;
    };

    // Handle URL authentication
    const handleUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (!uid || !token) return false;

      try {
        console.log('Starting token auth with UID:', uid);
        const customToken = await validateAuthToken(token);

        if (!customToken) {
          console.error('Token validation failed');
          return false;
        }

        console.log('Got custom token, signing in...');
        await signInWithCustomToken(auth, customToken);

        // Wait for auth to complete
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.error('Auth state update timeout');
            resolve(false);
          }, 5000);

          const authUnsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              console.log('URL auth successful:', user.uid);
              clearTimeout(timeout);
              authUnsubscribe();
              resolve(true);
            }
          });
        });
      } catch (error) {
        console.error('Token auth error:', error);
        return false;
      }
    };

    const initAuth = async () => {
      // Check for URL parameters first
      const params = new URLSearchParams(window.location.search);
      if (
        !state.hasAttemptedUrlAuth &&
        params.has('uid') &&
        params.has('token')
      ) {
        state.setHasAttemptedUrlAuth(true);
        console.log('Found URL auth parameters, attempting auth...');

        try {
          const success = await handleUrlAuth();
          if (success) {
            console.log('URL authentication successful');
            // Preserve spaceId parameter when cleaning URL
            const params = new URLSearchParams(window.location.search);
            const spaceId = params.get('spaceId');

            let newUrl = window.location.pathname;
            if (spaceId) {
              newUrl += `?spaceId=${encodeURIComponent(spaceId)}`;
            }

            window.history.replaceState({}, document.title, newUrl);
          } else {
            console.error('URL authentication failed');
          }
        } catch (error) {
          console.error('Error during URL auth:', error);
        }
      }

      // Set up auth state listener
      const unsubscribeFn = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user?.uid || 'null');

        // Store in window for components that need current user info
        window.currentUser = user;

        if (user) {
          // Get public space context if it exists
          const isPublicSpace = !!(
            window.publicAccessSpace && window.currentSpaceOwner
          );

          if (isPublicSpace) {
            console.log(
              'Maintaining public space context after auth state change'
            );
          }

          // Handle post-login redirect but prevent actual redirect
          handlePostLoginRedirect();
        }

        state.setAuthState({
          isAuthenticated: !!user,
          isLoading: false,
          user,
          isAuthReady: true,
          isCheckingUrlAuth: false,
        });

        // Initialize connection monitoring on successful auth
        if (user && !state.connectionMonitor) {
          const monitor = monitorConnection();
          state.setConnectionMonitor(monitor);
        }
      });

      state.setUnsubscribe(unsubscribeFn);
    };

    initAuth();
  },

  // Check URL auth
  checkUrlAuth: async () => {
    const state = get();
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    const token = params.get('token');

    if (uid && token) {
      state.updateAuthProperty('isCheckingUrlAuth', true);
      try {
        await handleUrlAuth();
      } catch {
        // Handle error silently
      } finally {
        state.updateAuthProperty('isCheckingUrlAuth', false);
      }
    } else {
      state.updateAuthProperty('isCheckingUrlAuth', false);
    }
  },

  // Cleanup function
  cleanup: () => {
    const state = get();

    if (state.unsubscribe) {
      state.unsubscribe();
    }

    if (state.connectionMonitor) {
      // Clean up connection monitoring
      if (window.firebase && window.firebase.database) {
        window.firebase
          .database()
          .ref('.info/connected')
          .off('value', state.connectionMonitor);
      }
    }

    // Reset state
    set({
      hasAttemptedUrlAuth: false,
      connectionMonitor: null,
      unsubscribe: null,
    });
  },

  // Selectors
  getAuthState: () => {
    const state = get();
    return state.authState;
  },

  getUser: () => {
    const state = get();
    return state.authState.user;
  },

  getIsAuthenticated: () => {
    const state = get();
    return state.authState.isAuthenticated;
  },

  getIsLoading: () => {
    const state = get();
    return state.authState.isLoading;
  },

  getIsAuthReady: () => {
    const state = get();
    return state.authState.isAuthReady;
  },

  getIsCheckingUrlAuth: () => {
    const state = get();
    return state.authState.isCheckingUrlAuth;
  },

  getConnectionState: () => {
    const state = get();
    return state.authState.connectionState;
  },
}));

export default useAuthStore;
