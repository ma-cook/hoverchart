import { useEffect, useRef } from 'react';
import {
  useConnectionStore,
  useObjectsStore,
  useSpatialManagerStore,
} from '../stores';
import { calculateFacePosition } from '../utils/facePositionUtils';

/**
 * Simplified component that updates connection positions in real-time as objects move
 * No unnecessary throttling or bulk operations for single object movements
 */
const RealTimeConnectionUpdater = () => {
  const updateConnections = useConnectionStore(
    (state) => state.updateConnections
  );
  const connections = useConnectionStore((state) => state.connections);
  const objects = useObjectsStore((state) => state.objects);
  const { isInitialized } = useSpatialManagerStore();

  // Track previous object positions to detect changes
  const previousPositionsRef = useRef(new Map());

  // Map of object -> connections for quick lookup
  const objectConnectionsRef = useRef(new Map());

  // Add throttling to prevent excessive updates
  const lastUpdateTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // Store current connections in a ref to avoid infinite loops
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Build object-to-connections mapping when connections change
  useEffect(() => {
    if (!isInitialized) return;

    const objectConnMap = new Map();
    const currentConnections = connectionsRef.current;

    currentConnections.forEach((conn) => {
      // Map start object to this connection
      if (conn.start?.objectId) {
        const startId = conn.start.objectId.toString();
        if (!objectConnMap.has(startId)) {
          objectConnMap.set(startId, []);
        }
        objectConnMap
          .get(startId)
          .push({ connection: conn, endpoint: 'start' });
      }

      // Map end object to this connection
      if (conn.end?.objectId) {
        const endId = conn.end.objectId.toString();
        if (!objectConnMap.has(endId)) {
          objectConnMap.set(endId, []);
        }
        objectConnMap.get(endId).push({ connection: conn, endpoint: 'end' });
      }
    });

    objectConnectionsRef.current = objectConnMap;

    // Clear previous position tracking when connections change to ensure fresh tracking
    previousPositionsRef.current.clear();
  }, [connections, isInitialized]);

  // React to object position changes - update connections with debouncing
  useEffect(() => {
    if (!isInitialized || window._connectionUpdateSkip) return;
    const currentConnections = connectionsRef.current;
    if (
      !Array.isArray(currentConnections) ||
      !currentConnections.length ||
      !objects.length
    )
      return;

    // Prevent multiple updates running simultaneously
    if (isUpdatingRef.current) return;

    // Simple debouncing - limit to 60fps max
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 16) {
      return;
    }
    lastUpdateTimeRef.current = now;

    // Collect all connection updates to batch them
    const connectionUpdates = new Map();

    // Helper function to update a single connection endpoint
    const updateConnectionEndpoint = (
      connection,
      endpoint,
      movedObject,
      newPosition
    ) => {
      const conn = connection;
      const endpointData = conn[endpoint];

      // Skip if no face defined
      if (endpointData?.face === undefined) {
        return;
      }

      try {
        // Calculate new face position
        const indicatorData = {
          type: endpointData.type || movedObject.type || 'cube',
          face: endpointData.face,
          objectId: endpointData.objectId,
          faceCenter: endpointData.faceCenter,
          cube: {
            position: newPosition,
            scale: movedObject.scale || [1, 1, 1],
          },
          plane:
            movedObject.type === 'plane'
              ? {
                  position: newPosition,
                  scale: movedObject.scale || [1, 1, 1],
                }
              : undefined,
        };

        const facePosition = calculateFacePosition(indicatorData, objects);

        // Store the update for batching - merge with existing update if present
        const existingUpdate = connectionUpdates.get(conn.id) || {};
        connectionUpdates.set(conn.id, {
          ...existingUpdate,
          [endpoint]: {
            ...endpointData,
            position: [...facePosition],
            worldPosition: [...facePosition],
            facePosition: [...facePosition],
          },
          // Don't update _visualUpdate or _localUpdate for position changes
          // These should only be updated for style/text changes that require full re-render
        });
      } catch (error) {
        console.warn(
          `Failed to calculate face position for ${endpoint}:`,
          error
        );

        // Fallback to object center - merge with existing update if present
        const existingUpdate = connectionUpdates.get(conn.id) || {};
        connectionUpdates.set(conn.id, {
          ...existingUpdate,
          [endpoint]: {
            ...endpointData,
            position: [...newPosition],
            worldPosition: [...newPosition],
            facePosition: [...newPosition],
          },
          // Don't update _visualUpdate or _localUpdate for position changes
          // These should only be updated for style/text changes that require full re-render
        });
      }
    };

    // Check each object for position changes
    objects.forEach((obj) => {
      const objId = obj.id.toString();
      const currentPos = obj.position;
      const previousPos = previousPositionsRef.current.get(objId);

      // Check if position has changed (slightly larger threshold to reduce noise)
      const positionChanged =
        !previousPos ||
        Math.abs(currentPos[0] - previousPos[0]) > 0.1 ||
        Math.abs(currentPos[1] - previousPos[1]) > 0.1 ||
        Math.abs(currentPos[2] - previousPos[2]) > 0.1;

      if (positionChanged) {
        // Update tracked position
        previousPositionsRef.current.set(objId, [...currentPos]);

        // Get connections for this object
        const objectConnections = objectConnectionsRef.current.get(objId) || [];

        if (objectConnections.length === 0) return;

        // Update each connection - store in batch
        objectConnections.forEach(({ connection, endpoint }) => {
          updateConnectionEndpoint(connection, endpoint, obj, currentPos);
        });
      }
    });

    // Apply all connection updates in a single batch operation to prevent flickering
    if (connectionUpdates.size > 0) {
      isUpdatingRef.current = true;

      // Use batch update to minimize store updates and prevent flickering
      updateConnections(connectionUpdates);

      // Reset updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [objects, updateConnections, isInitialized]);

  return null;
};

export default RealTimeConnectionUpdater;
