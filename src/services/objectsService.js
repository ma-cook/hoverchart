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
import { forceReconnect } from './connectionsService';

const objectsCache = new Map();
const saveTimeouts = new Map();
const updateThrottles = new Map();
const lastReceivedObjects = new Map(); // Cache for reconnection

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
    return;
  }

  try {
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;

    // Enhanced throttling with separate position and non-position timers
    const now = Date.now();
    const lastUpdateTime = updateThrottles.get(cacheKey) || 0;

    // INCREASE throttle times significantly to prevent excessive server updates
    // Use different throttle times based on object type
    let throttleTime = 500; // Default 500ms throttle

    // Text objects need more aggressive throttling for indicator position updates
    if (object.type === 'text' && object.indicatorPosition) {
      throttleTime = 2000; // Much longer throttle for text object indicator updates
    }
    // For regular position updates
    else if (object.position) {
      throttleTime = 800; // Increased from 500ms for position updates
    }
    // For other changes
    else {
      throttleTime = 200; // Slightly increased from 100ms
    }

    if (now - lastUpdateTime < throttleTime) {
      return; // Skip this update, too soon after previous one
    }

    updateThrottles.set(cacheKey, now);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
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
          const objectToSave = {
            ...newData,
            lastUpdated: Timestamp.fromDate(new Date()),
            creatorId: userId,
          };

          // Store in last received cache for reconnection scenarios
          lastReceivedObjects.set(`${spaceId}_${objectId}`, objectToSave);

          await setDoc(objectRef, objectToSave);
        } catch (error) {
          console.error('Error saving object:', error);
          objectsCache.delete(cacheKey);
        }
      }, saveTimeout)
    );
  } catch (error) {
    // Error handling with minimal logging
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
    lastReceivedObjects.delete(cacheKey);
  } catch (error) {
    // Error handling with minimal logging
    console.error('Error deleting object:', error);
  }
};

// Enhanced subscription function with better error handling and reconnection
export const subscribeToObjects = (userId, spaceId, callback) => {
  if (!userId || !spaceId) return () => {};

  let unsubscribe = null;
  let isSubscribed = true;
  let retryCount = 0;
  let maxRetries = 5;
  let delay = 1000;
  let lastDocumentCount = 0;
  let reconnectTimer = null;

  // First determine if this is a shared space
  const startSubscription = async () => {
    try {
      const sharedStatus = await isSharedSpace(userId, spaceId);

      // If we unsubscribed while waiting for the async operation, return early
      if (!isSubscribed) return;

      // Use the owner's ID to subscribe to the correct collection
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

      // Store owner ID for future reference
      window.currentSpaceOwner = ownerUserId;

      console.log(
        `[Objects] Setting up subscription for space ${spaceId} owned by ${ownerUserId}`
      );

      const objectsRef = collection(
        db,
        'users',
        ownerUserId,
        'spaces',
        spaceId,
        'objects'
      );

      const q = query(objectsRef);

      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Check if this is from cache or server
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';

          // Only log once per 5 batches of changes
          if (Math.random() < 0.2) {
            console.debug(
              `[Objects] Got ${
                snapshot.docChanges().length
              } changes from ${source}`
            );
          }

          // Reset retry count on successful connection
          retryCount = 0;

          // Check if we got documents when expected
          const documentCount = snapshot.docs.length;
          if (documentCount === 0 && lastDocumentCount > 0) {
            console.warn(
              'Received empty object snapshot when expecting documents, may need to reconnect'
            );
          }
          lastDocumentCount = documentCount;

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const objectId = change.doc.id;
            const cacheKey = `${spaceId}_${objectId}`;

            // Update our reconnection cache
            if (change.type !== 'removed') {
              lastReceivedObjects.set(cacheKey, data);
            } else {
              lastReceivedObjects.delete(cacheKey);
            }

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
        },
        async (error) => {
          console.error('Objects subscription error:', error);

          if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `Retrying objects subscription... Attempt ${retryCount}`
            );

            // Clear any existing timer
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
            }

            // Try force reconnect if this looks like a network issue
            if (
              error.code === 'unavailable' ||
              error.code === 'failed-precondition'
            ) {
              await forceReconnect();
            }

            // Exponential backoff
            reconnectTimer = setTimeout(() => {
              if (isSubscribed) {
                if (unsubscribe) {
                  unsubscribe();
                  unsubscribe = null;
                }
                startSubscription();
              }
            }, delay * Math.pow(2, retryCount - 1));
          } else {
            console.error(`Failed to reconnect after ${maxRetries} attempts`);

            // Last resort: re-deliver cached data
            if (lastReceivedObjects.size > 0) {
              console.log(
                `Re-delivering ${lastReceivedObjects.size} cached objects`
              );

              // Filter to only objects for this space
              const spacePrefix = `${spaceId}_`;
              [...lastReceivedObjects.entries()]
                .filter(([key]) => key.startsWith(spacePrefix))
                .forEach(([key, data]) => {
                  const objectId = key.substring(spacePrefix.length);
                  callback({
                    type: 'added',
                    id: objectId,
                    object: data,
                    fromCache: true,
                  });
                });
            }
          }
        }
      );
    } catch (error) {
      // Error handling with minimal logging
      console.error('Error starting objects subscription:', error);
    }
  };

  // Start the subscription process
  startSubscription();

  // Return a function to unsubscribe
  return () => {
    isSubscribed = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (unsubscribe) unsubscribe();
  };
};

export { positionsEqual };
