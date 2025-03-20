import { useState, useEffect } from 'react';
import { observeAuthState, handleUrlAuth } from '../services/authService';

/**
 * Custom hook to manage authentication state
 */
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCheckingUrlAuth, setIsCheckingUrlAuth] = useState(true);

  // Auth observer effect
  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // URL auth check
  useEffect(() => {
    const checkUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (uid && token) {
        setIsCheckingUrlAuth(true);
        try {
          await handleUrlAuth();
        } catch {
          // Handle error silently
        } finally {
          setIsCheckingUrlAuth(false);
        }
      } else {
        setIsCheckingUrlAuth(false);
      }
    };

    checkUrlAuth();
  }, []);

  // Update auth check state
  useEffect(() => {
    if (user || !isCheckingUrlAuth) {
      setIsCheckingUrlAuth(false);
    }
  }, [user, isCheckingUrlAuth]);

  return { user, isAuthReady, isCheckingUrlAuth };
}
