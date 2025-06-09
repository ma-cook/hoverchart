import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getCellCoordinates,
  getCellId,
  getNeighborCells,
  createCellsBatch,
  addObjectToCell,
  moveObjectBetweenCells, // Ensure this is the one from spatialPartitioning
  getOccupiedCells,
  getCellsToUnload,
  CELL_NEIGHBOR_RADIUS,
  CELL_UNLOAD_DISTANCE,
} from '../services/spatialPartitioning';

console.log('--- USE_SPATIAL_MANAGER_JS LOADED - V1 ---'); // Version marker

/**
 * Hook to manage spatial partitioning and camera-based cell loading
 */
export const useSpatialManager = ({
  user,
  currentSpaceId,
  cameraRef,
  onObjectsChange,
}) => {
  const [loadedCells, setLoadedCells] = useState(new Set());
  const [currentCellCoords, setCurrentCellCoords] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  // Refs for tracking
  const lastCameraPosition = useRef([0, 0, 0]);
  const cameraVelocity = useRef([0, 0, 0]); // Track camera movement direction
  const cellSubscriptions = useRef(new Map());
  const initializationPromise = useRef(null);
  const lastUpdateTime = useRef(0);
  const loadingCellsRef = useRef(new Set()); // Track cells currently being loaded
  const lastCellLoadTime = useRef(0); // Track when cells were last loaded
  const CELL_LOAD_COOLDOWN = 1000; // Minimum 1 second between cell loading operations
  const MAX_CONCURRENT_LOADS = 5; // Limit concurrent cell loading operations
  // Track objects by cell for cleanup during cell unloading
  const objectsByCellRef = useRef(new Map()); // Map of cellId -> Set of objectIds
  /**
   * Add object to cell tracking
   */
  const trackObjectInCell = useCallback((objectId, cellId) => {
    const objIdStr = objectId.toString();
    if (!objectsByCellRef.current.has(cellId)) {
      objectsByCellRef.current.set(cellId, new Set());
    }
    objectsByCellRef.current.get(cellId).add(objIdStr);
  }, []);
  /**
   * Remove object from cell tracking
   */
  const untrackObjectInCell = useCallback((objectId, cellId) => {
    const objIdStr = objectId.toString();
    const cellObjects = objectsByCellRef.current.get(cellId);
    if (cellObjects) {
      cellObjects.delete(objIdStr);

      if (cellObjects.size === 0) {
        objectsByCellRef.current.delete(cellId);
      }
    }
  }, []);
  const POSITION_UPDATE_THROTTLE = 250; // Increased from 100ms to 250ms to reduce Firebase requests

  /**
   * Load multiple cells in parallel for better performance
   */
  const loadCellsBatch = useCallback(
    async (cellCoordsList) => {
      if (!currentSpaceId || !cellCoordsList?.length) return [];

      const ownerUserId = window.currentSpaceOwner || user?.uid;
      if (!ownerUserId) return [];

      // Filter out cells that are already loaded OR currently being loaded
      const cellsToLoad = cellCoordsList.filter((coords) => {
        const cellId = getCellId(coords.x, coords.y, coords.z);
        return !loadedCells.has(cellId) && !loadingCellsRef.current.has(cellId);
      });

      if (cellsToLoad.length === 0) {
        return [];
      }

      // Apply concurrency limit
      const currentlyLoading = loadingCellsRef.current.size;
      if (currentlyLoading >= MAX_CONCURRENT_LOADS) {
        return [];
      }

      const availableSlots = MAX_CONCURRENT_LOADS - currentlyLoading;
      const cellsToLoadNow = cellsToLoad.slice(0, availableSlots);

      // Mark cells as being loaded
      cellsToLoadNow.forEach((coords) => {
        const cellId = getCellId(coords.x, coords.y, coords.z);
        loadingCellsRef.current.add(cellId);
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
          setLoadedCells((prev) => new Set([...prev, ...newCellIds]));
        }

        return results;
      } catch (error) {
        console.error('❌ Error in batch cell loading:', error);
        return [];
      } finally {
        // Remove cells from loading tracker
        cellsToLoadNow.forEach((coords) => {
          const cellId = getCellId(coords.x, coords.y, coords.z);
          loadingCellsRef.current.delete(cellId);
        });
      }
    },
    [user, currentSpaceId, loadedCells]
  );

  /**
   * Initialize the spatial system by discovering existing cells and loading the origin cell
   */
  const initializeSpatialSystem = useCallback(async () => {
    if (!currentSpaceId || isInitialized || initializationPromise.current) {
      return;
    } // Prevent multiple initialization attempts
    initializationPromise.current = (async () => {
      try {
        // Get the correct owner ID (could be from URL for public spaces)
        const ownerUserId = window.currentSpaceOwner || user?.uid;

        if (!ownerUserId) {
          return;
        } // Discover existing cells that contain objects
        const existingCells = await getOccupiedCells(
          ownerUserId,
          currentSpaceId
        ); // Get initial camera position and load neighbor cells
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
        );

        // Debug: Log all cells that should be loaded

        // Combine existing occupied cells and initial camera radius cells
        const cellsToLoad = new Set();
        existingCells.forEach((cellId) => cellsToLoad.add(cellId)); // Add initial camera radius cells
        for (const cellCoords of initialCells) {
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
          cellsToLoad.add(cellId);
        }

        // Convert Set to array of coordinates and load all cells in parallel
        const cellCoordsToLoad = initialCells.filter((cellCoords) => {
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
          return !existingCells.includes(cellId); // Only load cells that don't already exist
        });

        if (cellCoordsToLoad.length > 0) {
          await loadCellsBatch(cellCoordsToLoad);
        }

        if (existingCells.length > 0 || initialCells.length > 0) {
          setLoadedCells(cellsToLoad);
          setCurrentCellCoords({ x: 0, y: 0, z: 0 });
          setIsInitialized(true);
        }
      } catch {
        // Error during initialization - continue silently
      }
    })();

    return initializationPromise.current;
  }, [user, currentSpaceId, isInitialized, cameraRef, loadCellsBatch]);

  /**
   * Load a single cell (kept for backward compatibility)
   */
  const loadCell = useCallback(
    async (cellX, cellY, cellZ = 0) => {
      const results = await loadCellsBatch([{ x: cellX, y: cellY, z: cellZ }]);
      return results[0]?.success || false;
    },
    [loadCellsBatch]
  );
  /**
   * Unload multiple cells in batch for better performance
   */
  const unloadCellsBatch = useCallback(
    (cellIds, onObjectsChange) => {
      if (!cellIds?.length) return;

      const cellsToRemove = cellIds.filter((cellId) => loadedCells.has(cellId));

      if (cellsToRemove.length > 0) {
        // Notify about objects that should be removed
        if (onObjectsChange && objectsByCellRef.current.size > 0) {
          const objectsToRemove = [];

          cellsToRemove.forEach((cellId) => {
            const cellObjects = objectsByCellRef.current.get(cellId);

            if (cellObjects) {
              objectsToRemove.push(...Array.from(cellObjects));
              objectsByCellRef.current.delete(cellId);
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

        setLoadedCells((prev) => {
          const newSet = new Set(prev);
          cellsToRemove.forEach((cellId) => newSet.delete(cellId));
          return newSet;
        });
      }
    },
    [loadedCells]
  );
  /**
   * Update camera position and manage cell loading with predictive loading
   */
  const updateCameraPosition = useCallback(
    async (position) => {
      if (!isInitialized || !currentSpaceId) return;

      // Throttle position updates to improve performance
      const now = Date.now();
      if (now - lastUpdateTime.current < POSITION_UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTime.current = now;

      // Convert position to array if it's a Vector3
      const posArray = Array.isArray(position)
        ? position
        : [position.x, position.y, position.z];

      // Calculate camera velocity for predictive loading
      const [lastX, lastY, lastZ] = lastCameraPosition.current;
      const [newX, newY, newZ] = posArray;
      const timeDelta = POSITION_UPDATE_THROTTLE / 1000; // Convert to seconds

      const currentVelocity = [
        (newX - lastX) / timeDelta,
        (newY - lastY) / timeDelta,
        (newZ - lastZ) / timeDelta,
      ];

      // Update velocity (with smoothing)
      const smoothing = 0.3;
      cameraVelocity.current = [
        cameraVelocity.current[0] * (1 - smoothing) +
          currentVelocity[0] * smoothing,
        cameraVelocity.current[1] * (1 - smoothing) +
          currentVelocity[1] * smoothing,
        cameraVelocity.current[2] * (1 - smoothing) +
          currentVelocity[2] * smoothing,
      ];

      const distance = Math.sqrt(
        Math.pow(newX - lastX, 2) +
          Math.pow(newY - lastY, 2) +
          Math.pow(newZ - lastZ, 2)
      );

      // Check if this is the first position update (initial camera position)
      const isFirstUpdate = lastX === 0 && lastY === 0 && lastZ === 0; // Only update if camera moved more than 25 units OR this is the first update
      if (distance < 25 && !isFirstUpdate) return;

      lastCameraPosition.current = posArray;

      // Get current cell coordinates
      const newCellCoords = getCellCoordinates(posArray);

      // Update current cell if changed
      if (
        newCellCoords.x !== currentCellCoords.x ||
        newCellCoords.y !== currentCellCoords.y ||
        newCellCoords.z !== currentCellCoords.z
      ) {
        setCurrentCellCoords(newCellCoords);
      }

      // PRIORITY 1: Unload distant cells FIRST (non-blocking)
      const cellsToUnload = getCellsToUnload(
        posArray,
        Array.from(loadedCells),
        CELL_UNLOAD_DISTANCE
      );

      if (cellsToUnload.length > 0) {
        unloadCellsBatch(cellsToUnload, onObjectsChange);
      } // PRIORITY 2: Load immediate neighbor cells (non-blocking, fire-and-forget)
      const neighborCells = getNeighborCells(posArray, CELL_NEIGHBOR_RADIUS);
      const cellsToLoad = neighborCells.filter((cellCoords) => {
        const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
        return !loadedCells.has(cellId);
      });

      // Add cooldown check to prevent rapid successive cell loading
      const timeSinceLastLoad = now - lastCellLoadTime.current;
      const shouldLoadCells =
        cellsToLoad.length > 0 && timeSinceLastLoad >= CELL_LOAD_COOLDOWN;

      // PRIORITY 3: Predictive loading based on camera movement direction
      const predictiveCells = [];
      const speed = Math.sqrt(
        Math.pow(cameraVelocity.current[0], 2) +
          Math.pow(cameraVelocity.current[2], 2) // Only X and Z for horizontal movement
      );
      // Only do predictive loading if camera is moving fast enough but not too fast
      if (speed > 500 && speed < 2000) {
        // Added upper limit to prevent loading during rapid movements
        const direction = [
          cameraVelocity.current[0] / speed,
          0, // Keep Y the same
          cameraVelocity.current[2] / speed,
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
            !loadedCells.has(cellId) &&
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
      } // Load immediate cells first, then predictive cells with lower priority
      if (shouldLoadCells) {
        lastCellLoadTime.current = now; // Update the last load time
        loadCellsBatch(cellsToLoad).catch((error) => {
          console.error('❌ Error in background cell loading:', error);
        });
      }

      // Load predictive cells with delay to not interfere with immediate loading
      if (predictiveCells.length > 0) {
        setTimeout(() => {
          loadCellsBatch(predictiveCells).catch((error) => {
            console.error('❌ Error in predictive cell loading:', error);
          });
        }, 500); // 500ms delay for predictive loading
      }
    },
    [
      isInitialized,
      currentSpaceId,
      currentCellCoords,
      loadedCells,
      loadCellsBatch,
      unloadCellsBatch,
      onObjectsChange,
    ]
  );
  /**
   * Add an object to the appropriate cell
   */
  const addObjectToSpatialSystem = useCallback(
    async (objectId, position) => {
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
    [user, currentSpaceId]
  );
  /**
   * Move an object between cells when its position changes
   */
  const moveObjectInSpatialSystem = useCallback(
    async (objectId, oldPosition, newPosition, objectDataFull) => {
      // Added objectDataFull for clarity
      console.log(
        '[SpatialManagerDebug] moveObjectInSpatialSystem ENTER.',
        `ObjectId: ${objectId}`,
        `OldPos: ${JSON.stringify(oldPosition)}`,
        `NewPos: ${JSON.stringify(newPosition)}`,
        `FullObjectData:`,
        objectDataFull
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

        // IMPORTANT: The decision to call moveObjectBetweenCells vs. updateObjectInCell
        // should ideally happen here or be passed as a flag if this function is a generic update handler.
        // For now, we assume it's always a potential move if oldPosition and newPosition are provided.

        // The objectData to pass to moveObjectBetweenCells should be the full object data if available,
        // or at least { id: objectId, position: newPosition }.
        // The `objectDataFull` parameter is assumed to be the complete data of the object being moved.
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
    [user, currentSpaceId] // Dependencies
  );
  /**
   * Get cell coordinates for a position
   */
  const getCellForPosition = useCallback((position) => {
    return getCellCoordinates(position);
  }, []);

  // Initialize spatial system when dependencies are ready
  useEffect(() => {
    if (currentSpaceId && !isInitialized) {
      initializeSpatialSystem();
    }
  }, [currentSpaceId, isInitialized, initializeSpatialSystem]);
  // Track camera position with optimized frequency and movement detection
  useEffect(() => {
    if (!cameraRef?.current?.camera || !isInitialized) return;

    const camera = cameraRef.current.camera;
    let animationId;
    let lastCheckTime = 0;
    let lastPosition = { x: 0, y: 0, z: 0 };
    const CAMERA_CHECK_INTERVAL = 500; // Increased from 200ms to 500ms to reduce Firebase requests
    const MOVEMENT_THRESHOLD = 200; // Increased from 100 to 200 units to reduce cell transitions

    const trackCameraPosition = () => {
      const now = Date.now();

      if (now - lastCheckTime >= CAMERA_CHECK_INTERVAL) {
        if (camera && camera.position) {
          const currentPos = camera.position;

          // Calculate movement distance
          const distance = Math.sqrt(
            Math.pow(currentPos.x - lastPosition.x, 2) +
              Math.pow(currentPos.y - lastPosition.y, 2) +
              Math.pow(currentPos.z - lastPosition.z, 2)
          );

          // Only update if movement is significant
          if (distance >= MOVEMENT_THRESHOLD) {
            updateCameraPosition(currentPos);
            lastPosition = {
              x: currentPos.x,
              y: currentPos.y,
              z: currentPos.z,
            };
          }
        }
        lastCheckTime = now;
      }

      animationId = requestAnimationFrame(trackCameraPosition);
    };

    // Start tracking
    trackCameraPosition();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [cameraRef, isInitialized, updateCameraPosition]);
  // Cleanup subscriptions when component unmounts
  useEffect(() => {
    const subscriptions = cellSubscriptions.current;
    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      subscriptions.clear();
    };
  }, []); // Convert loadedCells Set to Array for consumers with stable reference
  const loadedCellsArray = useMemo(() => {
    const cellsArray = Array.from(loadedCells || new Set()).sort();
    return cellsArray;
  }, [loadedCells]);
  return {
    // State
    loadedCells: loadedCellsArray, // Always return as array
    currentCellCoords: currentCellCoords || { x: 0, y: 0 },
    isInitialized: isInitialized || false,

    // Methods
    addObjectToSpatialSystem,
    moveObjectInSpatialSystem,
    getCellForPosition,
    loadCell,
    updateCameraPosition,

    // Object tracking methods for cell integration
    trackObjectInCell,
    untrackObjectInCell,
  };
};
