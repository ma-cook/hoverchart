import { db } from '../firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import { isSharedSpace } from './sharedSpacesService';
import {
  addObjectToCell,
  updateObjectInCell as updateObjectInCellSpatial,
  deleteObjectFromCell as deleteObjectFromCellSpatial,
  getObjectsFromCells,
  getCellCoordinates,
  getCellId,
  moveObjectBetweenCells as moveObjectBetweenCellsSpatial,
} from './spatialPartitioning';
import { getIsInitialLoading } from '../utils/loadingState';

const objectsCache = new Map();
const saveTimeouts = new Map();
const updateThrottles = new Map();
const lastReceivedObjects = new Map();
const movingObjects = new Map(); // Track objects currently being moved to prevent race conditions

// Helper function for position-only comparison
const positionsEqual = (posA, posB) => {
  if (!posA || !posB) return false;
  if (!Array.isArray(posA) || !Array.isArray(posB)) return false;
  if (posA.length !== posB.length) return false;

  const epsilon = 0.001;
  for (let i = 0; i < posA.length; i++) {
    if (Math.abs(posA[i] - posB[i]) > epsilon) return false;
  }
  return true;
};

/**
 * Save object to the appropriate cell based on its position
 */
export const saveObjectToCell = async (userId, spaceId, object) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    console.log(
      `⏸️ [saveObjectToCell] Skipping save for object ${object.id} - still in initial loading phase`
    );
    return;
  }

  if (!userId || !spaceId || !object.id) {
    // console.warn('[SaveDebug] saveObjectToCell: Missing required parameters. Aborting.', { userId, spaceId, objectId: object?.id });
    return;
  }

  // For non-position updates, we need to find the object's current position from cache or existing data
  if (!object.position) {
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;
    const cachedData = objectsCache.get(cacheKey);

    if (cachedData && cachedData.position) {
      // Use cached position for the update
      object = { ...object, position: cachedData.position };
    } else {
      console.warn(
        '[SaveDebug] saveObjectToCell: No position available for non-position update. Skipping save.',
        {
          userId,
          spaceId,
          objectId: object?.id,
        }
      );
      return;
    }
  }

  try {
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;

    // Enhanced throttling
    const now = Date.now();
    const lastUpdateTime = updateThrottles.get(cacheKey) || 0;

    let throttleTime = 500; // Default throttle

    if (object.type === 'text' && object.indicatorPosition) {
      throttleTime = 2000;
    } else if (object.position) {
      throttleTime = 800;
    } else {
      throttleTime = 200;
    }

    if (now - lastUpdateTime < throttleTime) {
      // console.log(`[SaveDebug] Throttled save for object ${objectId}. Last update: ${lastUpdateTime}, Now: ${now}, Diff: ${now - lastUpdateTime}, Throttle: ${throttleTime}`);
      return;
    }

    updateThrottles.set(cacheKey, now);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      // console.log(`[SaveDebug] User ${userId} has read-only permissions for shared space ${spaceId}. Skipping save for object ${objectId}.`);
      return;
    }

    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const cachedData = objectsCache.get(cacheKey);

    // Clear any pending save timeout for this object
    if (saveTimeouts.has(cacheKey)) {
      clearTimeout(saveTimeouts.get(cacheKey));
    } // Deep clone the object to prevent reference issues
    let newData;
    try {
      newData = JSON.parse(JSON.stringify(object));
    } catch (error) {
      console.warn(
        '⚠️ Failed to clone object in spatialObjectsService:',
        error,
        'object:',
        object
      );
      newData = { ...object }; // Fallback to shallow copy
    }

    let oldCellId = null;
    let newCellId = null;
    let oldPosition = null;

    if (cachedData && cachedData.position) {
      oldPosition = cachedData.position; // Keep the actual old position
      const oldCellCoords = getCellCoordinates(cachedData.position);
      oldCellId = getCellId(oldCellCoords.x, oldCellCoords.y, oldCellCoords.z);
    }

    const newCellCoords = getCellCoordinates(newData.position);
    newCellId = getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z);
    // console.log(`[SaveDebug] Object ${objectId}: Old Cell: ${oldCellId}, New Cell: ${newCellId}. Old Pos: ${JSON.stringify(oldPosition)}, New Pos: ${JSON.stringify(newData.position)}`);

    // Enhanced comparison logic
    if (cachedData) {
      const positionChanged = !positionsEqual(
        cachedData.position,
        newData.position
      );

      const nonPositionDataChanged = !isEqual(
        // Renamed for clarity
        {
          ...cachedData,
          position: undefined,
          lastUpdated: undefined,
          cellId: undefined,
          creatorId: undefined,
        }, // Exclude volatile fields
        {
          ...newData,
          position: undefined,
          lastUpdated: undefined,
          cellId: undefined,
          creatorId: undefined,
        } // Exclude volatile fields
      );

      if (!positionChanged && !nonPositionDataChanged) {
        // console.log(`[SaveDebug] Object ${objectId} data unchanged (posChanged: ${positionChanged}, nonPosChanged: ${nonPositionDataChanged}). Skipping save.`);
        return;
      }
      // console.log(`[SaveDebug] Object ${objectId} data changed. PosChanged: ${positionChanged}, NonPosDataChanged: ${nonPositionDataChanged}`);
    }

    // Update cache before saving
    objectsCache.set(cacheKey, newData);

    // Save with timeout to batch changes
    const saveTimeoutDelay = object.position ? 300 : 150;

    saveTimeouts.set(
      cacheKey,
      setTimeout(async () => {
        try {
          const objectToSave = {
            ...newData,
            lastUpdated: Timestamp.fromDate(new Date()), // Firestore Timestamp
            creatorId: ownerUserId, // Ensure creatorId is the space owner or original user
          };

          // Store in last received cache for reconnection scenarios
          lastReceivedObjects.set(`${spaceId}_${objectId}`, objectToSave);

          if (
            oldCellId &&
            newCellId &&
            oldCellId !== newCellId &&
            oldPosition
          ) {
            console.log(
              `[SaveDebug] Object ${objectId} MOVED from cell ${oldCellId} to ${newCellId}. Calling moveObjectBetweenCellsSpatial.`
            );
            await moveObjectBetweenCellsSpatial(
              ownerUserId,
              spaceId,
              objectId, // Pass objectId string
              oldPosition, // Pass the actual old position
              newData.position, // Pass the new position
              objectToSave // Pass the full new object data for the new cell
            );
          } else {
            // console.log(`[SaveDebug] Object ${objectId} ADDED/UPDATED in cell ${newCellId}. Calling addObjectToCell.`);
            // This will update if object exists in this cell, or add if new to this cell / or if only non-positional data changed
            await addObjectToCell(ownerUserId, spaceId, objectToSave);
          }
        } catch (error) {
          console.error(
            `[SaveDebug] Error in throttled save for object ${objectId}:`,
            error
          );
          objectsCache.delete(cacheKey); // Remove from cache on error
        }
      }, saveTimeoutDelay)
    );
  } catch (error) {
    console.error(
      '[SaveDebug] Error in saveObjectToCell (outer try-catch):',
      error
    );
  }
};

