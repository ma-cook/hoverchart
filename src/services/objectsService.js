import { db } from '../firebase';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import isEqual from 'lodash/isEqual';

const objectsCache = new Map();
const saveTimeouts = new Map();

export const saveObject = async (userId, object) => {
  if (!userId || !object.id) return;

  const objectId = object.id.toString();
  const objectRef = doc(db, 'users', userId, 'objects', objectId);
  const cachedData = objectsCache.get(objectId);

  // Clear any pending save timeout for this object
  if (saveTimeouts.has(objectId)) {
    clearTimeout(saveTimeouts.get(objectId));
  }

  // Deep clone the object to prevent reference issues
  const newData = JSON.parse(JSON.stringify(object));

  // Only update if data has actually changed
  if (!cachedData || !isEqual(cachedData, newData)) {
    saveTimeouts.set(
      objectId,
      setTimeout(async () => {
        try {
          // Update cache before saving to prevent race conditions
          objectsCache.set(objectId, newData);
          await setDoc(objectRef, {
            ...newData,
            lastUpdated: Timestamp.fromDate(new Date()),
          });
        } catch (error) {
          console.error('Error saving object:', error);
          // Remove from cache if save failed
          objectsCache.delete(objectId);
        }
        saveTimeouts.delete(objectId);
      }, 1000) // 1 second debounce
    );
  }
};

export const deleteObject = async (userId, objectId) => {
  if (!userId || !objectId) return;

  try {
    const objectRef = doc(db, 'users', userId, 'objects', objectId.toString());
    await deleteDoc(objectRef);
    objectsCache.delete(objectId);
  } catch (error) {
    console.error('Error deleting object:', error);
  }
};

export const subscribeToObjects = (userId, callback) => {
  if (!userId) return () => {};

  const objectsRef = collection(db, 'users', userId, 'objects');
  const q = query(objectsRef);

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const objectId = change.doc.id;

      // Deep compare the data before triggering any updates
      const cachedData = objectsCache.get(objectId);
      const hasChanged = !cachedData || !isEqual(cachedData, data);

      if (hasChanged) {
        // Only update cache and trigger callback if data actually changed
        objectsCache.set(objectId, JSON.parse(JSON.stringify(data))); // Store deep copy
        callback({
          type: change.type,
          id: objectId,
          object: data,
        });
      }
    });
  });
};
