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
    // Skip empty tokens
    if (!token) {
      console.error('Empty token provided to validateAuthToken');
      return null;
    }

    console.log(`Validating token: ${token.substring(0, 10)}...`);

    // Check if token is already in a valid format
    if (token && token.split('.').length === 3) {
      console.log(
        'Token has valid JWT format, sending to verification endpoint'
      );

      const response = await fetch(
        'https://us-central1-hoverchart.cloudfunctions.net/verifyAuthToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          credentials: 'include',
        }
      );

      console.log(`Token validation response status: ${response.status}`);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }

        console.error(
          `Token validation failed with status ${response.status}: ${errorText}`
        );
        throw new Error(`Token verification failed: ${response.status}`);
      }

      try {
        const responseData = await response.json();
        console.log('Successfully received custom token');
        return responseData.customToken;
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        return null;
      }
    }

    console.error(
      'Invalid token format - should be JWT with 3 parts separated by dots'
    );
    return null;
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
};
