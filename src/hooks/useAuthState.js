import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth directly instead of app
import {
  handlePostLoginRedirect,
  handleUrlAuth,
} from '../services/authService';

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCheckingUrlAuth, setIsCheckingUrlAuth] = useState(true);

  useEffect(() => {
    // No need to call getAuth since we're importing auth directly now
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Store in window for components that need current user info
        window.currentUser = authUser;

        // Get public space context if it exists
        const isPublicSpace = !!(
          window.publicAccessSpace && window.currentSpaceOwner
        );

        if (isPublicSpace) {
          console.log(
            'Maintaining public space context after auth state change'
          );
        }

        // Handle post-login redirect but prevent actual redirect
        handlePostLoginRedirect();

        // Always finish auth check - never wait for any redirect
        setIsAuthReady(true);
        setIsCheckingUrlAuth(false);
      } else {
        window.currentUser = null;
        setIsAuthReady(true);
        setIsCheckingUrlAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (uid && token) {
        setIsCheckingUrlAuth(true);
        try {
          await handleUrlAuth();
        } catch {
          // Handle error silently
        } finally {
          setIsCheckingUrlAuth(false);
        }
      } else {
        setIsCheckingUrlAuth(false);
      }
    };

    checkUrlAuth();
  }, []);

  useEffect(() => {
    if (user || !isCheckingUrlAuth) {
      setIsCheckingUrlAuth(false);
    }
  }, [user, isCheckingUrlAuth]);

  return { user, isAuthReady, isCheckingUrlAuth };
}
