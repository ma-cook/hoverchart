import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '../stores';

// Module-level selector — single subscription instead of three
const selectAuth = (state) => ({
  authState: state.authState,
  initializeAuth: state.initializeAuth,
  cleanup: state.cleanup,
});

export function useAuth() {
  const { authState, initializeAuth, cleanup } = useAuthStore(selectAuth, shallow);

  useEffect(() => {
    // Initialize auth when hook is mounted
    initializeAuth();

    // Return cleanup function
    return cleanup;
  }, [initializeAuth, cleanup]);

  return authState;
}
