import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCustomToken,
} from 'firebase/auth';
import { auth } from '../firebase';

const API_BASE_URL =
  'https://us-central1-hoverchart.cloudfunctions.net/verifyAuthToken';

/**
 * Sign in user with Google
 */
export const signInUser = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Set up auth state observer
 */
export const observeAuthState = (callback) => {
  return auth.onAuthStateChanged(callback);
};

/**
 * Validate auth token with backend service
 */
export const validateAuthToken = async (token) => {
  try {
    console.log('Validating token with backend service...');
    const response = await fetch(`${API_BASE_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token validation error:', errorData);
      throw new Error(errorData.details || 'Token validation failed');
    }

    const data = await response.json();
    console.log('Token validation successful');
    return data.customToken;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};

/**
 * Handle authentication from URL parameters
 */
export const handleUrlAuth = async () => {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  const token = params.get('token');

  if (!uid || !token) return false;

  try {
    console.log('Starting URL authentication with UID:', uid);
    // Get authentication data from backend
    const response = await fetch(`${API_BASE_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token validation error:', errorData);
      throw new Error(errorData.details || 'Token validation failed');
    }

    const data = await response.json();
    console.log('Token validation successful, response:', data);

    // Verify UID matches before proceeding
    if (data.uid !== uid) {
      console.error('Authentication failed - UID mismatch', {
        expected: uid,
        received: data.uid,
      });
      return false;
    }

    // Sign in with the custom token
    await signInWithCustomToken(auth, data.customToken);
    console.log('Successfully signed in with custom token');

    // Clean up URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  } catch (error) {
    console.error('URL auth error:', error);
    return false;
  }
};
