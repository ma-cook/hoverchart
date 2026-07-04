import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '../stores';

// Module-level selector — single subscription instead of six
const selectAuthState = (state) => ({
  user: state.authState.user,
  isAuthReady: state.authState.isAuthReady,
  initializeAuth: state.initializeAuth,
});

export function useAuthState() {
  const { user, isAuthReady, initializeAuth } =
    useAuthStore(selectAuthState, shallow);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return { user, isAuthReady, isCheckingUrlAuth: false };
}
