import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { writeFileSync } from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

const app = initializeApp(firebaseConfig, 'rtdb-export');
const rtdb = getDatabase(app);

async function main() {
  const snap = await get(ref(rtdb, '/'));
  const data = snap.val();
  writeFileSync('rtdb-export.json', JSON.stringify(data, null, 2));
  console.log('RTDB export complete');
}

main().catch(console.error);
