import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false); // Refs for tracking
  const lastCameraPosition = useRef([0, 0, 0]);
  const cellSubscriptions = useRef(new Map());
  const initializationPromise = useRef(null);
  const lastUpdateTime = useRef(0);
  const loadingCellsRef = useRef(new Set()); // Track cells currently being loaded
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
    console.log(`📍 Tracked object ${objIdStr} in cell ${cellId}`);
    console.log(
      `📊 Total tracking state:`,
      Object.fromEntries(objectsByCellRef.current)
    );
  }, []);
  /**
   * Remove object from cell tracking
   */
  const untrackObjectInCell = useCallback((objectId, cellId) => {
    const objIdStr = objectId.toString();
    const cellObjects = objectsByCellRef.current.get(cellId);
    if (cellObjects) {
      cellObjects.delete(objIdStr);
      console.log(`📍 Untracked object ${objIdStr} from cell ${cellId}`);
      if (cellObjects.size === 0) {
        objectsByCellRef.current.delete(cellId);
        console.log(`📍 Removed empty cell ${cellId} from tracking`);
      }
    }
  }, []);

  const POSITION_UPDATE_THROTTLE = 100; // Only update every 100ms

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
        console.log(
          `⏳ Skipping cell loading - too many concurrent operations (${currentlyLoading}/${MAX_CONCURRENT_LOADS})`
        );
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
        console.log(
          `🚀 Batch creating ${cellsToLoadNow.length} cells (${loadingCellsRef.current.size} total loading)...`
        );
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
          console.log(
            `✅ Successfully loaded ${newCellIds.length} cells in batch`
          );
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
        console.log(
          `Loading ${initialCells.length} neighbor cells within radius ${CELL_NEIGHBOR_RADIUS} from camera position:`,
          initialCameraPosition
        );

        // Debug: Log all cells that should be loaded
        console.log('Detailed neighbor cells to load:');
        initialCells.forEach((cell, index) => {
          console.log(
            `  ${index + 1}. Cell (${cell.x}, ${cell.y}, ${
              cell.z
            }) -> ID: ${getCellId(cell.x, cell.y, cell.z)}`
          );
        }); // Combine existing occupied cells and initial camera radius cells
        const cellsToLoad = new Set();
        existingCells.forEach((cellId) => cellsToLoad.add(cellId)); // Add initial camera radius cells
        for (const cellCoords of initialCells) {
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
          cellsToLoad.add(cellId);
          console.log(`Adding cell ${cellId} to load set`);
        }

        // Convert Set to array of coordinates and load all cells in parallel
        const cellCoordsToLoad = initialCells.filter((cellCoords) => {
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
          return !existingCells.includes(cellId); // Only load cells that don't already exist
        });

        if (cellCoordsToLoad.length > 0) {
          console.log(
            `🚀 Batch loading ${cellCoordsToLoad.length} cells during initialization...`
          );
          await loadCellsBatch(cellCoordsToLoad);
        }

        console.log('Final cellsToLoad set:', Array.from(cellsToLoad));
        console.log(
          `Total cells loaded during initialization: ${cellsToLoad.size}`
        );
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
          console.log(`🔍 Checking cells for unloading:`, cellsToRemove);
          console.log(
            `🔍 Current object tracking:`,
            Object.fromEntries(objectsByCellRef.current)
          );

          cellsToRemove.forEach((cellId) => {
            const cellObjects = objectsByCellRef.current.get(cellId);
            console.log(
              `🔍 Cell ${cellId} has objects:`,
              cellObjects ? Array.from(cellObjects) : 'none'
            );
            if (cellObjects) {
              objectsToRemove.push(...Array.from(cellObjects));
              objectsByCellRef.current.delete(cellId);
            }
          });
          if (objectsToRemove.length > 0) {
            console.log(
              `🧹 Removing ${objectsToRemove.length} objects from unloaded cells:`,
              objectsToRemove
            );
            objectsToRemove.forEach((objectId) => {
              onObjectsChange({
                type: 'removed',
                id: objectId.toString(),
                source: 'cell-unload',
              });
            });
          } else {
            console.log(
              `⚠️ No objects found to remove despite having tracking data`
            );
          }
        } else {
          console.log(
            `⚠️ No object tracking or onObjectsChange callback available`
          );
        }

        setLoadedCells((prev) => {
          const newSet = new Set(prev);
          cellsToRemove.forEach((cellId) => newSet.delete(cellId));
          return newSet;
        });
        console.log(
          `🗑️ Unloaded ${cellsToRemove.length} cells in batch:`,
          cellsToRemove
        );
      }
    },
    [loadedCells]
  );
  /**
   * Update camera position and manage cell loading
   */ const updateCameraPosition = useCallback(
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

      // Check if camera has moved significantly (avoid excessive updates)
      const [lastX, lastY, lastZ] = lastCameraPosition.current;
      const [newX, newY, newZ] = posArray;
      const distance = Math.sqrt(
        Math.pow(newX - lastX, 2) +
          Math.pow(newY - lastY, 2) +
          Math.pow(newZ - lastZ, 2)
      );

      // Check if this is the first position update (initial camera position)
      const isFirstUpdate = lastX === 0 && lastY === 0 && lastZ === 0;

      // Only update if camera moved more than 10 units OR this is the first update
      if (distance < 10 && !isFirstUpdate) return;

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
        console.log(`🗑️ Unloading ${cellsToUnload.length} distant cells...`);
        unloadCellsBatch(cellsToUnload, onObjectsChange);
      }

      // PRIORITY 2: Load new cells (non-blocking, fire-and-forget)
      const neighborCells = getNeighborCells(posArray, CELL_NEIGHBOR_RADIUS);
      const cellsToLoad = neighborCells.filter((cellCoords) => {
        const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
        return !loadedCells.has(cellId);
      });

      if (cellsToLoad.length > 0) {
        console.log(
          `📦 Loading ${cellsToLoad.length} cells in parallel (non-blocking)...`
        );
        // Use fire-and-forget loading - don't await
        loadCellsBatch(cellsToLoad).catch((error) => {
          console.error('❌ Error in background cell loading:', error);
        });
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
    async (objectId, oldPosition, newPosition) => {
      if (!currentSpaceId || !objectId || !oldPosition || !newPosition)
        return false;

      try {
        // Get the correct owner ID
        const ownerUserId = window.currentSpaceOwner || user?.uid;
        if (!ownerUserId) {
          return false;
        }

        return await moveObjectBetweenCells(
          ownerUserId,
          currentSpaceId,
          objectId,
          oldPosition,
          newPosition
        );
      } catch {
        return false;
      }
    },
    [user, currentSpaceId]
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

  // Track camera position
  useEffect(() => {
    if (!cameraRef?.current?.camera || !isInitialized) return;

    const camera = cameraRef.current.camera;
    let animationId;
    const trackCameraPosition = () => {
      if (camera && camera.position) {
        updateCameraPosition(camera.position);
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
