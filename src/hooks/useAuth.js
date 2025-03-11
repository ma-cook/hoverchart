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
    let unsubscribe = null;
    let isMounted = true;

    const handleTokenFromURL = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        const authToken = params.get('auth_token');

        if (uid && authToken) {
          console.log(
            'Found auth parameters in URL, attempting to authenticate'
          );
          const customToken = await validateAuthToken(authToken);

          if (customToken && isMounted) {
            console.log('Got custom token, signing in with it');
            await signInWithCustomToken(auth, customToken);

            // Check if we got signed in successfully
            const user = auth.currentUser;
            if (user) {
              console.log('Successfully signed in with custom token');
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
              });

              // Remove URL parameters
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );

              return true;
            }
          }
        }
        return false;
      } catch (error) {
        console.error('Authentication error:', error);
        return false;
      }
    };

    const setupAuthListener = () => {
      // Listen for auth state changes
      unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed - user:', user ? user.uid : 'null');

        if (isMounted) {
          setAuthState({
            isAuthenticated: !!user,
            isLoading: false,
            user,
          });
        }
      });
    };

    const initializeAuth = async () => {
      // First check if we're already logged in
      if (auth.currentUser) {
        console.log('Already logged in as', auth.currentUser.uid);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: auth.currentUser,
        });
        return;
      }

      // Try to authenticate with URL parameters
      const authenticatedWithURL = await handleTokenFromURL();

      if (!authenticatedWithURL) {
        // Set up the auth listener to handle normal auth flow
        console.log('Setting up auth listener');
        setupAuthListener();
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
