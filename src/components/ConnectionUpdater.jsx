import { useRef, useEffect } from 'react';
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
 * ConnectionUpdater - Updates connection positions and animations with optimized performance
 */
const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
  transformingObjects,
}) => {
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 1; // Always update every frame for animations
  const lastPositions = useRef({});
  const ANIMATION_SPEED = 10; // Slightly increased for smoother animation
  const animationRequestRef = useRef();

  const lastUpdateTime = useRef(Date.now());
  const lastStyleChanges = useRef(new Map());
  const positionUpdateDebounceRef = useRef(new Map());

  // Use a ref to track connections pending updates to batch them
  const pendingAnimationUpdates = useRef(new Map());
  const pendingPositionUpdates = useRef(new Map());

  // Used to track whether we need to trigger a render
  const needsUpdate = useRef(false);

  // Store current dash offsets to interpolate between frames
  const currentDashOffsets = useRef(new Map());

  // Add a ref to track previously processed connections to avoid redundant processing
  const processedConnectionsRef = useRef(new Set());
  const connectionProcessCountRef = useRef({});

  // Separate animation loop for dash animations with proper timing
  useEffect(() => {
    // Initialize current values from existing connections
    connections.forEach((conn) => {
      if (conn.dashOffset !== undefined) {
        currentDashOffsets.current.set(conn.id, conn.dashOffset);
      }
    });

    // Use high-resolution timing for smooth animations
    let previousTimestamp = performance.now();

    const animateDashOffset = (timestamp) => {
      // Calculate precise delta time in seconds (with millisecond precision)
      const deltaTime = (timestamp - previousTimestamp) / 1000;
      previousTimestamp = timestamp;

      // Skip if delta time is unreasonably large (e.g. after tab was inactive)
      if (deltaTime > 0.1) {
        animationRequestRef.current = requestAnimationFrame(animateDashOffset);
        return;
      }

      // Only update if we have connections
      if (connections && connections.length > 0) {
        // Find all connections that need animation
        connections.forEach((conn) => {
          if (
            (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
            (conn.dashDirection === 'left' || conn.dashDirection === 'right')
          ) {
            // Get current dash offset value (or initialize it)
            const currentOffset =
              currentDashOffsets.current.get(conn.id) || conn.dashOffset || 0;

            // Calculate animation step with precise delta time for consistent speed
            const animationStep = deltaTime * ANIMATION_SPEED;

            // Calculate new offset with direction
            let newDashOffset;
            if (conn.dashDirection === 'left') {
              newDashOffset = (currentOffset - animationStep) % 1000;
              if (newDashOffset < 0) newDashOffset += 1000; // Keep positive for consistency
            } else {
              newDashOffset = (currentOffset + animationStep) % 1000;
            }

            // Update the current value in our ref for smooth interpolation
            currentDashOffsets.current.set(conn.id, newDashOffset);

            // Queue update to React state, but only at certain intervals
            pendingAnimationUpdates.current.set(conn.id, {
              id: conn.id,
              dashOffset: newDashOffset,
            });

            needsUpdate.current = true;
          }
        });
      }

      // Apply batched updates every 16ms (~60fps) for smooth animation
      // while preventing too many React state updates
      const now = performance.now();
      if (needsUpdate.current && now - lastUpdateTime.current > 16.67) {
        applyBatchedUpdates();
        lastUpdateTime.current = now;
      }

      animationRequestRef.current = requestAnimationFrame(animateDashOffset);
    };

    animationRequestRef.current = requestAnimationFrame(animateDashOffset);

    return () => {
      if (animationRequestRef.current) {
        cancelAnimationFrame(animationRequestRef.current);
      }
    };
  }, [connections]);

  // Apply all pending updates in a single React state update - optimized for minimal re-renders
  const applyBatchedUpdates = () => {
    if (!needsUpdate.current) return;

    recordStateUpdate();

    setConnections((current) => {
      // Create a new array only if we have changes to make
      if (
        pendingAnimationUpdates.current.size === 0 &&
        pendingPositionUpdates.current.size === 0
      ) {
        return current;
      }

      // Apply all pending updates in one pass
      return current.map((conn) => {
        const animUpdate = pendingAnimationUpdates.current.get(conn.id);
        const posUpdate = pendingPositionUpdates.current.get(conn.id);

        if (!animUpdate && !posUpdate) return conn;

        // Create a new connection object only if needed to avoid unnecessary re-renders
        const result = { ...conn };

        // Apply animation updates (dash offset) with interpolation for smoothness
        if (animUpdate) {
          result.dashOffset = animUpdate.dashOffset;
        }

        // Apply position updates
        if (posUpdate && !conn._transformLocked) {
          // Skip position updates for locked or recently moved connections
          if (
            !conn._isDragging ||
            !conn._moveTimestamp ||
            Date.now() - conn._moveTimestamp > 500
          ) {
            if (posUpdate.start)
              result.start = { ...conn.start, position: posUpdate.start };
            if (posUpdate.end)
              result.end = { ...conn.end, position: posUpdate.end };

            // Clear dragging flags
            delete result._isDragging;
            delete result._moveTimestamp;
          }
        }

        return result;
      });
    });

    // Clear pending updates
    pendingAnimationUpdates.current.clear();
    pendingPositionUpdates.current.clear();
    needsUpdate.current = false;
  };

  // Handle position updates on a different timing than animations
  useFrame((state, delta) => {
    frameCount.current += 1;
    recordFrameTime(delta * 1000);

    // Only process position updates every few frames
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    // Skip during active transformations - prevents visual jitter
    if (transformingObjects.current.size > 0) return;

    const now = Date.now();

    // Process connections for position updates
    if (connections.length > 0) {
      processPositionUpdates(connections, now);
    }
  });

  // Enhanced position update processing with better TextObject handling
  const processPositionUpdates = (connections, now) => {
    let hasChanges = false;

    // Reset processed connections counter every 2 seconds to prevent stale state
    if (now - (lastUpdateTime.current || 0) > 2000) {
      processedConnectionsRef.current.clear();
      connectionProcessCountRef.current = {};
    }

    connections.forEach((conn) => {
      try {
        // Skip if this connection has been processed too many times in quick succession
        const processCount = connectionProcessCountRef.current[conn.id] || 0;
        if (
          processCount > 5 &&
          now - (positionUpdateDebounceRef.current.get(conn.id) || 0) < 1000
        ) {
          return;
        }

        // Update process count
        connectionProcessCountRef.current[conn.id] = processCount + 1;

        // Enhanced detection of text objects and their movement states
        const startIsText =
          conn.start?.type === 'text' ||
          conn.start?.cube?.type === 'textObject' ||
          conn.start?.objectId?.toString().includes('text');

        const endIsText =
          conn.end?.type === 'text' ||
          conn.end?.cube?.type === 'textObject' ||
          conn.end?.objectId?.toString().includes('text');

        // Enhanced detection of plane objects
        const startIsPlane =
          conn.start?.type === 'plane' ||
          conn.start?.plane?.userData?.isPlane ||
          (conn.start?.objectId &&
            String(conn.start.objectId).includes('plane'));

        const endIsPlane =
          conn.end?.type === 'plane' ||
          conn.end?.plane?.userData?.isPlane ||
          (conn.end?.objectId && String(conn.end.objectId).includes('plane'));

        // Check if object is actively moving by examining flags
        const startIsMoving =
          (startIsText &&
            (conn.start?.cube?._textObjectMoving ||
              conn.start?._transformActive ||
              (conn.start?.cube?.userData?._lastMoveTime &&
                now - conn.start.cube.userData._lastMoveTime < 500))) ||
          (startIsPlane &&
            (conn.start?.plane?.userData?._isDragging ||
              conn.start?.plane?.userData?.isMoving ||
              (conn.start?.plane?.userData?._lastUpdateTime &&
                now - conn.start.plane.userData._lastUpdateTime < 500)));

        const endIsMoving =
          (endIsText &&
            (conn.end?.cube?._textObjectMoving ||
              conn.end?._transformActive ||
              (conn.end?.cube?.userData?._lastMoveTime &&
                now - conn.end.cube.userData._lastMoveTime < 500))) ||
          (endIsPlane &&
            (conn.end?.plane?.userData?._isDragging ||
              conn.end?.plane?.userData?.isMoving ||
              (conn.end?.plane?.userData?._lastUpdateTime &&
                now - conn.end.plane.userData._lastUpdateTime < 500)));

        // Skip locked connections or recently moved ones (unless object is moving)
        if (
          conn._transformLocked ||
          (conn._isDragging &&
            conn._moveTimestamp &&
            now - conn._moveTimestamp < 200 &&
            !startIsMoving &&
            !endIsMoving)
        ) {
          return;
        }

        // Special handling for text objects and plane objects that are currently moving
        if (startIsText || endIsText || startIsPlane || endIsPlane) {
          // Calculate positions with priority for live object data
          let newStartPos, newEndPos;

          // Handle start position calculation
          if (startIsText) {
            if (startIsMoving) {
              // For moving text objects, use the most direct position data
              newStartPos =
                conn.start?.cube?.userData?.indicatorWorldPosition ||
                conn.start?.cube?.userData?.connectionData?.indicatorPosition ||
                conn.start?.worldPosition ||
                calculateFacePosition(conn.start);
            } else {
              // For static text objects, calculate position
              newStartPos = calculateFacePosition(conn.start);
            }
          } else if (startIsPlane) {
            if (startIsMoving) {
              // For moving planes, use the most direct position data
              newStartPos =
                conn.start?.plane?.userData?.indicatorWorldPosition ||
                conn.start?.worldPosition ||
                conn.start?._indicatorWorldPosition ||
                calculateFacePosition(conn.start);
            } else {
              // For static planes, calculate position
              newStartPos = calculateFacePosition(conn.start);
            }
          } else {
            // Normal calculation for regular objects
            newStartPos = calculateFacePosition(conn.start);
          }

          // Handle end position calculation
          if (endIsText) {
            if (endIsMoving) {
              // For moving text objects, use direct position data
              newEndPos =
                conn.end?.cube?.userData?.indicatorWorldPosition ||
                conn.end?.cube?.userData?.connectionData?.indicatorPosition ||
                conn.end?.worldPosition ||
                calculateFacePosition(conn.end);
            } else {
              // For static text objects, calculate position
              newEndPos = calculateFacePosition(conn.end);
            }
          } else if (endIsPlane) {
            if (endIsMoving) {
              // For moving planes, use the most direct position data
              newEndPos =
                conn.end?.plane?.userData?.indicatorWorldPosition ||
                conn.end?.worldPosition ||
                conn.end?._indicatorWorldPosition ||
                calculateFacePosition(conn.end);
            } else {
              // For static planes, calculate position
              newEndPos = calculateFacePosition(conn.end);
            }
          } else {
            // Normal calculation for regular objects
            newEndPos = calculateFacePosition(conn.end);
          }

          // Safety check for valid positions
          if (
            !newStartPos ||
            !newEndPos ||
            !Array.isArray(newStartPos) ||
            !Array.isArray(newEndPos) ||
            newStartPos.some(isNaN) ||
            newEndPos.some(isNaN)
          ) {
            console.warn('Invalid position data for connection', conn.id);
            return;
          }

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
            needsUpdate.current = true;

            // Store positions and queue updates with higher priority for moving objects
            if (startChanged) {
              lastPositions.current[startKey] = [...newStartPos];
              positionUpdateDebounceRef.current.set(conn.id, now);

              const existing =
                pendingPositionUpdates.current.get(conn.id) || {};
              pendingPositionUpdates.current.set(conn.id, {
                ...existing,
                id: conn.id,
                start: newStartPos,
                priority: startIsMoving ? 3 : 1, // Higher priority (3) for actively moving objects
              });
            }

            if (endChanged) {
              lastPositions.current[endKey] = [...newEndPos];
              positionUpdateDebounceRef.current.set(conn.id, now);

              const existing =
                pendingPositionUpdates.current.get(conn.id) || {};
              pendingPositionUpdates.current.set(conn.id, {
                ...existing,
                id: conn.id,
                end: newEndPos,
                priority: endIsMoving ? 3 : 1, // Higher priority for actively moving objects
              });
            }
          }
        } else {
          // Original logic for regular objects
          // Check if this connection should have position updates debounced
          const lastPositionUpdate =
            positionUpdateDebounceRef.current.get(conn.id) || 0;
          const shouldDebouncePosition =
            now - lastPositionUpdate < 500 && !conn._needsUpdate;

          if (shouldDebouncePosition) return;

          // Calculate new positions
          const newStartPos = calculateFacePosition(conn.start);
          const newEndPos = calculateFacePosition(conn.end);

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
            needsUpdate.current = true;

            // Store positions for next comparison
            if (startChanged) {
              lastPositions.current[startKey] = [...newStartPos];
              positionUpdateDebounceRef.current.set(conn.id, now);

              // Queue position update
              const existing =
                pendingPositionUpdates.current.get(conn.id) || {};
              pendingPositionUpdates.current.set(conn.id, {
                ...existing,
                id: conn.id,
                start: newStartPos,
              });
            }

            if (endChanged) {
              lastPositions.current[endKey] = [...newEndPos];
              positionUpdateDebounceRef.current.set(conn.id, now);

              // Queue position update
              const existing =
                pendingPositionUpdates.current.get(conn.id) || {};
              pendingPositionUpdates.current.set(conn.id, {
                ...existing,
                id: conn.id,
                end: newEndPos,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing connection update:', error, conn);
      }
    });

    // Apply updates immediately for high-priority updates (moving text objects)
    // or after accumulating changes for regular updates
    if (
      (hasChanges &&
        pendingPositionUpdates.current.size > 0 &&
        Array.from(pendingPositionUpdates.current.values()).some(
          (update) => update.priority >= 3
        )) ||
      (hasChanges && pendingPositionUpdates.current.size > 2) ||
      (hasChanges && now - lastUpdateTime.current > 50) // Shorter interval for more responsive updates
    ) {
      applyBatchedUpdates();
      lastUpdateTime.current = now;

      // Reset counters after successful update
      setTimeout(() => {
        connectionProcessCountRef.current = {};
      }, 500);
    }
  };

  return null;
};

export default ConnectionUpdater;
