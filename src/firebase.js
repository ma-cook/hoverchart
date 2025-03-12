// firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence and handle token refresh
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
          console.log('Token refreshed for user:', user.uid);
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    });
  })
  .catch((error) => {
    console.error('Auth persistence error:', error);
  });

// Configure Google provider with custom parameters
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
});

const db = getFirestore(app);

export { auth, provider, db };
