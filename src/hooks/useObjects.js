import { useEffect, useRef } from 'react';
import { useObjectsStore } from '../stores';

/**
 * Custom hook to manage objects state and operations
 * Migrated to use Zustand store for state management
 */
export function useObjects({
  user,
  currentSpaceId,
  cameraRef,
  connections,
  setConnections,
}) {
  const {
    selectedId,
    setSelectedId,
    objects,
    initializeObjectsLoading,
    handleCreateObject: storeHandleCreateObject,
    handleObjectDelete: storeHandleObjectDelete,
    registerTransformingObject: storeRegisterTransformingObject,
    checkPositionJitter,
    getTransformStartPosition,
    // Internal refs equivalent
    draggingObjects,
    transformingObjects,
  } = useObjectsStore();

  // Create stable refs that won't cause useEffect dependency cycles
  const lastUpdateRef = useRef({});
  const draggingObjectsRef = useRef(new Set());
  const transformingObjectsRef = useRef(new Set());

  // Initialize objects loading state when objects change
  useEffect(() => {
    if (objects && objects.length > 0) {
      initializeObjectsLoading();
    }
  }, [objects, initializeObjectsLoading]);

  // NOTE: Removed periodic saving - objects are now saved immediately when modified
  // This is more efficient and prevents unnecessary database writes
  // Wrapper functions to maintain backward compatibility
  const handleCreateObject = (type, position = null, extraData = {}) => {
    storeHandleCreateObject(
      type,
      position,
      user,
      currentSpaceId,
      cameraRef,
      extraData
    );
  };

  const handleObjectDelete = (id) => {
    storeHandleObjectDelete(
      id,
      user,
      currentSpaceId,
      connections,
      setConnections
    );
  };

  const registerTransformingObject = (id, isTransforming, position) => {
    storeRegisterTransformingObject(
      id,
      isTransforming,
      position,
      connections,
      setConnections,
      user,
      currentSpaceId
    );
  };
  // Update refs with current store values
  draggingObjectsRef.current = draggingObjects;
  transformingObjectsRef.current = transformingObjects;

  return {
    selectedId,
    setSelectedId,
    handleCreateObject,
    handleObjectDelete,
    lastUpdateRef,
    draggingObjectsRef,
    registerTransformingObject,
    transformingObjectsRef,
    getTransformStartPosition,
    checkPositionJitter,
  };
}
