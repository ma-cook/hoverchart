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

  console.warn('Invalid position encountered, using fallback', pos);
  return fallback;
};

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
}) => {
  // Add frame skipping to reduce update frequency
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 5; // Increase from 3 to 5 to reduce updates

  // Add state to track if the component is mounted to prevent updates after unmount
  const isMounted = useRef(true);

  // Set up unmount cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reference to track if positions changed
  const lastPositions = useRef({});

  // Add initialPositionSync flag to force first-frame position sync
  const initialPositionSync = useRef(false);

  // Run an immediate position calculation once with debouncing
  useEffect(() => {
    // Skip if we've already done initial sync or no connections
    if (initialPositionSync.current || !connections.length) return;

    // Use a timeout to prevent multiple runs during initial render cascade
    const timer = setTimeout(() => {
      if (!isMounted.current) return;

      try {
        // Calculate all connection positions immediately
        const updatedConnections = connections.map((conn) => {
          if (!conn.start || !conn.end) return conn;

          try {
            let startPos, endPos;

            // Try to get positions with error handling
            try {
              startPos = calculateFacePosition(conn.start);
              startPos = ensureValidPosition(startPos, conn.start.position);
            } catch (err) {
              console.error('Error calculating start position:', err);
              startPos = ensureValidPosition(conn.start.position);
            }

            try {
              endPos = calculateFacePosition(conn.end);
              endPos = ensureValidPosition(endPos, conn.end.position);
            } catch (err) {
              console.error('Error calculating end position:', err);
              endPos = ensureValidPosition(conn.end.position);
            }

            // Store positions for comparison in frame updates
            lastPositions.current[`${conn.id}-start`] = [...startPos];
            lastPositions.current[`${conn.id}-end`] = [...endPos];

            return {
              ...conn,
              start: { ...conn.start, position: startPos },
              end: { ...conn.end, position: endPos },
            };
          } catch (error) {
            console.error('Error processing connection', conn.id, error);
            return conn;
          }
        });

        setConnections(updatedConnections);
      } catch (err) {
        console.error('Error in initial position sync:', err);
      }
      initialPositionSync.current = true;
    }, 200); // Add a small delay to let things settle

    return () => clearTimeout(timer);
  }, [connections, calculateFacePosition, setConnections]);

  // Optimize the frame update function
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
      // Calculate new positions without updating state immediately
      updatedConnections = connections.map((conn) => {
        if (!conn.start || !conn.end) return conn;

        try {
          // Create backups of original positions for logging if there are changes
          const originalStartPos = conn.start.position
            ? [...conn.start.position]
            : null;
          const originalEndPos = conn.end.position
            ? [...conn.end.position]
            : null;

          // Get positions with fallbacks for each potential failure point
          let newStartPos, newEndPos;

          // Handle start position calculation
          try {
            // For planes, use the stored worldPosition if available (most reliable)
            if (
              conn.start.type === 'plane' &&
              Array.isArray(conn.start.worldPosition)
            ) {
              newStartPos = ensureValidPosition(conn.start.worldPosition);
            } else {
              // Otherwise use the standard calculation
              newStartPos = calculateFacePosition(conn.start);
              newStartPos = ensureValidPosition(
                newStartPos,
                conn.start.position
              );
            }
          } catch (err) {
            console.warn('Error calculating start position:', err);
            newStartPos = ensureValidPosition(conn.start.position);
          }

          // Handle end position calculation
          try {
            // For planes, use the stored worldPosition if available
            if (
              conn.end.type === 'plane' &&
              Array.isArray(conn.end.worldPosition)
            ) {
              newEndPos = ensureValidPosition(conn.end.worldPosition);
            } else {
              // Otherwise use the standard calculation
              newEndPos = calculateFacePosition(conn.end);
              newEndPos = ensureValidPosition(newEndPos, conn.end.position);
            }
          } catch (err) {
            console.warn('Error calculating end position:', err);
            newEndPos = ensureValidPosition(conn.end.position);
          }

          // Generate position keys
          const startKey = `${conn.id}-start`;
          const endKey = `${conn.id}-end`;

          // Check if positions actually changed
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

            // Log position changes for debugging
            if (startChanged && originalStartPos) {
              console.log(`Connection ${conn.id} start pos changed:`, {
                from: originalStartPos,
                to: newStartPos,
              });
            }

            if (endChanged && originalEndPos) {
              console.log(`Connection ${conn.id} end pos changed:`, {
                from: originalEndPos,
                to: newEndPos,
              });
            }

            // Store new positions for next comparison
            lastPositions.current[startKey] = [...newStartPos];
            lastPositions.current[endKey] = [...newEndPos];

            // Return updated connection with new positions
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
              dashOffset: updateDashOffset(conn, delta),
            };
          }
        } catch (error) {
          console.error('Error processing connection:', error, 'conn:', conn);
        }

        // No change or error - return original connection
        return conn;
      });

      // Only update state if there are actual changes
      if (hasChanges && isMounted.current) {
        setConnections(updatedConnections);
      }
    } catch (err) {
      console.error('Error in connection update frame:', err);
    }
  });

  return null;
};

export default ConnectionUpdater;
