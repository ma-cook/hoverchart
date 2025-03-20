import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { recordFrameTime, recordStateUpdate } from '../utils/debugUtils';

// Helper function to compare arrays with small epsilon for floating point comparison
const arraysEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.001) return false;
  }
  return true;
};

/**
 * ConnectionUpdater - Updates connection positions and animations
 * This component manages the animations and position updates for connections
 * in a performance-optimized way.
 */
const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
  transformingObjects,
}) => {
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 6; // Increased to reduce CPU usage
  const lastPositions = useRef({});
  const ANIMATION_SPEED = 15; // Keep moderate speed
  const animationRequestRef = useRef();
  const lastUpdateTime = useRef(Date.now());
  const lastStyleChanges = useRef(new Map()); // Track recent style changes

  // Use a more efficient animation strategy that doesn't block other operations
  useFrame((state, delta) => {
    frameCount.current += 1;

    // Record frame time for performance monitoring
    recordFrameTime(delta * 1000);

    // Skip more frames to reduce CPU usage
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    // Throttle updates based on time to prevent excessive renders
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    if (timeSinceLastUpdate < 100) return; // Limit to ~10fps for animations

    // Only process animations if there are no active transformations
    if (transformingObjects.current.size > 0) return;

    if (connections.length > 0) {
      let hasChanges = false;
      const animatedConnIds = new Set();
      const styleChangedConnIds = new Set();

      // First, identify connections that have had recent style changes
      connections.forEach((conn) => {
        // Check if this connection has had a style change in the last 3 seconds
        if (conn._lastStyleUpdate && now - conn._lastStyleUpdate < 3000) {
          styleChangedConnIds.add(conn.id);
          lastStyleChanges.current.set(conn.id, conn._lastStyleUpdate);
        }
      });

      // Clean up old style change entries
      Array.from(lastStyleChanges.current.entries()).forEach(
        ([id, timestamp]) => {
          if (now - timestamp > 3000) {
            lastStyleChanges.current.delete(id);
          }
        }
      );

      const updatedConnections = connections.map((conn) => {
        // Always recalculate positions for all connections, including animated ones
        let newStartPos = calculateFacePosition(conn.start);
        let newEndPos = calculateFacePosition(conn.end);

        const startKey = `${conn.id}-start`;
        const endKey = `${conn.id}-end`;

        // Check if positions actually changed
        const startChanged =
          !lastPositions.current[startKey] ||
          !arraysEqual(lastPositions.current[startKey], newStartPos);
        const endChanged =
          !lastPositions.current[endKey] ||
          !arraysEqual(lastPositions.current[endKey], newEndPos);

        if (startChanged || endChanged || styleChangedConnIds.has(conn.id)) {
          hasChanges = true;

          // Store positions for next comparison
          if (startChanged) lastPositions.current[startKey] = [...newStartPos];
          if (endChanged) lastPositions.current[endKey] = [...newEndPos];
        }

        // Check if this connection needs animation
        const needsAnimation =
          (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
          (conn.dashDirection === 'left' || conn.dashDirection === 'right');

        // Create the updated connection object
        let updatedConn = { ...conn };

        // Always update positions, regardless of whether they've changed or the connection is animated
        updatedConn.start = { ...conn.start, position: newStartPos };
        updatedConn.end = { ...conn.end, position: newEndPos };

        // Update dash animation if needed
        if (needsAnimation) {
          // Track which connections are animated
          animatedConnIds.add(conn.id);
          hasChanges = true;

          // Calculate new dash offset for animated lines
          let newDashOffset = conn.dashOffset || 0;
          const animationStep = delta * ANIMATION_SPEED;

          if (conn.dashDirection === 'left') {
            newDashOffset = (newDashOffset - animationStep) % 1000;
          } else if (conn.dashDirection === 'right') {
            newDashOffset = (newDashOffset + animationStep) % 1000;
          }

          updatedConn.dashOffset = newDashOffset;
        }

        // Return the updated connection - positions are always updated
        return updatedConn;
      });

      // Only update state if something changed
      if (hasChanges) {
        recordStateUpdate(); // Record the state update for performance tracking

        // Use safer state update approach
        setConnections((current) => {
          // If connections list changed while we were calculating,
          // merge our updates with the current state
          if (current.length !== connections.length) {
            const updatedConnMap = new Map(
              updatedConnections.map((c) => [c.id, c])
            );

            return current.map((conn) => {
              const updatedConn = updatedConnMap.get(conn.id);
              if (!updatedConn) return conn;

              // Always update start and end positions for any connections that were updated
              return {
                ...conn,
                dashOffset: updatedConn.dashOffset || conn.dashOffset,
                start: { ...conn.start, position: updatedConn.start.position },
                end: { ...conn.end, position: updatedConn.end.position },
              };
            });
          }

          return updatedConnections;
        });

        lastUpdateTime.current = now;
      }
    }
  });

  return null;
};

export default ConnectionUpdater;
