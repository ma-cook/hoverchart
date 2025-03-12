import { auth, provider } from '../firebase';
import {
  signInWithPopup,
  signInWithCustomToken,
  getRedirectResult,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

import { getOrCreateDefaultSpace, getSpaceById } from './spacesService';

export const signInUser = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error during sign in:', error);
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
    console.log('Starting token validation...', { tokenLength: token?.length });

    // Cloud Function endpoint
    const functionUrl =
      'https://verifyauthtoken-qtk2xsi74a-uc.a.run.app/verify-token';

    console.log('Sending request to:', functionUrl);

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

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Validation error details:', errorText);
      throw new Error(`Validation failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('Validation successful, received data:', data);

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
  const uid = params.get('uid');
  const token = params.get('token');
  const spaceId = params.get('spaceId');

  if (!token || !uid) {
    console.log('Missing token or UID in URL');
    return false;
  }

  try {
    console.log('Starting URL authentication for UID:', uid);

    // Get custom token from validation
    const customToken = await validateAuthToken(token);

    if (!customToken) {
      console.error('No custom token received from validation');
      return false;
    }

    // Sign in with the custom token
    console.log('Signing in with custom token...');
    const userCredential = await signInWithCustomToken(auth, customToken);

    if (!userCredential?.user) {
      console.error('No user returned after custom token sign in');
      return false;
    }

    console.log('Successfully signed in user:', userCredential.user.uid);

    // Verify the UID matches
    if (userCredential.user.uid !== uid) {
      console.error('UID mismatch:', {
        expected: uid,
        received: userCredential.user.uid,
      });
      return false;
    }

    // Store space ID in session storage if provided
    if (spaceId) {
      // Verify space exists
      const space = await getSpaceById(uid, spaceId);
      if (space) {
        sessionStorage.setItem('currentSpaceId', spaceId);
        console.log(`Space ID ${spaceId} stored in session`);
      } else {
        console.warn(`Space ID ${spaceId} not found, falling back to default`);
        const defaultSpace = await getOrCreateDefaultSpace(uid);
        if (defaultSpace) {
          sessionStorage.setItem('currentSpaceId', defaultSpace.id);
          console.log(`Default space ID ${defaultSpace.id} stored in session`);
        }
      }
    } else {
      // No space ID provided, get or create default
      const defaultSpace = await getOrCreateDefaultSpace(uid);
      if (defaultSpace) {
        sessionStorage.setItem('currentSpaceId', defaultSpace.id);
        console.log(`Default space ID ${defaultSpace.id} stored in session`);
      }
    }

    return true;
  } catch (error) {
    console.error('URL auth failed:', error);
    return false;
  }
};
