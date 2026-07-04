import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { writeFileSync } from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportCollection(path) {
  const snap = await getDocs(collection(db, path));
  const data = {};
  snap.forEach((d) => { data[d.id] = d.data(); });
  return data;
}

async function main() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const output = {};

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    output[uid] = { data: userData, spaces: {} };

    const spacesSnap = await getDocs(collection(db, 'users', uid, 'spaces'));
    for (const spaceDoc of spacesSnap.docs) {
      const spaceId = spaceDoc.id;
      const spaceData = spaceDoc.data();
      const space = { data: spaceData, cells: {} };

      const cellsSnap = await getDocs(collection(db, 'users', uid, 'spaces', spaceId, 'cells'));
      for (const cellDoc of cellsSnap.docs) {
        const cellId = cellDoc.id;
        const cellData = cellDoc.data();
        const cell = { data: cellData, objects: {}, connections: {} };

        const objSnap = await getDocs(collection(db, 'users', uid, 'spaces', spaceId, 'cells', cellId, 'objects'));
        objSnap.forEach((d) => { cell.objects[d.id] = d.data(); });

        const connSnap = await getDocs(collection(db, 'users', uid, 'spaces', spaceId, 'cells', cellId, 'connections'));
        connSnap.forEach((d) => { cell.connections[d.id] = d.data(); });

        space.cells[cellId] = cell;
      }

      const presenceSnap = await getDocs(collection(db, 'users', uid, 'spaces', spaceId, 'presence'));
      space.presence = {};
      presenceSnap.forEach((d) => { space.presence[d.id] = d.data(); });

      output[uid].spaces[spaceId] = space;
    }
  }

  writeFileSync('firestore-export.json', JSON.stringify(output, null, 2));
  console.log(`Exported ${Object.keys(output).length} users`);
}

main().catch(console.error);
