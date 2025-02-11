import { db } from '../firebase';
import { getDoc, doc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import isEqual from 'lodash/isEqual'; // Add this import

let lastSavedData = null;

export const saveObjects = async (userId, objects) => {
  if (!userId) {
    console.error('saveObjects: Received invalid userId', userId);
    return;
  }
  // Only save if data has actually changed
  if (!isEqual(lastSavedData, objects)) {
    lastSavedData = JSON.parse(JSON.stringify(objects)); // Deep clone
    try {
      await setDoc(doc(db, 'users', userId), {
        objects,
        lastUpdated: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error saving objects:', error);
    }
  }
};

export const loadObjects = async (userId) => {
  if (!userId) {
    console.error('loadObjects: Received invalid userId', userId);
    return [];
  }

  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Loaded data from Firestore:', data);
      return data.objects || [];
    }
    console.log('No data found for user:', userId);
    return [];
  } catch (error) {
    console.error('Error loading objects:', error);
    return [];
  }
};

export const subscribeToObjects = (userId, callback) => {
  let lastData = null;

  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      const data = doc.data()?.objects || [];
      // Only trigger callback if data has actually changed
      if (!isEqual(lastData, data)) {
        lastData = JSON.parse(JSON.stringify(data)); // Deep clone
        callback(data);
      }
    } else {
      if (lastData !== null) {
        lastData = null;
        callback([]);
      }
    }
  });
};
