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
import { isSharedSpace } from './sharedSpacesService';

const objectsCache = new Map();
const saveTimeouts = new Map();

// Modified to handle shared spaces with improved logging
export const saveObject = async (userId, spaceId, object) => {
  if (!userId || !spaceId || !object.id) {
    console.warn('Missing required parameters:', {
      userId,
      spaceId,
      objectId: object?.id,
    });
    return;
  }

  try {
    console.log(`Attempting to save object ${object.id} to space ${spaceId}`);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);
    console.log('Shared status check result:', sharedStatus);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn('Cannot save object: no write permission for shared space');
      return;
    }

    // Use the owner's ID to save to the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
    console.log(`Saving object to owner's collection. Owner: ${ownerUserId}`);

    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;
    const objectRef = doc(
      db,
      'users',
      ownerUserId,
      'spaces',
      spaceId,
      'objects',
      objectId
    );

    console.log(
      `Database path: users/${ownerUserId}/spaces/${spaceId}/objects/${objectId}`
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
              // Add creator ID for shared spaces
              creatorId: userId,
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
  } catch (error) {
    console.error('Error in saveObject:', error);
  }
};

// Modified to handle shared spaces
export const deleteObject = async (userId, spaceId, objectId) => {
  if (!userId || !spaceId || !objectId) return;

  try {
    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn(
        'Cannot delete object: no write permission for shared space'
      );
      return;
    }

    // Use the owner's ID to delete from the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const cacheKey = `${spaceId}_${objectId}`;
    const objectRef = doc(
      db,
      'users',
      ownerUserId,
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

// Modified to handle shared spaces with improved logging
export const subscribeToObjects = (userId, spaceId, callback) => {
  if (!userId || !spaceId) return () => {};

  console.log(
    `Setting up object subscription for user ${userId}, space ${spaceId}`
  );

  // First determine if this is a shared space
  let unsubscribe = null;
  let isSubscribed = true;

  // Start subscription process
  const startSubscription = async () => {
    try {
      const sharedStatus = await isSharedSpace(userId, spaceId);
      console.log('Object subscription shared status:', sharedStatus);

      // If we unsubscribed while waiting for the async operation, return early
      if (!isSubscribed) return;

      // Use the owner's ID to subscribe to the correct collection
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
      console.log(
        `Subscribing to objects in owner's collection. Owner: ${ownerUserId}`
      );

      const objectsRef = collection(
        db,
        'users',
        ownerUserId,
        'spaces',
        spaceId,
        'objects'
      );

      console.log(
        `Subscription path: users/${ownerUserId}/spaces/${spaceId}/objects`
      );

      const q = query(objectsRef);

      unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(
          `Received snapshot with ${snapshot.docChanges().length} changes`
        );
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
    } catch (error) {
      console.error('Error starting subscription:', error);
    }
  };

  // Start the subscription process
  startSubscription();

  // Return a function to unsubscribe
  return () => {
    isSubscribed = false;
    if (unsubscribe) unsubscribe();
  };
};
