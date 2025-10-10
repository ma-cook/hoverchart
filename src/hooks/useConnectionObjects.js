import { useMemo } from 'react';
import useObjectsStore from '../stores/objectsStore';

// Custom equality function for position tracking
// Only returns true if position/scale/type haven't changed
const objectPositionEquals = (prev, next) => {
  if (!prev && !next) return true;
  if (!prev || !next) return false;

  return (
    prev.id === next.id &&
    prev.position?.[0] === next.position?.[0] &&
    prev.position?.[1] === next.position?.[1] &&
    prev.position?.[2] === next.position?.[2] &&
    prev.scale?.[0] === next.scale?.[0] &&
    prev.scale?.[1] === next.scale?.[1] &&
    prev.scale?.[2] === next.scale?.[2] &&
    prev.type === next.type
  );
};

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
 * PERFORMANCE OPTIMIZED: Only triggers re-render when THIS connection's objects move
 * Uses custom equality to compare position/scale values, not references
 * This prevents all 300+ connections from recalculating when any object moves
 */
export const useConnectionObjectPositions = (startObjectId, endObjectId) => {
  // Select ONLY the start object with custom equality checking
  const startObject = useObjectsStore(
    (state) => {
      if (!startObjectId || !state.objects) return null;
      const obj = state.objects.find(
        (obj) => obj.id?.toString() === startObjectId.toString()
      );
      if (!obj) return null;
      // Return only position-critical properties
      return {
        id: obj.id,
        position: obj.position,
        scale: obj.scale,
        type: obj.type,
      };
    },
    objectPositionEquals // Custom deep equality for position arrays
  );

  // Select ONLY the end object with custom equality checking
  const endObject = useObjectsStore(
    (state) => {
      if (!endObjectId || !state.objects) return null;
      const obj = state.objects.find(
        (obj) => obj.id?.toString() === endObjectId.toString()
      );
      if (!obj) return null;
      // Return only position-critical properties
      return {
        id: obj.id,
        position: obj.position,
        scale: obj.scale,
        type: obj.type,
      };
    },
    objectPositionEquals // Custom deep equality for position arrays
  );

  return {
    startObject,
    endObject,
  };
};

export default useConnectionObjects;
