import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
} from 'firebase/firestore';

// Cell size constants
export const CELL_SIZE = 2000;
export const CELL_LOAD_DISTANCE = 4; // Distance from edge to trigger adjacent cell loading
export const CELL_UNLOAD_DISTANCE = 2; // Distance in cell blocks to unload cells

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
 * Check if position is within distance of cell edge
 * @param {Array} position - [x, y, z] world position
 * @param {number} distance - Distance threshold
 * @returns {Array} - Array of adjacent cell coordinates that should be loaded
 */
export const getAdjacentCellsToLoad = (
  position,
  distance = CELL_LOAD_DISTANCE
) => {
  if (!Array.isArray(position) || position.length < 3) {
    return [];
  }

  const [x, y, z] = position;
  const currentCell = getCellCoordinates(position);
  const bounds = getCellBounds(currentCell.x, currentCell.y, currentCell.z);

  const adjacentCells = [];

  // Check distance to each edge and determine which adjacent cells to load
  const distanceToLeftEdge = x - bounds.minX;
  const distanceToRightEdge = bounds.maxX - x;
  const distanceToBottomEdge = y - bounds.minY;
  const distanceToTopEdge = bounds.maxY - y;
  const distanceToFrontEdge = z - bounds.minZ;
  const distanceToBackEdge = bounds.maxZ - z;

  // Load adjacent cells if within threshold distance in any direction
  // X-axis neighbors
  if (distanceToLeftEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x - 1,
      y: currentCell.y,
      z: currentCell.z,
    });
  }
  if (distanceToRightEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x + 1,
      y: currentCell.y,
      z: currentCell.z,
    });
  }

  // Y-axis neighbors
  if (distanceToBottomEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x,
      y: currentCell.y - 1,
      z: currentCell.z,
    });
  }
  if (distanceToTopEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x,
      y: currentCell.y + 1,
      z: currentCell.z,
    });
  }

  // Z-axis neighbors
  if (distanceToFrontEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x,
      y: currentCell.y,
      z: currentCell.z - 1,
    });
  }
  if (distanceToBackEdge <= distance) {
    adjacentCells.push({
      x: currentCell.x,
      y: currentCell.y,
      z: currentCell.z + 1,
    });
  }

  return adjacentCells;
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

/**
 * Check if a cell exists
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {number} cellX - Cell x coordinate
 * @param {number} cellY - Cell y coordinate
 * @param {number} cellZ - Cell z coordinate
 * @returns {Promise<boolean>} - Whether cell exists
 */
export const cellExists = async (userId, spaceId, cellX, cellY, cellZ) => {
  if (!userId || !spaceId) return false;

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
    return cellDoc.exists();
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
  )
    return false;
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

    // Add object data to cell with object ID as key
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

    const cellDoc = await getDoc(cellRef);
    if (!cellDoc.exists()) return true; // Cell doesn't exist, object not in any cell

    const cellData = cellDoc.data();

    // Handle both old array format and new object format
    if (Array.isArray(cellData.objects)) {
      const objectIndex = cellData.objects.indexOf(objectId);
      if (objectIndex > -1) {
        cellData.objects.splice(objectIndex, 1);
        await setDoc(cellRef, cellData, { merge: true });
      }
    } else if (cellData.objects && typeof cellData.objects === 'object') {
      if (cellData.objects[objectId]) {
        delete cellData.objects[objectId];
        await setDoc(cellRef, cellData, { merge: true });
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Move object between cells
 * @param {string} userId - User ID (or space owner ID)
 * @param {string} spaceId - Space ID
 * @param {Object} objectData - Complete object data
 * @param {Array} oldPosition - Old position [x, y, z]
 * @param {Array} newPosition - New position [x, y, z]
 * @returns {Promise<boolean>} - Success status
 */
export const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectData,
  oldPosition,
  newPosition
) => {
  if (!userId || !spaceId || !objectData || !oldPosition || !newPosition)
    return false;

  const oldCellCoords = getCellCoordinates(oldPosition);
  const newCellCoords = getCellCoordinates(newPosition);
  // If object didn't change cells, just update the object data in the current cell
  if (
    oldCellCoords.x === newCellCoords.x &&
    oldCellCoords.y === newCellCoords.y &&
    oldCellCoords.z === newCellCoords.z
  ) {
    // Update object in current cell with new position
    const updatedObjectData = { ...objectData, position: newPosition };
    await addObjectToCell(userId, spaceId, updatedObjectData);
    return true;
  }

  try {
    // Remove from old cell
    await removeObjectFromCell(userId, spaceId, objectData.id, oldPosition); // Add to new cell with updated position
    const updatedObjectData = { ...objectData, position: newPosition };
    await addObjectToCell(userId, spaceId, updatedObjectData);

    return true;
  } catch {
    return false;
  }
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
  if (!userId || !spaceId || !cellCoords) return [];

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
        }
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
  if (
    !userId ||
    !spaceId ||
    !objectData ||
    !objectData.id ||
    !objectData.position
  )
    return false;
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
      // Cell doesn't exist, create it and add the object
      return await addObjectToCell(userId, spaceId, objectData);
    }

    const cellData = cellDoc.data();

    // Ensure objects is an object (for backward compatibility)
    if (Array.isArray(cellData.objects)) {
      cellData.objects = {};
    }

    // Update object data in cell
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

    const cellDoc = await getDoc(cellRef);
    if (!cellDoc.exists()) return true; // Cell doesn't exist, object already not present

    const cellData = cellDoc.data();

    // Handle both old array format and new object format
    if (Array.isArray(cellData.objects)) {
      const objectIndex = cellData.objects.indexOf(objectId);
      if (objectIndex > -1) {
        cellData.objects.splice(objectIndex, 1);
        await setDoc(cellRef, cellData, { merge: true });
      }
    } else if (cellData.objects && typeof cellData.objects === 'object') {
      if (cellData.objects[objectId]) {
        delete cellData.objects[objectId];
        await setDoc(cellRef, cellData, { merge: true });
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Subscribe to cell changes
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

  const unsubscribes = [];
  cellCoords.forEach((coords) => {
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

    const unsubscribe = onSnapshot(
      cellRef,
      (doc) => {
        if (doc.exists()) {
          callback({
            type: 'cell_updated',
            cellId,
            data: { id: cellId, ...doc.data() },
          });
        }
      },
      () => {
        // Error handler - silently handle errors
      }
    );

    unsubscribes.push(unsubscribe);
  });

  // Return a function to unsubscribe from all cells
  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
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
