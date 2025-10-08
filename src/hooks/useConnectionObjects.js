import { useMemo } from 'react';
import useObjectsStore from '../stores/objectsStore';

/**
 * Hook that selects only the object data needed for a specific connection
 * This prevents unnecessary re-renders when unrelated objects change
 */
export const useConnectionObjects = (connection) => {
  const objects = useObjectsStore((state) => state.objects);

  return useMemo(() => {
    if (!connection || !objects || objects.length === 0) {
      return {
        startObject: null,
        endObject: null,
        allObjects: [],
      };
    }

    const startObjectId = connection.start?.objectId?.toString();
    const endObjectId = connection.end?.objectId?.toString();

    const startObject = startObjectId
      ? objects.find((obj) => obj.id.toString() === startObjectId)
      : null;

    const endObject = endObjectId
      ? objects.find((obj) => obj.id.toString() === endObjectId)
      : null;

    // For pathfinding, we need all objects for intersection testing
    // but we'll create a minimal representation to reduce re-render triggers
    const allObjects = objects.map((obj) => ({
      id: obj.id,
      position: obj.position,
      scale: obj.scale,
      type: obj.type,
      faceSize: obj.faceSize,
    }));

    return {
      startObject,
      endObject,
      allObjects,
    };
  }, [connection?.start?.objectId, connection?.end?.objectId, objects]);
};

/**
 * Hook that gets pathfinding object data
 * Returns a memoized array of objects for intersection calculations
 */
export const usePathfindingObjects = () => {
  const objects = useObjectsStore((state) => state.objects);

  return useMemo(() => {
    if (!objects || objects.length === 0) return [];

    return objects.map((obj) => ({
      id: obj.id,
      position: obj.position,
      scale: obj.scale || [1, 1, 1],
      type: obj.type,
      faceSize: obj.faceSize,
    }));
  }, [objects]);
};

/**
 * More granular hook that only watches specific object positions
 * Now uses a separate pathfinding hook to reduce re-renders
 */
export const useConnectionObjectPositions = (startObjectId, endObjectId) => {
  // Get only the specific objects we need for this connection
  const startObject = useObjectsStore((state) => {
    if (!startObjectId || !state.objects) return null;
    return (
      state.objects.find(
        (obj) => obj.id.toString() === startObjectId.toString()
      ) || null
    );
  });

  const endObject = useObjectsStore((state) => {
    if (!endObjectId || !state.objects) return null;
    return (
      state.objects.find(
        (obj) => obj.id.toString() === endObjectId.toString()
      ) || null
    );
  });

  return {
    startObject,
    endObject,
  };
};

export default useConnectionObjects;
