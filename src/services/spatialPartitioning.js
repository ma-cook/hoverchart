import { db } from '../firebase';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  deleteField,
  writeBatch,
} from 'firebase/firestore';

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from './globalSubscriptionManager';

import { getIsInitialLoading } from '../utils/loadingState';

// Cell size constants
export const CELL_SIZE = 10000;
export const CELL_NEIGHBOR_RADIUS = 1; // Load 3x3 horizontal grid around camera (9 cells)
export const CELL_UNLOAD_DISTANCE = 4; // Increased distance to reduce premature unloading
export const CELL_BOUNDARY_HYSTERESIS = 1000; // 1000 units buffer zone to prevent rapid switching near boundaries

// Cache for cell existence checks to reduce redundant fetch calls
const cellExistenceCache = new Map(); // cellId -> { exists: boolean, timestamp: number }
const CACHE_DURATION = 60000; // 1 minute cache for cell existence checks
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

// Periodic cache cleanup
const cleanupCache = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, value] of cellExistenceCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => cellExistenceCache.delete(key));

  // If cache is still too large, remove oldest entries
  if (cellExistenceCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cellExistenceCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const excessCount = cellExistenceCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < excessCount; i++) {
      cellExistenceCache.delete(entries[i][0]);
    }
  }
};

// Run cache cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

// Spatial partitioning service loaded

// Race condition protection for concurrent object moves
const movingObjects = new Map(); // objectId -> { timestamp, promise }
const MOVE_TIMEOUT = 500; // Reduced to 500ms timeout for moves

/**
 * Calculate which cell a position belongs to
 * @param {Array} position - [x, y, z] world position
 * @returns {Object} - {x, y, z} cell coordinates
 */
export const getCellCoordinates = (position) => {
  if (!Array.isArray(position) || position.length < 3) {
    return { x: 0, y: 0, z: 0 };
  }

  const [x, y, z] = position;

  return {
    x: Math.floor(x / CELL_SIZE),
    y: Math.floor(y / CELL_SIZE),
    z: Math.floor(z / CELL_SIZE),
  };
};

/**
 * Get cell coordinates with hysteresis to prevent rapid switching near boundaries
 * @param {Array} position - [x, y, z] world position
 * @param {Object} currentCell - Current cell coordinates {x, y, z}
 * @returns {Object} - {x, y, z} cell coordinates with hysteresis applied
 */
export const getCellCoordinatesWithHysteresis = (position, currentCell) => {
  if (!currentCell) {
    return getCellCoordinates(position);
  }

  const [x, y, z] = position;
  const newCoords = getCellCoordinates(position);

  // If we haven't changed cells, no need for hysteresis
  if (
    newCoords.x === currentCell.x &&
    newCoords.y === currentCell.y &&
    newCoords.z === currentCell.z
  ) {
    return currentCell;
  }

  // Check if we're within the hysteresis buffer zone of the current cell
  const currentCellCenter = [
    (currentCell.x + 0.5) * CELL_SIZE,
    (currentCell.y + 0.5) * CELL_SIZE,
    (currentCell.z + 0.5) * CELL_SIZE,
  ];

  const distanceFromCenter = Math.sqrt(
    Math.pow(x - currentCellCenter[0], 2) +
      Math.pow(y - currentCellCenter[1], 2) +
      Math.pow(z - currentCellCenter[2], 2)
  );

  // If we're still within the buffer zone, stick to current cell
  const bufferDistance = CELL_SIZE / 2 - CELL_BOUNDARY_HYSTERESIS;
  if (distanceFromCenter < bufferDistance) {
    return currentCell;
  }

  // Only switch cells if we're clearly outside the buffer zone
  return newCoords;
};

/**
 * Generate cell ID from coordinates
 * @param {number} x - Cell x coordinate
 * @param {number} y - Cell y coordinate
 * @param {number} z - Cell z coordinate
 * @returns {string} - Cell ID
 */
export const getCellId = (x, y, z) => {
  return `${x},${y},${z}`;
};

/**
 * Parse cell ID back to coordinates
 * @param {string} cellId - Cell ID string
 * @returns {Object} - {x, y, z} cell coordinates
 */
export const parseCellId = (cellId) => {
  const [x, y, z] = cellId.split(',').map(Number);
  return { x, y, z };
};

/**
 * Get world bounds for a cell
 * @param {number} cellX - Cell x coordinate
 * @param {number} cellY - Cell y coordinate
 * @param {number} cellZ - Cell z coordinate
 * @returns {Object} - {minX, maxX, minY, maxY, minZ, maxZ} bounds
 */
export const getCellBounds = (cellX, cellY, cellZ) => {
  return {
    minX: cellX * CELL_SIZE,
    maxX: (cellX + 1) * CELL_SIZE,
    minY: cellY * CELL_SIZE,
    maxY: (cellY + 1) * CELL_SIZE,
    minZ: cellZ * CELL_SIZE,
    maxZ: (cellZ + 1) * CELL_SIZE,
  };
};

/**
 * Create a new cell in the database
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {number} cellX - Cell x coordinate
 * @param {number} cellY - Cell y coordinate
 * @param {number} cellZ - Cell z coordinate
 * @returns {Promise<boolean>} - Success status
 */
export const createCell = async (userId, spaceId, cellX, cellY, cellZ) => {
  if (!userId || !spaceId) {
    return false;
  }

  try {
    const cellId = getCellId(cellX, cellY, cellZ);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // Check if cell already exists
    const cellDoc = await getDoc(cellRef);
    if (cellDoc.exists()) {
      return true;
    }

    // Create new cell
    const cellData = {
      id: cellId,
      x: cellX,
      y: cellY,
      z: cellZ,
      bounds: getCellBounds(cellX, cellY, cellZ),
      createdAt: new Date(),
      objects: {}, // Will store object data with objectId as key
      connections: {}, // Will store connection data with connectionId as key
    };

    await setDoc(cellRef, cellData);
    return true;
  } catch {
    return false;
  }
};

