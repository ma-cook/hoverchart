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
    const response = await fetch(
      'https://us-central1-hoverchart.cloudfunctions.net/verifyAuthToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'omit',
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Token validation failed (${response.status}):`, errorData);
      return null;
    }

    const data = await response.json();
    if (!data.customToken) {
      console.error('No custom token in response:', data);
      return null;
    }

    console.log('Successfully received custom token');
    return data.customToken;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};
