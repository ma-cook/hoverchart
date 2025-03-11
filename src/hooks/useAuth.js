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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
        });
      } else {
        // Check for URL parameters if not already authenticated
        const handleTokenFromURL = async () => {
          try {
            const params = new URLSearchParams(window.location.search);
            const uid = params.get('uid');
            const authToken = params.get('auth_token');

            if (!uid || !authToken) {
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
              });
              return;
            }

            // Validate the token
            const customToken = await validateAuthToken(authToken);
            if (customToken) {
              await signInWithCustomToken(auth, customToken);
              // onAuthStateChanged will update the state
            } else {
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
              });
            }
          } catch (error) {
            console.error('Authentication error:', error);
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
            });
          }
        };

        handleTokenFromURL();
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  return authState;
}
