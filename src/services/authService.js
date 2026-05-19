import {
  signInWithRedirect,
  signInWithCustomToken,
  getRedirectResult,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, provider, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { getOrCreateDefaultSpace, getSpaceById } from './spacesService';
import { registerSharedSpaceFromUrl } from './sharedSpacesService';

export const signInUser = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);

    // Check if we're currently viewing a shared space
    const isViewingSharedSpace =
      window.publicAccessSpace && window.currentSpaceOwner;

    // Persist public-space context across the redirect round-trip so we can
    // restore it after Firebase navigates back to the app.
    if (isViewingSharedSpace) {
      sessionStorage.setItem(
        'pendingSharedSpaceContext',
        JSON.stringify({
          spaceId: window.publicAccessSpace,
          ownerId: window.currentSpaceOwner,
        })
      );
    }

    // Redirect to Google. The browser will navigate away and return to the
    // app; `completeRedirectSignIn()` picks up the result on next page load.
    await signInWithRedirect(auth, provider);

    // Unreachable in practice — page navigates away before this line runs.
    return null;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Call this once on app startup to complete a sign-in that began with
// `signInWithRedirect`. Returns the signed-in user (or null if there's no
// pending redirect result).
export const completeRedirectSignIn = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;

    const user = result.user;

    // Restore any public/shared space context that was active before the
    // redirect navigated the page away.
    const pendingRaw = sessionStorage.getItem('pendingSharedSpaceContext');
    if (pendingRaw) {
      sessionStorage.removeItem('pendingSharedSpaceContext');
      try {
        const { spaceId, ownerId } = JSON.parse(pendingRaw);
        if (spaceId && ownerId) {
          window.publicAccessSpace = spaceId;
          window.currentSpaceOwner = ownerId;
          await registerSharedSpaceFromUrl(user.uid, spaceId, ownerId);
          sessionStorage.setItem(`isPublicSpace_${spaceId}`, 'true');
          sessionStorage.setItem(`isSharedSpace_${spaceId}`, 'true');
          sessionStorage.setItem(`sharedSpaceOwner_${spaceId}`, ownerId);
        }
      } catch (parseErr) {
        console.warn('Failed to restore shared space context:', parseErr);
      }
    }

    return user;
  } catch (error) {
    console.error('Error completing redirect sign-in:', error);
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

// Handle URL auth with spaceId support
export const handleUrlAuth = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const spaceId = params.get('spaceId');
  const ownerUid = params.get('ownerUid');

  if (!code) {
    return false;
  }

  try {
    const exchangeAuthCode = httpsCallable(functions, 'exchangeAuthCode');
    const result = await exchangeAuthCode({ code });

    if (!result.data?.token) {
      console.error('No token received from auth code exchange');
      return false;
    }

    const userCredential = await signInWithCustomToken(auth, result.data.token);

    if (!userCredential?.user) {
      console.error('No user returned after custom token sign in');
      return false;
    }

    const uid = userCredential.user.uid;

    // Store space ID in session storage if provided
    if (spaceId) {
      const spaceOwner = ownerUid || uid;
      const space = await getSpaceById(spaceOwner, spaceId);
      if (space) {
        sessionStorage.setItem('currentSpaceId', spaceId);
      } else {
        console.warn(`Space ID ${spaceId} not found, falling back to default`);
        const defaultSpace = await getOrCreateDefaultSpace(uid);
        if (defaultSpace) {
          sessionStorage.setItem('currentSpaceId', defaultSpace.id);
        }
      }
    } else {
      const defaultSpace = await getOrCreateDefaultSpace(uid);
      if (defaultSpace) {
        sessionStorage.setItem('currentSpaceId', defaultSpace.id);
      }
    }

    return true;
  } catch (error) {
    console.error('URL auth failed:', error);
    return false;
  }
};


