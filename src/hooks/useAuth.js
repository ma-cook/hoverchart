import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '../stores';

const selectAuth = (state) => ({
  authState: state.authState,
  initializeAuth: state.initializeAuth,
});

export function useAuth() {
  const { authState, initializeAuth } = useAuthStore(selectAuth, shallow);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return authState;
}
