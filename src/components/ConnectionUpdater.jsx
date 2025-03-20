import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Add Three.js import

// Simplified array comparison
const arraysEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.001) return false;
  }
  return true;
};

// Safety function to ensure we always get a valid position array
const ensureValidPosition = (pos, fallback = [0, 0, 0]) => {
  // Check if it's already a valid array
  if (
    Array.isArray(pos) &&
    pos.length === 3 &&
    pos.every((n) => typeof n === 'number' && !isNaN(n))
  ) {
    return pos;
  }

  // If pos is an object with numeric x,y,z properties, convert to array
  if (
    pos &&
    typeof pos === 'object' &&
    'x' in pos &&
    'y' in pos &&
    'z' in pos &&
    !isNaN(pos.x) &&
    !isNaN(pos.y) &&
    !isNaN(pos.z)
  ) {
    return [pos.x, pos.y, pos.z];
  }

  return fallback;
};

// Improve the position calculation for text objects by honoring position locks
const calculateTextObjectPosition = (conn, isStart) => {
  const endpoint = isStart ? conn.start : conn.end;

  // If we don't have proper references, can't calculate
  if (!endpoint || !endpoint.objectId) return [0, 0, 0];

  // If position is locked by TextObject component, ALWAYS respect it
  if (endpoint._textPositionLocked) {
    return endpoint.position || endpoint.worldPosition || [0, 0, 0];
  }

  // Skip updating if the text object is currently being edited
  if (endpoint.plane?.userData?.isTextEditing) {
    return endpoint.worldPosition || endpoint.position;
  }

  // SIMPLIFIED PRIORITY ORDER - no fallbacks to default positions

  // First priority: worldPosition from the connection itself
  if (Array.isArray(endpoint.worldPosition)) {
    return endpoint.worldPosition;
  }

  // Second priority: indicatorPosition from plane.userData
  if (Array.isArray(endpoint.plane?.userData?.indicatorPosition)) {
    return endpoint.plane.userData.indicatorPosition;
  }

  // Third priority: indicatorPosition from cube.userData
  if (Array.isArray(endpoint.cube?.userData?.indicatorPosition)) {
    return endpoint.cube.userData.indicatorPosition;
  }

  // Fourth priority: explicit position in the connection
  if (Array.isArray(endpoint.position)) {
    return endpoint.position;
  }

  // If we get here, we have no valid position data - log warning
  console.warn(
    'No valid indicator position found for text object',
    endpoint.objectId
  );

  // Return last stored position or zero vector as absolute last resort
  return [0, 0, 0];
};

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
  transformingObjects, // Make sure we receive this prop
}) => {
  // Simple frame skipping for better performance
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 5;

  // Track last positions to avoid redundant updates
  const lastPositions = useRef({});

  // Add state to track if the component is mounted
  const isMounted = useRef(true);

  // Set up unmount cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Add a throttle mechanism for text objects
  const lastTextUpdateTime = useRef({});
  const TEXT_UPDATE_INTERVAL = 500; // ms between text object connection updates

  // Run update on every frame (with skipping)
  useFrame((state, delta) => {
    // Only proceed if mounted and if connections exist
    if (!isMounted.current || connections.length === 0) return;

    // Skip frames to reduce calculation frequency
    frameCount.current += 1;
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    // Create a variable to track changes
    let hasChanges = false;
    let updatedConnections = connections;

    try {
      // Calculate new positions
      updatedConnections = connections.map((conn) => {
        if (!conn.start || !conn.end) return conn;

        // Skip connection updates for objects that are actively being transformed
        if (
          transformingObjects &&
          (transformingObjects.current.has(conn.start?.objectId) ||
            transformingObjects.current.has(conn.end?.objectId))
        ) {
          return conn;
        }

        // Skip updates for text objects that are being edited
        const isTextObjectEditing =
          (conn.start.type === 'text' &&
            conn.start.plane?.userData?.isTextEditing) ||
          (conn.end.type === 'text' && conn.end.plane?.userData?.isTextEditing);

        if (isTextObjectEditing) {
          return conn;
        }

        // Add throttling for text object connections
        const now = Date.now();
        const hasTextObject =
          conn.start.type === 'text' || conn.end.type === 'text';

        if (hasTextObject) {
          const lastUpdate = lastTextUpdateTime.current[conn.id] || 0;
          if (now - lastUpdate < TEXT_UPDATE_INTERVAL) {
            return conn; // Skip this update if too soon
          }
          // Update the last update time
          lastTextUpdateTime.current[conn.id] = now;
        }

        // IMPORTANT: Don't update positions for connections with locked text positions
        const isTextLocked =
          (conn.start?._textPositionLocked && conn.start.type === 'text') ||
          (conn.end?._textPositionLocked && conn.end.type === 'text');

        if (isTextLocked) {
          // Just do dash animation but don't change positions
          if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
            let newDashOffset = conn.dashOffset || 0;
            if (conn.dashDirection === 'left') {
              newDashOffset = newDashOffset - delta * 2;
            } else if (conn.dashDirection === 'right') {
              newDashOffset = newDashOffset + delta * 2;
            }
            return {
              ...conn,
              dashOffset: newDashOffset,
            };
          }
          return conn; // No changes needed
        }

        try {
          // For 'text' type indicators, be more careful with position updates
          let newStartPos, newEndPos;
          let positionsUpdated = false;

          if (conn.start.type === 'text') {
            // Use our specialized text object position calculation
            newStartPos = calculateTextObjectPosition(conn, true);

            // Only count as updated if position actually changed
            if (!arraysEqual(conn.start.position, newStartPos)) {
              positionsUpdated = true;
            }
          } else {
            newStartPos = ensureValidPosition(
              calculateFacePosition(conn.start),
              conn.start.position
            );

            if (!arraysEqual(conn.start.position, newStartPos)) {
              positionsUpdated = true;
            }
          }

          if (conn.end.type === 'text') {
            // Use our specialized text object position calculation
            newEndPos = calculateTextObjectPosition(conn, false);

            if (!arraysEqual(conn.end.position, newEndPos)) {
              positionsUpdated = true;
            }
          } else {
            newEndPos = ensureValidPosition(
              calculateFacePosition(conn.end),
              conn.end.position
            );

            if (!arraysEqual(conn.end.position, newEndPos)) {
              positionsUpdated = true;
            }
          }

          // Only continue if positions actually changed (to prevent cycles)
          if (positionsUpdated) {
            // Check if positions have actually changed
            const startKey = `${conn.id}-start`;
            const endKey = `${conn.id}-end`;

            const startChanged = !arraysEqual(
              lastPositions.current[startKey],
              newStartPos
            );
            const endChanged = !arraysEqual(
              lastPositions.current[endKey],
              newEndPos
            );

            if (startChanged || endChanged) {
              hasChanges = true;

              // Store new positions for comparison in next frame
              lastPositions.current[startKey] = [...newStartPos];
              lastPositions.current[endKey] = [...newEndPos];

              // Calculate dash offset animation
              let newDashOffset = conn.dashOffset || 0;
              if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
                if (conn.dashDirection === 'left') {
                  newDashOffset = newDashOffset - delta * 2;
                } else if (conn.dashDirection === 'right') {
                  newDashOffset = newDashOffset + delta * 2;
                }
              }

              // Don't change the connection line style when just updating positions
              return {
                ...conn,
                start: { ...conn.start, position: newStartPos },
                end: { ...conn.end, position: newEndPos },
                dashOffset: newDashOffset,
                // Preserve all existing properties
                lineStyle: conn.lineStyle,
                text: conn.text || '',
                textStyle: conn.textStyle || {
                  fontSize: 1.5,
                  color: 'white',
                  underline: false,
                },
                _lastStyleUpdate: conn._lastStyleUpdate || 0,
                dashDirection: conn.dashDirection,
                _textPosition: conn._textPosition,
                _pathPoints: conn._pathPoints,
                _stabilityCounter: (conn._stabilityCounter || 0) + 1,
              };
            }
          }
        } catch (error) {
          console.error('Error updating connection position:', error);
        }

        // No change or error - return original connection
        return conn;
      });

      // Only update state if there are actual changes
      if (hasChanges && isMounted.current) {
        setConnections(updatedConnections);
      }
    } catch (error) {
      console.error('Error in connection updater:', error);
    }
  });

  return null;
};

export default ConnectionUpdater;