/**
 * Delete object from its cell
 */
export const deleteObjectFromSpatialCell = async (
  userId,
  spaceId,
  objectId,
  position
) => {
  if (!userId || !spaceId || !objectId) {
    throw new Error(
      'Missing required parameters for deleteObjectFromSpatialCell'
    );
  }

  console.log(
    `🗑️ [Delete Debug] Starting deletion for object ${objectId} at position:`,
    position
  );

  try {
    const objectIdString = objectId.toString();
    const cacheKey = `${spaceId}_${objectIdString}`;

    // Clear from cache immediately to prevent re-additions
    console.log(
      `🗑️ [Delete Debug] Clearing cache for object ${objectIdString}`
    );
    objectsCache.delete(cacheKey);
    lastReceivedObjects.delete(cacheKey);

    // Clear any pending save timeouts that might re-add the object
    if (saveTimeouts.has(cacheKey)) {
      console.log(
        `🗑️ [Delete Debug] Clearing pending save timeout for object ${objectIdString}`
      );
      clearTimeout(saveTimeouts.get(cacheKey));
      saveTimeouts.delete(cacheKey);
    }

    updateThrottles.delete(cacheKey);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      throw new Error(
        `User ${userId} does not have write permissions for shared space ${spaceId}`
      );
    }

    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // If no position provided, try to find the object in all cells
    if (!position) {
      console.log(
        `🗑️ [Delete Debug] No position provided, searching all cells for object ${objectIdString}`
      );
      const { findObjectInCells } = await import('./spatialPartitioning');
      const found = await findObjectInCells(
        ownerUserId,
        spaceId,
        objectIdString
      );

      if (found && found.object && found.object.position) {
        position = found.object.position;
        console.log(
          `🗑️ [Delete Debug] Found object ${objectIdString} at position:`,
          position
        );
      } else {
        console.warn(
          `⚠️ [Delete Debug] Could not find object ${objectIdString} in any cell`
        );
        return; // Object doesn't exist in database anyway
      }
    }
    console.log(
      `🗑️ [Delete Debug] Calling deleteObjectFromCellSpatial for object ${objectIdString} with:`,
      {
        ownerUserId,
        spaceId,
        objectIdString,
        position,
      }
    );
    const deleteResult = await deleteObjectFromCellSpatial(
      ownerUserId,
      spaceId,
      objectIdString,
      position
    );

    console.log(
      `🗑️ [Delete Debug] deleteObjectFromCellSpatial returned:`,
      deleteResult
    );

    if (!deleteResult) {
      throw new Error(
        `Failed to delete object ${objectIdString} from spatial cell`
      );
    }

    console.log(
      `✅ [Delete Debug] Successfully completed deletion for object ${objectIdString}`
    );

    // Additional safety: Clear any cached references that might cause re-addition
    setTimeout(() => {
      objectsCache.delete(cacheKey);
      lastReceivedObjects.delete(cacheKey);
    }, 100);
  } catch (error) {
    console.error(
      `❌ [Delete Debug] Error deleting object ${objectId} from cell:`,
      error
    );
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Update an object within its cell (with cell boundary detection)
 */
export const updateObjectInSpatialCell = async (
  userId,
  spaceId,
  objectData
) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    console.log(
      `⏸️ [updateObjectInSpatialCell] Skipping save for object ${objectData.id} - still in initial loading phase`
    );
    return;
  }

  if (!userId || !spaceId || !objectData.id) {
    console.error(
      '[updateObjectInSpatialCell] Missing userId, spaceId, or object ID.'
    );
    throw new Error('Missing required IDs for object update.');
  }

  // Validate position data
  if (
    !objectData.position ||
    !Array.isArray(objectData.position) ||
    objectData.position.length !== 3
  ) {
    console.error(
      '[updateObjectInSpatialCell] Invalid or missing position data:',
      {
        id: objectData.id,
        position: objectData.position,
        positionType: typeof objectData.position,
        isArray: Array.isArray(objectData.position),
      }
    );
    throw new Error('Invalid position data for spatial object update.');
  }

  try {
    const objectId = objectData.id.toString();
    const moveKey = `${spaceId}_${objectId}`;

    // Race condition protection: Check if object is already being moved
    if (movingObjects.has(moveKey)) {
      const moveInfo = movingObjects.get(moveKey);
      const timeSinceMove = Date.now() - moveInfo.timestamp;

      // If a move is already in progress and it's recent (less than 2 seconds), skip this update
      if (timeSinceMove < 2000) {
        console.log(
          `[updateObjectInSpatialCell] Object ${objectId} is already being moved. Skipping concurrent update.`
        );
        return;
      } else {
        // Clean up stale move tracking
        movingObjects.delete(moveKey);
      }
    }

    // Mark object as being moved
    movingObjects.set(moveKey, { timestamp: Date.now() });

    // Set up cleanup timeout
    const cleanupTimeout = setTimeout(() => {
      movingObjects.delete(moveKey);
    }, 3000); // Clean up after 3 seconds

    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);

      if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
        return;
      }

      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

      const objectToUpdate = {
        ...objectData,
        lastUpdated: Timestamp.fromDate(new Date()),
        updatedBy: userId,
      };

      // If object has position, check for cell boundary crossings
      if (objectData.position && Array.isArray(objectData.position)) {
        const cacheKey = `${spaceId}_${objectData.id}`;
        const cachedData = objectsCache.get(cacheKey);

        if (cachedData && cachedData.position) {
          // Calculate old and new cell IDs
          const oldCellCoords = getCellCoordinates(cachedData.position);
          const newCellCoords = getCellCoordinates(objectData.position);
          const oldCellId = getCellId(
            oldCellCoords.x,
            oldCellCoords.y,
            oldCellCoords.z
          );
          const newCellId = getCellId(
            newCellCoords.x,
            newCellCoords.y,
            newCellCoords.z
          );

          if (oldCellId !== newCellId) {
            console.log(
              `[updateObjectInSpatialCell] Object ${objectData.id} crossed cell boundary from ${oldCellId} to ${newCellId}. Using moveObjectBetweenCells.`
            );

            // Use moveObjectBetweenCells for cell boundary crossings
            await moveObjectBetweenCellsSpatial(
              ownerUserId,
              spaceId,
              objectData.id,
              cachedData.position,
              objectData.position,
              objectToUpdate
            );

            // Update cache with new position
            objectsCache.set(cacheKey, { ...objectToUpdate });
            return;
          }
        }
      }

      // No cell boundary crossing - use direct update
      await updateObjectInCellSpatial(ownerUserId, spaceId, objectToUpdate);
    } finally {
      // Always clean up the moving object tracking
      clearTimeout(cleanupTimeout);
      movingObjects.delete(moveKey);
    }
  } catch (error) {
    console.error(
      `[updateObjectInSpatialCell] Failed to update object ${objectData.id}:`,
      error
    );
    throw error;
  }
};

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from './globalSubscriptionManager';

