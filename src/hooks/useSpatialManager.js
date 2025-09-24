import { useEffect, useMemo } from 'react';
import { useSpatialManagerStore } from '../stores';

/**
 * Hook to manage spatial partitioning and camera-based cell loading
 * Migrated to use Zustand store for state management
 */
export const useSpatialManager = ({
  user,
  currentSpaceId,
  currentSpaceOwner,
  cameraRef,
  onObjectsChange,
}) => {
  const {
    isInitialized,
    loadedCells: loadedCellsSet,
    currentCellCoords,
    initializeSpatialSystem,
    updateCameraPosition,
    addObjectToSpatialSystem,
    moveObjectInSpatialSystem,
    getCellForPosition,
    loadCell,
    trackObjectInCell,
    untrackObjectInCell,
  } = useSpatialManagerStore();
  // Memoize the loaded cells array to prevent constant re-renders
  // Only change when the Set contents actually change
  const loadedCellsKey = useMemo(() => {
    if (!loadedCellsSet || loadedCellsSet.size === 0) {
      return '';
    }
    return Array.from(loadedCellsSet).sort().join(',');
  }, [loadedCellsSet]);
  const memoizedLoadedCells = useMemo(() => {
    if (!loadedCellsSet || loadedCellsSet.size === 0) {
      return [];
    }
    return Array.from(loadedCellsSet).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCellsKey]);
  // Initialize spatial system when dependencies are ready
  useEffect(() => {
    // For public spaces, we need the owner to be resolved before initializing
    const isPublicSpace = !user && currentSpaceId;
    const needsOwner = isPublicSpace && !currentSpaceOwner;

    if (currentSpaceId && !isInitialized && !needsOwner) {
      initializeSpatialSystem(user, currentSpaceId, cameraRef);

      // Force initial camera position update after initialization
      if (cameraRef?.current?.camera) {
        const pos = cameraRef.current.camera.position;
        updateCameraPosition(
          { x: pos.x, y: pos.y, z: pos.z },
          user,
          currentSpaceId,
          onObjectsChange
        );
      }
    }
  }, [
    currentSpaceId,
    currentSpaceOwner,
    isInitialized,
    initializeSpatialSystem,
    user,
    cameraRef,
    onObjectsChange,
    updateCameraPosition,
  ]);

  // Track camera position for cell loading
  useEffect(() => {
    if (!isInitialized || !currentSpaceId) return;

    let cleanup = () => {};
    let retryCount = 0;
    const maxRetries = 10;

    const setupCameraListeners = () => {
      if (!cameraRef?.current?.camera || !cameraRef?.current?.orbitControls) {
        if (retryCount < maxRetries) {
          retryCount++;

          setTimeout(setupCameraListeners, 100);
        } else {
          console.error(
            '❌ Failed to set up camera listeners after max retries'
          );
        }
        return;
      }

      const camera = cameraRef.current.camera;
      const controls = cameraRef.current.orbitControls;
      let lastCellCoords = null;
      let debounceTimer = null;

      const handleCameraMove = () => {
        const currentPos = camera.position;
        const currentCellCoords = getCellForPosition([
          currentPos.x,
          currentPos.y,
          currentPos.z,
        ]);

        // Only trigger update when crossing cell boundaries
        if (
          !lastCellCoords ||
          currentCellCoords.x !== lastCellCoords.x ||
          currentCellCoords.y !== lastCellCoords.y ||
          currentCellCoords.z !== lastCellCoords.z
        ) {
          // Clear any existing debounce timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          // Call immediately without debounce
          updateCameraPosition(
            { x: currentPos.x, y: currentPos.y, z: currentPos.z },
            user,
            currentSpaceId,
            onObjectsChange
          );

          lastCellCoords = currentCellCoords;
        }
      };

      // Set up event handlers for camera movement
      controls.addEventListener('change', handleCameraMove);

      // Force initial position update
      handleCameraMove();

      cleanup = () => {
        if (controls) {
          controls.removeEventListener('change', handleCameraMove);
        }
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
      };
    };

    // Start the setup process
    setupCameraListeners();

    return () => cleanup();
  }, [
    cameraRef,
    isInitialized,
    updateCameraPosition,
    user,
    currentSpaceId,
    onObjectsChange,
    getCellForPosition,
  ]);

  // Wrapper functions to maintain backward compatibility
  const addObjectToSpatialSystemWrapper = (objectId, position) => {
    return addObjectToSpatialSystem(objectId, position, user, currentSpaceId);
  };

  const moveObjectInSpatialSystemWrapper = (
    objectId,
    oldPosition,
    newPosition,
    objectDataFull
  ) => {
    return moveObjectInSpatialSystem(
      objectId,
      oldPosition,
      newPosition,
      objectDataFull,
      user,
      currentSpaceId
    );
  };

  const loadCellWrapper = (cellX, cellY, cellZ = 0) => {
    return loadCell(cellX, cellY, cellZ, user, currentSpaceId);
  };
  const updateCameraPositionWrapper = (position) => {
    return updateCameraPosition(
      position,
      user,
      currentSpaceId,
      onObjectsChange
    );
  };

  return {
    // State
    loadedCells: memoizedLoadedCells, // Use memoized array to prevent constant re-renders
    currentCellCoords: currentCellCoords || { x: 0, y: 0 },
    isInitialized: isInitialized || false,

    // Methods
    addObjectToSpatialSystem: addObjectToSpatialSystemWrapper,
    moveObjectInSpatialSystem: moveObjectInSpatialSystemWrapper,
    getCellForPosition,
    loadCell: loadCellWrapper,
    updateCameraPosition: updateCameraPositionWrapper,

    // Object tracking methods for cell integration
    trackObjectInCell,
    untrackObjectInCell,
  };
};