// Request deduplication for concurrent cell loading (legacy - now handled in batch)
// const cellLoadingPromises = new Map(); // cellKey -> Promise

/**
 * Create multiple cells in batch for better performance with optimized existence checks
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoordsList - Array of {x, y, z} cell coordinates
 * @returns {Promise<Array>} - Array of success status for each cell
 */
export const createCellsBatch = async (userId, spaceId, cellCoordsList) => {
  if (!userId || !spaceId || !cellCoordsList?.length) {
    return [];
  }

  // Limit batch size for conservative performance
  const BATCH_SIZE = 6;
  const results = [];

  // Process in small batches to avoid overwhelming Firestore
  for (let i = 0; i < cellCoordsList.length; i += BATCH_SIZE) {
    const batch = cellCoordsList.slice(i, i + BATCH_SIZE);
    const batchResults = await createCellsBatchOptimized(
      userId,
      spaceId,
      batch
    );
    results.push(...batchResults);
  }

  return results;
};

/**
 * Optimized batch cell creation with reduced database round trips
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoordsList - Array of {x, y, z} cell coordinates (max 6-8)
 * @returns {Promise<Array>} - Array of success status for each cell
 */
const createCellsBatchOptimized = async (userId, spaceId, cellCoordsList) => {
  if (!userId || !spaceId || !cellCoordsList?.length) {
    return [];
  }

  // Step 1: Check cache first for all cells
  const cacheChecks = cellCoordsList.map(({ x, y, z }) => {
    const cellId = getCellId(x, y, z);
    const cacheKey = `${userId}:${spaceId}:${cellId}`;
    const cached = cellExistenceCache.get(cacheKey);

    return {
      coords: { x, y, z },
      cellId,
      cacheKey,
      cached:
        cached && Date.now() - cached.timestamp < CACHE_DURATION
          ? cached
          : null,
    };
  });

  // Step 2: Separate cached vs uncached cells
  const cachedExisting = cacheChecks.filter((item) => item.cached?.exists);
  const cachedNonExisting = cacheChecks.filter(
    (item) => item.cached && !item.cached.exists
  );
  const uncachedCells = cacheChecks.filter((item) => !item.cached);

  // Step 3: Batch check existence for uncached cells only
  let existenceResults = [];
  if (uncachedCells.length > 0) {
    // Use Promise.all for parallel existence checks
    const existencePromises = uncachedCells.map(
      async ({ coords, cellId, cacheKey }) => {
        try {
          const cellRef = doc(
            db,
            'users',
            userId,
            'spaces',
            spaceId,
            'cells',
            cellId
          );
          const cellDoc = await getDoc(cellRef);
          const exists = cellDoc.exists();

          // Cache the result
          cellExistenceCache.set(cacheKey, {
            exists,
            timestamp: Date.now(),
          });

          return { coords, cellId, exists, cellDoc: exists ? cellDoc : null };
        } catch (error) {
          console.warn(`Failed to check cell existence for ${cellId}:`, error);
          return { coords, cellId, exists: false, cellDoc: null };
        }
      }
    );

    existenceResults = await Promise.all(existencePromises);
  }

  // Step 4: Combine all results
  const allResults = [
    ...cachedExisting.map((item) => ({ ...item, exists: true })),
    ...cachedNonExisting.map((item) => ({ ...item, exists: false })),
    ...existenceResults,
  ];

  // Step 5: Filter cells that need creation and use batch write
  const cellsToCreate = allResults.filter((item) => !item.exists);

  if (cellsToCreate.length === 0) {
    // All cells already exist
    return cellCoordsList.map(() => true);
  }

  // Step 6: Use Firestore batch write for creating multiple cells
  try {
    const batch = writeBatch(db);

    cellsToCreate.forEach(({ coords, cellId }) => {
      const { x, y, z } = coords;
      const cellRef = doc(
        db,
        'users',
        userId,
        'spaces',
        spaceId,
        'cells',
        cellId
      );

      const cellData = {
        id: cellId,
        x: x,
        y: y,
        z: z,
        bounds: getCellBounds(x, y, z),
        createdAt: new Date(),
        objects: {},
        connections: {},
      };

      batch.set(cellRef, cellData);
    });

    // Commit the batch
    await batch.commit();

    // Update cache for newly created cells
    cellsToCreate.forEach(({ cacheKey }) => {
      cellExistenceCache.set(cacheKey, {
        exists: true,
        timestamp: Date.now(),
      });
    });

    // Return success for all cells
    return cellCoordsList.map(() => true);
  } catch (error) {
    console.error('Failed to create cells batch:', error);

    // Fallback: create cells individually
    const fallbackPromises = cellsToCreate.map(async ({ coords }) => {
      const { x, y, z } = coords;
      return await createCell(userId, spaceId, x, y, z);
    });

    const fallbackResults = await Promise.all(fallbackPromises);

    // Reconstruct full results array
    const fullResults = [];
    let createIndex = 0;

    for (const item of allResults) {
      if (item.exists) {
        fullResults.push(true);
      } else {
        fullResults.push(fallbackResults[createIndex] || false);
        createIndex++;
      }
    }

    return fullResults;
  }
};

/**
 * Check if cell exists in cache first, then database
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {number} cellX - Cell x coordinate
 * @param {number} cellY - Cell y coordinate
 * @param {number} cellZ - Cell z coordinate
 * @returns {Promise<boolean>} - Whether cell exists
 */
export const cellExists = async (userId, spaceId, cellX, cellY, cellZ) => {
  if (!userId || !spaceId) return false;

  const cellId = getCellId(cellX, cellY, cellZ);
  const cacheKey = `${userId}:${spaceId}:${cellId}`;

  // Check cache first
  const cached = cellExistenceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.exists;
  }

  try {
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );
    const cellDoc = await getDoc(cellRef);
    const exists = cellDoc.exists();

    // Cache the result
    cellExistenceCache.set(cacheKey, {
      exists,
      timestamp: Date.now(),
    });

    return exists;
  } catch {
    return false;
  }
};

