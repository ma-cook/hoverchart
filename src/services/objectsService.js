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
const updateThrottles = new Map();

// Helper function for position-only comparison
const positionsEqual = (posA, posB) => {
  if (!posA || !posB) return false;
  if (!Array.isArray(posA) || !Array.isArray(posB)) return false;
  if (posA.length !== posB.length) return false;

  // For positions, use a small epsilon for floating point comparison
  const epsilon = 0.001;
  for (let i = 0; i < posA.length; i++) {
    if (Math.abs(posA[i] - posB[i]) > epsilon) return false;
  }
  return true;
};

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
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;

    // Enhanced throttling with separate position and non-position timers
    const now = Date.now();
    const lastUpdateTime = updateThrottles.get(cacheKey) || 0;

    // Increase throttle time for position updates to prevent excessive saves
    const throttleTime = object.position ? 500 : 100; // 500ms for position, 100ms for other changes

    if (now - lastUpdateTime < throttleTime) {
      return; // Skip this update, too soon after previous one
    }

    updateThrottles.set(cacheKey, now);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn('Cannot save object: no write permission for shared space');
      return;
    }

    // Use the owner's ID to save to the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const objectRef = doc(
      db,
      'users',
      ownerUserId,
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

    // Enhanced comparison logic to prevent unnecessary updates
    if (cachedData) {
      // Check if position has changed significantly
      const positionChanged = !positionsEqual(
        cachedData.position,
        newData.position
      );

      // Check if non-position data has changed
      const nonPositionChanged = !isEqual(
        { ...cachedData, position: undefined },
        { ...newData, position: undefined }
      );

      // Only update if position or other properties changed
      if (!positionChanged && !nonPositionChanged) {
        return;
      }
    }

    // Update cache before saving to prevent race conditions
    objectsCache.set(cacheKey, newData);

    // Save with a timeout to batch frequent changes
    // Use longer timeout for position changes to further reduce updates
    const saveTimeout = object.position ? 300 : 150;

    saveTimeouts.set(
      cacheKey,
      setTimeout(async () => {
        try {
          await setDoc(objectRef, {
            ...newData,
            lastUpdated: Timestamp.fromDate(new Date()),
            creatorId: userId,
          });
        } catch (error) {
          console.error('Error saving object:', error);
          objectsCache.delete(cacheKey);
        }
      }, saveTimeout)
    );
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

          // Special handling for position updates - use position equality
          const cachedData = objectsCache.get(cacheKey);
          let hasChanged = false;

          if (cachedData) {
            const positionChanged = !positionsEqual(
              cachedData.position,
              data.position
            );
            const otherDataChanged = !isEqual(
              { ...cachedData, position: undefined },
              { ...data, position: undefined }
            );

            hasChanged = positionChanged || otherDataChanged;
          } else {
            hasChanged = true; // No cached data, treat as changed
          }

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
