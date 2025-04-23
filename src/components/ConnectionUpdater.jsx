import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { registerUserPresence } from '../services/webrtcservice';

// Helper for array comparison
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
  transformingObjects,
  userId,
  spaceId,
}) => {
  const frameCount = useRef(0);
  const lastPositions = useRef({});
  const lastUpdateTime = useRef(Date.now());
  const pendingUpdates = useRef(new Map());

  // Apply batched updates
  const applyUpdates = () => {
    if (pendingUpdates.current.size === 0) return;

    setConnections((current) =>
      current.map((conn) => {
        const update = pendingUpdates.current.get(conn.id);
        if (!update) return conn;

        return {
          ...conn,
          ...(update.start
            ? { start: { ...conn.start, position: update.start } }
            : {}),
          ...(update.end ? { end: { ...conn.end, position: update.end } } : {}),
        };
      })
    );

    pendingUpdates.current.clear();
    lastUpdateTime.current = Date.now();
  };

  // Update positions on each frame
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return; // Update every other frame
    if (transformingObjects.current.size > 0) return; // Skip during transformations

    connections.forEach((conn) => {
      if (conn._transformLocked) return;

      const newStartPos = calculateFacePosition(conn.start);
      const newEndPos = calculateFacePosition(conn.end);

      const startKey = `${conn.id}-start`;
      const endKey = `${conn.id}-end`;

      // Check if positions changed
      const startChanged =
        !lastPositions.current[startKey] ||
        !arraysEqual(lastPositions.current[startKey], newStartPos);
      const endChanged =
        !lastPositions.current[endKey] ||
        !arraysEqual(lastPositions.current[endKey], newEndPos);

      if (startChanged || endChanged) {
        if (startChanged) lastPositions.current[startKey] = [...newStartPos];
        if (endChanged) lastPositions.current[endKey] = [...newEndPos];

        pendingUpdates.current.set(conn.id, {
          id: conn.id,
          ...(startChanged ? { start: newStartPos } : {}),
          ...(endChanged ? { end: newEndPos } : {}),
        });

        // Apply updates if enough have accumulated or enough time has passed
        if (
          pendingUpdates.current.size > 2 ||
          Date.now() - lastUpdateTime.current > 50
        ) {
          applyUpdates();
        }
      }
    });
  });

  // Register user presence
  useEffect(() => {
    if (!userId || !spaceId) return;

    registerUserPresence(userId, spaceId);
  }, [userId, spaceId]);

  return null;
};

export default ConnectionUpdater;
