import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

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

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
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

        try {
          // For 'text' type indicators, be more careful with position updates
          // to avoid resetting to [0,0,0]
          let newStartPos, newEndPos;

          if (
            conn.start.type === 'text' &&
            !arraysEqual(conn.start.position, [0, 0, 0])
          ) {
            // Preserve existing position for text objects that already have valid positions
            newStartPos = conn.start.position;
          } else {
            // Calculate position for other types
            newStartPos = ensureValidPosition(
              calculateFacePosition(conn.start),
              conn.start.position
            );
          }

          if (
            conn.end.type === 'text' &&
            !arraysEqual(conn.end.position, [0, 0, 0])
          ) {
            // Preserve existing position for text objects that already have valid positions
            newEndPos = conn.end.position;
          } else {
            // Calculate position for other types
            newEndPos = ensureValidPosition(
              calculateFacePosition(conn.end),
              conn.end.position
            );
          }

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

            // Return updated connection with new positions
            return {
              ...conn,
              start: { ...conn.start, position: newStartPos },
              end: { ...conn.end, position: newEndPos },
              dashOffset: newDashOffset,
            };
          }
        } catch {
          // Remove console.error with unused error variable
        }

        // No change or error - return original connection
        return conn;
      });

      // Only update state if there are actual changes
      if (hasChanges && isMounted.current) {
        setConnections(updatedConnections);
      }
    } catch {
      // Remove console.error with unused error variable
      // Prevent logging unused error variable
    }
  });

  return null;
};

export default ConnectionUpdater;
