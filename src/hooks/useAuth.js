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
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (!uid || !token) {
        console.log('No token auth parameters found');
        return false;
      }

      try {
        console.log('Attempting token validation...');
        const customToken = await validateAuthToken(token);

        if (!customToken) {
          console.error('Failed to get custom token');
          return false;
        }

        console.log('Signing in with custom token...');
        await signInWithCustomToken(auth, customToken);

        // Clear URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        return true;
      } catch (error) {
        console.error('Token auth failed:', error);
        return false;
      }
    };

    const initAuth = async () => {
      // Try token auth first
      await handleTokenAuth();

      // Set up auth state listener
      unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'null');
        setAuthState({
          isAuthenticated: !!user,
          isLoading: false,
          user,
        });
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authState;
}
