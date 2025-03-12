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

// Modified to include spaceId parameter
export const saveObject = async (userId, spaceId, object) => {
  if (!userId || !spaceId || !object.id) return;

  const objectId = object.id.toString();
  const cacheKey = `${spaceId}_${objectId}`;
  const objectRef = doc(
    db,
    'users',
    userId,
    'spaces',
    spaceId,
    'objects',
    objectId
  );
  const cachedData = objectsCache.get(cacheKey);

  // Clear any pending save timeout for this object
  if (saveTimeouts.has(cacheKey)) {
    clearTimeout(saveTimeouts.get(cacheKey));
  }

  // Deep clone the object to prevent reference issues
  const newData = JSON.parse(JSON.stringify(object));

  // Only update if data has actually changed
  if (!cachedData || !isEqual(cachedData, newData)) {
    saveTimeouts.set(
      cacheKey,
      setTimeout(async () => {
        try {
          // Update cache before saving to prevent race conditions
          objectsCache.set(cacheKey, newData);
          await setDoc(objectRef, {
            ...newData,
            lastUpdated: Timestamp.fromDate(new Date()),
          });
        } catch (error) {
          console.error('Error saving object:', error);
          // Remove from cache if save failed
          objectsCache.delete(cacheKey);
        }
        saveTimeouts.delete(cacheKey);
      }, 1000) // 1 second debounce
    );
  }
};

// Modified to include spaceId parameter
export const deleteObject = async (userId, spaceId, objectId) => {
  if (!userId || !spaceId || !objectId) return;

  try {
    const cacheKey = `${spaceId}_${objectId}`;
    const objectRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'objects',
      objectId.toString()
    );
    await deleteDoc(objectRef);
    objectsCache.delete(cacheKey);
  } catch (error) {
    console.error('Error deleting object:', error);
  }
};

// Modified to include spaceId parameter
export const subscribeToObjects = (userId, spaceId, callback) => {
  if (!userId || !spaceId) return () => {};

  const objectsRef = collection(
    db,
    'users',
    userId,
    'spaces',
    spaceId,
    'objects'
  );
  const q = query(objectsRef);

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const objectId = change.doc.id;
      const cacheKey = `${spaceId}_${objectId}`;

      // Deep compare the data before triggering any updates
      const cachedData = objectsCache.get(cacheKey);
      const hasChanged = !cachedData || !isEqual(cachedData, data);

      if (hasChanged) {
        // Only update cache and trigger callback if data actually changed
        objectsCache.set(cacheKey, JSON.parse(JSON.stringify(data))); // Store deep copy
        callback({
          type: change.type,
          id: objectId,
          object: data,
        });
      }
    });
  });
};
