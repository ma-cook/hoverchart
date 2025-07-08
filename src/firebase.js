// firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  }-default-rtdb.firebaseio.com`, // Derived from project ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with cache enabled
const db = initializeFirestore(app, {
  cache: {
    // Use persistent cache (IndexedDB)
    persistenceEnabled: true,
    // Enable synchronization between tabs
    synchronizeTabs: true,
  },
});

// Set persistence and handle token refresh
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
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

const database = getDatabase(app);
const storage = getStorage(app);

export { auth, provider, db, database, storage };
