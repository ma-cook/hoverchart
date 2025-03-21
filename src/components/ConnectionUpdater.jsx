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
  const positionUpdateDebounceRef = useRef(new Map()); // Debounce position updates

  useFrame((state, delta) => {
    frameCount.current += 1;
    recordFrameTime(delta * 1000);

    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    // Determine update interval based on active transformations
    const hasActiveTransforms = transformingObjects.current.size > 0;
    const updateInterval = hasActiveTransforms ? 50 : 100;

    if (timeSinceLastUpdate < updateInterval) return;

    // Handle animations differently during active transformations
    if (hasActiveTransforms) {
      // During transforms, only update animations for non-attached connections
      updateAnimationsOnly(connections, delta, now);
      return;
    }

    // Process all connections during normal operation
    if (connections.length > 0) {
      processConnections(connections, now, delta);
    }
  });

  // Update only dash animations during transforms
  const updateAnimationsOnly = (connections, delta, now) => {
    const animatedConnections = connections.filter(
      (conn) =>
        // Skip connections that are transform-locked
        !conn._transformLocked &&
        (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
        (conn.dashDirection === 'left' || conn.dashDirection === 'right')
    );

    if (animatedConnections.length === 0) return;

    const updatedConnections = animatedConnections.map((conn) => {
      let newDashOffset = conn.dashOffset || 0;
      const animationStep = delta * ANIMATION_SPEED;

      if (conn.dashDirection === 'left') {
        newDashOffset = (newDashOffset - animationStep) % 1000;
      } else if (conn.dashDirection === 'right') {
        newDashOffset = (newDashOffset + animationStep) % 1000;
      }

      return {
        ...conn,
        dashOffset: newDashOffset,
      };
    });

    setConnections((current) => {
      return current.map((conn) => {
        const updated = updatedConnections.find((u) => u.id === conn.id);
        if (updated) {
          return { ...conn, dashOffset: updated.dashOffset };
        }
        return conn;
      });
    });

    lastUpdateTime.current = now;
  };

  // Process connections - both positions and animations
  const processConnections = (connections, now, delta) => {
    let hasChanges = false;
    const animatedConnIds = new Set();
    const styleChangedConnIds = new Set();
    const positionChangedConnIds = new Set();

    // First identify connections with recent style changes
    connections.forEach((conn) => {
      if (conn._lastStyleUpdate && now - conn._lastStyleUpdate < 3000) {
        styleChangedConnIds.add(conn.id);
        lastStyleChanges.current.set(conn.id, conn._lastStyleUpdate);
      }

      // Identify connections that need immediate position update
      if (conn._needsUpdate || conn._positionFromMove) {
        positionChangedConnIds.add(conn.id);
      }
    });

    // Clean up old style changes
    Array.from(lastStyleChanges.current.entries()).forEach(
      ([id, timestamp]) => {
        if (now - timestamp > 3000) {
          lastStyleChanges.current.delete(id);
        }
      }
    );

    // Process each connection
    const updatedConnections = connections.map((conn) => {
      // Skip locked connections or those being actively dragged (recent movement)
      if (conn._transformLocked) {
        return conn;
      }

      // For connections that were just moved, preserve their position and just continue animation
      if (
        conn._isDragging &&
        conn._moveTimestamp &&
        now - conn._moveTimestamp < 200
      ) {
        // Just update animation if needed
        if (
          (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
          (conn.dashDirection === 'left' || conn.dashDirection === 'right')
        ) {
          hasChanges = true;
          let newDashOffset = conn.dashOffset || 0;
          const animationStep = delta * ANIMATION_SPEED;

          if (conn.dashDirection === 'left') {
            newDashOffset = (newDashOffset - animationStep) % 1000;
          } else if (conn.dashDirection === 'right') {
            newDashOffset = (newDashOffset + animationStep) % 1000;
          }

          return { ...conn, dashOffset: newDashOffset };
        }
        return conn;
      }

      // Check if this connection should have position updates debounced
      const lastPositionUpdate =
        positionUpdateDebounceRef.current.get(conn.id) || 0;
      const shouldDebouncePosition =
        now - lastPositionUpdate < 500 && !positionChangedConnIds.has(conn.id);

      // Always recalculate positions unless debounced
      let newStartPos = shouldDebouncePosition
        ? conn.start.position
        : calculateFacePosition(conn.start);
      let newEndPos = shouldDebouncePosition
        ? conn.end.position
        : calculateFacePosition(conn.end);

      const startKey = `${conn.id}-start`;
      const endKey = `${conn.id}-end`;

      // Check if positions actually changed
      const startChanged =
        !shouldDebouncePosition &&
        (!lastPositions.current[startKey] ||
          !arraysEqual(lastPositions.current[startKey], newStartPos));

      const endChanged =
        !shouldDebouncePosition &&
        (!lastPositions.current[endKey] ||
          !arraysEqual(lastPositions.current[endKey], newEndPos));

      if (startChanged || endChanged || styleChangedConnIds.has(conn.id)) {
        hasChanges = true;

        // Store positions for next comparison
        if (startChanged) {
          lastPositions.current[startKey] = [...newStartPos];
          positionUpdateDebounceRef.current.set(conn.id, now);
        }
        if (endChanged) {
          lastPositions.current[endKey] = [...newEndPos];
          positionUpdateDebounceRef.current.set(conn.id, now);
        }
      }

      // Check if animation is needed
      const needsAnimation =
        (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
        (conn.dashDirection === 'left' || conn.dashDirection === 'right');

      // Create the updated connection object
      const updatedConn = { ...conn };

      // Clear any one-time flags
      delete updatedConn._needsUpdate;
      delete updatedConn._positionFromMove;

      // Update positions if changed and not dragging
      if ((startChanged || endChanged) && !conn._isDragging) {
        updatedConn.start = { ...conn.start, position: newStartPos };
        updatedConn.end = { ...conn.end, position: newEndPos };

        // Clear dragging flags if they exist
        delete updatedConn._isDragging;
        delete updatedConn._moveTimestamp;
      }

      // Update dash animation if needed
      if (needsAnimation) {
        animatedConnIds.add(conn.id);
        hasChanges = true;

        // Calculate new dash offset
        let newDashOffset = conn.dashOffset || 0;
        const animationStep = delta * ANIMATION_SPEED;

        if (conn.dashDirection === 'left') {
          newDashOffset = (newDashOffset - animationStep) % 1000;
        } else if (conn.dashDirection === 'right') {
          newDashOffset = (newDashOffset + animationStep) % 1000;
        }

        updatedConn.dashOffset = newDashOffset;
      }

      return updatedConn;
    });

    // Only update state if something changed
    if (hasChanges) {
      recordStateUpdate();

      setConnections((current) => {
        // Handle if connections array changed while calculating
        if (current.length !== connections.length) {
          const updatedConnMap = new Map(
            updatedConnections.map((c) => [c.id, c])
          );

          return current.map((conn) => {
            const updatedConn = updatedConnMap.get(conn.id);
            if (!updatedConn) return conn;

            // Skip position updates for locked or recently moved connections
            if (
              conn._transformLocked ||
              (conn._isDragging &&
                conn._moveTimestamp &&
                now - conn._moveTimestamp < 500)
            ) {
              return {
                ...conn,
                dashOffset: updatedConn.dashOffset || conn.dashOffset,
              };
            }

            // For all other connections, apply full updates
            return {
              ...conn,
              dashOffset: updatedConn.dashOffset || conn.dashOffset,
              start: updatedConn.start || conn.start,
              end: updatedConn.end || conn.end,
              _isDragging: updatedConn._isDragging,
              _moveTimestamp: updatedConn._moveTimestamp,
            };
          });
        }

        return updatedConnections;
      });

      lastUpdateTime.current = now;
    }
  };

  return null;
};

export default ConnectionUpdater;