/**
 * Subscribe to objects in loaded cells with deduplication
 */
export const subscribeToSpatialObjects = (
  userId,
  spaceId,
  loadedCells,
  callback
) => {
  if (!spaceId) return () => {};

  // Ensure loadedCells is always an array
  const safeCells = Array.isArray(loadedCells) ? loadedCells : [];

  const isAnonymous = !userId;
  let isSubscribed = true;
  const unsubscribeFunctions = new Map();
  const localSubscriptionKeys = new Set(); // Track which subscriptions this instance uses

  const startCellSubscriptions = async () => {
    try {
      const ownerIdFromUrl = window.currentSpaceOwner;

      if (isAnonymous && !ownerIdFromUrl) {
        console.error('Anonymous access requires owner ID in URL');
        return;
      }

      const effectiveOwnerId = isAnonymous ? ownerIdFromUrl : userId;

      let ownerUserId = effectiveOwnerId;
      if (!isAnonymous) {
        try {
          const sharedStatus = await isSharedSpace(userId, spaceId);
          if (!isSubscribed) return;
          ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
        } catch (error) {
          console.error('Error checking shared status:', error);
          ownerUserId = window.currentSpaceOwner || userId;
        }
      }
      window.currentSpaceOwner = ownerUserId;

      // Guard against empty cells
      if (safeCells.length === 0) {
        return;
      }

      // Subscribe to each loaded cell with deduplication
      for (const cellKey of safeCells) {
        if (!cellKey || typeof cellKey !== 'string') {
          console.warn('[SpatialObjects] Invalid cellKey:', cellKey);
          continue;
        }

        const [x, y, z] = cellKey.split(',').map(Number);
        const subscriptionKey = generateSubscriptionKey.spatialObjects(
          spaceId,
          cellKey
        );

        // Create cell reference
        const cellRef = doc(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells',
          cellKey
        );

        // Use global subscription manager
        const { unsubscribe: globalUnsubscribe } = getOrCreateSubscription(
          subscriptionKey,
          SUBSCRIPTION_TYPES.SPATIAL_OBJECTS,
          () => {
            // Create the actual Firebase subscription
            return onSnapshot(
              cellRef,
              { includeMetadataChanges: true },
              (snapshot) => {
                if (!snapshot.exists()) {
                  return;
                }
                const cellData = snapshot.data();
                const cellObjects = cellData.objects || {}; // Process each object in the cell
                Object.entries(cellObjects).forEach(
                  ([objectId, objectData]) => {
                    // Loading object from cell - debug logging removed

                    const cacheKey = `${spaceId}_${objectId}`;

                    // Check if object data has changed
                    const cachedData = objectsCache.get(cacheKey);
                    let hasChanged = false;
                    if (cachedData) {
                      const positionChanged = !positionsEqual(
                        cachedData.position,
                        objectData.position
                      );
                      const otherDataChanged = !isEqual(
                        { ...cachedData, position: undefined },
                        { ...objectData, position: undefined }
                      );

                      hasChanged = positionChanged || otherDataChanged;

                      // Object comparison debug logging removed

                      if (hasChanged) {
                        // DUPLICATE PROTECTION: Compare timestamps to ensure we only accept newer versions
                        if (cachedData.lastUpdated && objectData.lastUpdated) {
                          // Handle both Firestore Timestamps and regular Date objects
                          const cachedTime = cachedData.lastUpdated.toMillis
                            ? cachedData.lastUpdated.toMillis()
                            : new Date(cachedData.lastUpdated).getTime();
                          const newTime = objectData.lastUpdated.toMillis
                            ? objectData.lastUpdated.toMillis()
                            : new Date(objectData.lastUpdated).getTime();

                          if (newTime <= cachedTime) {
                            // Rejecting older version - debug logging removed
                            return; // Skip this older version
                          }

                          // Accepting newer version - debug logging removed
                        }

                        // Change details debug logging removed
                      }
                    } else {
                      hasChanged = true;
                      // New object debug logging removed
                    }
                    if (hasChanged) {
                      // Skip Firebase updates for objects currently being transformed
                      if (
                        window._currentTransformingObjects &&
                        window._currentTransformingObjects.has(objectId)
                      ) {
                        console.log(
                          `🔒 Skipping Firebase update for transforming object ${objectId}`
                        );
                        return;
                      }

                      // Accepting object debug logging removed

                      try {
                        objectsCache.set(
                          cacheKey,
                          JSON.parse(JSON.stringify(objectData))
                        );
                      } catch (error) {
                        console.warn(
                          '⚠️ Failed to cache object in spatialObjectsService:',
                          error,
                          'objectData:',
                          objectData
                        );
                        objectsCache.set(cacheKey, { ...objectData }); // Fallback to shallow copy
                      }
                      lastReceivedObjects.set(cacheKey, objectData);
                      callback({
                        type: 'added',
                        id: objectId,
                        object: objectData,
                        cellCoords: { x, y, z: z || 0 },
                      });
                    } else {
                      console.log(
                        `⏭️ [subscribeToSpatialObjects] Skipping object ${objectId} from cell ${cellKey} (no changes detected)`
                      );
                    }
                  }
                );

                // Handle removed objects (compare with cache)
                const currentObjectIds = new Set(Object.keys(cellObjects));
                const cachedObjectIds = new Set();

                for (const cacheKey of objectsCache.keys()) {
                  if (cacheKey.startsWith(`${spaceId}_`)) {
                    const objectId = cacheKey.substring(`${spaceId}_`.length);
                    const objectData = objectsCache.get(cacheKey);

                    // Check if this object belongs to this cell
                    if (objectData && objectData.cellId === cellKey) {
                      cachedObjectIds.add(objectId);
                    }
                  }
                }

                // Find removed objects
                for (const objectId of cachedObjectIds) {
                  if (!currentObjectIds.has(objectId)) {
                    const cacheKey = `${spaceId}_${objectId}`;
                    objectsCache.delete(cacheKey);
                    lastReceivedObjects.delete(cacheKey);
                    callback({
                      type: 'removed',
                      id: objectId,
                      cellCoords: { x, y, z: z || 0 },
                    });
                  }
                }
              },
              (error) => {
                console.error(`Subscription error for cell ${cellKey}:`, error);

                if (error.code === 'permission-denied' && isAnonymous) {
                  console.error(
                    'Anonymous access denied. This space may not be public.'
                  );
                  return;
                }
              }
            );
          }
        );

        // Store the cleanup function
        localSubscriptionKeys.add(subscriptionKey);
        unsubscribeFunctions.set(cellKey, globalUnsubscribe);
      }
    } catch (error) {
      console.error('Error starting spatial objects subscriptions:', error);
    }
  };

  startCellSubscriptions();
  // Return cleanup function
  return () => {
    isSubscribed = false;
    // Clean up all subscriptions created by this instance
    for (const unsubscribe of unsubscribeFunctions.values()) {
      unsubscribe();
    }
    unsubscribeFunctions.clear();
  };
};

