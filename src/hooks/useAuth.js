import { useState, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { validateAuthToken } from '../services/authService';

export function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    connectionState: 'unknown', // Add connection state tracking
  });

  useEffect(() => {
    let unsubscribe;
    let hasAttemptedUrlAuth = false;
    let connectionMonitor = null;

    // Monitor Firebase connection status
    const monitorConnection = () => {
      if (window.firebase && window.firebase.database) {
        const connRef = window.firebase.database().ref('.info/connected');
        return connRef.on('value', (snap) => {
          const isConnected = snap.val() === true;
          setAuthState((prev) => ({
            ...prev,
            connectionState: isConnected ? 'connected' : 'disconnected',
          }));

          // If we're disconnected, prepare to handle reconnection
          if (!isConnected) {
            console.log('Firebase connection lost, preparing for reconnection');
          }
        });
      }
      return null;
    };

    const handleUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (!uid || !token) return false;

      try {
        console.log('Starting token auth with UID:', uid);
        const customToken = await validateAuthToken(token);

        if (!customToken) {
          console.error('Token validation failed');
          return false;
        }

        console.log('Got custom token, signing in...');
        await signInWithCustomToken(auth, customToken);

        // Wait for auth to complete
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.error('Auth state update timeout');
            resolve(false);
          }, 5000);

          const authUnsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              console.log('URL auth successful:', user.uid);
              clearTimeout(timeout);
              authUnsubscribe();
              resolve(true);
            }
          });
        });
      } catch (error) {
        console.error('Token auth error:', error);
        return false;
      }
    };

    const initAuth = async () => {
      // Check for URL parameters first
      const params = new URLSearchParams(window.location.search);
      if (!hasAttemptedUrlAuth && params.has('uid') && params.has('token')) {
        hasAttemptedUrlAuth = true;
        console.log('Found URL auth parameters, attempting auth...');

        try {
          const success = await handleUrlAuth();
          if (success) {
            console.log('URL authentication successful');
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else {
            console.error('URL authentication failed');
          }
        } catch (error) {
          console.error('Error during URL auth:', error);
        }
      }

      // Set up auth state listener
      unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user?.uid || 'null');
        setAuthState({
          isAuthenticated: !!user,
          isLoading: false,
          user,
          connectionState: authState.connectionState,
        });

        // Initialize connection monitoring on successful auth
        if (user && !connectionMonitor) {
          connectionMonitor = monitorConnection();
        }
      });
    };

    initAuth();

    return () => {
      unsubscribe?.();
      if (connectionMonitor) {
        // Clean up connection monitoring
        if (window.firebase && window.firebase.database) {
          window.firebase
            .database()
            .ref('.info/connected')
            .off('value', connectionMonitor);
        }
      }
    };
  }, [authState.connectionState]);

  return authState;
}
