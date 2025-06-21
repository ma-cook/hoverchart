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
export const CELL_UNLOAD_DISTANCE = 3; // Distance in cell blocks to unload cells (increased to reduce reload)

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

// Request deduplication for concurrent cell loading
const cellLoadingPromises = new Map(); // cellKey -> Promise

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

  // First, check which cells already exist using cached existence checks
  const existenceChecks = await Promise.all(
    cellCoordsList.map(async ({ x, y, z }) => {
      const exists = await cellExists(userId, spaceId, x, y, z);
      return { coords: { x, y, z }, exists };
    })
  );

  // Filter out cells that already exist
  const cellsToCreate = existenceChecks
    .filter(({ exists }) => !exists)
    .map(({ coords }) => coords);

  if (cellsToCreate.length === 0) {
    // All cells already exist
    return cellCoordsList.map(() => true);
  }

  // Deduplicate concurrent requests
  const results = await Promise.all(
    cellsToCreate.map(async ({ x, y, z }) => {
      const cellKey = `${userId}:${spaceId}:${getCellId(x, y, z)}`;

      // Check if this cell is already being created
      if (cellLoadingPromises.has(cellKey)) {
        return await cellLoadingPromises.get(cellKey);
      }

      // Create new loading promise
      const loadingPromise = createCell(userId, spaceId, x, y, z);
      cellLoadingPromises.set(cellKey, loadingPromise);

      try {
        const result = await loadingPromise;
        return result;
      } finally {
        // Clean up the promise when done
        cellLoadingPromises.delete(cellKey);
      }
    })
  );

  // Reconstruct full results array matching original input order
  const fullResults = [];
  let createIndex = 0;

  for (const { exists } of existenceChecks) {
    if (exists) {
      fullResults.push(true); // Cell already existed
    } else {
      fullResults.push(results[createIndex] || false);
      createIndex++;
    }
  }

  return fullResults;
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
    console.warn('addObjectToCell: Missing required parameters');
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
      console.log(`📦 Creating new cell ${cellId} for object ${objectData.id}`);
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
      console.log(
        `🔄 Updating existing object ${objectData.id} in cell ${cellId}`
      );
    } else {
      console.log(`➕ Adding new object ${objectData.id} to cell ${cellId}`);
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

    console.log(
      `✅ Successfully saved object ${objectData.id} to cell ${cellId}`
    );

    return true;
  } catch (error) {
    console.error(`❌ Error adding object ${objectData.id} to cell:`, error);
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
    console.warn('removeObjectFromCell: Missing required parameters');
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
      console.log(
        `📍 Cell ${cellId} doesn't exist, object ${objectId} already removed`
      );
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
      console.log(`ℹ️ Object ${objectId} was not found in cell ${cellId}`);
      console.log(
        `ℹ️ Available objects in cell ${cellId}:`,
        Object.keys(cellData.objects || {})
      );
      return true; // Object doesn't exist, consider it "removed"
    }

    console.log(
      `🗑️ REMOVING: Object ${objectId} from cell ${cellId} using atomic deleteField`
    );

    // Use atomic updateDoc with deleteField for safe removal
    await updateDoc(cellRef, {
      [`objects.${objectId}`]: deleteField(),
    });

    console.log(
      `🗑️ ATOMIC DELETE: Completed deleteField operation for object ${objectId} in cell ${cellId}`
    );

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
          console.warn(
            `⚠️ VERIFICATION ATTEMPT ${verificationAttempts}: Object ${objectId} still exists in cell ${cellId}`
          );

          if (verificationAttempts < maxAttempts) {
            // Retry the deletion
            console.log(
              `🔄 RETRY ${verificationAttempts}: Re-attempting atomic deletion for object ${objectId}`
            );
            await updateDoc(cellRef, {
              [`objects.${objectId}`]: deleteField(),
            });
          } else {
            console.error(
              `❌ FINAL VERIFICATION FAILED: Object ${objectId} still exists after ${maxAttempts} attempts!`
            );
            return false;
          }
        } else {
          console.log(
            `✅ VERIFICATION SUCCESS: Object ${objectId} confirmed removed from cell ${cellId}`
          );
          return true;
        }
      } else {
        console.log(`✅ VERIFICATION SUCCESS: Cell ${cellId} no longer exists`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`❌ Error removing object ${objectId} from cell:`, error);
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
  console.log(
    `[MoveDebug] moveObjectBetweenCells ENTER. User: ${userId}, Space: ${spaceId}`,
    `objectIdOrData:`,
    objectIdOrData,
    `oldPosition:`,
    oldPosition,
    `newPosition:`,
    newPosition,
    `objectData (param):`,
    objectData
  );

  if (!userId || !spaceId || !objectIdOrData || !oldPosition || !newPosition) {
    console.warn(
      '[MoveDebug] Missing required parameters for moveObjectBetweenCells. Aborting.'
    );
    return false;
  }

  let objectId;
  let effectiveObjectData; // This will hold the most complete object data, intended for the new state/position

  if (typeof objectIdOrData === 'string') {
    objectId = objectIdOrData;
    effectiveObjectData = objectData
      ? { ...objectData, id: objectId, position: newPosition }
      : { id: objectId, position: newPosition };
    console.log(
      `[MoveDebug] Signature: objectId string. Derived objectId: ${objectId}, effectiveObjectData prepared:`,
      effectiveObjectData
    );
  } else {
    effectiveObjectData = { ...objectIdOrData, position: newPosition };
    objectId = effectiveObjectData.id;
    console.log(
      `[MoveDebug] Signature: objectData object. Derived objectId: ${objectId}, effectiveObjectData prepared:`,
      effectiveObjectData
    );
  }

  if (!objectId) {
    console.error(
      '[MoveDebug] No object ID could be determined. Aborting moveObjectBetweenCells.'
    );
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
      console.log(
        `[MoveDebug] ⚠️ Object ${objectId} is already being moved (${timeSinceLastMove}ms ago). Waiting for existing operation...`
      );
      try {
        await existing.promise;
        console.log(
          `[MoveDebug] ✅ Previous move operation for ${objectId} completed. Proceeding with new move.`
        );
      } catch (error) {
        console.warn(
          `[MoveDebug] ⚠️ Previous move operation for ${objectId} failed:`,
          error
        );
      }
    } else {
      console.log(
        `[MoveDebug] 🕐 Previous move for ${objectId} timed out (${timeSinceLastMove}ms). Proceeding with new move.`
      );
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

      console.log(`[MoveDebug] Object ID for move: ${objectId}`);
      console.log(
        `[MoveDebug] Old position: ${JSON.stringify(
          oldPosition
        )} -> Old cell ID: ${oldCellId} (Coords: ${JSON.stringify(
          oldCellCoords
        )})`
      );
      console.log(
        `[MoveDebug] New position: ${JSON.stringify(
          newPosition
        )} -> New cell ID: ${newCellId} (Coords: ${JSON.stringify(
          newCellCoords
        )})`
      );

      if (oldCellId === newCellId) {
        console.log(
          `[MoveDebug] Object ${objectId} remains in the same cell: ${oldCellId}. Attempting to update object data in this cell.`
        );
        console.log(
          `[MoveDebug] Calling addObjectToCell (for same-cell update) for object ${objectId} with data:`,
          effectiveObjectData
        );
        const updateResult = await addObjectToCell(
          userId,
          spaceId,
          effectiveObjectData
        );
        console.log(
          `[MoveDebug] addObjectToCell (for same-cell update) for object ${objectId} result: ${updateResult}`
        );
        return updateResult;
      }

      // If cells are different, proceed with move
      console.log(
        `[MoveDebug] Object ${objectId} is moving from cell ${oldCellId} to ${newCellId}.`
      );

      console.log(
        `[MoveDebug] Step 1: Attempting to remove object ${objectId} from old cell ${oldCellId} (using oldPosition: ${JSON.stringify(
          oldPosition
        )})`
      );
      const removed = await removeObjectFromCell(
        userId,
        spaceId,
        objectId,
        oldPosition
      );
      console.log(
        `[MoveDebug] removeObjectFromCell result for object ${objectId} from old cell ${oldCellId}: ${removed}`
      );

      console.log(
        `[MoveDebug] Step 2: Attempting to add object ${objectId} to new cell ${newCellId} with data:`,
        effectiveObjectData
      );
      const added = await addObjectToCell(userId, spaceId, effectiveObjectData);
      console.log(
        `[MoveDebug] addObjectToCell result for object ${objectId} to new cell ${newCellId}: ${added}`
      );

      if (added) {
        console.log(
          `[MoveDebug] ✅ Successfully moved object ${objectId} from ${oldCellId} to ${newCellId}.`
        );
        return true;
      } else {
        console.error(
          `[MoveDebug] ❌ Failed to add object ${objectId} to new cell ${newCellId}. The object might be in an inconsistent state (potentially removed from old, but not added to new).`
        );
        return false;
      }
    } catch (error) {
      console.error(
        `[MoveDebug] ❌ CRITICAL ERROR during moveObjectBetweenCells for ${objectId}:`,
        error
      );
      return false;
    } finally {
      // Clean up the moving objects cache
      movingObjects.delete(objectId);
      console.log(
        `[MoveDebug] 🧹 Cleaned up move tracking for object ${objectId}`
      );
    }
  })();

  // Store the move operation in our cache
  movingObjects.set(objectId, {
    timestamp: now,
    promise: movePromise,
  });

  console.log(
    `[MoveDebug] 📝 Registered move operation for object ${objectId}`
  );

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
  console.log('🔍 getObjectsFromCells called:', { userId, spaceId, cellCoords });
  
  if (!userId || !spaceId || !cellCoords) {
    console.log('❌ getObjectsFromCells: Missing required params');
    return [];
  }

  try {
    const allObjects = [];    console.log(`🔍 Processing ${cellCoords.length} cells`);
    
    for (const coords of cellCoords) {
      const cellId = getCellId(coords.x, coords.y, coords.z);
      console.debug('🔍 Fetching cell:', cellId);
      
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
      console.debug('🔍 Cell doc exists:', cellDoc.exists(), 'for cellId:', cellId);
        if (cellDoc.exists()) {
        const cellData = cellDoc.data();
        console.debug('🔍 Cell data:', { cellId, hasObjects: !!cellData.objects, objectsType: typeof cellData.objects });

        // Handle both old array format and new object format
        if (cellData.objects) {
          if (Array.isArray(cellData.objects)) {
            console.log('📝 Found old array format objects in cell', cellId, '- count:', cellData.objects.length);
            // Old format - we'll need to load objects from global collection
            // This is for backward compatibility
          } else if (typeof cellData.objects === 'object') {
            // New format - objects stored directly in cell
            const cellObjects = Object.values(cellData.objects);
            console.log('📦 Found new format objects in cell', cellId, '- count:', cellObjects.length);
            allObjects.push(...cellObjects);
          }        } else {
          console.debug('🔍 No objects found in cell', cellId);
        }} else {
        // Cell doesn't exist - this is expected for empty areas
        console.debug('📍 Cell is empty (no objects):', cellId);
      }
    }

    console.log('📦 getObjectsFromCells returning:', allObjects.length, 'objects');
    return allObjects;
  } catch (error) {
    console.error('❌ Error in getObjectsFromCells:', error);
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
    console.log(
      `⏸️ [updateObjectInCell] Skipping save for object ${objectData?.id} - still in initial loading phase`
    );
    return false;
  }

  if (
    !userId ||
    !spaceId ||
    !objectData ||
    !objectData.id ||
    !objectData.position
  ) {
    console.warn(
      '[updateObjectInCell] Missing required parameters. Aborting update for object:',
      objectData?.id || 'unknown'
    );
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
      console.log(
        `[updateObjectInCell] Cell ${cellId} does not exist. Calling addObjectToCell for object ${objectData.id}.`
      );
      return await addObjectToCell(userId, spaceId, objectData);
    }

    console.log(
      `[updateObjectInCell] Cell ${cellId} exists. Directly updating object ${objectData.id} in this cell's object map.`
    );
    const cellData = cellDoc.data();
    if (Array.isArray(cellData.objects)) {
      console.warn(
        `[updateObjectInCell] Cell ${cellId} has legacy array for objects. Converting to map for object ${objectData.id}.`
      );
      cellData.objects = {}; // Convert or handle appropriately
    }

    // Ensure cellData.objects is an object map
    if (typeof cellData.objects !== 'object' || cellData.objects === null) {
      console.warn(
        `[updateObjectInCell] cellData.objects for cell ${cellId} is not an object or is null. Initializing to empty object.`
      );
      cellData.objects = {};
    }

    cellData.objects[objectData.id] = {
      ...objectData,
      lastUpdated: new Date(),
      cellId: cellId,
    };
    await setDoc(cellRef, cellData, { merge: true });
    console.log(
      `[updateObjectInCell] ✅ Successfully updated object ${objectData.id} directly in cell ${cellId}.`
    );
    return true;
  } catch (error) {
    console.error(
      `[updateObjectInCell] ❌ Error updating object ${objectData.id} in cell:`,
      error
    );
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
      console.log(
        `📍 Cell ${cellId} doesn't exist, object ${objectId} already deleted`
      );
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
      console.log(
        `ℹ️ Object ${objectId} not found in cell ${cellId} for deletion`
      );
      return true; // Object doesn't exist, consider it deleted
    }

    console.log(
      `🗑️ DELETING: Object ${objectId} from cell ${cellId} using atomic operation`
    );

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
        console.log(`✅ DELETION SUCCESS: Cell ${cellId} no longer exists`);
        return true;
      }

      const verifyData = verifyDoc.data();
      if (!verifyData.objects || !verifyData.objects[objectId]) {
        console.log(
          `✅ DELETION SUCCESS: Object ${objectId} confirmed deleted from cell ${cellId}`
        );
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.warn(
          `⚠️ DELETION RETRY ${attempts}: Object ${objectId} still exists, retrying...`
        );
        await updateDoc(cellRef, {
          [`objects.${objectId}`]: deleteField(),
        });
      } else {
        console.error(
          `❌ DELETION FAILED: Object ${objectId} still exists after ${maxAttempts} attempts`
        );
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error(
      `❌ Error in deleteObjectFromCell for object ${objectId}:`,
      error
    );
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
        console.log(`🔥 Creating NEW cell subscription for: ${cellId}`);

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
          (error) => {
            console.error(`Cell subscription error for ${cellId}:`, error);
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
    console.error('❌ addConnectionToCells: Missing required parameters', {
      userId: !!userId,
      spaceId: !!spaceId,
      connectionData: !!connectionData,
      connectionId: connectionData?.id,
    });
    return false;
  }

  try {
    console.log('🔄 Adding connection to cells:', {
      connectionId: connectionData.id,
      userId,
      spaceId,
    });

    // Get start and end positions
    const startPosition = connectionData.start?.position;
    const endPosition = connectionData.end?.position;

    if (!startPosition || !endPosition) {
      console.error('❌ addConnectionToCells: Missing connection positions', {
        startPosition,
        endPosition,
      });
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

    console.log('🔄 Adding connection to start cell:', startCellId);
    await addConnectionToCell(userId, spaceId, startCellId, connectionData);

    // Add connection to end cell if different from start cell
    const endCellId = getCellId(
      endCellCoords.x,
      endCellCoords.y,
      endCellCoords.z
    );
    if (startCellId !== endCellId) {
      console.log('🔄 Adding connection to end cell:', endCellId);
      await addConnectionToCell(userId, spaceId, endCellId, connectionData);
    }

    console.log('✅ Successfully added connection to cells');
    return true;
  } catch (error) {
    console.error('❌ Error in addConnectionToCells:', error);
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
    console.error('❌ addConnectionToCell: Missing required parameters', {
      userId: !!userId,
      spaceId: !!spaceId,
      cellId,
      connectionData: !!connectionData,
    });
    return false;
  }

  try {
    console.log('🔄 Adding connection to specific cell:', {
      cellId,
      connectionId: connectionData.id,
    });

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
      console.log('📁 Cell exists, updating existing cell');
    } else {
      console.log('📁 Cell does not exist, creating new cell');
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

    // Ensure connections is an object
    if (!cellData.connections || Array.isArray(cellData.connections)) {
      console.log('🔧 Fixing connections structure in cell');
      cellData.connections = {};
    }

    // Add connection data to cell
    cellData.connections[connectionData.id] = {
      ...connectionData,
      lastUpdated: new Date(),
      cellId: cellId,
    };

    console.log('💾 Saving connection to cell document');
    await setDoc(cellRef, cellData, { merge: true });
    console.log('✅ Successfully saved connection to cell:', cellId);
    return true;
  } catch (error) {
    console.error('❌ Error in addConnectionToCell:', error);
    return false;
  }
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
    const startPosition = connectionData?.start?.position;
    const endPosition = connectionData?.end?.position;

    if (!startPosition || !endPosition) {
      return false;
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
    await removeConnectionFromCell(userId, spaceId, startCellId, connectionId);

    // Remove connection from end cell if different from start cell
    const endCellId = getCellId(
      endCellCoords.x,
      endCellCoords.y,
      endCellCoords.z
    );
    if (startCellId !== endCellId) {
      await removeConnectionFromCell(userId, spaceId, endCellId, connectionId);
    }

    return true;
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
    console.log(
      '🔍 getConnectionsFromCells: Early return due to missing parameters:',
      {
        userId: !!userId,
        spaceId: !!spaceId,
        cellCoords: cellCoords?.length || 0,
      }
    );
    return [];
  }

  console.log('🔍 getConnectionsFromCells: Starting with params:', {
    userId,
    spaceId,
    cellCoordsLength: cellCoords.length,
    cellCoords: cellCoords.slice(0, 5), // Show first 5 for debugging
  });

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

  console.log(
    `🔍 getConnectionsFromCells: Filtered to ${validCellCoords.length} valid cells`
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
      console.log(`🔍 Checking cell ${cellId} for connections:`, {
        exists: cellDoc.exists(),
        cellId,
      });

      if (cellDoc.exists()) {
        const cellData = cellDoc.data();

        if (cellData.connections && typeof cellData.connections === 'object') {
          const cellConnections = Object.values(cellData.connections);
          // Only log when connections are found to reduce noise
          if (cellConnections.length > 0) {
            console.log(
              `🔗 Found ${cellConnections.length} connections in cell ${cellId}:`,
              {
                connectionIds: cellConnections.map((c) => c.id),
              }
            );
          }

          // Only add connections we haven't seen before
          cellConnections.forEach((connection) => {
            if (!seenConnectionIds.has(connection.id)) {
              seenConnectionIds.add(connection.id);
              allConnections.push(connection);
              console.log(
                `✅ Added connection ${connection.id} from cell ${cellId}`
              );
            }
          });
        } else {
          console.log(
            `📭 Cell ${cellId} has no connections or invalid connections data`
          );
        }
      } else {
        console.log(`❌ Cell ${cellId} does not exist`);
      }
    }

    return allConnections;
  } catch (error) {
    console.error('❌ Error in getConnectionsFromCells:', error);
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
  console.log('=== DEBUG: Testing cell radius loading ===');

  const cameraPosition = [20, 20, 50];
  console.log('Camera position:', cameraPosition);
  console.log('Load radius:', CELL_NEIGHBOR_RADIUS);

  // Get the camera's cell coordinates
  const cameraCell = getCellCoordinates(cameraPosition);
  console.log('Camera cell coordinates:', cameraCell);

  // Get all cells within radius
  const cellsInRadius = getCellsInRadius(cameraPosition, CELL_NEIGHBOR_RADIUS);
  console.log(
    `Cells within radius ${CELL_NEIGHBOR_RADIUS}:`,
    cellsInRadius.length
  );

  // Show a sampling of cells
  console.log(
    'First 10 cells:',
    cellsInRadius.slice(0, 10).map((c) => `(${c.x},${c.y},${c.z})`)
  );
  console.log(
    'Last 10 cells:',
    cellsInRadius.slice(-10).map((c) => `(${c.x},${c.y},${c.z})`)
  );

  // Calculate expected number of cells
  const expectedCells = Math.pow(2 * CELL_NEIGHBOR_RADIUS + 1, 3);
  console.log(
    `Expected cells for radius ${CELL_NEIGHBOR_RADIUS}: ${expectedCells}`
  );
  console.log(`Actual cells: ${cellsInRadius.length}`);

  // Check if origin cell is included
  const hasOrigin = cellsInRadius.some(
    (c) => c.x === 0 && c.y === 0 && c.z === 0
  );
  console.log('Includes origin cell (0,0,0):', hasOrigin);

  // Check if camera cell is included
  const hasCameraCell = cellsInRadius.some(
    (c) => c.x === cameraCell.x && c.y === cameraCell.y && c.z === cameraCell.z
  );
  console.log('Includes camera cell:', hasCameraCell);

  return cellsInRadius;
};

/**
 * Debug function to test getNeighborCells specifically
 */
export const debugNeighborCells = (position = [20, 20, 50]) => {
  console.log('=== DEBUG: Testing getNeighborCells function ===');
  console.log('Position:', position);
  console.log('CELL_NEIGHBOR_RADIUS:', CELL_NEIGHBOR_RADIUS);

  const neighborCells = getNeighborCells(position, CELL_NEIGHBOR_RADIUS);
  console.log('Neighbor cells count:', neighborCells.length);
  console.log('Expected count for radius 1:', Math.pow(3, 3), '(3x3x3)');

  // Show all cells
  console.log('All neighbor cells:');
  neighborCells.forEach((cell, index) => {
    console.log(`  ${index + 1}. (${cell.x}, ${cell.y}, ${cell.z})`);
  });

  return neighborCells;
};

/**
 * Debug function to test current cell loading state
 */
export const debugCurrentCellLoading = () => {
  // Test getNeighborCells function
  const testPosition = [0, 0, 0]; // Origin position
  const neighborCells = getNeighborCells(testPosition, CELL_NEIGHBOR_RADIUS);
  console.log(`\ngetNeighborCells([0,0,0], ${CELL_NEIGHBOR_RADIUS}):`);
  console.log('- Expected cells:', Math.pow(3, 3), '(3x3x3)');
  console.log('- Actual cells:', neighborCells.length);
  console.log('- Cell coordinates:');
  neighborCells.forEach((cell, index) => {
    console.log(`  ${index + 1}. (${cell.x}, ${cell.y}, ${cell.z})`);
  });

  // Test getCellsInRadius function
  const cellsInRadius = getCellsInRadius(testPosition, CELL_NEIGHBOR_RADIUS);
  console.log(`\ngetCellsInRadius([0,0,0], ${CELL_NEIGHBOR_RADIUS}):`);
  console.log('- Expected cells:', Math.pow(3, 3), '(3x3x3)');
  console.log('- Actual cells:', cellsInRadius.length);

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
  } catch (error) {
    console.error('Error finding object in cells:', error);
    return null;
  }
};

/**
 * Get all objects in a space across all cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @returns {Promise<Object>} - Object with objectId as key and object data as value
 */
export const getAllObjectsInSpace = async (userId, spaceId) => {
  if (!userId || !spaceId) return {};

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

    const allObjects = {};

    // Search through all cells for objects
    for (const cellDoc of snapshot.docs) {
      const cellData = cellDoc.data();

      if (cellData.objects && typeof cellData.objects === 'object') {
        // Merge objects from this cell into the result
        Object.assign(allObjects, cellData.objects);
      }
    }

    return allObjects;
  } catch (error) {
    console.error('Error getting all objects in space:', error);
    return {};
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.findObjectInCells = findObjectInCells;
  window.getAllObjectsInSpace = getAllObjectsInSpace;
}
