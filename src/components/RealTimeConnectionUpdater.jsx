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
 *
 * PERF FIX: connections and objects are read from refs populated by
 * Zustand subscribe() instead of React state selectors.  The old
 * pattern (`useConnectionStore(s => s.connections)`) caused this
 * component to re-render on every object property change (color, text,
 * scale) — not just position — which cascaded into O(N) scans and
 * connection store writes that propagated to all Connection components.
 */
const RealTimeConnectionUpdater = () => {
  // Only subscribe to the action (stable reference, never changes)
  const updateConnections = useConnectionStore(
    (state) => state.updateConnections
  );
  // Only subscribe to isInitialized from spatial store (boolean, cheap)
  const isInitialized = useSpatialManagerStore((state) => state.isInitialized);

  // Track previous object positions to detect changes
  const previousPositionsRef = useRef(new Map());

  // Map of object -> connections for quick lookup
  const objectConnectionsRef = useRef(new Map());

  // PERFORMANCE: Increased throttle to 100ms (10fps for position updates)
  // Visual updates happen via objectPositions map in renderer
  const lastUpdateTimeRef = useRef(0);
  const pendingUpdateRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // PERF: Populate refs via store.subscribe() instead of React state.
  // This avoids re-rendering the component (and re-running effects) on
  // every unrelated property change in the objects/connections arrays.
  const connectionsRef = useRef(useConnectionStore.getState().connections);
  const objectsRef = useRef(useObjectsStore.getState().objects);
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

  // ─── Rebuild object-to-connections map ────────────────────────────
  // Extracted so it can be invoked from the subscribe callback below
  // as well as from `runConnectionUpdate`.
  const rebuildConnectionMap = useCallback(() => {
    const currentConnections = connectionsRef.current;
    if (!isInitializedRef.current || !Array.isArray(currentConnections)) return;

    const objectConnMap = new Map();

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
  }, [runConnectionUpdate]);

  // ─── Zustand subscribe() listeners ─────────────────────────────────
  // PERF FIX: Instead of using React state selectors (which trigger
  // component re-renders and effect re-runs on EVERY store change),
  // we subscribe directly to the stores and update refs.  The
  // subscribe callbacks only fire work when the data they care about
  // actually changes (connection array reference / objects array reference).

  // Subscribe to connection store — rebuild map when connections change
  useEffect(() => {
    // Seed with current state
    connectionsRef.current = useConnectionStore.getState().connections;
    rebuildConnectionMap();

    const unsub = useConnectionStore.subscribe((state) => {
      const next = state.connections;
      if (next !== connectionsRef.current) {
        connectionsRef.current = next;
        rebuildConnectionMap();
      }
    });
    return unsub;
  }, [rebuildConnectionMap]);

  // Subscribe to objects store — throttled position update when objects change
  useEffect(() => {
    objectsRef.current = useObjectsStore.getState().objects;

    const unsub = useObjectsStore.subscribe((state) => {
      const next = state.objects;
      if (next !== objectsRef.current) {
        objectsRef.current = next;

        // Gate checks (mirrors the old useEffect guards)
        if (!isInitializedRef.current || window._connectionUpdateSkip) return;
        const currentConnections = connectionsRef.current;
        if (
          !Array.isArray(currentConnections) ||
          !currentConnections.length ||
          !next.length
        ) return;
        if (isUpdatingRef.current) return;

        // PERFORMANCE: Throttle store updates to 100ms (10fps)
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

        if (timeSinceLastUpdate < 100) {
          // Schedule a deferred update so rapid batches still converge.
          if (!pendingUpdateRef.current) {
            pendingUpdateRef.current = setTimeout(() => {
              pendingUpdateRef.current = null;
              runConnectionUpdate();
            }, 100 - timeSinceLastUpdate);
          }
          return;
        }

        runConnectionUpdate();
      }
    });
    return unsub;
  }, [runConnectionUpdate]);

  return null;
};

export default RealTimeConnectionUpdater;
