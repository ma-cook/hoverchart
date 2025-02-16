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
  const currentData = objectsCache.get(objectId);

  // Clear any pending save timeout for this object
  if (saveTimeouts.has(objectId)) {
    clearTimeout(saveTimeouts.get(objectId));
  }

  // Only update if data has changed, with debouncing
  if (!currentData || !isEqual(currentData, object)) {
    saveTimeouts.set(
      objectId,
      setTimeout(async () => {
        try {
          await setDoc(objectRef, {
            ...object,
            lastUpdated: Timestamp.fromDate(new Date()),
          });
          objectsCache.set(objectId, object);
        } catch (error) {
          console.error('Error saving object:', error);
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

      switch (change.type) {
        case 'added':
        case 'modified':
          if (!isEqual(objectsCache.get(objectId), data)) {
            objectsCache.set(objectId, data);
            callback({
              type: change.type,
              id: objectId,
              object: data,
            });
          }
          break;
        case 'removed':
          objectsCache.delete(objectId);
          callback({
            type: 'removed',
            id: objectId,
          });
          break;
      }
    });
  });
};
