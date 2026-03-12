import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '../stores';

// Module-level selector — single subscription instead of six
const selectAuthState = (state) => ({
  user: state.authState.user,
  isAuthReady: state.authState.isAuthReady,
  isCheckingUrlAuth: state.authState.isCheckingUrlAuth,
  initializeAuth: state.initializeAuth,
  checkUrlAuth: state.checkUrlAuth,
  cleanup: state.cleanup,
});

export function useAuthState() {
  const { user, isAuthReady, isCheckingUrlAuth, initializeAuth, checkUrlAuth, cleanup } =
    useAuthStore(selectAuthState, shallow);

  useEffect(() => {
    // Initialize auth when hook is mounted
    initializeAuth();

    // Return cleanup function
    return cleanup;
  }, [initializeAuth, cleanup]);

  useEffect(() => {
    // Check URL auth on mount
    checkUrlAuth();
  }, [checkUrlAuth]);

  return { user, isAuthReady, isCheckingUrlAuth };
}
