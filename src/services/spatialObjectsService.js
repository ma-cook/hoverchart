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
  moveObjectBetweenCells as moveObjectBetweenCellsSpatial,
} from './spatialPartitioning';

const objectsCache = new Map();
const saveTimeouts = new Map();
const updateThrottles = new Map();
const lastReceivedObjects = new Map();

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
  if (!userId || !spaceId || !object.id || !object.position) {
    return;
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
      return;
    }

    updateThrottles.set(cacheKey, now);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const cachedData = objectsCache.get(cacheKey);

    // Clear any pending save timeout for this object
    if (saveTimeouts.has(cacheKey)) {
      clearTimeout(saveTimeouts.get(cacheKey));
    }

    // Deep clone the object to prevent reference issues
    const newData = JSON.parse(JSON.stringify(object));

    // Enhanced comparison logic
    if (cachedData) {
      const positionChanged = !positionsEqual(
        cachedData.position,
        newData.position
      );

      const nonPositionChanged = !isEqual(
        { ...cachedData, position: undefined },
        { ...newData, position: undefined }
      );

      if (!positionChanged && !nonPositionChanged) {
        return;
      }
    }

    // Update cache before saving
    objectsCache.set(cacheKey, newData);

    // Save with timeout to batch changes
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

          // Save to appropriate cell instead of global objects collection
          await addObjectToCell(ownerUserId, spaceId, objectToSave);

          console.log(
            `Object ${objectId} saved to cell at position`,
            object.position
          );
        } catch (error) {
          console.error('Error saving object to cell:', error);
          objectsCache.delete(cacheKey);
        }
      }, saveTimeout)
    );
  } catch (error) {
    console.error('Error in saveObjectToCell:', error);
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
  if (!userId || !spaceId || !objectId) return;

  try {
    // Clear from cache immediately
    const cacheKey = `${spaceId}_${objectId}`;
    objectsCache.delete(cacheKey);
    lastReceivedObjects.delete(cacheKey);

    // Clear any pending save timeouts
    if (saveTimeouts.has(cacheKey)) {
      clearTimeout(saveTimeouts.get(cacheKey));
      saveTimeouts.delete(cacheKey);
    }

    updateThrottles.delete(cacheKey);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Delete from the appropriate cell
    await deleteObjectFromCellSpatial(
      ownerUserId,
      spaceId,
      objectId.toString(),
      position
    );

    console.log(`Object ${objectId} deleted from cell`);
  } catch (error) {
    console.error('Error deleting object from cell:', error);
  }
};

/**
 * Update an object within its cell
 */
export const updateObjectInSpatialCell = async (
  userId,
  spaceId,
  objectData
) => {
  if (!userId || !spaceId || !objectData.id) {
    console.error(
      '[updateObjectInSpatialCell] Missing userId, spaceId, or object ID.'
    );
    throw new Error('Missing required IDs for object update.');
  }

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

    await updateObjectInCellSpatial(ownerUserId, spaceId, objectToUpdate);

    console.log(`Object ${objectData.id} updated in cell`);
  } catch (error) {
    console.error(
      `[updateObjectInSpatialCell] Failed to update object ${objectData.id}:`,
      error
    );
    throw error;
  }
};

/**
 * Subscribe to objects in loaded cells
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
      console.log(
        `[SpatialObjects] Setting up subscriptions for ${
          safeCells.length
        } cells in space ${spaceId} owned by ${ownerUserId}${
          isAnonymous ? ' (anonymous access)' : ''
        }`
      );

      // Guard against empty cells
      if (safeCells.length === 0) {
        console.log('[SpatialObjects] No loaded cells to subscribe to yet');
        return;
      } // Subscribe to each loaded cell
      for (const cellKey of safeCells) {
        if (!cellKey || typeof cellKey !== 'string') {
          console.warn('[SpatialObjects] Invalid cellKey:', cellKey);
          continue;
        }

        const [x, y] = cellKey.split(',').map(Number);

        if (unsubscribeFunctions.has(cellKey)) {
          continue; // Already subscribed to this cell
        }

        const cellRef = doc(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells',
          cellKey
        );

        const unsubscribe = onSnapshot(
          cellRef,
          { includeMetadataChanges: true },
          (snapshot) => {
            if (!snapshot.exists()) {
              return;
            }

            const cellData = snapshot.data();
            const cellObjects = cellData.objects || {};

            // Process each object in the cell
            Object.entries(cellObjects).forEach(([objectId, objectData]) => {
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
              } else {
                hasChanged = true;
              }

              if (hasChanged) {
                objectsCache.set(
                  cacheKey,
                  JSON.parse(JSON.stringify(objectData))
                );
                lastReceivedObjects.set(cacheKey, objectData);
                callback({
                  type: 'added',
                  id: objectId,
                  object: objectData,
                  cellCoords: { x, y },
                });
              }
            });

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
                  cellCoords: { x, y },
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

            // Handle other errors similar to the original service
          }
        );

        unsubscribeFunctions.set(cellKey, unsubscribe);
      }
    } catch (error) {
      console.error('Error starting spatial objects subscriptions:', error);
    }
  };

  startCellSubscriptions();

  // Return cleanup function
  return () => {
    isSubscribed = false;
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
      oldCellCoords.y === newCellCoords.y
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
    console.log(
      `Object ${objectData.id} moved from cell (${oldCellCoords.x},${oldCellCoords.y}) to (${newCellCoords.x},${newCellCoords.y})`
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
      const [x, y] = cellKey.split(',').map(Number);
      return { x, y };
    });

    const objects = await getObjectsFromCells(ownerUserId, spaceId, cellCoords);

    console.log(
      `Loaded ${objects.length} objects from ${cellCoords.length} cells`
    );
    return objects;
  } catch (error) {
    console.error('Error loading objects from cells:', error);
    return [];
  }
};

export { positionsEqual };
