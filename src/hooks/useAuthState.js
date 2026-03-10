import { useEffect } from 'react';
import { useAuthStore } from '../stores';

export function useAuthState() {
  // Use auth store
  const user = useAuthStore((state) => state.authState.user);
  const isAuthReady = useAuthStore((state) => state.authState.isAuthReady);
  const isCheckingUrlAuth = useAuthStore(
    (state) => state.authState.isCheckingUrlAuth
  );
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const cleanup = useAuthStore((state) => state.cleanup);

  useEffect(() => {
    // Initialize auth when hook is mounted
    initializeAuth();

    // Return cleanup function
    return cleanup;
  }, [initializeAuth, cleanup]);

  return { user, isAuthReady, isCheckingUrlAuth };
}
