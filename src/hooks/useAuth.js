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

    const handleTokenAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        const token = params.get('token');

        if (!uid || !token) {
          console.log('No URL auth parameters found');
          return false;
        }

        console.log('Starting token validation...');
        const customToken = await validateAuthToken(token);

        if (!customToken) {
          console.error('Failed to get custom token');
          return false;
        }

        console.log('Signing in with custom token...');
        try {
          await signInWithCustomToken(auth, customToken);
          // Wait for auth state to update
          await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 5000);
            const unsubscribe = auth.onAuthStateChanged((user) => {
              if (user) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(true);
              }
            });
          });

          // Clear URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          return true;
        } catch (signInError) {
          console.error('Error signing in with custom token:', signInError);
          return false;
        }
      } catch (error) {
        console.error('Token auth failed:', error);
        return false;
      }
    };

    const initAuth = async () => {
      if (auth.currentUser) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: auth.currentUser,
        });
        return;
      }

      let success = false;
      try {
        success = await handleTokenAuth();
      } catch (e) {
        console.error('Error during token auth:', e);
      }

      if (!success) {
        unsubscribe = auth.onAuthStateChanged((user) => {
          setAuthState({
            isAuthenticated: !!user,
            isLoading: false,
            user,
          });
        });
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
