import {
  signInWithPopup,
  getRedirectResult,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, provider } from '../firebase';

import { getOrCreateDefaultSpace, getSpaceById } from './spacesService';
import { registerSharedSpaceFromUrl } from './sharedSpacesService';

export const signInUser = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);

    // Check if we're currently viewing a shared space
    const isViewingSharedSpace =
      window.publicAccessSpace && window.currentSpaceOwner;

    // Explicitly save current URL and view state before login

    const publicSpaceId = window.publicAccessSpace;
    const publicSpaceOwner = window.currentSpaceOwner;

    // Sign in with Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Restore public space context after login
    if (isViewingSharedSpace) {
      window.publicAccessSpace = publicSpaceId;
      window.currentSpaceOwner = publicSpaceOwner;

      // Register this user as having access to the shared space
      await registerSharedSpaceFromUrl(
        user.uid,
        window.publicAccessSpace,
        window.currentSpaceOwner
      );

      // Update session storage for safety
      sessionStorage.setItem(`isPublicSpace_${publicSpaceId}`, 'true');
      sessionStorage.setItem(`isSharedSpace_${publicSpaceId}`, 'true');
      sessionStorage.setItem(
        `sharedSpaceOwner_${publicSpaceId}`,
        publicSpaceOwner
      );
    }

    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const handlePostLoginRedirect = () => {
  // MODIFIED: Completely disable automatic redirection

  // Clean up stored URL if it exists to prevent any chance of redirection
  if (sessionStorage.getItem('loginRedirectUrl')) {
    sessionStorage.removeItem('loginRedirectUrl');
  }

  // Always return false to indicate no redirection occurred
  return false;
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error handling redirect:', error);
    return null;
  }
};

export const observeAuthState = (callback) => {
  if (auth.currentUser) {
    callback(auth.currentUser);
  }
  return onAuthStateChanged(auth, callback);
};

export const validateAuthToken = async (token) => {
  try {
    // Cloud Function endpoint
    const functionUrl =
      'https://verifyauthtoken-qtk2xsi74a-uc.a.run.app/verify-token';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        token,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Validation error details:', errorText);
      throw new Error(`Validation failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.customToken) {
      throw new Error('No custom token in response');
    }

    return data.customToken;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
};


