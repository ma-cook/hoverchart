import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useObjectsStore from '../stores/objectsStore';

// Module-level equality — avoids re-creating identical comparator per render per connection
const objectPositionEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return (
    a.id === b.id &&
    a.position?.[0] === b.position?.[0] &&
    a.position?.[1] === b.position?.[1] &&
    a.position?.[2] === b.position?.[2] &&
    a.scale?.[0] === b.scale?.[0] &&
    a.scale?.[1] === b.scale?.[1] &&
    a.scale?.[2] === b.scale?.[2] &&
    a.type === b.type
  );
};

/**
 * Hook that selects only the object data needed for a specific connection
 * This prevents unnecessary re-renders when unrelated objects change
 */
export const useConnectionObjects = (connection) => {
  const objects = useObjectsStore((state) => state.objects, shallow);

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
  const objects = useObjectsStore((state) => state.objects, shallow);

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
 * Uses shallow comparison to prevent unnecessary re-renders
 * This prevents all 300+ connections from recalculating when any object moves
 */
export const useConnectionObjectPositions = (startObjectId, endObjectId) => {
  // Select ONLY the start object with shallow equality checking
  // PERFORMANCE: Return the object directly instead of creating a new object
  // The shallow comparison will compare the object's properties
  const startObject = useObjectsStore((state) => {
    if (!startObjectId || !state.objects) return null;
    return state.objects.find(
      (obj) => obj.id?.toString() === startObjectId.toString()
    ) || null;
  }, objectPositionEqual);

  // Select ONLY the end object with custom equality checking
  const endObject = useObjectsStore((state) => {
    if (!endObjectId || !state.objects) return null;
    return state.objects.find(
      (obj) => obj.id?.toString() === endObjectId.toString()
    ) || null;
  }, objectPositionEqual);

  return {
    startObject,
    endObject,
  };
};

export default useConnectionObjects;
