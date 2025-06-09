import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Component that updates connection positions in real-time as objects move
 */
const RealTimeConnectionUpdater = ({
  connections,
  setConnections,
  objects,
  user,
  currentSpaceId,
}) => {
  const lastObjectPositionsRef = useRef(new Map());
  const databaseSaveTimeoutRef = useRef(new Map());

  // Track object position changes and update connections immediately
  useFrame(() => {
    if (!connections.length || !objects.length) return;

    const objectPositionMap = new Map();
    let hasPositionChanges = false;

    // Check for object position changes
    objects.forEach((obj) => {
      const objId = obj.id.toString();
      const currentPos = obj.position;
      const lastPos = lastObjectPositionsRef.current.get(objId);

      if (
        !lastPos ||
        Math.abs(currentPos[0] - lastPos[0]) > 0.001 ||
        Math.abs(currentPos[1] - lastPos[1]) > 0.001 ||
        Math.abs(currentPos[2] - lastPos[2]) > 0.001
      ) {
        objectPositionMap.set(objId, currentPos);
        lastObjectPositionsRef.current.set(objId, [...currentPos]);
        hasPositionChanges = true;
      }
    });

    // If no position changes, skip update
    if (!hasPositionChanges) return;

    // Update connections that are affected by object movement
    setConnections((prevConnections) => {
      return prevConnections.map((conn) => {
        let needsUpdate = false;
        let updatedConn = { ...conn };

        // Check if start object moved
        const startObjectId = conn.start?.objectId?.toString();
        if (startObjectId && objectPositionMap.has(startObjectId)) {
          const newObjectPos = objectPositionMap.get(startObjectId);

          // Update start position to follow the object
          updatedConn.start = {
            ...updatedConn.start,
            position: [...newObjectPos],
            worldPosition: [...newObjectPos],
            facePosition: [...newObjectPos],
          };
          needsUpdate = true;

          // Clear existing database save timeout for this connection
          if (databaseSaveTimeoutRef.current.has(conn.id)) {
            clearTimeout(databaseSaveTimeoutRef.current.get(conn.id));
          }

          // Set new timeout to save to database after movement stops
          const saveTimeout = setTimeout(async () => {
            if (user && currentSpaceId) {
              try {
                const spaceOwnerId = window.currentSpaceOwner || user.uid;
                const { saveConnection } = await import(
                  '../services/connectionsService'
                );

                // Get the latest connection state
                const connectionToSave = { ...updatedConn };
                delete connectionToSave._localUpdate;

                await saveConnection(
                  spaceOwnerId,
                  currentSpaceId,
                  connectionToSave
                );
                console.log(
                  `💾 Saved connection ${conn.id} position after object ${startObjectId} movement`
                );
              } catch (error) {
                console.error(`❌ Failed to save connection position:`, error);
              }
            }
            databaseSaveTimeoutRef.current.delete(conn.id);
          }, 1000); // Save 1 second after movement stops

          databaseSaveTimeoutRef.current.set(conn.id, saveTimeout);
        }

        // Check if end object moved
        const endObjectId = conn.end?.objectId?.toString();
        if (endObjectId && objectPositionMap.has(endObjectId)) {
          const newObjectPos = objectPositionMap.get(endObjectId);

          // Update end position to follow the object
          updatedConn.end = {
            ...updatedConn.end,
            position: [...newObjectPos],
            worldPosition: [...newObjectPos],
            facePosition: [...newObjectPos],
          };
          needsUpdate = true;

          // Clear existing database save timeout for this connection
          if (databaseSaveTimeoutRef.current.has(conn.id)) {
            clearTimeout(databaseSaveTimeoutRef.current.get(conn.id));
          }

          // Set new timeout to save to database after movement stops
          const saveTimeout = setTimeout(async () => {
            if (user && currentSpaceId) {
              try {
                const spaceOwnerId = window.currentSpaceOwner || user.uid;
                const { saveConnection } = await import(
                  '../services/connectionsService'
                );

                // Get the latest connection state
                const connectionToSave = { ...updatedConn };
                delete connectionToSave._localUpdate;

                await saveConnection(
                  spaceOwnerId,
                  currentSpaceId,
                  connectionToSave
                );
                console.log(
                  `💾 Saved connection ${conn.id} position after object ${endObjectId} movement`
                );
              } catch (error) {
                console.error(`❌ Failed to save connection position:`, error);
              }
            }
            databaseSaveTimeoutRef.current.delete(conn.id);
          }, 1000); // Save 1 second after movement stops

          databaseSaveTimeoutRef.current.set(conn.id, saveTimeout);
        }

        if (needsUpdate) {
          updatedConn._localUpdate = Date.now(); // Mark as local update
          return updatedConn;
        }

        return conn;
      });
    });
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      databaseSaveTimeoutRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      databaseSaveTimeoutRef.current.clear();
    };
  }, []);

  return null;
};

export default RealTimeConnectionUpdater;
