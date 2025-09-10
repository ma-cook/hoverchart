import { useEffect, useRef } from 'react';
import {
  useConnectionStore,
  useObjectsStore,
  useSpatialManagerStore,
} from '../stores';
import { calculateFacePosition } from '../utils/facePositionUtils';
import { getCellCoordinates, getCellId } from '../services/spatialPartitioning';

/**
 * Component that updates connection positions in real-time as objects move
 * Uses reactive store subscriptions instead of continuous monitoring
 * IMPORTANT: This only updates visual positions, does NOT save to database
 */
const RealTimeConnectionUpdater = () => {
  // Get store state and actions
  const setConnections = useConnectionStore((state) => state.setConnections);
  const connections = useConnectionStore((state) => state.connections);
  const objects = useObjectsStore((state) => state.objects);

  // Get spatial system state to handle cell-based updates
  const { loadedCells, isInitialized } = useSpatialManagerStore();

  // Track previous object positions and face positions to detect changes
  const previousPositionsRef = useRef(new Map()); // objectId -> position
  const previousFacePositionsRef = useRef(new Map()); // connectionId_start/end -> position

  // Track which objects have connections to optimize updates
  const connectedObjectsRef = useRef(new Map()); // objectId -> { connectionIds: Set, lastUpdate: number }
  const connectedObjectsCache = useRef(new Set()); // Set of connected object IDs for quick lookup

  // Throttle face position updates
  const nextFaceUpdateRef = useRef(new Map()); // connectionId -> nextUpdateTime

  // Throttle for object position updates (100ms)
  const OBJECT_UPDATE_THROTTLE = 100;

  // Update connected objects map when connections change or cells load/unload
  useEffect(() => {
    // Skip if spatial system isn't initialized
    if (!isInitialized) {
      return;
    }

    const newMap = new Map();
    const now = Date.now();

    // Include all connections initially, then filter based on cell loading
    const activeConnections = connections.filter((conn) => {
      if (!conn.start?.position || !conn.end?.position) return false;

      // If spatial system isn't initialized, include all connections
      if (!isInitialized || loadedCells.size === 0) return true;

      // Check if either end is in a loaded cell
      const startCell = getCellCoordinates(conn.start.position);
      const endCell = getCellCoordinates(conn.end.position);
      const startCellId = getCellId(startCell.x, startCell.y, startCell.z);
      const endCellId = getCellId(endCell.x, endCell.y, endCell.z);

      return loadedCells.has(startCellId) || loadedCells.has(endCellId);
    });

    activeConnections.forEach((conn) => {
      // Update the face update times for new connections
      nextFaceUpdateRef.current.set(conn.id + '_start', now);
      nextFaceUpdateRef.current.set(conn.id + '_end', now); // Handle start connections
      if (conn.start?.objectId) {
        const startId = conn.start.objectId.toString();
        if (!newMap.has(startId)) {
          newMap.set(startId, { connectionIds: new Set(), lastUpdate: now });
        }
        newMap.get(startId).connectionIds.add(conn.id);
      }

      // Handle end connections
      if (conn.end?.objectId) {
        const endId = conn.end.objectId.toString();
        if (!newMap.has(endId)) {
          newMap.set(endId, { connectionIds: new Set(), lastUpdate: now });
        }
        newMap.get(endId).connectionIds.add(conn.id);
      }
    });

    // Clear out old face positions for removed connections
    const activeConnIds = new Set(connections.map((c) => c.id));
    for (const key of previousFacePositionsRef.current.keys()) {
      const [connId] = key.split('_');
      if (!activeConnIds.has(connId)) {
        previousFacePositionsRef.current.delete(key);
        nextFaceUpdateRef.current.delete(connId + '_start');
        nextFaceUpdateRef.current.delete(connId + '_end');
      }
    }

    // Update the connected objects map and refresh the cache
    connectedObjectsRef.current = newMap;
    connectedObjectsCache.current = new Set(newMap.keys());
  }, [connections, isInitialized, loadedCells]);

  // React to object position changes, but only for loaded cells
  useEffect(() => {
    // Skip updates if not initialized or if connection deletion is in progress
    if (!isInitialized || window._connectionUpdateSkip) {
      return;
    }

    if (!Array.isArray(connections) || !connections.length || !objects.length)
      return;

    // Filter out connections that are currently being deleted
    const activeConnections = connections.filter((conn) => {
      // Skip deleted connections
      if (window._deletingConnections?.has(conn.id)) {
        return false;
      }

      // Check if connection endpoints are in loaded cells
      const startPos = conn.start?.position;
      const endPos = conn.end?.position;
      if (!startPos || !endPos) {
        return false;
      }

      // Get cell coordinates for both endpoints
      const startCell = getCellCoordinates(startPos);
      const endCell = getCellCoordinates(endPos);

      // Get cell IDs in the correct format (just like they're stored in the loadedCells Set)
      const startCellId = getCellId(startCell.x, startCell.y, startCell.z);
      const endCellId = getCellId(endCell.x, endCell.y, endCell.z);

      // Check if both endpoint cells are loaded
      const startCellLoaded = loadedCells.has(startCellId);
      const endCellLoaded = loadedCells.has(endCellId);

      return startCellLoaded && endCellLoaded;
    });

    if (!activeConnections.length) return;

    // Update connected objects cache for quick lookup
    connectedObjectsCache.current = new Set(
      Array.from(connectedObjectsRef.current.keys())
    ); // Skip updates if any objects are currently being transformed
    if (
      window._currentTransformingObjects &&
      window._currentTransformingObjects.size > 0
    ) {
      return; // Let the manual drag updates handle real-time visuals
    }
    let hasUpdates = false;
    const updatedConnections = [...activeConnections];

    const now = Date.now();

    // Check each object for position changes, but only those that have connections
    objects.forEach((obj) => {
      const objId = obj.id.toString();

      // Skip objects that don't have any connections
      if (!connectedObjectsCache.current.has(objId)) {
        return;
      }

      const objData = connectedObjectsRef.current.get(objId);

      // Skip if object was updated too recently (throttle)
      if (now - objData.lastUpdate < OBJECT_UPDATE_THROTTLE) {
        return;
      }

      const currentPos = obj.position;
      const previousPos = previousPositionsRef.current.get(objId);

      // Check if position has changed (use larger threshold to reduce updates)
      const positionChanged =
        !previousPos ||
        Math.abs(currentPos[0] - previousPos[0]) > 0.02 || // Increased threshold
        Math.abs(currentPos[1] - previousPos[1]) > 0.02 ||
        Math.abs(currentPos[2] - previousPos[2]) > 0.02;

      if (positionChanged) {
        // Update the tracked position and last update time
        previousPositionsRef.current.set(objId, [...currentPos]);
        objData.lastUpdate = now;

        // Get the set of connection IDs that need to be updated for this object
        const connectionIds = objData.connectionIds;

        // Find and update only the connections related to this object
        // Use Set for faster lookups
        const connSet = new Set(connectionIds);
        const relevantConnections = updatedConnections.filter((conn) =>
          connSet.has(conn.id)
        );

        for (const conn of relevantConnections) {
          let needsUpdate = false;
          let updatedConn = { ...conn };

          // Check face update throttling times
          // Check throttling for face position updates
          const lastStartUpdate =
            nextFaceUpdateRef.current.get(conn.id + '_start') || 0;
          const lastEndUpdate =
            nextFaceUpdateRef.current.get(conn.id + '_end') || 0;
          const canUpdateStart = now - lastStartUpdate > 300;
          const canUpdateEnd = now - lastEndUpdate > 300;

          // Check if this connection's start is connected to the moved object
          if (conn.start?.objectId?.toString() === objId && canUpdateStart) {
            if (conn.start?.face) {
              try {
                const indicatorData = {
                  type: conn.start.type || obj.type || 'cube', // Use stored connection type first, then obj.type as fallback
                  face: conn.start.face,
                  faceCenter: conn.start.faceCenter, // Include faceCenter for dodecahedrons
                  cube: {
                    position: currentPos,
                    scale: obj.scale || [1, 1, 1],
                  },
                  plane:
                    obj.type === 'plane'
                      ? {
                          position: currentPos,
                          scale: obj.scale || [1, 1, 1],
                        }
                      : undefined,
                };
                const facePosition = calculateFacePosition(
                  indicatorData,
                  objects
                );

                // Update the face position timestamp for throttling
                nextFaceUpdateRef.current.set(conn.id + '_start', now);

                // Check if the face position has meaningfully changed
                const prevFacePos = previousFacePositionsRef.current.get(
                  conn.id + '_start'
                );
                const facePositionChanged =
                  !prevFacePos ||
                  facePosition.some(
                    (val, i) => Math.abs(val - prevFacePos[i]) > 0.01
                  );

                if (facePositionChanged) {
                  // Store the new face position
                  previousFacePositionsRef.current.set(conn.id + '_start', [
                    ...facePosition,
                  ]);

                  // Create completely new start object to ensure reactivity
                  updatedConn.start = {
                    ...conn.start,
                    position: [...facePosition],
                    worldPosition: [...facePosition],
                    facePosition: [...facePosition],
                  };
                  needsUpdate = true;
                }
              } catch (error) {
                console.warn('Failed to calculate start face position:', error);
                // Create completely new start object even for fallback
                updatedConn.start = {
                  ...conn.start,
                  position: [...currentPos],
                  worldPosition: [...currentPos],
                  facePosition: [...currentPos],
                };
                needsUpdate = true;
              }
            }
          }

          // Check if this connection's end is connected to the moved object
          if (conn.end?.objectId?.toString() === objId && canUpdateEnd) {
            if (conn.end?.face) {
              try {
                const indicatorData = {
                  type: conn.end.type || obj.type || 'cube', // Use stored connection type first, then obj.type as fallback
                  face: conn.end.face,
                  faceCenter: conn.end.faceCenter, // Include faceCenter for dodecahedrons
                  cube: {
                    position: currentPos,
                    scale: obj.scale || [1, 1, 1],
                  },
                  plane:
                    obj.type === 'plane'
                      ? {
                          position: currentPos,
                          scale: obj.scale || [1, 1, 1],
                        }
                      : undefined,
                };
                const facePosition = calculateFacePosition(
                  indicatorData,
                  objects
                );

                // Update the face position timestamp for throttling
                nextFaceUpdateRef.current.set(conn.id + '_end', now);

                // Check if the face position has meaningfully changed
                const prevFacePos = previousFacePositionsRef.current.get(
                  conn.id + '_end'
                );
                const facePositionChanged =
                  !prevFacePos ||
                  facePosition.some(
                    (val, i) => Math.abs(val - prevFacePos[i]) > 0.01
                  );

                if (facePositionChanged) {
                  // Store the new face position
                  previousFacePositionsRef.current.set(conn.id + '_end', [
                    ...facePosition,
                  ]);

                  // Create completely new end object to ensure reactivity
                  updatedConn.end = {
                    ...conn.end,
                    position: [...facePosition],
                    worldPosition: [...facePosition],
                    facePosition: [...facePosition],
                  };
                  needsUpdate = true;
                }
              } catch (error) {
                console.warn('Failed to calculate end face position:', error);
                // Create completely new end object even for fallback
                updatedConn.end = {
                  ...conn.end,
                  position: [...currentPos],
                  worldPosition: [...currentPos],
                  facePosition: [...currentPos],
                };
                needsUpdate = true;
              }
            }
          }
          if (needsUpdate) {
            // Mark as visual-only update to prevent database saves
            updatedConn._visualUpdate = Date.now();
            updatedConn._localUpdate = Date.now();
            updatedConn._lastStyleUpdate = Date.now(); // Also update this to trigger renders
            // Remove any save triggers
            delete updatedConn._needsSave;
            const index = updatedConnections.findIndex((c) => c.id === conn.id);
            if (index !== -1) {
              updatedConnections[index] = updatedConn;
              hasUpdates = true;
            }
          }
        }
      }
    }); // Update connections if any positions changed
    if (hasUpdates) {
      setConnections(updatedConnections);
    }
  }, [objects, connections, setConnections, isInitialized, loadedCells]);

  // This component doesn't render anything
  return null;
};

export default RealTimeConnectionUpdater;
