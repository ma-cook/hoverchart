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
    console.log('Auth hook initialized');
    let unsubscribe = null;
    let isProcessing = false;

    // Setup authentication state listener
    const setupAuthListener = () => {
      console.log('Setting up auth state listener');
      return auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'null');

        if (user) {
          console.log('User is authenticated:', user.uid);
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
          });

          // Clean up URL parameters if present
          const params = new URLSearchParams(window.location.search);
          if (params.has('uid') || params.has('auth_token')) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } else if (!isProcessing) {
          // Only update to unauthenticated if we're not in the middle of authenticating
          console.log('No user authenticated, checking URL parameters...');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      });
    };

    // Handle URL parameters for authentication
    const handleURLAuth = async () => {
      try {
        isProcessing = true;
        console.log('Checking URL for auth parameters');

        // Check if user is already logged in
        if (auth.currentUser) {
          console.log('Already authenticated as:', auth.currentUser.uid);
          isProcessing = false;
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: auth.currentUser,
          });
          return true;
        }

        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        const authToken = params.get('auth_token');

        if (!uid || !authToken) {
          console.log('No auth parameters in URL');
          isProcessing = false;
          return false;
        }

        console.log(
          `Found URL auth parameters for uid: ${uid.substring(0, 5)}...`
        );

        try {
          console.log('Validating auth token');
          const customToken = await validateAuthToken(authToken);

          if (customToken) {
            console.log('Token validated successfully, signing in');
            await signInWithCustomToken(auth, customToken);

            // Wait briefly to ensure auth state updates
            await new Promise((resolve) => setTimeout(resolve, 500));

            const user = auth.currentUser;
            if (user) {
              console.log(
                'Successfully signed in with custom token:',
                user.uid
              );

              // Remove URL parameters
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );

              isProcessing = false;
              return true;
            }
          } else {
            console.error('Failed to validate token');
          }
        } catch (error) {
          console.error('Error during token validation:', error);
        }

        isProcessing = false;
        return false;
      } catch (error) {
        console.error('Error in URL auth flow:', error);
        isProcessing = false;
        return false;
      }
    };

    const initAuth = async () => {
      // First try URL authentication
      const urlAuthSuccess = await handleURLAuth();

      // Setup regular auth listener if URL auth didn't succeed
      if (!urlAuthSuccess) {
        unsubscribe = setupAuthListener();
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