/**
 * Update subscriptions when loaded cells change
 */
export const updateCellSubscriptions = (
  currentUnsubscribe,
  userId,
  spaceId,
  loadedCells,
  callback
) => {
  // Clean up current subscriptions
  if (currentUnsubscribe) {
    currentUnsubscribe();
  }

  // Ensure loadedCells is always an array
  const safeCells = Array.isArray(loadedCells) ? loadedCells : [];

  // Start new subscriptions for the updated cell list
  return subscribeToSpatialObjects(userId, spaceId, safeCells, callback);
};

/**
 * Move object between cells (for when object position changes significantly)
 */
export const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectData,
  oldPosition,
  newPosition
) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    console.log(
      `⏸️ [moveObjectBetweenCells] Skipping save for object ${objectData.id} - still in initial loading phase`
    );
    return false;
  }

  if (!userId || !spaceId || !objectData || !oldPosition || !newPosition) {
    return false;
  }

  try {
    const sharedStatus = await isSharedSpace(userId, spaceId);
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return false;
    }

    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Get old and new cell coordinates
    const oldCellCoords = getCellCoordinates(oldPosition);
    const newCellCoords = getCellCoordinates(newPosition); // If the cell hasn't changed, just update the object in place
    if (
      oldCellCoords.x === newCellCoords.x &&
      oldCellCoords.y === newCellCoords.y &&
      oldCellCoords.z === newCellCoords.z
    ) {
      const updatedObject = {
        ...objectData,
        position: newPosition,
        lastUpdated: Timestamp.fromDate(new Date()),
        updatedBy: userId,
      };

      await updateObjectInCellSpatial(ownerUserId, spaceId, updatedObject);
      return true;
    }

    // Move object between cells
    await moveObjectBetweenCellsSpatial(
      ownerUserId,
      spaceId,
      objectData.id,
      oldPosition,
      newPosition,
      { ...objectData, position: newPosition }
    );

    return true;
  } catch (error) {
    console.error('Error moving object between cells:', error);
    return false;
  }
};

