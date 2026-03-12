import {
  saveObjectToCell,
  updateObjectInSpatialCell,
} from '../services/spatialObjectsService';
import useObjectsStore from '../stores/objectsStore';

/**
 * Handle object movement with position updates
 * @param {Object} params - Parameters object
 */
export const handleObjectMove = ({
  id,
  newPosition,
  isDragStart = false,
  isDragEnd = false,
  draggingObjectsRef,
  objects,
  setObjects,
  user,
  currentSpaceId,
}) => {
  const objectId = id.toString();

  if (isDragStart) {
    // Object drag started - add to tracking set
    draggingObjectsRef.current.add(objectId);
  }

  // Store the movement timestamp to track the most recent change
  const moveTimestamp = Date.now(); // Update local object state immediately for smooth UI
  setObjects((prev) => {
    // Find the existing object
    const existingObject = prev.find((obj) => obj.id === id);
    if (!existingObject) return prev;

    // Never update position for transform locked objects
    if (existingObject._transformLocked) {
      return prev;
    }

    // Skip update if this is a jittery movement coming from elsewhere
    if (
      existingObject._moveTimestamp &&
      existingObject._moveTimestamp > moveTimestamp
    ) {
      return prev;
    }

    // Position jitter checking is now handled at the App.jsx level
    // through checkPositionJitterWithHistory before calling this function

    // Create updated objects array - prevent jitter by not changing refs
    const updatedObjects = prev.map((obj) => {
      if (obj.id === id) {
        // Form new object carefully to avoid unnecessary re-renders
        const newObj = {
          ...obj,
          position: [newPosition.x, newPosition.y, newPosition.z],
          _moveTimestamp: moveTimestamp,
          _isDragging: true,
        };
        return newObj;
      }
      return obj;
    });

    return updatedObjects;
  });
  // Find connections related to this object and update them
  // NOTE: Connection updates are now handled by RealTimeConnectionUpdater
  // to avoid conflicts and ensure real-time visual updates
  /*
  setConnections((prev) => {
    // Check if any connections need updating
    const needsUpdate = prev.some(
      (conn) =>
        // Only update connections not locked by transforms and that are recent
        (conn.start?.objectId === objectId ||
          conn.end?.objectId === objectId) &&
        !conn._transformLocked &&
        (!conn._moveTimestamp || conn._moveTimestamp < moveTimestamp)
    );

    if (!needsUpdate) return prev;

    // Update all related connections
    return prev.map((conn) => {
      // If this connection isn't related to the moved object, leave it unchanged
      if (
        conn.start?.objectId !== objectId &&
        conn.end?.objectId !== objectId
      ) {
        return conn;
      }

      // Skip if connection is transform locked or has a more recent update
      if (
        conn._transformLocked ||
        (conn._moveTimestamp && conn._moveTimestamp > moveTimestamp)
      ) {
        return conn;
      }

      // Clone the connection to modify it
      const updatedConn = { ...conn };

      // Update positions for relevant ends
      if (updatedConn.start?.objectId === objectId) {
        // Re-calculate start position based on new object position
        const faceCenter = updatedConn.start.faceCenter || [0, 0, 0];
        const worldPos = new THREE.Vector3(...faceCenter);
        const worldMatrix = new THREE.Matrix4()
          .makeScale(...(updatedConn.start.cube?.scale || [1, 1, 1]))
          .setPosition(newPosition.x, newPosition.y, newPosition.z);
        worldPos.applyMatrix4(worldMatrix);

        // Update the position
        updatedConn.start.position = [worldPos.x, worldPos.y, worldPos.z];
        updatedConn.start._positionFromMove = true; // Flag this as an explicit position update
      }

      if (updatedConn.end?.objectId === objectId) {
        // Similar update for end position
        const faceCenter = updatedConn.end.faceCenter || [0, 0, 0];
        const worldPos = new THREE.Vector3(...faceCenter);
        const worldMatrix = new THREE.Matrix4()
          .makeScale(...(updatedConn.end.cube?.scale || [1, 1, 1]))
          .setPosition(newPosition.x, newPosition.y, newPosition.z);
        worldPos.applyMatrix4(worldMatrix);

        updatedConn.end.position = [worldPos.x, worldPos.y, worldPos.z];
        updatedConn.end._positionFromMove = true; // Flag this as an explicit position update
      }

      // Flag this connection as being dragged and track timestamp
      updatedConn._isDragging = true;
      updatedConn._moveTimestamp = moveTimestamp;
      updatedConn._needsUpdate = true; // Mark for immediate update

      return updatedConn;
    });
  });
  */
  // ONLY save to database when drag ends
  if (user && isDragEnd) {
    // Find the object from current state, not the passed objects array
    // to ensure we have the most recent state
    const currentObjects = objects || [];
    const object = currentObjects.find((obj) => obj.id === id);

    if (object) {
      // Skip saving if this object is transform locked
      if (object._transformLocked) {
        draggingObjectsRef.current.delete(objectId);
        return;
      }

      // When drag ends, clean up the movement timestamps and flags
      const updatedObject = {
        ...object,
        position: [newPosition.x, newPosition.y, newPosition.z],
        _finalPosition: true, // Mark this as a final confirmed position
      }; // Remove tracking flags before saving to database
      delete updatedObject._isDragging;
      delete updatedObject._moveTimestamp;
      delete updatedObject._transformActive;

      (async () => {
        try {
          // Check if we're still in initial loading phase
          const { isInitialLoading } = useObjectsStore.getState();
          if (isInitialLoading) {
            // Still remove from dragging set and clear flags
            setTimeout(() => {
              draggingObjectsRef.current.delete(objectId);
            }, 300);
            return;
          }

          const spaceOwnerId = window.currentSpaceOwner || user.uid;

          await saveObjectToCell(spaceOwnerId, currentSpaceId, updatedObject);

          // Clear transitioning flag if object was being transitioned between cells
          if (window.transitioningObjectsRef?.current?.has(id.toString())) {
            window.transitioningObjectsRef.current.delete(id.toString());
          }

          // IMPORTANT: Trigger immediate connection saves when object movement ends
          // This ensures that connection line positions are persisted immediately
          try {
            const { useConnectionStore } = await import('../stores');
            const { usePublicSpaceStore } = await import('../stores');
            const { useObjectsStore } = await import('../stores');

            const connectionStore = useConnectionStore.getState();
            const connections = connectionStore.connections;
            const objects = useObjectsStore.getState().objects;
            const saveConnectionsImmediately =
              usePublicSpaceStore.getState().saveConnectionsImmediately;
            let _objectIdSet = null; // lazy-init Set for O(1) existence checks
            // BUT EXCLUDE visual-only updates from RealTimeConnectionUpdater
            // AND EXCLUDE connections that are being deleted or reference deleted objects
            const connectionsToSave = connections.filter((conn) => {
              // Skip visual-only updates
              if (conn._visualUpdate) return false;

              // Only save if explicitly marked for saving
              if (!conn._moveTimestamp && !conn._needsSave) return false;

              // Skip connections in deletion blacklist
              if (connectionStore.deletingConnections.has(conn.id)) {
                console.log(
                  `🚫 [objectUpdateHandlers] Skipping save for deleted connection: ${conn.id}`
                );
                return false;
              }

              // PERFORMANCE: Use Set for O(1) existence checks instead of O(n) .some()
              if (!_objectIdSet) {
                _objectIdSet = new Set(objects.map(o => o.id.toString()));
              }
              const startObjectExists = _objectIdSet.has(conn.start?.objectId);
              const endObjectExists = _objectIdSet.has(conn.end?.objectId);

              if (!startObjectExists || !endObjectExists) {
                console.log(
                  `🚫 [objectUpdateHandlers] Skipping save for connection with missing objects: ${conn.id} (start: ${startObjectExists}, end: ${endObjectExists})`
                );
                return false;
              }

              return true;
            });

            if (connectionsToSave.length > 0) {
              console.log(
                `💾 [objectUpdateHandlers] Saving ${connectionsToSave.length} connections after object movement`
              );
              await saveConnectionsImmediately(
                connectionsToSave,
                user,
                currentSpaceId
              );
            }
          } catch (error) {
            console.warn(
              'Failed to save connection positions immediately:',
              error
            );
          }

          // Remove from dragging set when drag ends after save completes
          setTimeout(() => {
            draggingObjectsRef.current.delete(objectId);
          }, 300); // Longer timeout to prevent jitter after drag end
        } catch (error) {
          console.error(
            `🎯 [handleObjectMove] ❌ Failed to save object ${id}:`,
            error
          );
        }
      })();
    }
  }
};

