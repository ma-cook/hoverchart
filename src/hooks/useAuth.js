import { useState, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { validateAuthToken } from '../services/authService';

export function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    let unsubscribe;

    const handleTokenFromURL = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        const authToken = params.get('auth_token');

        if (uid && authToken) {
          const customToken = await validateAuthToken(authToken);
          if (customToken) {
            await signInWithCustomToken(auth, customToken);
            // Remove URL parameters after successful login
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Authentication error:', error);
        return false;
      }
    };

    const initializeAuth = async () => {
      // First try to authenticate with URL parameters
      const authenticatedWithURL = await handleTokenFromURL();

      if (!authenticatedWithURL) {
        // If URL auth failed or wasn't attempted, check current auth state
        unsubscribe = auth.onAuthStateChanged((user) => {
          setAuthState({
            isAuthenticated: !!user,
            isLoading: false,
            user,
          });
        });
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
