import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

// Compare arrays with a small epsilon tolerance for floating point
const arraysEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.001) return false;
  }
  return true;
};

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
}) => {
  // Add frame skipping to reduce update frequency
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 3; // Only update every 3rd frame

  // Reference to track if positions changed
  const lastPositions = useRef({});

  // Add initialPositionSync flag to force first-frame position sync
  const initialPositionSync = useRef(false);

  // Run an immediate position calculation once
  useEffect(() => {
    if (!initialPositionSync.current && connections.length > 0) {
      // Calculate all connection positions immediately
      const updatedConnections = connections.map((conn) => {
        const newStartPos = calculateFacePosition(conn.start);
        const newEndPos = calculateFacePosition(conn.end);

        // Store positions for comparison in frame updates
        lastPositions.current[`${conn.id}-start`] = [...newStartPos];
        lastPositions.current[`${conn.id}-end`] = [...newEndPos];

        return {
          ...conn,
          start: { ...conn.start, position: newStartPos },
          end: { ...conn.end, position: newEndPos },
        };
      });

      setConnections(updatedConnections);
      initialPositionSync.current = true;
    }
  }, [connections, calculateFacePosition, setConnections]);

  useFrame((state, delta) => {
    // Skip frames to reduce calculation frequency
    frameCount.current += 1;
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    if (connections.length > 0) {
      let hasChanges = false;

      // Calculate new positions without updating state immediately
      const updatedConnections = connections.map((conn) => {
        if (!conn.start || !conn.end) return conn;

        // Calculate new positions using the memoized function
        const newStartPos = calculateFacePosition(conn.start);
        const newEndPos = calculateFacePosition(conn.end);

        // Generate position keys
        const startKey = `${conn.id}-start`;
        const endKey = `${conn.id}-end`;

        // Check if positions actually changed
        const startChanged =
          !lastPositions.current[startKey] ||
          !arraysEqual(lastPositions.current[startKey], newStartPos);
        const endChanged =
          !lastPositions.current[endKey] ||
          !arraysEqual(lastPositions.current[endKey], newEndPos);

        if (startChanged || endChanged) {
          hasChanges = true;

          // Store new positions for next comparison
          lastPositions.current[startKey] = [...newStartPos];
          lastPositions.current[endKey] = [...newEndPos];

          // Update dash offset if line is animated
          let newDashOffset = conn.dashOffset;
          if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
            if (conn.dashDirection === 'left') {
              newDashOffset = (conn.dashOffset || 0) - delta * 2;
            } else if (conn.dashDirection === 'right') {
              newDashOffset = (conn.dashOffset || 0) + delta * 2;
            }
          }

          // Return updated connection
          return {
            ...conn,
            start: {
              ...conn.start,
              position: newStartPos,
            },
            end: {
              ...conn.end,
              position: newEndPos,
            },
            dashOffset: newDashOffset,
          };
        }

        // No change - return original connection
        return conn;
      });

      // Only update state if there are actual changes
      if (hasChanges) {
        setConnections(updatedConnections);
      }
    }
  });

  return null;
};

export default ConnectionUpdater;
