import { api } from '../api-client';

// Import stores at top to avoid 5-minute dynamic import delays
import useConnectionStore from '../stores/connectionStore';

import { getIsInitialLoading } from '../utils/loadingState';

// Cell size constants
export const CELL_SIZE = 15000; // Reduced by 1/3rd (was 10000)
export const CELL_NEIGHBOR_RADIUS = 1; // Load 3x3 horizontal grid around camera (9 cells)
export const CELL_UNLOAD_DISTANCE = 3;
export const CELL_BOUNDARY_HYSTERESIS = 1500; // Proportionally reduced with cell size (was 1000)

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

  // Handle NaN, undefined, or non-finite values - default to origin cell
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    console.warn('⚠️ Invalid position detected, defaulting to origin cell:', position);
    return { x: 0, y: 0, z: 0 };
  }

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
  // Use Chebyshev distance (max of per-axis distances) instead of Euclidean.
  // Cells are axis-aligned cubes, so the relevant metric is the max absolute
  // offset along any single axis. Euclidean distance underestimates at
  // corners (√3 × half-size) causing hysteresis to never activate diagonally.
  const currentCellCenter = [
    (currentCell.x + 0.5) * CELL_SIZE,
    (currentCell.y + 0.5) * CELL_SIZE,
    (currentCell.z + 0.5) * CELL_SIZE,
  ];

  const chebyshevDistance = Math.max(
    Math.abs(x - currentCellCenter[0]),
    Math.abs(y - currentCellCenter[1]),
    Math.abs(z - currentCellCenter[2]),
  );

  // If we're still within the buffer zone, stick to current cell
  const bufferDistance = CELL_SIZE / 2 - CELL_BOUNDARY_HYSTERESIS;
  if (chebyshevDistance < bufferDistance) {
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
    const cacheKey = `${userId}:${spaceId}:${cellId}`;

    // Check cache first to avoid unnecessary database calls
    const cached = cellExistenceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.exists) {
        return true; // Cell already exists (from cache)
      }
      // If cache says it doesn't exist, we'll create it below
    }

    // Check if cell already exists (only if not in cache or cache expired)
    if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) {
      const cells = await api.get(`/api/spaces/${spaceId}/cells`);
      const existingCell = cells.find(c => c.id === cellId);
      if (existingCell) {
        // Update cache
        cellExistenceCache.set(cacheKey, {
          exists: true,
          timestamp: Date.now(),
        });
        return true;
      }
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

    await api.post(`/api/spaces/${spaceId}/cells`, cellData);

    // Update cache to reflect the newly created cell
    cellExistenceCache.set(cacheKey, {
      exists: true,
      timestamp: Date.now(),
    });

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

  // Process in small batches to avoid overwhelming API
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
          const cell = await getCell(userId, spaceId, coords.x, coords.y, coords.z);
          const exists = cell !== null;

          // Cache the result
          cellExistenceCache.set(cacheKey, {
            exists,
            timestamp: Date.now(),
          });

          return { coords, cellId, exists };
        } catch (error) {
          console.warn(`Failed to check cell existence for ${cellId}:`, error);
          return { coords, cellId, exists: false };
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

  // Step 5: Filter cells that need creation and create them
  const cellsToCreate = allResults.filter((item) => !item.exists);

  if (cellsToCreate.length === 0) {
    // All cells already exist
    return cellCoordsList.map(() => true);
  }

  // Step 6: Create cells via API
  try {
    await Promise.all(
      cellsToCreate.map(({ coords }) =>
        api.post(`/api/spaces/${spaceId}/cells`, {
          id: getCellId(coords.x, coords.y, coords.z),
          x: coords.x,
          y: coords.y,
          z: coords.z,
        })
      )
    );

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
    const cell = await getCell(userId, spaceId, cellX, cellY, cellZ);
    const exists = cell !== null;

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
        const cell = await getCell(userId, spaceId, coords.x, coords.y, coords.z);
        const exists = cell !== null;

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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);
    const cell = cells.find(c => c.id === cellId);
    if (cell) {
      return { id: cellId, ...cell };
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

    const objectToAdd = {
      ...objectData,
      lastUpdated: new Date(),
      cellId: cellId,
      updatedAt: new Date(),
    };

    await api.post(`/api/spaces/${spaceId}/objects`, objectToAdd);

    return true;
  } catch (error) {
    console.error('Error adding object to cell:', error);
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

    await api.delete(`/api/spaces/${spaceId}/objects/${objectId}?cell_id=${cellId}`);

    return true;
  } catch (error) {
    console.error('Error removing object from cell:', error);
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

      // Write to the new cell FIRST so the object is never missing from both.
      // Only delete from the old cell on success — if the write fails the
      // object remains safely in its original cell.
      const added = await addObjectToCell(userId, spaceId, effectiveObjectData);

      if (added) {
        // New cell confirmed — now safe to remove from old cell.
        // A failure here leaves a stale duplicate, which is recoverable;
        // the alternative (delete-first) risks total data loss.
        try {
          await removeObjectFromCell(userId, spaceId, objectId, oldPosition);
        } catch {
          console.warn(
            `[SpatialMove] Old-cell cleanup failed for ${objectId} in ${oldCellId}. Stale copy may remain.`
          );
        }
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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    return cells.map((cell) => ({
      id: cell.id,
      ...cell,
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
    const results = await Promise.all(
      cellCoords.map(async (coords) => {
        const cellId = getCellId(coords.x, coords.y, coords.z);

        const objects = await api.get(`/api/spaces/${spaceId}/objects?cell_id=${cellId}`);

        // Normalize: flatten metadata.* to top level for frontend compatibility
        objects.forEach((objectData) => {
          if (objectData.metadata) {
            const meta = typeof objectData.metadata === 'string' ? JSON.parse(objectData.metadata) : objectData.metadata;
            for (const key of ['merfolkData', 'faceColors', 'faceTexts', 'faceTextStyles', 'textStyle', 'headerStyle', 'size', 'lineColor', 'lineThickness', 'borderColor', 'borderStyle']) {
              if (meta[key] !== undefined && objectData[key] === undefined) {
                objectData[key] = meta[key];
              }
            }
          }

          // Sanitize fontSize values from old data
          if (
            objectData.textStyle?.fontSize &&
            typeof objectData.textStyle.fontSize === 'string'
          ) {
            const parsed = parseFloat(objectData.textStyle.fontSize);
            objectData.textStyle.fontSize = isNaN(parsed) ? 1.5 : parsed;
          }
          if (
            objectData.headerStyle?.fontSize &&
            typeof objectData.headerStyle.fontSize === 'string'
          ) {
            const parsed = parseFloat(objectData.headerStyle.fontSize);
            objectData.headerStyle.fontSize = isNaN(parsed) ? 1.5 : parsed;
          }
          if (objectData.faceTextStyles) {
            Object.keys(objectData.faceTextStyles).forEach((face) => {
              const style = objectData.faceTextStyles[face];
              if (style?.fontSize && typeof style.fontSize === 'string') {
                const parsed = parseFloat(style.fontSize);
                style.fontSize = isNaN(parsed) ? 0.5 : parsed;
              }
            });
          }
        });

        return objects;
      })
    );

    return results.flat();
  } catch (error) {
    console.error('Error loading objects from cells:', error);
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

    const objectToUpdate = {
      ...objectData,
      lastUpdated: new Date(),
      updatedAt: new Date(),
      cellId: cellId,
    };

    await api.patch(`/api/spaces/${spaceId}/objects/${objectData.id}`, objectToUpdate);

    return true;
  } catch (error) {
    console.error('Error updating object in cell:', error);
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

    await api.delete(`/api/spaces/${spaceId}/objects/${objectId}?cell_id=${cellId}`);
    return true;
  } catch (error) {
    console.error('Error deleting object from cell:', error);
    return false;
  }
};

// Track callbacks for cell subscriptions
const cellCallbacks = new Map(); // subscriptionKey -> Set(callbacks)

/**
 * Subscribe to cell changes using polling
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

  const lastDataMap = new Map();

  const intervalId = setInterval(async () => {
    try {
      const cells = await api.get(`/api/spaces/${spaceId}/cells`);

      cellCoords.forEach((coords) => {
        const cellId = getCellId(coords.x, coords.y, coords.z);
        const cell = cells.find(c => c.id === cellId);

        if (cell) {
          const cellData = { id: cellId, ...cell };
          const cellDataJson = JSON.stringify(cellData);
          const lastDataJson = lastDataMap.get(cellId);

          if (cellDataJson !== lastDataJson) {
            lastDataMap.set(cellId, cellDataJson);
            callback({
              type: 'cell_updated',
              cellId,
              data: cellData,
            });
          }
        }
      });
    } catch {
      // Error handler - no logging
    }
  }, 2000);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    lastDataMap.clear();
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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    return cells.map(cell => cell.id);
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
    // Using static import from top of file to avoid 5-minute dynamic import delay
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
  connectionsArray,
  skipCellCheck = false
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
    if (!skipCellCheck) {
      const cells = await api.get(`/api/spaces/${spaceId}/cells`);
      const cellExists = cells.some(c => c.id === cellId);

      if (!cellExists) {
        const [x, y, z] = cellId.split(',').map(Number);
        await createCell(userId, spaceId, x, y, z);
      }
    }

    console.log(
      `💾 Saving ${connectionsArray.length} connections to subcollection...`
    );
    const saveStart = performance.now();

    await api.post('/api/bulk/import', { spaceId, connections: connectionsArray });

    const saveDuration = ((performance.now() - saveStart) / 1000).toFixed(2);
    console.log(
      `✅ Saved ${connectionsArray.length} connections to cell document in ${saveDuration}s`
    );

    return true;
  } catch (error) {
    console.error('❌ Bulk connection save error:', error.message);
    return false;
  }
};

/**
 * Save connections in bulk via API.
 *
 * @param {string} userId
 * @param {string} spaceId
 * @param {Map<string, object[]>} connectionsByCell  - cellId → connectionData[]
 * @returns {{ saved: number, failed: number }}
 */
export const bulkSaveConnectionsBatch = async (
  userId,
  spaceId,
  connectionsByCell
) => {
  if (!userId || !spaceId || !connectionsByCell || connectionsByCell.size === 0) {
    return { saved: 0, failed: 0 };
  }

  let totalSaved = 0;
  let totalFailed = 0;

  try {
    const allConnections = [];
    for (const [, connections] of connectionsByCell) {
      if (connections && connections.length > 0) {
        allConnections.push(...connections);
      }
    }

    if (allConnections.length === 0) {
      return { saved: 0, failed: 0 };
    }

    await api.post('/api/bulk/import', { spaceId, connections: allConnections });
    totalSaved = allConnections.length;
  } catch (error) {
    console.error(`❌ Bulk import failed:`, error);
    totalFailed = 0;
    for (const [, connections] of connectionsByCell) {
      if (connections) totalFailed += connections.length;
    }
  }

  return { saved: totalSaved, failed: totalFailed };
};

/**
 * Add connection to a specific cell
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
    const connectionStore = useConnectionStore.getState();

    if (connectionStore.deletingConnections.has(connectionData.id)) {
      return false;
    }

    const connectionToSave = {
      ...connectionData,
      lastUpdated: new Date(),
      cellId: cellId,
    };

    await api.post(`/api/spaces/${spaceId}/connections`, connectionToSave);

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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    let errorCount = 0;

    for (const cell of cells) {
      try {
        await api.delete(`/api/spaces/${spaceId}/connections/${connectionId}?cell_id=${cell.id}`);
      } catch {
        errorCount++;
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
    await api.delete(`/api/spaces/${spaceId}/connections/${connectionId}?cell_id=${cellId}`);
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

      const connections = await api.get(`/api/spaces/${spaceId}/connections?cell_id=${cellId}`);

      for (const connection of connections) {
        if (!seenConnectionIds.has(connection.id)) {
          seenConnectionIds.add(connection.id);
          allConnections.push(connection);
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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    for (const cell of cells) {
      try {
        const object = await api.get(`/api/spaces/${spaceId}/objects/${objectId}?cell_id=${cell.id}`);
        if (object) {
          return {
            object,
            cellId: cell.id,
          };
        }
      } catch {
        continue;
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
 * @returns {Promise<Object>} - Map of objectId -> object data
 */
export const getAllObjectsInSpace = async (userId, spaceId) => {
  if (!userId || !spaceId) return {};

  try {
    const allObjects = {};

    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    for (const cell of cells) {
      const objects = await api.get(`/api/spaces/${spaceId}/objects?cell_id=${cell.id}`);

      objects.forEach((object) => {
        allObjects[object.id] = object;
      });
    }

    return allObjects;
  } catch (error) {
    console.error('Error getting all objects in space:', error);
    return {};
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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    for (const cell of cells) {
      try {
        const connections = await api.get(`/api/spaces/${spaceId}/connections?cell_id=${cell.id}`);
        const connection = connections.find(c => c.id === connectionId);
        if (connection) {
          return {
            connection,
            cellId: cell.id,
          };
        }
      } catch {
        continue;
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
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    let purgedCount = 0;
    const purgePromises = [];

    for (const cell of cells) {
      const purgePromise = (async () => {
        try {
          await api.delete(`/api/spaces/${spaceId}/connections/${connectionId}?cell_id=${cell.id}`);
          return 1;
        } catch {
          return 0;
        }
      })();

      purgePromises.push(purgePromise);
    }

    const results = await Promise.all(purgePromises);
    purgedCount = results.reduce((sum, result) => sum + result, 0);

    return purgedCount;
  } catch {
    return 0;
  }
};

/**
 * Delete all cells in a space
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Function} onProgress - Optional callback for progress updates (deletedCount, totalCount)
 * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
 */
export const deleteAllCellsInSpace = async (userId, spaceId, onProgress) => {
  if (!userId || !spaceId) {
    return { success: false, deletedCount: 0, error: 'Missing userId or spaceId' };
  }

  try {
    const cells = await api.get(`/api/spaces/${spaceId}/cells`);

    if (!cells || cells.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const totalCells = cells.length;
    let deletedCount = 0;

    for (const cell of cells) {
      try {
        await api.delete(`/api/spaces/${spaceId}/cells/${cell.id}`);
        deletedCount++;
      } catch {
        // continue with next cell
      }

      if (onProgress) {
        onProgress(deletedCount, totalCells);
      }
    }

    // Clear the cell existence cache for this space
    const cacheKeysToDelete = [];
    for (const key of cellExistenceCache.keys()) {
      if (key.startsWith(`${userId}:${spaceId}:`)) {
        cacheKeysToDelete.push(key);
      }
    }
    cacheKeysToDelete.forEach(key => cellExistenceCache.delete(key));

    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error deleting all cells in space:', error);
    return { success: false, deletedCount: 0, error: error.message };
  }
};
