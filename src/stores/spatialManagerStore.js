import { create } from 'zustand';
import {
  getCellCoordinates,
  getCellId,
  getNeighborCells,
  createCellsBatch,
  addObjectToCell,
  moveObjectBetweenCells,
  getOccupiedCells,
  getCellsToUnload,
  CELL_NEIGHBOR_RADIUS,
  CELL_UNLOAD_DISTANCE,
} from '../services/spatialPartitioning';

import { getIsInitialLoading } from '../utils/loadingState';

// Version marker

const useSpatialManagerStore = create((set, get) => ({
  // State
  loadedCells: new Set(),
  currentCellCoords: { x: 0, y: 0, z: 0 },
  isInitialized: false,

  // Internal tracking state
  lastCameraPosition: [0, 0, 0],
  cameraVelocity: [0, 0, 0],
  cellSubscriptions: new Map(),
  initializationPromise: null,
  lastUpdateTime: 0,
  loadingCells: new Set(),
  lastCellLoadTime: 0,
  objectsByCell: new Map(), // Map of cellId -> Set of objectIds

  // Constants
  CELL_LOAD_COOLDOWN: 1000, // Minimum 1 second between cell loading operations
  MAX_CONCURRENT_LOADS: 5, // Limit concurrent cell loading operations
  POSITION_UPDATE_THROTTLE: 250, // Throttle position updates

  // Actions
  setLoadedCells: (cells) => {
    set({ loadedCells: new Set(cells) });
  },

  addLoadedCell: (cellId) => {
    const state = get();
    const newSet = new Set(state.loadedCells);
    newSet.add(cellId);
    set({ loadedCells: newSet });
  },

  removeLoadedCell: (cellId) => {
    const state = get();
    const newSet = new Set(state.loadedCells);
    newSet.delete(cellId);
    set({ loadedCells: newSet });
  },

  setCurrentCellCoords: (coords) => {
    set({ currentCellCoords: coords });
  },

  setIsInitialized: (initialized) => {
    set({ isInitialized: initialized });
  },

  setLastCameraPosition: (position) => {
    set({ lastCameraPosition: position });
  },

  setCameraVelocity: (velocity) => {
    set({ cameraVelocity: velocity });
  },

  setLastUpdateTime: (time) => {
    set({ lastUpdateTime: time });
  },

  setLastCellLoadTime: (time) => {
    set({ lastCellLoadTime: time });
  },

  addLoadingCell: (cellId) => {
    const state = get();
    const newSet = new Set(state.loadingCells);
    newSet.add(cellId);
    set({ loadingCells: newSet });
  },

  removeLoadingCell: (cellId) => {
    const state = get();
    const newSet = new Set(state.loadingCells);
    newSet.delete(cellId);
    set({ loadingCells: newSet });
  },

  // Object tracking methods
  trackObjectInCell: (objectId, cellId) => {
    const state = get();
    const objIdStr = objectId.toString();
    const newMap = new Map(state.objectsByCell);

    if (!newMap.has(cellId)) {
      newMap.set(cellId, new Set());
    }
    newMap.get(cellId).add(objIdStr);
    set({ objectsByCell: newMap });
  },

  untrackObjectInCell: (objectId, cellId) => {
    const state = get();
    const objIdStr = objectId.toString();
    const newMap = new Map(state.objectsByCell);
    const cellObjects = newMap.get(cellId);

    if (cellObjects) {
      cellObjects.delete(objIdStr);
      if (cellObjects.size === 0) {
        newMap.delete(cellId);
      }
      set({ objectsByCell: newMap });
    }
  },

  // Load multiple cells in parallel for better performance
  loadCellsBatch: async (cellCoordsList, user, currentSpaceId) => {
    if (!currentSpaceId || !cellCoordsList?.length) return [];

    const ownerUserId = window.currentSpaceOwner || user?.uid;
    if (!ownerUserId) return [];

    const state = get();

    // Filter out cells that are already loaded OR currently being loaded
    const cellsToLoad = cellCoordsList.filter((coords) => {
      const cellId = getCellId(coords.x, coords.y, coords.z);
      return !state.loadedCells.has(cellId) && !state.loadingCells.has(cellId);
    });

    if (cellsToLoad.length === 0) {
      return [];
    }

    // Apply concurrency limit
    const currentlyLoading = state.loadingCells.size;
    if (currentlyLoading >= state.MAX_CONCURRENT_LOADS) {
      return [];
    }

    const availableSlots = state.MAX_CONCURRENT_LOADS - currentlyLoading;
    const cellsToLoadNow = cellsToLoad.slice(0, availableSlots);

    // Mark cells as being loaded
    cellsToLoadNow.forEach((coords) => {
      const cellId = getCellId(coords.x, coords.y, coords.z);
      get().addLoadingCell(cellId);
    });

    try {
      // Use batch creation for better performance
      const results = await createCellsBatch(
        ownerUserId,
        currentSpaceId,
        cellsToLoadNow
      );

      // Update loaded cells with successful loads
      const newCellIds = cellsToLoadNow
        .filter((coords, index) => results[index]) // Only successful creations
        .map((coords) => getCellId(coords.x, coords.y, coords.z));

      if (newCellIds.length > 0) {
        const currentState = get();
        const newLoadedCells = new Set([
          ...currentState.loadedCells,
          ...newCellIds,
        ]);
        set({ loadedCells: newLoadedCells });
      }

      return results;
    } catch (error) {
      console.error('❌ Error in batch cell loading:', error);
      return [];
    } finally {
      // Remove cells from loading tracker
      cellsToLoadNow.forEach((coords) => {
        const cellId = getCellId(coords.x, coords.y, coords.z);
        get().removeLoadingCell(cellId);
      });
    }
  },
  // Initialize the spatial system by discovering existing cells and loading the origin cell
  initializeSpatialSystem: async (user, currentSpaceId, cameraRef) => {
    const state = get();

    if (!currentSpaceId || state.isInitialized || state.initializationPromise) {
      console.debug('🚫 Skipping spatial initialization:', {
        noSpaceId: !currentSpaceId,
        alreadyInitialized: state.isInitialized,
        hasPromise: !!state.initializationPromise,
      });
      return;
    }

    // Prevent multiple initialization attempts
    const initPromise = (async () => {
      try {
        // Get the correct owner ID (could be from URL for public spaces)
        const ownerUserId = window.currentSpaceOwner || user?.uid;

        if (!ownerUserId) {
          set({ initializationPromise: null }); // Clear the promise so we can retry
          return;
        }

        // Discover existing cells that contain objects
        const existingCells = await getOccupiedCells(
          ownerUserId,
          currentSpaceId
        );

        // Get initial camera position and load neighbor cells
        // Use actual camera position if available, otherwise use default
        const actualCameraPosition = cameraRef?.current?.camera?.position;
        const initialCameraPosition = actualCameraPosition
          ? [
              actualCameraPosition.x,
              actualCameraPosition.y,
              actualCameraPosition.z,
            ]
          : [20, 20, 50]; // Default camera position

        const initialCells = getNeighborCells(
          initialCameraPosition,
          CELL_NEIGHBOR_RADIUS
        ); // Combine existing occupied cells and initial camera radius cells
        const cellsToLoad = new Set();
        existingCells.forEach((cellId) => cellsToLoad.add(cellId));

        // Add initial camera radius cells
        for (const cellCoords of initialCells) {
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
          cellsToLoad.add(cellId);
        }

        // Convert all cells to load into coordinate format for batch loading
        const allCellCoordsToLoad = [];

        // Add existing cells coordinates
        for (const cellId of existingCells) {
          const coords = cellId.split(',').map((num) => parseInt(num));
          if (coords.length >= 2) {
            allCellCoordsToLoad.push({
              x: coords[0],
              y: coords[1],
              z: coords[2] || 0,
            });
          }
        }
        // Add initial camera cells coordinates
        for (const cellCoords of initialCells) {
          allCellCoordsToLoad.push(cellCoords);
        }
        if (allCellCoordsToLoad.length > 0) {
          await get().loadCellsBatch(allCellCoordsToLoad, user, currentSpaceId);

          // Wait a bit more for all cell subscriptions to be established
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (existingCells.length > 0 || initialCells.length > 0) {
          // Set state first
          set({
            loadedCells: cellsToLoad,
            currentCellCoords: { x: 0, y: 0, z: 0 },
            isInitialized: true,
          }); // Add a small delay to ensure all cell subscriptions are fully established
          // before other systems start using the spatial manager
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('❌ Error during spatial initialization:', error);
        set({ initializationPromise: null }); // Clear the promise so we can retry
      } finally {
        // Always clear the promise when done (success or failure)
        set({ initializationPromise: null });
      }
    })();

    set({ initializationPromise: initPromise });
    return initPromise;
  },

  // Load a single cell (kept for backward compatibility)
  loadCell: async (cellX, cellY, cellZ = 0, user, currentSpaceId) => {
    const results = await get().loadCellsBatch(
      [{ x: cellX, y: cellY, z: cellZ }],
      user,
      currentSpaceId
    );
    return results[0]?.success || false;
  },

  // Unload multiple cells in batch for better performance
  unloadCellsBatch: (cellIds, onObjectsChange) => {
    if (!cellIds?.length) return;

    const state = get();
    const cellsToRemove = cellIds.filter((cellId) =>
      state.loadedCells.has(cellId)
    );

    if (cellsToRemove.length > 0) {
      // Notify about objects that should be removed
      if (onObjectsChange && state.objectsByCell.size > 0) {
        const objectsToRemove = [];

        cellsToRemove.forEach((cellId) => {
          const cellObjects = state.objectsByCell.get(cellId);

          if (cellObjects) {
            objectsToRemove.push(...Array.from(cellObjects));
            // Remove from objectsByCell map
            const newMap = new Map(state.objectsByCell);
            newMap.delete(cellId);
            set({ objectsByCell: newMap });
          }
        });

        if (objectsToRemove.length > 0) {
          objectsToRemove.forEach((objectId) => {
            onObjectsChange({
              type: 'removed',
              id: objectId.toString(),
              source: 'cell-unload',
            });
          });
        }
      }

      // Remove cells from loaded set
      const newLoadedCells = new Set(state.loadedCells);
      cellsToRemove.forEach((cellId) => newLoadedCells.delete(cellId));
      set({ loadedCells: newLoadedCells });
    }
  },

  // Update camera position and manage cell loading with predictive loading
  updateCameraPosition: async (
    position,
    user,
    currentSpaceId,
    onObjectsChange
  ) => {
    const state = get();

    if (!state.isInitialized || !currentSpaceId) return;

    // Throttle position updates to improve performance
    const now = Date.now();
    if (now - state.lastUpdateTime < state.POSITION_UPDATE_THROTTLE) {
      return;
    }
    set({ lastUpdateTime: now });

    // Convert position to array if it's a Vector3
    const posArray = Array.isArray(position)
      ? position
      : [position.x, position.y, position.z];

    // Calculate camera velocity for predictive loading
    const [lastX, lastY, lastZ] = state.lastCameraPosition;
    const [newX, newY, newZ] = posArray;
    const timeDelta = state.POSITION_UPDATE_THROTTLE / 1000; // Convert to seconds

    const currentVelocity = [
      (newX - lastX) / timeDelta,
      (newY - lastY) / timeDelta,
      (newZ - lastZ) / timeDelta,
    ];

    // Update velocity (with smoothing)
    const smoothing = 0.3;
    const newCameraVelocity = [
      state.cameraVelocity[0] * (1 - smoothing) +
        currentVelocity[0] * smoothing,
      state.cameraVelocity[1] * (1 - smoothing) +
        currentVelocity[1] * smoothing,
      state.cameraVelocity[2] * (1 - smoothing) +
        currentVelocity[2] * smoothing,
    ];
    set({ cameraVelocity: newCameraVelocity });

    const distance = Math.sqrt(
      Math.pow(newX - lastX, 2) +
        Math.pow(newY - lastY, 2) +
        Math.pow(newZ - lastZ, 2)
    );

    // Check if this is the first position update (initial camera position)
    const isFirstUpdate = lastX === 0 && lastY === 0 && lastZ === 0;

    // Only update if camera moved more than 25 units OR this is the first update
    if (distance < 25 && !isFirstUpdate) return;

    set({ lastCameraPosition: posArray });

    // Get current cell coordinates
    const newCellCoords = getCellCoordinates(posArray);

    // Update current cell if changed
    if (
      newCellCoords.x !== state.currentCellCoords.x ||
      newCellCoords.y !== state.currentCellCoords.y ||
      newCellCoords.z !== state.currentCellCoords.z
    ) {
      set({ currentCellCoords: newCellCoords });
    }

    // PRIORITY 1: Unload distant cells FIRST (non-blocking)
    const cellsToUnload = getCellsToUnload(
      posArray,
      Array.from(state.loadedCells),
      CELL_UNLOAD_DISTANCE
    );

    if (cellsToUnload.length > 0) {
      get().unloadCellsBatch(cellsToUnload, onObjectsChange);
    }

    // PRIORITY 2: Load immediate neighbor cells (non-blocking, fire-and-forget)
    const neighborCells = getNeighborCells(posArray, CELL_NEIGHBOR_RADIUS);
    const cellsToLoad = neighborCells.filter((cellCoords) => {
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
      return !state.loadedCells.has(cellId);
    });

    // Add cooldown check to prevent rapid successive cell loading
    const timeSinceLastLoad = now - state.lastCellLoadTime;
    const shouldLoadCells =
      cellsToLoad.length > 0 && timeSinceLastLoad >= state.CELL_LOAD_COOLDOWN;

    // PRIORITY 3: Predictive loading based on camera movement direction
    const predictiveCells = [];
    const speed = Math.sqrt(
      Math.pow(newCameraVelocity[0], 2) + Math.pow(newCameraVelocity[2], 2) // Only X and Z for horizontal movement
    );

    // Only do predictive loading if camera is moving fast enough but not too fast
    if (speed > 500 && speed < 2000) {
      // Added upper limit to prevent loading during rapid movements
      const direction = [
        newCameraVelocity[0] / speed,
        0, // Keep Y the same
        newCameraVelocity[2] / speed,
      ];

      // Predict where camera will be in next 2-3 seconds
      const predictedPosition = [
        posArray[0] + direction[0] * speed * 2,
        posArray[1],
        posArray[2] + direction[2] * speed * 2,
      ];

      const predictedNeighbors = getNeighborCells(predictedPosition, 1);
      predictedNeighbors.forEach((cellCoords) => {
        const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
        if (
          !state.loadedCells.has(cellId) &&
          !cellsToLoad.some(
            (c) =>
              c.x === cellCoords.x &&
              c.y === cellCoords.y &&
              c.z === cellCoords.z
          )
        ) {
          predictiveCells.push(cellCoords);
        }
      });
    }

    // Load immediate cells first, then predictive cells with lower priority
    if (shouldLoadCells) {
      set({ lastCellLoadTime: now }); // Update the last load time
      get()
        .loadCellsBatch(cellsToLoad, user, currentSpaceId)
        .catch((error) => {
          console.error('❌ Error in background cell loading:', error);
        });
    }

    // Load predictive cells with delay to not interfere with immediate loading
    if (predictiveCells.length > 0) {
      setTimeout(() => {
        get()
          .loadCellsBatch(predictiveCells, user, currentSpaceId)
          .catch((error) => {
            console.error('❌ Error in predictive cell loading:', error);
          });
      }, 500); // 500ms delay for predictive loading
    }
  },

  // Add an object to the appropriate cell
  addObjectToSpatialSystem: async (
    objectId,
    position,
    user,
    currentSpaceId
  ) => {
    if (!currentSpaceId || !objectId || !position) return false;

    try {
      // Get the correct owner ID
      const ownerUserId = window.currentSpaceOwner || user?.uid;
      if (!ownerUserId) {
        return false;
      }
      return await addObjectToCell(ownerUserId, currentSpaceId, {
        id: objectId,
        position: position,
      });
    } catch {
      return false;
    }
  },
  // Move an object between cells when its position changes
  moveObjectInSpatialSystem: async (
    objectId,
    oldPosition,
    newPosition,
    objectDataFull,
    user,
    currentSpaceId
  ) => {
    // Check if we're still in initial loading phase - no saves during app startup
    if (getIsInitialLoading()) {
      console.log(
        `⏸️ [SpatialManager] Skipping moveObjectInSpatialSystem for object ${objectId} - still in initial loading phase`
      );
      return false;
    }

    console.log(
      '[SpatialManagerDebug] moveObjectInSpatialSystem ENTER.',
      `ObjectId: ${objectId}`,
      `OldPos: ${JSON.stringify(oldPosition)}`,
      `NewPos: ${JSON.stringify(newPosition)}`,
      `CurrentSpaceId: ${currentSpaceId}`
    );

    if (!currentSpaceId || !objectId || !oldPosition || !newPosition) {
      console.warn(
        '[SpatialManagerDebug] moveObjectInSpatialSystem: Missing required parameters. Aborting.'
      );
      return false;
    }

    try {
      const ownerUserId = window.currentSpaceOwner || user?.uid;
      if (!ownerUserId) {
        console.warn(
          '[SpatialManagerDebug] moveObjectInSpatialSystem: No ownerUserId. Aborting.'
        );
        return false;
      }

      // Determine old and new cell IDs here for logging and decision making
      const oldCellCoords = getCellCoordinates(oldPosition);
      const oldCellId = getCellId(
        oldCellCoords.x,
        oldCellCoords.y,
        oldCellCoords.z
      );
      const newCellCoords = getCellCoordinates(newPosition);
      const newCellId = getCellId(
        newCellCoords.x,
        newCellCoords.y,
        newCellCoords.z
      );

      console.log(
        `[SpatialManagerDebug] Calculated Old Cell ID: ${oldCellId}, New Cell ID: ${newCellId}`
      );

      // The objectData to pass to moveObjectBetweenCells should be the full object data if available,
      // or at least { id: objectId, position: newPosition }.
      const effectiveObjectDataForMove = objectDataFull
        ? { ...objectDataFull, position: newPosition, id: objectId }
        : { id: objectId, position: newPosition };

      console.log(
        '[SpatialManagerDebug] Calling moveObjectBetweenCells with:',
        `Owner: ${ownerUserId}`,
        `Space: ${currentSpaceId}`,
        `ObjID: ${objectId}`,
        `OldPos: ${JSON.stringify(oldPosition)}`,
        `NewPos: ${JSON.stringify(newPosition)}`,
        `Payload:`,
        effectiveObjectDataForMove
      );

      const result = await moveObjectBetweenCells(
        ownerUserId,
        currentSpaceId,
        objectId, // Pass objectId directly as objectIdOrData (string signature)
        oldPosition,
        newPosition,
        effectiveObjectDataForMove // This is the 6th param (objectData) for moveObjectBetweenCells
      );

      console.log(
        `[SpatialManagerDebug] moveObjectBetweenCells result: ${result}`
      );
      return result;
    } catch (error) {
      console.error(
        '[SpatialManagerDebug] ❌ Error in moveObjectInSpatialSystem:',
        error
      );
      return false;
    }
  },

  // Get cell coordinates for a position
  getCellForPosition: (position) => {
    return getCellCoordinates(position);
  },

  // Get loaded cells as array (for backward compatibility)
  getLoadedCellsArray: () => {
    const state = get();
    return Array.from(state.loadedCells || new Set()).sort();
  },

  // Cleanup all spatial manager state
  resetSpatialManager: () => {
    const state = get();

    // Cleanup subscriptions
    state.cellSubscriptions.forEach((unsubscribe) => unsubscribe());

    set({
      loadedCells: new Set(),
      currentCellCoords: { x: 0, y: 0, z: 0 },
      isInitialized: false,
      lastCameraPosition: [0, 0, 0],
      cameraVelocity: [0, 0, 0],
      cellSubscriptions: new Map(),
      initializationPromise: null,
      lastUpdateTime: 0,
      loadingCells: new Set(),
      lastCellLoadTime: 0,
      objectsByCell: new Map(),
    });
  },
}));

export default useSpatialManagerStore;
