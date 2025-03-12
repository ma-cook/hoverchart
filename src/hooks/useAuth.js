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
    let hasAttemptedUrlAuth = false;

    const handleTokenAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (!uid || !token) return false;

      console.log('Found URL auth parameters, starting validation...');
      try {
        const customToken = await validateAuthToken(token);
        if (!customToken) {
          console.error('Failed to obtain custom token');
          return false;
        }

        console.log('Got custom token, signing in...');
        await signInWithCustomToken(auth, customToken);

        // Wait for auth state to update
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.error('Auth state update timeout');
            resolve(false);
          }, 5000);

          const unsub = auth.onAuthStateChanged((user) => {
            if (user) {
              console.log('Successfully signed in:', user.uid);
              clearTimeout(timeout);
              unsub();
              resolve(true);
            }
          });
        });
      } catch (error) {
        console.error('Token auth failed:', error);
        return false;
      }
    };

    const setupAuthListener = () => {
      console.log('Setting up auth listener');
      return auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user?.uid || 'null');
        setAuthState({
          isAuthenticated: !!user,
          isLoading: false,
          user,
        });
      });
    };

    const initAuth = async () => {
      if (!hasAttemptedUrlAuth) {
        hasAttemptedUrlAuth = true;
        const success = await handleTokenAuth();

        if (success) {
          // Clear URL parameters after successful auth
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }

      // Set up regular auth listener
      unsubscribe = setupAuthListener();
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