/**
 * Handle object updates including scale, position, and other properties
 */
export const handleObjectUpdate = ({
  id,
  updates,
  user,
  currentSpaceId,
  lastUpdateRef,
}) => {
  if (!id || !currentSpaceId || !user?.uid) {
    return;
  }

  // Clean up internal flags before processing
  const cleanedUpdates = { ...updates };
  delete cleanedUpdates._finalPosition;
  delete cleanedUpdates._moveComplete;
  delete cleanedUpdates._transformActive;
  delete cleanedUpdates._isDragging;
  delete cleanedUpdates._moveTimestamp; // CRITICAL FIX: Get the complete current object to merge updates properly
  // This prevents partial objects from overwriting complete object data in the database
  let currentObjectData = lastUpdateRef?.current?.[id];

  // If we don't have the object in lastUpdateRef, get it from the objects store
  if (!currentObjectData) {
    const objectsStore = useObjectsStore.getState();
    currentObjectData = objectsStore.objects.find((obj) => obj.id === id) || {};
  }

  // Check if this is a position update (spatial partitioning required)
  const hasPosition =
    cleanedUpdates.position && Array.isArray(cleanedUpdates.position);

  // Check if position actually changed (only if both old and new positions exist)
  const positionChanged =
    hasPosition &&
    (!currentObjectData.position ||
      !Array.isArray(currentObjectData.position) ||
      cleanedUpdates.position[0] !== currentObjectData.position[0] ||
      cleanedUpdates.position[1] !== currentObjectData.position[1] ||
      cleanedUpdates.position[2] !== currentObjectData.position[2]);
  const completeObjectData = {
    id,
    ...currentObjectData, // Start with current complete state
    ...cleanedUpdates, // Apply updates on top
  };
  // FIXED: Always save changes to database, not just position updates
  // UI settings like colors, styles, text, etc. should persist immediately

  // Check if we're still in initial loading phase
  const { isInitialLoading } = useObjectsStore.getState();
  if (isInitialLoading) {
    return;
  }

  const spaceOwnerId = window.currentSpaceOwner || user.uid;
  if (positionChanged) {
    // For actual position updates, use spatial cell system
    updateObjectInSpatialCell(spaceOwnerId, currentSpaceId, completeObjectData)
      .then(() => {
        // Position update successful
      })
      .catch((error) => {
        console.warn(
          '[handleObjectUpdate] Error updating object position in spatial cell:',
          error
        );
      });
  } else {
    // For non-position updates (UI settings like color, style, text, etc.)
    // use a more lightweight update that doesn't require spatial partitioning
    saveObjectToCell(spaceOwnerId, currentSpaceId, completeObjectData).catch(
      (error) => {
        console.warn(
          '[handleObjectUpdate] Error saving object settings:',
          error
        );
      }
    );
  }
};
