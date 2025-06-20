import { useEffect } from 'react';
import { useAuthStore } from '../stores';

export function useAuth() {
  // Use auth store
  const authState = useAuthStore((state) => state.authState);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const cleanup = useAuthStore((state) => state.cleanup);

  useEffect(() => {
    // Initialize auth when hook is mounted
    initializeAuth();

    // Return cleanup function
    return cleanup;
  }, [initializeAuth, cleanup]);

  return authState;
}
