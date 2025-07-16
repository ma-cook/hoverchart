import { useEffect, useRef } from 'react';
import { useObjectsStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';

/**
 * Custom hook to manage objects state and operations
 * Migrated to use Zustand store for state management
 */
export function useObjects({ user, currentSpaceId, cameraRef }) {
  const {
    selectedId,
    setSelectedId,
    objects,
    initializeObjectsLoading,
    handleCreateObject: storeHandleCreateObject,
    handleObjectDelete: storeHandleObjectDelete,
    addTransformingObject,
    removeTransformingObject,
    setTransformPosition,
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
    // Get connections from the connection store
    const connections = useConnectionStore.getState().connections;

    storeHandleObjectDelete(id, user, currentSpaceId, connections);
  };

  const registerTransformingObject = (id, isTransforming, position) => {
    if (isTransforming) {
      addTransformingObject(id);
      if (position) {
        setTransformPosition(id, position);
      }
    } else {
      removeTransformingObject(id);
    }
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
  };
}
