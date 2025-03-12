import { useState, useEffect } from 'react';
import { signInWithCustomToken, getAuth } from 'firebase/auth';
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
    let isProcessing = false;

    const handleTokenAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        // Check for both parameter names
        const authToken = params.get('auth_token') || params.get('token');

        if (!uid || !authToken) {
          console.log('No auth parameters found in URL');
          return false;
        }

        console.log(
          `Found auth parameters in URL for uid: ${uid.substring(0, 5)}...`
        );
        isProcessing = true;
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const customToken = await validateAuthToken(authToken);
        if (!customToken) {
          console.error('Failed to get custom token');
          return false;
        }

        console.log('Got custom token, signing in...');
        await signInWithCustomToken(auth, customToken);

        // Remove URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        return true;
      } catch (error) {
        console.error('Token auth failed:', error);
        return false;
      } finally {
        isProcessing = false;
      }
    };

    const initAuth = async () => {
      // Try URL token auth first
      const success = await handleTokenAuth();
      if (!success) {
        console.log(
          'Token auth failed or not attempted, setting up auth listener'
        );
      }

      // Set up auth state listener regardless
      unsubscribe = auth.onAuthStateChanged((user) => {
        console.log(
          'Auth state changed:',
          user ? `User ${user.uid}` : 'no user'
        );
        if (!isProcessing) {
          setAuthState({
            isAuthenticated: !!user,
            isLoading: false,
            user,
          });
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
