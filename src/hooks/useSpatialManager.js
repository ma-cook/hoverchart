import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getCellCoordinates,
  getCellId,
  getAdjacentCellsToLoad,
  createCell,
  cellExists,
  addObjectToCell,
  moveObjectBetweenCells,
  getOccupiedCells,
  getCellsToUnload,
  CELL_LOAD_DISTANCE,
  CELL_UNLOAD_DISTANCE,
} from '../services/spatialPartitioning';

/**
 * Hook to manage spatial partitioning and camera-based cell loading
 */
export const useSpatialManager = ({ user, currentSpaceId, cameraRef }) => {
  const [loadedCells, setLoadedCells] = useState(new Set());
  const [currentCellCoords, setCurrentCellCoords] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for tracking
  const lastCameraPosition = useRef([0, 0, 0]);
  const cellSubscriptions = useRef(new Map());
  const initializationPromise = useRef(null);
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
        );

        // Always ensure the origin cell exists
        const originCellSuccess = await createCell(
          ownerUserId,
          currentSpaceId,
          0,
          0,
          0
        );

        // Combine origin cell with existing occupied cells
        const cellsToLoad = new Set(['0,0,0']); // Always start with origin        existingCells.forEach((cellId) => cellsToLoad.add(cellId));

        if (originCellSuccess || existingCells.length > 0) {
          setLoadedCells(cellsToLoad);
          setCurrentCellCoords({ x: 0, y: 0, z: 0 });
          setIsInitialized(true);
        }
      } catch (error) {
        // Error during initialization - continue silently
      }
    })();

    return initializationPromise.current;
  }, [user, currentSpaceId, isInitialized]);
  /**
   * Load a cell and its objects
   */
  const loadCell = useCallback(
    async (cellX, cellY, cellZ = 0) => {
      if (!currentSpaceId) return false;

      const cellId = getCellId(cellX, cellY, cellZ);

      // Skip if already loaded
      if (loadedCells.has(cellId)) {
        return true;
      }

      try {
        // Get the correct owner ID
        const ownerUserId = window.currentSpaceOwner || user?.uid;
        if (!ownerUserId) {
          return false;
        }

        // Check if cell exists, create if it doesn't
        const exists = await cellExists(
          ownerUserId,
          currentSpaceId,
          cellX,
          cellY,
          cellZ
        );
        if (!exists) {
          const created = await createCell(
            ownerUserId,
            currentSpaceId,
            cellX,
            cellY,
            cellZ
          );
          if (!created) {
            return false;
          }
        }
        // Add to loaded cells
        setLoadedCells((prev) => new Set([...prev, cellId]));
        return true;
      } catch {
        // Error loading cell
        return false;
      }
    },
    [user, currentSpaceId, loadedCells]
  );

  /**
   * Unload a cell that's too far from the camera
   */
  const unloadCell = useCallback(
    (cellId) => {
      if (!loadedCells.has(cellId)) {
        return false; // Cell not loaded
      }

      try {
        // Remove from loaded cells
        setLoadedCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellId);
          return newSet;
        });

        return true;
      } catch {
        return false;
      }
    },
    [loadedCells]
  );

  /**
   * Update camera position and manage cell loading
   */
  const updateCameraPosition = useCallback(
    async (position) => {
      if (!isInitialized || !currentSpaceId) return;

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

      // Only update if camera moved more than 10 units
      if (distance < 10) return;

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

      // Check if we need to load adjacent cells
      const adjacentCells = getAdjacentCellsToLoad(
        posArray,
        CELL_LOAD_DISTANCE
      );

      // Load current cell if not loaded
      const currentCellId = getCellId(
        newCellCoords.x,
        newCellCoords.y,
        newCellCoords.z
      );

      if (!loadedCells.has(currentCellId)) {
        await loadCell(newCellCoords.x, newCellCoords.y, newCellCoords.z);
      }

      // Load adjacent cells that should be loaded
      for (const cellCoords of adjacentCells) {
        const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
        if (!loadedCells.has(cellId)) {
          await loadCell(cellCoords.x, cellCoords.y, cellCoords.z);
        }
      }

      // Unload cells that are too far away
      const cellsToUnload = getCellsToUnload(
        posArray,
        Array.from(loadedCells),
        CELL_UNLOAD_DISTANCE
      );

      for (const cellId of cellsToUnload) {
        unloadCell(cellId);
      }
    },
    [
      isInitialized,
      currentSpaceId,
      currentCellCoords,
      loadedCells,
      loadCell,
      unloadCell,
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
  };
};
