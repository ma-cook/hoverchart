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

// Improve the position calculation for text objects
const calculateTextObjectPosition = (conn, isStart) => {
  const endpoint = isStart ? conn.start : conn.end;

  // If we don't have proper references, can't calculate
  if (!endpoint || !endpoint.objectId) return [0, 0, 0];

  // Skip updating if the text object is currently being edited
  if (endpoint.plane?.userData?.isTextEditing) {
    // Return the current position to prevent changes during editing
    return endpoint.position || [0, 0, 0];
  }

  // FIRST PRIORITY: Check for directly stored indicator position
  if (endpoint.plane?.userData?.indicatorPosition) {
    const pos = endpoint.plane.userData.indicatorPosition;
    if (
      Array.isArray(pos) &&
      pos.length === 3 &&
      (pos[0] !== 0 || pos[1] !== 0 || pos[2] !== 0)
    ) {
      return pos;
    }
  }

  // SECOND PRIORITY: Get the current position from the connection
  const currentPos = endpoint.position || [0, 0, 0];
  if (
    currentPos &&
    (currentPos[0] !== 0 || currentPos[1] !== 0 || currentPos[2] !== 0)
  ) {
    return currentPos;
  }

  // THIRD PRIORITY: Calculate from world position + offset
  if (endpoint.plane?.userData?.lastWorldPosition) {
    const pos = endpoint.plane.userData.lastWorldPosition;
    const offset = endpoint.plane.userData.indicatorOffset ||
      endpoint.offset || [0, -5, 0];
    const scale = endpoint.plane.userData.lastScale ||
      endpoint.scale || [1, 1, 1];

    // Apply offset correctly based on scale
    return [pos[0] + offset[0], pos[1] + offset[1], pos[2] + offset[2]];
  }

  // FOURTH PRIORITY: Try to get live position
  if (endpoint.plane) {
    try {
      const position = new THREE.Vector3();
      endpoint.plane.getWorldPosition(position);

      // Get the most accurate scale available
      const scale = endpoint.scale || [1, 1, 1];
      const verticalOffset = -5 * scale[1];

      return [position.x, position.y + verticalOffset, position.z];
    } catch (e) {
      console.error('Error getting text object position:', e);
    }
  }

  // Last resort - use the calculate face position or fallback
  return calculateFacePosition
    ? calculateFacePosition(endpoint)
    : endpoint.position || [0, 0, 0];
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

        try {
          // For 'text' type indicators, be more careful with position updates
          let newStartPos, newEndPos;
          let positionsUpdated = false;

          if (conn.start.type === 'text') {
            // Use our special text object position calculation
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
            // Use our special text object position calculation
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