/**
 * Bulk check if multiple cells exist - optimized for batch operations
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoordsList - Array of {x, y, z} cell coordinates
 * @returns {Promise<Array>} - Array of {coords, exists} objects
 */
export const cellExistsBulk = async (userId, spaceId, cellCoordsList) => {
  if (!userId || !spaceId || !cellCoordsList?.length) {
    return [];
  }

  // Check cache first for all cells
  const cacheResults = [];
  const uncachedCells = [];

  cellCoordsList.forEach((coords) => {
    const { x, y, z } = coords;
    const cellId = getCellId(x, y, z);
    const cacheKey = `${userId}:${spaceId}:${cellId}`;
    const cached = cellExistenceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      cacheResults.push({ coords, exists: cached.exists });
    } else {
      uncachedCells.push({ coords, cellId, cacheKey });
    }
  });

  // For uncached cells, check in parallel
  let uncachedResults = [];
  if (uncachedCells.length > 0) {
    const promises = uncachedCells.map(async ({ coords, cellId, cacheKey }) => {
      try {
        const cellRef = doc(
          db,
          'users',
          userId,
          'spaces',
          spaceId,
          'cells',
          cellId
        );
        const cellDoc = await getDoc(cellRef);
        const exists = cellDoc.exists();

        // Cache the result
        cellExistenceCache.set(cacheKey, {
          exists,
          timestamp: Date.now(),
        });

        return { coords, exists };
      } catch {
        return { coords, exists: false };
      }
    });

    uncachedResults = await Promise.all(promises);
  }

  // Combine and maintain original order
  const allResults = [...cacheResults, ...uncachedResults];

  // Sort to match original input order
  return cellCoordsList.map((inputCoords) => {
    return (
      allResults.find(
        (result) =>
          result.coords.x === inputCoords.x &&
          result.coords.y === inputCoords.y &&
          result.coords.z === inputCoords.z
      ) || { coords: inputCoords, exists: false }
    );
  });
};

/**
 * Get cell data
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {number} cellX - Cell x coordinate
 * @param {number} cellY - Cell y coordinate
 * @param {number} cellZ - Cell z coordinate
 * @returns {Promise<Object|null>} - Cell data or null
 */
