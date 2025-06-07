import * as THREE from 'three';
import {
  saveObjectToCell,
  updateObjectInSpatialCell,
} from '../services/spatialObjectsService';

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
  setConnections,
  user,
  currentSpaceId,
  checkPositionJitter,
}) => {
  const objectId = id.toString();

  if (isDragStart) {
    // Object drag started - add to tracking set
    draggingObjectsRef.current.add(objectId);
  }

  // Store the movement timestamp to track the most recent change
  const moveTimestamp = Date.now();

  // Update local object state immediately for smooth UI
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

    // Skip if we think this is oscillation jitter
    if (
      checkPositionJitter &&
      existingObject.position &&
      checkPositionJitter(objectId, [
        newPosition.x,
        newPosition.y,
        newPosition.z,
      ])
    ) {
      return prev;
    }

    // Create updated objects array - prevent jitter by not changing refs
    return prev.map((obj) => {
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
  });

  // Find connections related to this object and update them
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
      };

      // Remove tracking flags before saving to database
      delete updatedObject._isDragging;
      delete updatedObject._moveTimestamp;
      delete updatedObject._transformActive; // Adding a brief delay before saving to avoid race conditions
      setTimeout(() => {
        const spaceOwnerId = window.currentSpaceOwner || user.uid;
        saveObjectToCell(spaceOwnerId, currentSpaceId, updatedObject);

        // Remove from dragging set when drag ends after save completes
        setTimeout(() => {
          draggingObjectsRef.current.delete(objectId);
        }, 300); // Longer timeout to prevent jitter after drag end
      }, 150);
    }
  }
};

/**
 * Handle object updates including scale, position, and other properties
 */
export const handleObjectUpdate = ({ id, updates, user, currentSpaceId }) => {
  if (!id || !currentSpaceId || !user?.uid) {
    return;
  }

  // Clean up internal flags before saving to database
  const cleanedUpdates = { ...updates };
  delete cleanedUpdates._finalPosition;
  delete cleanedUpdates._moveComplete;
  delete cleanedUpdates._transformActive;
  delete cleanedUpdates._isDragging;
  delete cleanedUpdates._moveTimestamp;

  // Update Firestore using spatial cell-based function
  const spaceOwnerId = window.currentSpaceOwner || user.uid;
  const objectData = { id, ...cleanedUpdates };
  updateObjectInSpatialCell(spaceOwnerId, currentSpaceId, objectData)
    .then(() => {
      // --- Optional: Update local state optimistically if needed ---
      // setObjects(prevObjects => ... );
      // lastUpdateRef.current[id] = { ...lastUpdateRef.current[id], ...updates };
    })
    .catch(() => {
      // Error updating Firestore - continue silently
    });
};
