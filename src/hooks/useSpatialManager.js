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

    console.log('🔧 useSpatialManager init effect:', {
      currentSpaceId,
      isInitialized,
      user: !!user,
      hasCamera: !!cameraRef,
      currentSpaceOwner,
      isPublicSpace,
      needsOwner,
      canInit: currentSpaceId && !isInitialized && !needsOwner,
    });

    if (currentSpaceId && !isInitialized && !needsOwner) {
      console.log('🚀 Initializing spatial system with:', {
        userId: user?.uid,
        spaceOwner: currentSpaceOwner,
        spaceId: currentSpaceId,
      });
      initializeSpatialSystem(user, currentSpaceId, cameraRef);
    }
  }, [
    currentSpaceId,
    currentSpaceOwner,
    isInitialized,
    initializeSpatialSystem,
    user,
    cameraRef,
  ]);

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
            updateCameraPosition(
              currentPos,
              user,
              currentSpaceId,
              onObjectsChange
            );
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
  }, [
    cameraRef,
    isInitialized,
    updateCameraPosition,
    user,
    currentSpaceId,
    onObjectsChange,
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
