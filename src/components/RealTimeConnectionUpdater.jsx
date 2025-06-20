import { useEffect, useRef } from 'react';
import { useConnectionStore, useObjectsStore } from '../stores';
import { calculateFacePosition } from '../utils/facePositionUtils';

/**
 * Component that updates connection positions in real-time as objects move
 * Uses reactive store subscriptions instead of continuous monitoring
 * IMPORTANT: This only updates visual positions, does NOT save to database
 */
const RealTimeConnectionUpdater = () => {
  // Get store state and actions
  const setConnections = useConnectionStore((state) => state.setConnections);
  const objects = useObjectsStore((state) => state.objects);

  // Track previous object positions to detect changes
  const previousPositionsRef = useRef(new Map()); // React to object position changes
  useEffect(() => {
    // Get current connections inside the effect to avoid dependency issues
    const connections = useConnectionStore.getState().connections;

    if (!connections.length || !objects.length) return;

    // Skip updates if any objects are currently being transformed
    if (
      window._currentTransformingObjects &&
      window._currentTransformingObjects.size > 0
    ) {
      return; // Let the manual drag updates handle real-time visuals
    }

    let hasUpdates = false;
    const updatedConnections = [...connections];

    // Check each object for position changes
    objects.forEach((obj) => {
      const objId = obj.id.toString();
      const currentPos = obj.position;
      const previousPos = previousPositionsRef.current.get(objId); // Check if position has changed (use smaller threshold for smoother updates)
      const positionChanged =
        !previousPos ||
        Math.abs(currentPos[0] - previousPos[0]) > 0.0001 ||
        Math.abs(currentPos[1] - previousPos[1]) > 0.0001 ||
        Math.abs(currentPos[2] - previousPos[2]) > 0.0001;
      if (positionChanged) {
        // Update the tracked position
        previousPositionsRef.current.set(objId, [...currentPos]);

        // Find and update all connections related to this object
        for (let i = 0; i < updatedConnections.length; i++) {
          const conn = updatedConnections[i];
          let needsUpdate = false;
          let updatedConn = { ...conn };

          // Check if this connection's start is connected to the moved object
          if (conn.start?.objectId?.toString() === objId) {
            if (conn.start?.face) {
              try {
                const indicatorData = {
                  type: obj.type || 'cube',
                  face: conn.start.face,
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
                // Create completely new start object to ensure reactivity
                updatedConn.start = {
                  ...conn.start,
                  position: [...facePosition],
                  worldPosition: [...facePosition],
                  facePosition: [...facePosition],
                };
                needsUpdate = true;
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
          if (conn.end?.objectId?.toString() === objId) {
            if (conn.end?.face) {
              try {
                const indicatorData = {
                  type: obj.type || 'cube',
                  face: conn.end.face,
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
                // Create completely new end object to ensure reactivity
                updatedConn.end = {
                  ...conn.end,
                  position: [...facePosition],
                  worldPosition: [...facePosition],
                  facePosition: [...facePosition],
                };
                needsUpdate = true;
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
            updatedConnections[i] = updatedConn;
            hasUpdates = true;
          }
        }
      }
    }); // Update connections if any positions changed
    if (hasUpdates) {
      setConnections(updatedConnections);
    }
  }, [objects, setConnections]); // Remove connections dependency to avoid loops

  // This component doesn't render anything
  return null;
};

export default RealTimeConnectionUpdater;