/**
 * Load all objects from currently loaded cells
 */
export const loadObjectsFromCells = async (userId, spaceId, loadedCells) => {
  if (!userId || !spaceId || !loadedCells || loadedCells.length === 0) {
    return [];
  }

  try {
    const sharedStatus = await isSharedSpace(userId, spaceId);
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
    const cellCoords = loadedCells.map((cellKey) => {
      const [x, y, z] = cellKey.split(',').map(Number);
      return { x, y, z: z || 0 }; // Default z to 0 for backward compatibility
    });

    const objects = await getObjectsFromCells(ownerUserId, spaceId, cellCoords);

    return objects;
  } catch (error) {
    console.error('Error loading objects from cells:', error);
    return [];
  }
};

// Convenience functions that provide a simpler API for common operations
// These wrap the spatial-aware functions for cases where you don't need to manage cells directly

/**
 * Save object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Object} object - Object data (must include position)
 * @returns {Promise<void>}
 */
export const saveObject = async (userId, spaceId, object) => {
  return saveObjectToCell(userId, spaceId, object);
};

/**
 * Delete object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {string} objectId - Object ID
 * @param {Array} position - Object position [x, y, z] (needed to find the correct cell)
 * @returns {Promise<void>}
 */
export const deleteObject = async (userId, spaceId, objectId, position) => {
  return deleteObjectFromSpatialCell(userId, spaceId, objectId, position);
};

/**
 * Update object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Object} objectData - Updated object data
 * @returns {Promise<void>}
 */
export const updateObject = async (userId, spaceId, objectData) => {
  return updateObjectInSpatialCell(userId, spaceId, objectData);
};

/**
 * Subscribe to all objects in a space using spatial partitioning
 * Note: This subscribes to objects in the provided loaded cells only
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Array} loadedCells - Array of loaded cell IDs
 * @param {Function} callback - Callback for object changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToObjects = (userId, spaceId, loadedCells, callback) => {
  return subscribeToSpatialObjects(userId, spaceId, loadedCells, callback);
};

export { positionsEqual };
