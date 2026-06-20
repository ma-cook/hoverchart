import { create } from 'zustand';
import {
  getCellCoordinates,
  getCellCoordinatesWithHysteresis,
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

// Import caches from spatialObjectsService
import {
  objectsCache,
  saveTimeouts,
  updateThrottles,
  lastReceivedObjects,
} from '../services/spatialObjectsService';

import { getIsInitialLoading } from '../utils/loadingState';
import { forceCleanupSubscription, generateSubscriptionKey } from '../services/globalSubscriptionManager';
// Lazy-accessed at runtime (inside actions) to break circular init dependency
import useObjectsStore from './objectsStore';
import useConnectionStore from './connectionStore';

// Version marker

const useSpatialManagerStore = create((set, get) => ({
  // State
  loadedCells: new Set(),
  currentCellCoords: { x: 0, y: 0, z: 0 },
  cameraCellCoords: { x: 0, y: 0, z: 0 },
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

  // Constants - Optimized for smoother performance with conservative limits
  CELL_LOAD_COOLDOWN: 0, // No cooldown for immediate loading
  MAX_CONCURRENT_LOADS: 6, // Conservative limit to prevent overwhelming Firestore
  POSITION_UPDATE_THROTTLE: 0, // No throttling - handled by hysteresis
  UNLOAD_BATCH_SIZE: 6, // Conservative unload batch size
  LOAD_BATCH_SIZE: 6, // Conservative load batch size for optimal performance

  // Handler for when cells are reloaded
  handleCellsReloaded: (loadedCells) => {
    if (!loadedCells?.length) return;

    try {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore.getState().setObjects([...currentObjects]);
    } catch (error) {
      console.error('Error updating objects after cell reload:', error);
    }
  },

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

  setCameraCellCoords: (coords) => {
    set({ cameraCellCoords: coords });
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

  // Helper method to efficiently determine which cells need loading
  getCellsNeedingLoad: (cellCoordsList) => {
    const state = get();
    return cellCoordsList.filter((coords) => {
      const cellId = getCellId(coords.x, coords.y, coords.z);
      return !state.loadedCells.has(cellId) && !state.loadingCells.has(cellId);
    });
  },

  // Helper method to check if we can load more cells
  canLoadMoreCells: () => {
    const state = get();
    return state.loadingCells.size < state.MAX_CONCURRENT_LOADS;
  },

  // Load multiple cells in parallel for better performance
  loadCellsBatch: async (cellCoordsList, user, currentSpaceId) => {
    if (!currentSpaceId || !cellCoordsList?.length) return [];

    const state = get();

    // Quick exit if we can't load more cells
    if (!state.canLoadMoreCells()) {
      return [];
    }

    // Efficiently filter cells that need loading
    const cellsToLoad = state.getCellsNeedingLoad(cellCoordsList);

    if (cellsToLoad.length === 0) {
      return [];
    }

    const ownerUserId = window.currentSpaceOwner || user?.uid;
    if (!ownerUserId) return [];

    // Apply conservative batch limits
    const availableSlots = state.MAX_CONCURRENT_LOADS - state.loadingCells.size;
    const effectiveBatchSize = Math.min(availableSlots, state.LOAD_BATCH_SIZE);
    const cellsToLoadNow = cellsToLoad.slice(0, effectiveBatchSize);

    // Get cell IDs for cleanup operations
    const loadingCellIds = cellsToLoadNow.map((coords) =>
      getCellId(coords.x, coords.y, coords.z)
    );

    // Mark cells as being loaded
    cellsToLoadNow.forEach((coords) => {
      const cellId = getCellId(coords.x, coords.y, coords.z);
      get().addLoadingCell(cellId);
    });

    // Remove unloaded flags for the cells and their objects (batch operation)
    if (window._unloadedObjects || window._unloadedCells) {
      loadingCellIds.forEach((cellId) => {
        // Remove cell from unloaded tracking
        if (window._unloadedCells) {
          window._unloadedCells.delete(cellId);
        }

        // Remove all objects in this cell from unloaded tracking
        const cellObjects = state.objectsByCell.get(cellId);
        if (cellObjects && window._unloadedObjects) {
          cellObjects.forEach((objId) => {
            window._unloadedObjects.delete(objId);
          });
        }
      });
    }

    try {
      // Use optimized batch creation for better performance
      const results = await createCellsBatch(
        ownerUserId,
        currentSpaceId,
        cellsToLoadNow
      );

      // Process successful loads in batch
      const loadedCellIds = [];
      cellsToLoadNow.forEach((coords, index) => {
        if (results[index]) {
          const cellId = getCellId(coords.x, coords.y, coords.z);
          loadedCellIds.push(cellId);
          if (window._unloadedCells) {
            window._unloadedCells.delete(cellId);
          }
        }
      });

      // Batch restore objects and connections for loaded cells
      if (loadedCellIds.length > 0) {
        // Restore objects
        get().handleCellsReloaded(loadedCellIds);

        // Restore connections
        try {
          useConnectionStore
            .getState()
            .clearUnloadedConnectionsForCells(loadedCellIds);
        } catch (error) {
          console.error(
            'Error restoring connections for reloaded cells:',
            error
          );
        }
      }

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
        }
        if (existingCells.length > 0 || initialCells.length > 0) {
          set({
            loadedCells: cellsToLoad,
            currentCellCoords: { x: 0, y: 0, z: 0 },
            isInitialized: true,
          });
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
  unloadCellsBatch: (cellIds, onObjectsChange, currentSpaceId) => {
    if (!cellIds?.length) return;

    const state = get();
    const cellsToRemove = cellIds.filter((cellId) =>
      state.loadedCells.has(cellId)
    );

    // Limit unload batch size to prevent frame drops
    const unloadBatchSize = Math.min(
      cellsToRemove.length,
      state.UNLOAD_BATCH_SIZE
    );
    const cellsToUnloadNow = cellsToRemove.slice(0, unloadBatchSize);

    // Queue remaining cells for next batch if needed
    if (cellsToRemove.length > unloadBatchSize) {
      const remainingCells = cellsToRemove.slice(unloadBatchSize);
      // Process immediately without delay
      get().unloadCellsBatch(remainingCells, onObjectsChange, currentSpaceId);
    }

    if (cellsToUnloadNow.length > 0) {
      // Notify about objects that should be removed and track them
      if (onObjectsChange && state.objectsByCell.size > 0) {
        const objectsToRemove = [];
        // Create or update the global tracking set for unloaded objects
        if (!window._unloadedObjects) {
          window._unloadedObjects = new Set();
        }

        cellsToUnloadNow.forEach((cellId) => {
          const cellObjects = state.objectsByCell.get(cellId);

          if (cellObjects) {
            // Add objects to tracking set
            cellObjects.forEach((objId) => {
              window._unloadedObjects.add(objId.toString());
            });

            objectsToRemove.push(...Array.from(cellObjects));
          }
        });

        if (objectsToRemove.length > 0) {
          objectsToRemove.forEach((objectId) => {
            // Clean up object caches and subscriptions
            const objStr = objectId.toString();
            const cacheKey = `${currentSpaceId}_${objStr}`;
            // Clean from objectsCache
            objectsCache?.delete(cacheKey);
            // Clean from other caches
            saveTimeouts?.delete(cacheKey);
            updateThrottles?.delete(cacheKey);
            lastReceivedObjects?.delete(cacheKey);
          });

          // Clean up objects state in the store
          try {
            useObjectsStore.getState().cleanupUnloadedObjects();
          } catch (error) {
            console.error('Error cleaning up objects store:', error);
          }
        }
      }

      // Remove connections from unloaded cells synchronously
      try {
        useConnectionStore.getState().removeConnectionsFromCells(cellsToUnloadNow);
      } catch (error) {
        console.error('Error removing connections from unloaded cells:', error);
      }

      // Force cleanup connection subscriptions for unloaded cells to ensure fresh subscriptions when reloaded
      try {
        cellsToUnloadNow.forEach((cellKey) => {
          const subscriptionKey = generateSubscriptionKey.connections(
            currentSpaceId || 'default',
            cellKey
          );
          forceCleanupSubscription(subscriptionKey);
        });
      } catch (error) {
        console.error('Error force cleaning connection subscriptions:', error);
      }

      // Clean up subscriptions for unloaded cells
      try {
        cellsToUnloadNow.forEach((cellKey) => {
          // Clean up spatial object subscriptions
          const spatialSubKey = generateSubscriptionKey.spatialObjects(
            currentSpaceId || 'default',
            cellKey
          );
          forceCleanupSubscription(spatialSubKey);
        });
      } catch (error) {
        console.error(
          'Error force cleaning spatial object subscriptions:',
          error
        );
      }
      // Remove cells from loaded set
      const newLoadedCells = new Set(state.loadedCells);
      cellsToUnloadNow.forEach((cellId) => newLoadedCells.delete(cellId));
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

    const now = Date.now();

    // Convert position to array if it's a Vector3
    const posArray = Array.isArray(position)
      ? position
      : [position.x, position.y, position.z];

    // Use hysteresis to prevent rapid cell switching near boundaries
    const newCellCoords = getCellCoordinatesWithHysteresis(
      posArray,
      state.currentCellCoords
    );

    // Only proceed if we've actually changed cells
    const cellChanged =
      newCellCoords.x !== state.currentCellCoords.x ||
      newCellCoords.y !== state.currentCellCoords.y ||
      newCellCoords.z !== state.currentCellCoords.z;

    // Update camera position and cell coordinates
    set({
      lastCameraPosition: posArray,
      currentCellCoords: newCellCoords,
    });

    // If we haven't changed cells, skip most processing to reduce overhead
    if (!cellChanged) {
      return;
    }

    // Track a global set of unloaded cells to prevent resubscription
    if (!window._unloadedCells) {
      window._unloadedCells = new Set();
    }

    // PRIORITY 1: Unload distant cells FIRST (non-blocking)
    const cellsToUnload = getCellsToUnload(
      posArray,
      Array.from(state.loadedCells),
      CELL_UNLOAD_DISTANCE
    ).filter((cellId) => {
      // Don't unload cells that are in the loading state
      return !state.loadingCells.has(cellId);
    });

    if (cellsToUnload.length > 0) {
      window._lastCellUnloadTime = now;
      get().unloadCellsBatch(cellsToUnload, onObjectsChange, currentSpaceId);
    }

    // PRIORITY 2: Load immediate neighbor cells (non-blocking, fire-and-forget)
    const neighborCells = getNeighborCells(posArray, CELL_NEIGHBOR_RADIUS);

    const cellsToLoad = neighborCells.filter((cellCoords) => {
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

      // Debug each cell's status
      const isAlreadyLoaded = state.loadedCells.has(cellId);
      const isLoading = state.loadingCells.has(cellId);

      // Don't load if the cell is already loaded or loading
      if (isAlreadyLoaded || isLoading) {
        return false;
      }

      // Clear unloaded flag immediately when trying to reload
      if (window._unloadedCells?.has(cellId)) {
        window._unloadedCells.delete(cellId);
      }

      return true;
    });

    // Load cells immediately without cooldown
    const shouldLoadCells = cellsToLoad.length > 0;

    // PRIORITY 3: Load cells in the direction of movement
    const predictiveCells = [];
    // Get a few cells ahead in the current view direction
    const forwardCells = getNeighborCells(posArray, 2);
    forwardCells.forEach((cellCoords) => {
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
      if (
        !state.loadedCells.has(cellId) &&
        !cellsToLoad.some(
          (c) =>
            c.x === cellCoords.x && c.y === cellCoords.y && c.z === cellCoords.z
        )
      ) {
        predictiveCells.push(cellCoords);
      }
    });

    // Load immediate cells first, then predictive cells with lower priority
    if (shouldLoadCells) {
      set({ lastCellLoadTime: now }); // Update the last load time
      get()
        .loadCellsBatch(cellsToLoad, user, currentSpaceId)

        .catch((error) => {
          console.error('❌ Error in background cell loading:', error);
        });
    }

    // Load predictive cells immediately
    if (predictiveCells.length > 0) {
      get()
        .loadCellsBatch(predictiveCells, user, currentSpaceId)
        .catch((error) => {
          console.error('❌ Error in predictive cell loading:', error);
        });
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
      return false;
    }

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

      // The objectData to pass to moveObjectBetweenCells should be the full object data if available,
      // or at least { id: objectId, position: newPosition }.
      const effectiveObjectDataForMove = objectDataFull
        ? { ...objectDataFull, position: newPosition, id: objectId }
        : { id: objectId, position: newPosition };

      const result = await moveObjectBetweenCells(
        ownerUserId,
        currentSpaceId,
        objectId, // Pass objectId directly as objectIdOrData (string signature)
        oldPosition,
        newPosition,
        effectiveObjectDataForMove // This is the 6th param (objectData) for moveObjectBetweenCells
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
      cameraCellCoords: { x: 0, y: 0, z: 0 },
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
