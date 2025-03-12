import { auth, provider } from '../firebase';
import {
  signInWithPopup, // Updated to use popup instead of redirect
  getRedirectResult,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

export const signInUser = async () => {
  try {
    // Ensure persistence is set before sign in
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
  // Add immediate auth state check
  if (auth.currentUser) {
    callback(auth.currentUser);
  }
  return onAuthStateChanged(auth, callback);
};

// New function to validate auth token received from landing page
export const validateAuthToken = async (token) => {
  try {
    console.log('Starting token validation...');

    // Force https for production
    const baseUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5001/hoverchart/us-central1'
        : 'https://us-central1-hoverchart.cloudfunctions.net';

    const response = await fetch(`${baseUrl}/verifyAuthToken`, {
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
      throw new Error(`Validation failed: ${text}`);
    }

    const data = await response.json();
    console.log('Received response:', { hasCustomToken: !!data.customToken });

    if (!data.customToken) {
      throw new Error('No custom token in response');
    }

    return data.customToken;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error; // Re-throw to handle in calling code
  }
};
