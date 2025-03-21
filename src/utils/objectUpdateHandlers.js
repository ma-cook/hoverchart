import * as THREE from 'three';
import { saveObject } from '../services/objectsService';
import isEqual from 'lodash/isEqual';

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
  connections,
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
      delete updatedObject._transformActive;

      // Adding a brief delay before saving to avoid race conditions
      setTimeout(() => {
        const spaceOwnerId = window.currentSpaceOwner || user.uid;
        saveObject(spaceOwnerId, currentSpaceId, updatedObject);

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
export const handleObjectUpdate = ({
  id,
  updates,
  transformingObjects,
  lastUpdateRef,
  setObjects,
  user,
  currentSpaceId,
  checkPositionJitter,
}) => {
  if (!user || !id || !currentSpaceId) return;

  const updateTimestamp = Date.now();
  const isTransforming = transformingObjects.current.has(id.toString());
  const objId = id.toString();

  // Handle updates during transform with extreme caution
  setObjects((prev) => {
    const existingObj = prev.find((obj) => obj.id === id);

    if (!existingObj) return prev;

    // Critical: Never update transformLocked objects from outside their transform
    if (existingObj._transformLocked && !isTransforming) {
      return prev;
    }

    // Skip if there's a more recent update for this object
    if (
      existingObj._updateTimestamp &&
      existingObj._updateTimestamp > updateTimestamp
    ) {
      return prev;
    }

    // If this is a position update, check for jitter/oscillation
    if (
      updates.position &&
      checkPositionJitter &&
      checkPositionJitter(objId, updates.position)
    ) {
      // Skip position update but keep other properties
      const updatesWithoutPosition = { ...updates };
      delete updatesWithoutPosition.position;

      if (Object.keys(updatesWithoutPosition).length === 0) {
        return prev; // Nothing left to update
      }

      // Continue with non-position updates
      updates = updatesWithoutPosition;
    }

    // Special handling for transform operations
    if (isTransforming) {
      return prev.map((obj) => {
        if (obj.id === id) {
          // For transform operations, we always prioritize our local state
          const newObj = {
            ...obj,
            ...updates,
            _isTransforming: true,
            _updateTimestamp: updateTimestamp,
            // Keep transform lock in place
            _transformLocked: obj._transformLocked || true,
            _lockTime: obj._lockTime || updateTimestamp,
          };

          // Update last reference with clean object
          lastUpdateRef.current[id] = {
            ...newObj,
            _isTransforming: undefined,
            _updateTimestamp: undefined,
            _transformLocked: undefined,
            _lockTime: undefined,
          };

          return newObj;
        }
        return obj;
      });
    }

    // For normal updates, proceed as usual but verify locking
    return prev.map((obj) => {
      if (obj.id === id) {
        // Standard non-transform update flow

        // Filter out position updates for controlled objects
        let filteredUpdates = { ...updates };

        if (obj._transformLocked && filteredUpdates.position) {
          delete filteredUpdates.position;
        }

        // If no updates left after filtering, return unchanged object
        if (Object.keys(filteredUpdates).length === 0) {
          return obj;
        }

        const newObj = {
          ...obj,
          ...filteredUpdates,
          _updateTimestamp: updateTimestamp,
        };

        // Handle database updates with debouncing
        if (!obj._transformLocked && !obj._isDragging) {
          // Create clean version of object for database
          const cleanObj = { ...newObj };
          delete cleanObj._isTransforming;
          delete cleanObj._updateTimestamp;
          delete cleanObj._positionUpdated;
          delete cleanObj._saveTimeout;
          delete cleanObj._transformLocked;
          delete cleanObj._lockTime;
          delete cleanObj._isDragging;
          delete cleanObj._moveTimestamp;

          // Clear any existing save timeout
          if (newObj._saveTimeout) {
            clearTimeout(newObj._saveTimeout);
          }

          const saveTimeout = setTimeout(() => {
            const spaceOwnerId = window.currentSpaceOwner || user.uid;
            saveObject(spaceOwnerId, currentSpaceId, cleanObj);
          }, 300); // Longer debounce time to reduce saves

          newObj._saveTimeout = saveTimeout;
          lastUpdateRef.current[id] = cleanObj;
        }

        return newObj;
      }
      return obj;
    });
  });
};
