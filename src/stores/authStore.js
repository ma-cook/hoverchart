import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { auth } from '../firebase';
import {
  handlePostLoginRedirect,
} from '../services/authService';

const useAuthStore = createWithEqualityFn((set, get) => ({
  // Auth state
  authState: {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    connectionState: 'unknown',
    isAuthReady: false,
    isCheckingUrlAuth: false,
  },
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

    const initAuth = async () => {
      // Check for URL parameters first
      const params = new URLSearchParams(window.location.search);
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

  checkUrlAuth: () => {
    // No-op: legacy URL auth via exchangeAuthCode has been removed
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
