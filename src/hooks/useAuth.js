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
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const handleTokenAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        const token = params.get('token');

        if (!uid || !token) return false;

        setIsProcessingToken(true);
        console.log('Processing token auth...');

        const customToken = await validateAuthToken(token);
        if (!customToken) {
          console.error('Failed to get custom token');
          return false;
        }

        try {
          await signInWithCustomToken(auth, customToken);
          // Wait for auth state to update
          const user = await new Promise((resolve) => {
            const unsub = auth.onAuthStateChanged((u) => {
              if (u) {
                unsub();
                resolve(u);
              }
            });
            // Timeout after 5 seconds
            setTimeout(() => {
              unsub();
              resolve(null);
            }, 5000);
          });

          if (user) {
            console.log('Successfully authenticated with token');
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
            return true;
          }
        } catch (error) {
          console.error('Error signing in with custom token:', error);
        }
        return false;
      } catch (error) {
        console.error('Token auth error:', error);
        return false;
      } finally {
        setIsProcessingToken(false);
      }
    };

    const setupAuthListener = () => {
      return auth.onAuthStateChanged((user) => {
        if (!isProcessingToken) {
          console.log('Auth state updated:', user?.uid || 'null');
          setAuthState({
            isAuthenticated: !!user,
            isLoading: false,
            user,
          });
        }
      });
    };

    const initAuth = async () => {
      // First try the token auth
      if (await handleTokenAuth()) {
        console.log('Token auth successful');
      } else {
        console.log('Token auth failed or not attempted');
      }

      // Set up regular auth listener
      unsubscribe = setupAuthListener();
    };

    initAuth();
    return () => unsubscribe?.();
  }, []);

  return authState;
}