export const getCell = async (userId, spaceId, cellX, cellY, cellZ) => {
  if (!userId || !spaceId) return null;

  try {
    const cellId = getCellId(cellX, cellY, cellZ);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );
    const cellDoc = await getDoc(cellRef);
    if (cellDoc.exists()) {
      return { id: cellId, ...cellDoc.data() };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Add object to cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Object} objectData - Complete object data
 * @returns {Promise<boolean>} - Success status
 */
export const addObjectToCell = async (userId, spaceId, objectData) => {
  if (
    !userId ||
    !spaceId ||
    !objectData ||
    !objectData.id ||
    !objectData.position
  ) {
    return false;
  }

  try {
    const cellCoords = getCellCoordinates(objectData.position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // Get current cell data
    const cellDoc = await getDoc(cellRef);
    let cellData;

    if (cellDoc.exists()) {
      cellData = cellDoc.data();
    } else {
      // Create cell if it doesn't exist
      await createCell(
        userId,
        spaceId,
        cellCoords.x,
        cellCoords.y,
        cellCoords.z
      );
      cellData = {
        id: cellId,
        x: cellCoords.x,
        y: cellCoords.y,
        z: cellCoords.z,
        bounds: getCellBounds(cellCoords.x, cellCoords.y, cellCoords.z),
        createdAt: new Date(),
        objects: {},
        connections: {},
      };
    }

    // Ensure objects is an object (for backward compatibility)
    if (Array.isArray(cellData.objects)) {
      cellData.objects = {};
    }

    // Check if object already exists in this cell
    const objectExists = cellData.objects[objectData.id];
    if (objectExists) {
      // Object exists, will be updated
    } else {
      // Object doesn't exist, will be added
    } // Add object data to cell with object ID as key
    const objectToAdd = {
      ...objectData,
      lastUpdated: new Date(),
      cellId: cellId,
    };

    // Use updateDoc for atomic operation to prevent race conditions
    await updateDoc(cellRef, {
      [`objects.${objectData.id}`]: objectToAdd,
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * Remove object from cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} objectId - Object ID
 * @param {Array} position - Object position [x, y, z]
 * @returns {Promise<boolean>} - Success status
 */
export const removeObjectFromCell = async (
  userId,
  spaceId,
  objectId,
  position
) => {
  if (!userId || !spaceId || !objectId || !position) {
    return false;
  }

  try {
    const cellCoords = getCellCoordinates(position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // First, check if the cell exists and the object is actually there
    const cellDoc = await getDoc(cellRef);
    if (!cellDoc.exists()) {
      return true; // Cell doesn't exist, object not in any cell
    }

    const cellData = cellDoc.data();

    // Check if object exists in the cell before attempting deletion
    let objectExists = false;
    if (Array.isArray(cellData.objects)) {
      // Legacy array format - convert to object format first
      const objectsAsMap = {};
      cellData.objects.forEach((obj) => {
        if (typeof obj === 'string') {
          objectsAsMap[obj] = { id: obj };
        } else if (obj && obj.id) {
          objectsAsMap[obj.id] = obj;
        }
      });

      // Update the cell to use object format
      await updateDoc(cellRef, {
        objects: objectsAsMap,
      });

      objectExists = objectsAsMap[objectId] !== undefined;
    } else if (cellData.objects && typeof cellData.objects === 'object') {
      objectExists = cellData.objects[objectId] !== undefined;
    }

    if (!objectExists) {
      return true; // Object doesn't exist, consider it "removed"
    }

    // Use atomic updateDoc with deleteField for safe removal
    await updateDoc(cellRef, {
      [`objects.${objectId}`]: deleteField(),
    });

    // Verify the removal with retries for eventual consistency
    let verificationAttempts = 0;
    const maxAttempts = 3;

    while (verificationAttempts < maxAttempts) {
      // Wait for Firestore to propagate changes
      await new Promise((resolve) =>
        setTimeout(resolve, 200 * (verificationAttempts + 1))
      );

      const verifyDoc = await getDoc(cellRef);
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data();
        if (verifyData.objects && verifyData.objects[objectId]) {
          verificationAttempts++;

          if (verificationAttempts < maxAttempts) {
            // Retry the deletion
            await updateDoc(cellRef, {
              [`objects.${objectId}`]: deleteField(),
            });
          } else {
            return false;
          }
        } else {
          return true;
        }
      } else {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Move object between cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string|Object} objectIdOrData - Object ID string or complete object data
 * @param {Array} oldPosition - Old position [x, y, z]
 * @param {Array} newPosition - New position [x, y, z]
 * @param {Object} [objectData] - Complete object data (when first param is objectId)
 * @returns {Promise<boolean>} - Success status
 */
export const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectIdOrData,
  oldPosition,
  newPosition,
  objectData = null // This is the optional one if objectIdOrData is a string
) => {
  if (!userId || !spaceId || !objectIdOrData || !oldPosition || !newPosition) {
    return false;
  }

  let objectId;
  let effectiveObjectData; // This will hold the most complete object data, intended for the new state/position

  if (typeof objectIdOrData === 'string') {
    objectId = objectIdOrData;
    effectiveObjectData = objectData
      ? { ...objectData, id: objectId, position: newPosition }
      : { id: objectId, position: newPosition };
  } else {
    effectiveObjectData = { ...objectIdOrData, position: newPosition };
    objectId = effectiveObjectData.id;
  }

  if (!objectId) {
    return false;
  }
  if (!effectiveObjectData.id) {
    effectiveObjectData.id = objectId;
  }

  // Race condition protection: Check if object is already being moved
  const now = Date.now();
  const existing = movingObjects.get(objectId);

  if (existing) {
    const timeSinceLastMove = now - existing.timestamp;
    if (timeSinceLastMove < MOVE_TIMEOUT) {
      try {
        await existing.promise;
      } catch {
        // Previous move operation failed, continue with new move
      }
    } else {
      // Previous move timed out, proceed with new move
    }
  }

  // Create a promise for this move operation
  const movePromise = (async () => {
    try {
      const oldCellCoords = getCellCoordinates(oldPosition);
      const newCellCoords = getCellCoordinates(newPosition);
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

      if (oldCellId === newCellId) {
        const updateResult = await addObjectToCell(
          userId,
          spaceId,
          effectiveObjectData
        );
        return updateResult;
      }

      // If cells are different, proceed with move
      await removeObjectFromCell(userId, spaceId, objectId, oldPosition);

      const added = await addObjectToCell(userId, spaceId, effectiveObjectData);

      if (added) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    } finally {
      // Clean up the moving objects cache
      movingObjects.delete(objectId);
    }
  })();

  // Store the move operation in our cache
  movingObjects.set(objectId, {
    timestamp: now,
    promise: movePromise,
  });

  return await movePromise;
};

/**
 * Get all loaded cells for a space
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @returns {Promise<Array>} - Array of loaded cells
 */
export const getLoadedCells = async (userId, spaceId) => {
  if (!userId || !spaceId) return [];

  try {
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );
    const cellsSnapshot = await getDocs(cellsRef);

    return cellsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch {
    return [];
  }
};

/**
 * Get all objects from loaded cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoords - Array of {x, y} cell coordinates to load from
 * @returns {Promise<Array>} - Array of objects from all specified cells
 */
export const getObjectsFromCells = async (userId, spaceId, cellCoords) => {
  if (!userId || !spaceId || !cellCoords) {
    return [];
  }

  try {
    const allObjects = [];

    for (const coords of cellCoords) {
      const cellId = getCellId(coords.x, coords.y, coords.z);

      const cellRef = doc(
        db,
        'users',
        userId,
        'spaces',
        spaceId,
        'cells',
        cellId
      );

      const cellDoc = await getDoc(cellRef);
      if (cellDoc.exists()) {
        const cellData = cellDoc.data();

        // Handle both old array format and new object format
        if (cellData.objects) {
          if (Array.isArray(cellData.objects)) {
            // Old format - we'll need to load objects from global collection
            // This is for backward compatibility
          } else if (typeof cellData.objects === 'object') {
            // New format - objects stored directly in cell
            const cellObjects = Object.values(cellData.objects);
            allObjects.push(...cellObjects);
          }
        } else {
          // No objects found in this cell
        }
      } else {
        // Cell doesn't exist - this is expected for empty areas
      }
    }

    return allObjects;
  } catch {
    return [];
  }
};

/**
 * Update object in its current cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Object} objectData - Complete object data
 * @returns {Promise<boolean>} - Success status
 */
export const updateObjectInCell = async (userId, spaceId, objectData) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    return false;
  }

  if (
    !userId ||
    !spaceId ||
    !objectData ||
    !objectData.id ||
    !objectData.position
  ) {
    return false;
  }
  try {
    const cellCoords = getCellCoordinates(objectData.position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    const cellDoc = await getDoc(cellRef);
    if (!cellDoc.exists()) {
      return await addObjectToCell(userId, spaceId, objectData);
    }

    const cellData = cellDoc.data();
    if (Array.isArray(cellData.objects)) {
      cellData.objects = {}; // Convert or handle appropriately
    }

    // Ensure cellData.objects is an object map
    if (typeof cellData.objects !== 'object' || cellData.objects === null) {
      cellData.objects = {};
    }

    cellData.objects[objectData.id] = {
      ...objectData,
      lastUpdated: new Date(),
      cellId: cellId,
    };
    await setDoc(cellRef, cellData, { merge: true });
    return true;
  } catch {
    return false;
  }
};

/**
 * Delete object from its cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} objectId - Object ID
 * @param {Array} position - Object position [x, y, z]
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObjectFromCell = async (
  userId,
  spaceId,
  objectId,
  position
) => {
  if (!userId || !spaceId || !objectId || !position) return false;

  try {
    const cellCoords = getCellCoordinates(position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // Check if cell exists first
    const cellDoc = await getDoc(cellRef);
    if (!cellDoc.exists()) {
      return true; // Cell doesn't exist, object already not present
    }

    const cellData = cellDoc.data();

    // Check if object exists before attempting deletion
    let objectExists = false;
    if (Array.isArray(cellData.objects)) {
      // Legacy array format - check if object exists
      objectExists =
        cellData.objects.includes(objectId) ||
        cellData.objects.some((obj) => obj && obj.id === objectId);
    } else if (cellData.objects && typeof cellData.objects === 'object') {
      objectExists = cellData.objects[objectId] !== undefined;
    }

    if (!objectExists) {
      return true; // Object doesn't exist, consider it deleted
    }

    // Use atomic updateDoc with deleteField for safe deletion
    await updateDoc(cellRef, {
      [`objects.${objectId}`]: deleteField(),
    });

    // Verify deletion with retries
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempts + 1)));

      const verifyDoc = await getDoc(cellRef);
      if (!verifyDoc.exists()) {
        return true;
      }

      const verifyData = verifyDoc.data();
      if (!verifyData.objects || !verifyData.objects[objectId]) {
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await updateDoc(cellRef, {
          [`objects.${objectId}`]: deleteField(),
        });
      } else {
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
};

// Track callbacks for cell subscriptions
const cellCallbacks = new Map(); // subscriptionKey -> Set(callbacks)

/**
 * Subscribe to cell changes with global subscription deduplication
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoords - Array of {x, y} cell coordinates to watch
 * @param {Function} callback - Callback function for changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToCells = (userId, spaceId, cellCoords, callback) => {
  if (!userId || !spaceId || !cellCoords || !callback) {
    return () => {};
  }

  const unsubscribeFunctions = [];

  cellCoords.forEach((coords) => {
    const cellId = getCellId(coords.x, coords.y, coords.z);
    const subscriptionKey = generateSubscriptionKey.cells(spaceId, cellId);

    // Add callback to tracking
    if (!cellCallbacks.has(subscriptionKey)) {
      cellCallbacks.set(subscriptionKey, new Set());
    }
    cellCallbacks.get(subscriptionKey).add(callback);

    // Use global subscription manager
    const { unsubscribe } = getOrCreateSubscription(
      subscriptionKey,
      SUBSCRIPTION_TYPES.CELLS,
      () => {
        const cellRef = doc(
          db,
          'users',
          userId,
          'spaces',
          spaceId,
          'cells',
          cellId
        );

        return onSnapshot(
          cellRef,
          (doc) => {
            if (doc.exists()) {
              const cellData = {
                type: 'cell_updated',
                cellId,
                data: { id: cellId, ...doc.data() },
              };

              // Notify all registered callbacks for this cell
              const callbacks = cellCallbacks.get(subscriptionKey);
              if (callbacks) {
                callbacks.forEach((cb) => cb(cellData));
              }
            }
          },
          () => {
            // Error handler - no logging
          }
        );
      }
    );

    unsubscribeFunctions.push(() => {
      const callbacks = cellCallbacks.get(subscriptionKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          cellCallbacks.delete(subscriptionKey);
        }
      }
      unsubscribe();
    });
  });

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach((cleanup) => cleanup());
  };
};

/**
 * Get all cell IDs that contain objects for a given space
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @returns {Promise<Array>} - Array of cell IDs that contain objects
 */
export const getOccupiedCells = async (userId, spaceId) => {
  if (!userId || !spaceId) return [];

  try {
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );

    const snapshot = await getDocs(cellsRef);
    const occupiedCells = [];

    snapshot.forEach((doc) => {
      const cellData = doc.data();
      // Check if cell has any objects
      if (cellData.objects && Object.keys(cellData.objects).length > 0) {
        occupiedCells.push(doc.id);
      }
    });

    return occupiedCells;
  } catch {
    return [];
  }
};

/**
 * Calculate the distance between two cells in cell blocks
 * @param {Object} cell1 - {x, y, z} cell coordinates
 * @param {Object} cell2 - {x, y, z} cell coordinates
 * @returns {number} - Distance in cell blocks (Manhattan distance)
 */
export const getCellDistance = (cell1, cell2) => {
  return Math.max(
    Math.abs(cell1.x - cell2.x),
    Math.abs(cell1.y - cell2.y),
    Math.abs(cell1.z - cell2.z || 0)
  );
};

/**
 * Get cells that should be unloaded based on camera position
 * @param {Array} position - [x, y, z] camera position
 * @param {Array} loadedCellIds - Array of currently loaded cell IDs
 * @param {number} unloadDistance - Distance in cell blocks to unload
 * @returns {Array} - Array of cell IDs that should be unloaded
 */
export const getCellsToUnload = (
  position,
  loadedCellIds,
  unloadDistance = CELL_UNLOAD_DISTANCE
) => {
  if (!Array.isArray(position) || position.length < 3) {
    return [];
  }

  const currentCell = getCellCoordinates(position);
  const cellsToUnload = [];

  for (const cellId of loadedCellIds) {
    const cellCoords = parseCellId(cellId);
    const distance = getCellDistance(currentCell, cellCoords);

    if (distance >= unloadDistance) {
      cellsToUnload.push(cellId);
    }
  }

  return cellsToUnload;
};

/**
 * Add connection to the appropriate cells based on endpoint positions
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Object} connectionData - Complete connection data
 * @returns {Promise<boolean>} - Success status
 */
export const addConnectionToCells = async (userId, spaceId, connectionData) => {
  if (!userId || !spaceId || !connectionData || !connectionData.id) {
    return false;
  }

  try {
    // Check if this connection is in the deletion blacklist
    const { default: useConnectionStore } = await import(
      '../stores/connectionStore'
    );
    const connectionStore = useConnectionStore.getState();

    if (connectionStore.deletingConnections.has(connectionData.id)) {
      return false;
    }

    // Get start and end positions
    const startPosition = connectionData.start?.position;
    const endPosition = connectionData.end?.position;

    if (!startPosition || !endPosition) {
      return false;
    }

    // Get cell coordinates for both endpoints
    const startCellCoords = getCellCoordinates(startPosition);
    const endCellCoords = getCellCoordinates(endPosition);

    // Add connection to start cell
    const startCellId = getCellId(
      startCellCoords.x,
      startCellCoords.y,
      startCellCoords.z
    );

    await addConnectionToCell(userId, spaceId, startCellId, connectionData);

    // Add connection to end cell if different from start cell
    const endCellId = getCellId(
      endCellCoords.x,
      endCellCoords.y,
      endCellCoords.z
    );
    if (startCellId !== endCellId) {
      await addConnectionToCell(userId, spaceId, endCellId, connectionData);
    }

    return true;
  } catch {
    return false;
  }
};

export const bulkSaveConnectionsToCell = async (
  userId,
  spaceId,
  cellId,
  connectionsArray
) => {
  if (
    !userId ||
    !spaceId ||
    !cellId ||
    !connectionsArray ||
    !Array.isArray(connectionsArray)
  ) {
    return false;
  }

  if (connectionsArray.length === 0) {
    return true;
  }

  try {
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // Get current cell data
    const cellDoc = await getDoc(cellRef);
    let cellData;

    if (cellDoc.exists()) {
      cellData = cellDoc.data();
    } else {
      // Cell doesn't exist, create it
      const [x, y, z] = cellId.split(',').map(Number);
      await createCell(userId, spaceId, x, y, z);
      cellData = {
        id: cellId,
        x,
        y,
        z,
        bounds: getCellBounds(x, y, z),
        createdAt: new Date(),
        objects: {},
        connections: {},
      };
    }

    // Initialize or fix connections structure
    if (!cellData.connections || Array.isArray(cellData.connections)) {
      cellData.connections = {};
    }

    // Add all connections in bulk
    cellData.hasConnections = true;
    const currentTime = new Date();

    for (const connectionData of connectionsArray) {
      cellData.connections[connectionData.id] = {
        ...connectionData,
        lastUpdated: currentTime,
        cellId: cellId,
      };
    }

    await setDoc(cellRef, cellData, { merge: true });

    return true;
  } catch {
    return false;
  }
};

/**
 * Add connection to a specific cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} cellId - Cell ID
 * @param {Object} connectionData - Complete connection data
 * @returns {Promise<boolean>} - Success status
 */
export const addConnectionToCell = async (
  userId,
  spaceId,
  cellId,
  connectionData
) => {
  if (!userId || !spaceId || !cellId || !connectionData) {
    return false;
  }

  try {
    // Check if this connection is in the deletion blacklist
    const { default: useConnectionStore } = await import(
      '../stores/connectionStore'
    );
    const connectionStore = useConnectionStore.getState();

    if (connectionStore.deletingConnections.has(connectionData.id)) {
      return false;
    }

    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    // Get current cell data
    const cellDoc = await getDoc(cellRef);
    let cellData;

    if (cellDoc.exists()) {
      cellData = cellDoc.data();
    } else {
      // Cell doesn't exist, create it
      const [x, y, z] = cellId.split(',').map(Number);
      await createCell(userId, spaceId, x, y, z);
      cellData = {
        id: cellId,
        x,
        y,
        z,
        bounds: getCellBounds(x, y, z),
        createdAt: new Date(),
        objects: {},
        connections: {},
      };
    }

    // Initialize or fix connections structure
    if (!cellData.connections || Array.isArray(cellData.connections)) {
      cellData.connections = {};
    }

    // Add connection data to cell and mark cell as having connections
    cellData.hasConnections = true;
    cellData.connections[connectionData.id] = {
      ...connectionData,
      lastUpdated: new Date(),
      cellId: cellId,
    };

    await setDoc(cellRef, cellData, { merge: true });
    return true;
  } catch {
    return false;
  }
};

/**
 * Remove connection from all cells (fallback when position data is missing)
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} connectionId - Connection ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeConnectionFromAllCells = async (
  userId,
  spaceId,
  connectionId
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

  try {
    // Get all cells in the space
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );
    const snapshot = await getDocs(cellsRef);

    let errorCount = 0;

    // Process each cell
    for (const cellDoc of snapshot.docs) {
      const cellData = cellDoc.data();

      if (cellData.connections && typeof cellData.connections === 'object') {
        if (cellData.connections[connectionId]) {
          try {
            delete cellData.connections[connectionId];

            // If this was the last connection, clean up the cell's connection data
            if (Object.keys(cellData.connections).length === 0) {
              delete cellData.connections;
              delete cellData.hasConnections;
            }

            await setDoc(cellDoc.ref, cellData, { merge: true });
          } catch {
            errorCount++;
          }
        }
      }
    }

    return errorCount === 0;
  } catch {
    return false;
  }
};

/**
 * Normalize position data to handle both array and object formats
 * @param {Object|Array} position - Position as {x,y,z} or [x,y,z]
 * @returns {Object|null} - Normalized position as {x,y,z} or null if invalid
 */
const normalizePosition = (position) => {
  if (!position) return null;

  // Handle array format [x, y, z]
  if (Array.isArray(position) && position.length >= 3) {
    const [x, y, z] = position;
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number' &&
      !isNaN(x) &&
      !isNaN(y) &&
      !isNaN(z)
    ) {
      return { x, y, z };
    }
  }

  // Handle object format {x, y, z}
  if (
    typeof position === 'object' &&
    position.x !== undefined &&
    position.y !== undefined &&
    position.z !== undefined
  ) {
    const { x, y, z } = position;
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number' &&
      !isNaN(x) &&
      !isNaN(y) &&
      !isNaN(z)
    ) {
      return { x, y, z };
    }
  }

  return null;
};

/**
 * Remove connection from cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} connectionId - Connection ID
 * @param {Object} connectionData - Connection data with positions
 * @returns {Promise<boolean>} - Success status
 */
export const removeConnectionFromCells = async (
  userId,
  spaceId,
  connectionId,
  connectionData
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

  try {
    const rawStartPosition = connectionData?.start?.position;
    const rawEndPosition = connectionData?.end?.position;

    // Normalize positions to handle both array and object formats
    const startPosition = normalizePosition(rawStartPosition);
    const endPosition = normalizePosition(rawEndPosition);

    if (!startPosition || !endPosition) {
      // Fallback: search all cells for this connection
      const fallbackResult = await removeConnectionFromAllCells(
        userId,
        spaceId,
        connectionId
      );

      return fallbackResult;
    }

    // Get cell coordinates for both endpoints
    const startCellCoords = getCellCoordinates(startPosition);
    const endCellCoords = getCellCoordinates(endPosition);

    // Remove connection from start cell
    const startCellId = getCellId(
      startCellCoords.x,
      startCellCoords.y,
      startCellCoords.z
    );

    const startResult = await removeConnectionFromCell(
      userId,
      spaceId,
      startCellId,
      connectionId
    );

    // Remove connection from end cell if different from start cell
    const endCellId = getCellId(
      endCellCoords.x,
      endCellCoords.y,
      endCellCoords.z
    );
    let endResult = true;
    if (startCellId !== endCellId) {
      endResult = await removeConnectionFromCell(
        userId,
        spaceId,
        endCellId,
        connectionId
      );
    }

    const success = startResult && endResult;

    // If the position-based approach failed, try the all-cells fallback
    if (!success) {
      const fallbackResult = await removeConnectionFromAllCells(
        userId,
        spaceId,
        connectionId
      );
      if (fallbackResult) {
        return true;
      }
    }

    return success;
  } catch {
    return false;
  }
};

/**
 * Remove connection from a specific cell
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} cellId - Cell ID
 * @param {string} connectionId - Connection ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeConnectionFromCell = async (
  userId,
  spaceId,
  cellId,
  connectionId
) => {
  if (!userId || !spaceId || !cellId || !connectionId) {
    return false;
  }

  try {
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );
    const cellDoc = await getDoc(cellRef);

    if (!cellDoc.exists()) {
      return true; // Cell doesn't exist, connection already not present
    }

    const cellData = cellDoc.data();

    // Ensure connections is an object
    if (cellData.connections && typeof cellData.connections === 'object') {
      if (cellData.connections[connectionId]) {
        delete cellData.connections[connectionId];

        // If this was the last connection, clean up the cell's connection data
        if (Object.keys(cellData.connections).length === 0) {
          delete cellData.connections;
          delete cellData.hasConnections;
        }

        await setDoc(cellRef, cellData, { merge: true });
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Get all connections from loaded cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Array} cellCoords - Array of {x, y, z} cell coordinates
 * @returns {Promise<Array>} - Array of connections from all specified cells
 */
export const getConnectionsFromCells = async (userId, spaceId, cellCoords) => {
  if (!userId || !spaceId || !cellCoords || cellCoords.length === 0) {
    return [];
  }

  // Filter out invalid cell coordinates
  const validCellCoords = cellCoords.filter(
    (coords) =>
      coords &&
      typeof coords.x === 'number' &&
      typeof coords.y === 'number' &&
      typeof coords.z === 'number' &&
      !isNaN(coords.x) &&
      !isNaN(coords.y) &&
      !isNaN(coords.z)
  );

  try {
    const allConnections = [];
    const seenConnectionIds = new Set(); // To avoid duplicates across cells
    for (const coords of validCellCoords) {
      const cellId = getCellId(coords.x, coords.y, coords.z);

      const cellRef = doc(
        db,
        'users',
        userId,
        'spaces',
        spaceId,
        'cells',
        cellId
      );
      const cellDoc = await getDoc(cellRef);

      if (cellDoc.exists()) {
        const cellData = cellDoc.data();

        if (cellData.connections && typeof cellData.connections === 'object') {
          const cellConnections = Object.values(cellData.connections);

          // Only add connections we haven't seen before
          cellConnections.forEach((connection) => {
            if (!seenConnectionIds.has(connection.id)) {
              seenConnectionIds.add(connection.id);
              allConnections.push(connection);
            }
          });
        }
      }
    }

    return allConnections;
  } catch {
    return [];
  }
};

/**
 * Update connection in cells when endpoint positions change
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Object} oldConnectionData - Old connection data
 * @param {Object} newConnectionData - New connection data
 * @returns {Promise<boolean>} - Success status
 */
export const updateConnectionInCells = async (
  userId,
  spaceId,
  oldConnectionData,
  newConnectionData
) => {
  if (!userId || !spaceId || !oldConnectionData || !newConnectionData) {
    return false;
  }

  try {
    // Remove connection from old cells
    await removeConnectionFromCells(
      userId,
      spaceId,
      oldConnectionData.id,
      oldConnectionData
    );

    // Add connection to new cells
    await addConnectionToCells(userId, spaceId, newConnectionData);

    return true;
  } catch {
    return false;
  }
};

/**
 * Get all cells within a radius of the given position
 * @param {Array} position - [x, y, z] world position
 * @param {number} radius - Radius in cell blocks
 * @returns {Array} - Array of cell coordinates within the radius
 */
export const getCellsInRadius = (position, radius = CELL_NEIGHBOR_RADIUS) => {
  if (!Array.isArray(position) || position.length < 3) {
    return [];
  }

  const centerCell = getCellCoordinates(position);
  const cellsInRadius = [];
  // Generate all cells within radius using Manhattan distance
  for (
    let cellX = centerCell.x - radius;
    cellX <= centerCell.x + radius;
    cellX++
  ) {
    for (
      let cellY = centerCell.y - radius;
      cellY <= centerCell.y + radius;
      cellY++
    ) {
      for (
        let cellZ = centerCell.z - radius;
        cellZ <= centerCell.z + radius;
        cellZ++
      ) {
        const distance = Math.max(
          Math.abs(cellX - centerCell.x),
          Math.abs(cellY - centerCell.y),
          Math.abs(cellZ - centerCell.z)
        );

        if (distance <= radius) {
          cellsInRadius.push({ x: cellX, y: cellY, z: cellZ });
        }
      }
    }
  }

  return cellsInRadius;
};

/**
 * Get immediate neighbor cells around a position (3x3 horizontal grid)
 * @param {Array} position - [x, y, z] world position
 * @param {number} neighborRadius - Radius in cell blocks (default 1 for 3x3 grid)
 * @returns {Array} - Array of cell coordinates within the neighbor radius (horizontal only)
 */
export const getNeighborCells = (
  position,
  neighborRadius = CELL_NEIGHBOR_RADIUS
) => {
  if (!Array.isArray(position) || position.length < 3) {
    return [];
  }

  const centerCell = getCellCoordinates(position);
  const neighborCells = [];
  // Generate cells in a 3x3 horizontal grid (X and Z only, Y stays constant)
  for (
    let cellX = centerCell.x - neighborRadius;
    cellX <= centerCell.x + neighborRadius;
    cellX++
  ) {
    for (
      let cellZ = centerCell.z - neighborRadius;
      cellZ <= centerCell.z + neighborRadius;
      cellZ++
    ) {
      // Y coordinate stays the same as the camera's current Y cell
      neighborCells.push({ x: cellX, y: centerCell.y, z: cellZ });
    }
  }

  return neighborCells;
};

/**
 * Debug function to test cell radius loading
 */
export const debugCellRadius = () => {
  const cameraPosition = [20, 20, 50];

  // Get all cells within radius
  const cellsInRadius = getCellsInRadius(cameraPosition, CELL_NEIGHBOR_RADIUS);

  return cellsInRadius;
};

/**
 * Debug function to test getNeighborCells specifically
 */
export const debugNeighborCells = (position = [20, 20, 50]) => {
  const neighborCells = getNeighborCells(position, CELL_NEIGHBOR_RADIUS);

  return neighborCells;
};

/**
 * Debug function to test current cell loading state
 */
export const debugCurrentCellLoading = () => {
  // Test getNeighborCells function
  const testPosition = [0, 0, 0]; // Origin position
  const neighborCells = getNeighborCells(testPosition, CELL_NEIGHBOR_RADIUS);

  // Test getCellsInRadius function
  const cellsInRadius = getCellsInRadius(testPosition, CELL_NEIGHBOR_RADIUS);

  return {
    neighborCells,
    cellsInRadius,
    radius: CELL_NEIGHBOR_RADIUS,
    cellSize: CELL_SIZE,
  };
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.debugCellRadius = debugCellRadius;
  window.debugNeighborCells = debugNeighborCells;
  window.debugCurrentCellLoading = debugCurrentCellLoading;
}

/**
 * Find an object by ID across all cells in a space
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {string} objectId - Object ID to find
 * @returns {Promise<Object|null>} - Object data and cell info or null if not found
 */
export const findObjectInCells = async (userId, spaceId, objectId) => {
  if (!userId || !spaceId || !objectId) return null;

  try {
    // Get all cells in the space
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );
    const snapshot = await getDocs(cellsRef);

    // Search through all cells for the object
    for (const cellDoc of snapshot.docs) {
      const cellData = cellDoc.data();

      if (cellData.objects && typeof cellData.objects === 'object') {
        if (cellData.objects[objectId]) {
          return {
            object: cellData.objects[objectId],
            cellId: cellDoc.id,
            cellRef: doc(
              db,
              'users',
              userId,
              'spaces',
              spaceId,
              'cells',
              cellDoc.id
            ),
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Find a connection in all cells (for debugging/verification purposes)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {string} connectionId - Connection ID to find
 * @returns {Promise<Object|null>} - Connection data with cell info if found
 */
export const findConnectionInCells = async (userId, spaceId, connectionId) => {
  if (!userId || !spaceId || !connectionId) return null;

  try {
    // Get all cells in the space
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );
    const snapshot = await getDocs(cellsRef);

    // Search through all cells for the connection
    for (const cellDoc of snapshot.docs) {
      const cellData = cellDoc.data();

      if (cellData.connections && typeof cellData.connections === 'object') {
        if (cellData.connections[connectionId]) {
          return {
            connection: cellData.connections[connectionId],
            cellId: cellDoc.id,
            cellRef: doc(
              db,
              'users',
              userId,
              'spaces',
              spaceId,
              'cells',
              cellDoc.id
            ),
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Aggressively purge a connection from ALL cells (for when normal deletion fails)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {string} connectionId - Connection ID to purge
 * @returns {Promise<number>} - Number of cells the connection was removed from
 */
export const purgeConnectionFromAllCells = async (
  userId,
  spaceId,
  connectionId
) => {
  if (!userId || !spaceId || !connectionId) return 0;

  try {
    // Get all cells in the space
    const cellsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells'
    );
    const snapshot = await getDocs(cellsRef);

    let purgedCount = 0;
    const purgePromises = [];

    // Search through all cells for the connection and remove it
    for (const cellDoc of snapshot.docs) {
      const cellData = cellDoc.data();

      if (cellData.connections && typeof cellData.connections === 'object') {
        if (cellData.connections[connectionId]) {
          // Remove the connection from this cell
          const purgePromise = (async () => {
            try {
              delete cellData.connections[connectionId];

              // If this was the last connection, clean up the cell's connection data
              if (Object.keys(cellData.connections).length === 0) {
                delete cellData.connections;
                delete cellData.hasConnections;
              }

              await setDoc(cellDoc.ref, cellData, { merge: true });

              return 1;
            } catch {
              return 0;
            }
          })();

          purgePromises.push(purgePromise);
        }
      }
    }

    // Wait for all purge operations to complete
    const results = await Promise.all(purgePromises);
    purgedCount = results.reduce((sum, result) => sum + result, 0);

    return purgedCount;
  } catch {
    return 0;
  }
};
