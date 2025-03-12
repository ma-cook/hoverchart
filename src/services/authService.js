import { auth, provider } from '../firebase';
import {
  signInWithPopup,
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

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
    console.log('Starting token validation...');

    // Add the /verify-token path to the URL
    const functionUrl =
      'https://verifyauthtoken-qtk2xsi74a-uc.a.run.app/verify-token';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    console.log('Validation response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Validation failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    console.log('Validation response:', data);

    if (!data.customToken) {
      throw new Error('No custom token in response');
    }

    return data.customToken;
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
};

export const handleUrlAuth = async () => {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  const token = params.get('token');

  if (!token || !uid) {
    return false;
  }

  try {
    console.log('Starting URL authentication for UID:', uid);

    // First try to authenticate with the token
    const user = await validateAuthToken(token);

    // Check if the authenticated user matches the expected UID
    if (!user) {
      console.error('Authentication failed - no user');
      return false;
    }

    if (user.uid !== uid) {
      console.error('Authentication failed - UID mismatch', {
        expected: uid,
        received: user.uid,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('URL auth failed:', error);
    return false;
  }
};
