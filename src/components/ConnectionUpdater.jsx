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

  // Process position updates separately from animations
  const processPositionUpdates = (connections, now) => {
    let hasChanges = false;

    connections.forEach((conn) => {
      // Skip locked connections or those being actively dragged
      if (
        conn._transformLocked ||
        (conn._isDragging &&
          conn._moveTimestamp &&
          now - conn._moveTimestamp < 200)
      ) {
        return;
      }

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
          const existing = pendingPositionUpdates.current.get(conn.id) || {};
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
          const existing = pendingPositionUpdates.current.get(conn.id) || {};
          pendingPositionUpdates.current.set(conn.id, {
            ...existing,
            id: conn.id,
            end: newEndPos,
          });
        }
      }
    });

    // Apply updates if time elapsed or we have significant changes
    if (
      (hasChanges && pendingPositionUpdates.current.size > 2) ||
      now - lastUpdateTime.current > 100
    ) {
      applyBatchedUpdates();
      lastUpdateTime.current = now;
    }
  };

  return null;
};

export default ConnectionUpdater;
