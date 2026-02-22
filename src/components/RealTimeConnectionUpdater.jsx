import { useEffect, useRef, useCallback } from 'react';
import {
  useConnectionStore,
  useObjectsStore,
  useSpatialManagerStore,
} from '../stores';
import { calculateFacePosition } from '../utils/facePositionUtils';

/**
 * PERFORMANCE OPTIMIZED: Updates connection positions as objects move
 * - Uses throttled updates (100ms) to reduce store update frequency
 * - Batches all connection updates into single store call
 * - Only updates connections whose objects actually moved
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

  // PERFORMANCE: Increased throttle to 100ms (10fps for position updates)
  // Visual updates happen via objectPositions map in renderer
  const lastUpdateTimeRef = useRef(0);
  const pendingUpdateRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Store current connections in a ref to avoid infinite loops
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Keep fresh references for the deferred update callback
  const objectsRef = useRef(objects);
  objectsRef.current = objects;
  const updateConnectionsRef = useRef(updateConnections);
  updateConnectionsRef.current = updateConnections;
  const isInitializedRef = useRef(isInitialized);
  isInitializedRef.current = isInitialized;

  // Track which connection IDs have already had face positions computed
  // so we only process truly NEW connections and avoid infinite loops.
  const processedConnectionIdsRef = useRef(new Set());

  // ─── Core update logic ─────────────────────────────────────────────
  // Defined BEFORE the useEffects that call it to avoid TDZ errors.
  // Extracted so it can be called both from the useEffect (normal path)
  // and from the deferred timeout (throttled path).
  const runConnectionUpdate = useCallback(() => {
    if (!isInitializedRef.current || window._connectionUpdateSkip) return;
    const currentConnections = connectionsRef.current;
    const currentObjects = objectsRef.current;
    if (
      !Array.isArray(currentConnections) ||
      !currentConnections.length ||
      !currentObjects.length
    )
      return;

    // Prevent multiple updates running simultaneously
    if (isUpdatingRef.current) return;

    lastUpdateTimeRef.current = Date.now();

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

        const facePosition = calculateFacePosition(indicatorData, currentObjects);

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
        });
      }
    };

    // Check each object for position changes
    currentObjects.forEach((obj) => {
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
      updateConnectionsRef.current(connectionUpdates);

      // Reset updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, []);

  // Build object-to-connections mapping when connections change
  useEffect(() => {
    if (!isInitialized) return;

    const objectConnMap = new Map();
    const currentConnections = connectionsRef.current;

    // Detect genuinely new connections
    const newConnectionIds = [];
    currentConnections.forEach((conn) => {
      if (!processedConnectionIdsRef.current.has(conn.id)) {
        newConnectionIds.push(conn.id);
      }

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

    // BUGFIX: When *new* connections arrive (from Firestore), we must compute
    // their face positions. Previously the update only fired when `objects`
    // changed, so newly loaded connections never got facePosition/worldPosition.
    // Only clear previousPositions for objects involved in NEW connections
    // to force a position recalculation, but DON'T clear ALL, which would
    // cause an infinite loop (update → store change → connections change → repeat).
    if (newConnectionIds.length > 0) {
      // Mark new connections as needing processing
      const objectsNeedingUpdate = new Set();
      for (const connId of newConnectionIds) {
        const conn = currentConnections.find(c => c.id === connId);
        if (conn?.start?.objectId) objectsNeedingUpdate.add(conn.start.objectId.toString());
        if (conn?.end?.objectId) objectsNeedingUpdate.add(conn.end.objectId.toString());
      }
      // Clear previous positions only for objects involved in new connections
      for (const objId of objectsNeedingUpdate) {
        previousPositionsRef.current.delete(objId);
      }
      // Mark all current connections as processed
      for (const conn of currentConnections) {
        processedConnectionIdsRef.current.add(conn.id);
      }
      // Schedule the update for the new connections
      // Use a short timeout to batch rapid additions and avoid re-triggering
      // during the same React commit cycle.
      setTimeout(() => {
        runConnectionUpdate();
      }, 16);
    }
  }, [connections, isInitialized, runConnectionUpdate]);

  // React to object position changes - update connections with throttling
  // PERFORMANCE: Visual rendering uses objectPositions map directly for smooth updates
  // This store update is only needed for persistence/sync and can be infrequent
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

    // PERFORMANCE: Throttle store updates to 100ms (10fps)
    // Visual updates happen at 60fps via objectPositions map in BatchedConnectionLines
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (timeSinceLastUpdate < 100) {
      // BUGFIX: Schedule a deferred UPDATE (not just a ref reset).
      // Previously, the timeout just set lastUpdateTimeRef = 0 without
      // triggering re-execution. This meant connections for objects that
      // loaded in rapid batches (<100ms apart) never got their positions
      // recalculated — causing text labels to cluster at stale Firestore
      // positions ("half way through" the progressive mount).
      if (!pendingUpdateRef.current) {
        pendingUpdateRef.current = setTimeout(() => {
          pendingUpdateRef.current = null;
          // Actually run the update logic with latest data from refs
          runConnectionUpdate();
        }, 100 - timeSinceLastUpdate);
      }
      return;
    }

    runConnectionUpdate();
  }, [objects, updateConnections, isInitialized, runConnectionUpdate]);

  return null;
};

export default RealTimeConnectionUpdater;
