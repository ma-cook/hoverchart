import * as THREE from 'three';
import { saveObject } from '../services/objectsService';
import isEqual from 'lodash/isEqual';

/**
 * Handle object movement with position updates
 * @param {Object} params - Parameters object
 * @param {any} params.id - Object ID
 * @param {Object} params.newPosition - New position coordinates {x, y, z}
 * @param {boolean} params.isDragStart - Whether this is the start of a drag operation
 * @param {boolean} params.isDragEnd - Whether this is the end of a drag operation
 * @param {Set} params.draggingObjectsRef - Reference to tracked dragging objects
 * @param {Array} params.objects - Current objects array
 * @param {Function} params.setObjects - Function to update objects state
 * @param {Array} params.connections - Current connections array
 * @param {Function} params.setConnections - Function to update connections state
 * @param {Object} params.user - Current user object
 * @param {string} params.currentSpaceId - Current space ID
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
}) => {
  const objectId = id.toString();

  if (isDragStart) {
    // Object drag started - add to tracking set
    draggingObjectsRef.current.add(objectId);
  }

  // Update local object state immediately for smooth UI
  setObjects((prev) =>
    prev.map((obj) =>
      obj.id === id
        ? {
            ...obj,
            position: [newPosition.x, newPosition.y, newPosition.z],
          }
        : obj
    )
  );

  // Find connections related to this object and update them
  setConnections((prev) => {
    // Check if any connections need updating
    const needsUpdate = prev.some(
      (conn) =>
        conn.start?.objectId === objectId || conn.end?.objectId === objectId
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

      // Clone the connection to modify it
      const updatedConn = { ...conn };

      // Update positions for relevant ends
      if (updatedConn.start?.objectId === objectId) {
        // Re-calculate start position based on new object position
        const faceCenter = updatedConn.start.faceCenter || [0, 0, 0];
        // Transform the face position to world coordinates
        const worldPos = new THREE.Vector3(...faceCenter);
        // Apply the object's transform
        const worldMatrix = new THREE.Matrix4()
          .makeScale(...(updatedConn.start.cube?.scale || [1, 1, 1]))
          .setPosition(newPosition.x, newPosition.y, newPosition.z);
        worldPos.applyMatrix4(worldMatrix);

        // Update the position
        updatedConn.start.position = [worldPos.x, worldPos.y, worldPos.z];
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
      }

      // Make sure this update is properly tracked by adding a flag
      // This will signal to the connection updater that positions need to be recalculated
      updatedConn._positionMoved = Date.now();

      return updatedConn;
    });
  });

  // ONLY save to database when drag ends or in special cases
  if (user && isDragEnd) {
    const object = objects.find((obj) => obj.id === id);
    if (object) {
      const updatedObject = {
        ...object,
        position: [newPosition.x, newPosition.y, newPosition.z],
      };

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveObject(spaceOwnerId, currentSpaceId, updatedObject);

      // Remove from dragging set when drag ends
      draggingObjectsRef.current.delete(objectId);
    }
  }
};

/**
 * Handle object updates including scale, position, and other properties
 * @param {Object} params - Parameters object
 * @param {any} params.id - Object ID
 * @param {Object} params.updates - Properties to update
 * @param {Object} params.transformingObjects - Reference to objects being transformed
 * @param {Object} params.lastUpdateRef - Reference to track last updates for debouncing
 * @param {Function} params.setObjects - Function to update objects state
 * @param {Object} params.user - Current user object
 * @param {string} params.currentSpaceId - Current space ID
 */
export const handleObjectUpdate = ({
  id,
  updates,
  transformingObjects,
  lastUpdateRef,
  setObjects,
  user,
  currentSpaceId,
}) => {
  if (!user || !id || !currentSpaceId) return;

  // Only track object ID during transform, don't manipulate matrices
  if (updates.scale && transformingObjects.current.has(id.toString())) {
    setObjects((prev) => {
      return prev.map((obj) => {
        if (obj.id === id) {
          const newObj = { ...obj, ...updates };
          lastUpdateRef.current[id] = newObj;
          return newObj;
        }
        return obj;
      });
    });

    // Let Three.js handle the matrices naturally
    return;
  }

  // Regular update process for non-scaling changes
  setObjects((prev) => {
    return prev.map((obj) => {
      if (obj.id === id) {
        const newObj = { ...obj, ...updates };

        // Use correct owner ID
        const spaceOwnerId = window.currentSpaceOwner || user.uid;

        // Check if position has changed
        if (updates.position && !isEqual(obj.position, updates.position)) {
          // Save immediately for position changes
          saveObject(spaceOwnerId, currentSpaceId, newObj);
          lastUpdateRef.current[id] = newObj;
        } else {
          // Normal debounced save for other changes
          if (!isEqual(lastUpdateRef.current[id], newObj)) {
            lastUpdateRef.current[id] = newObj;
            saveObject(spaceOwnerId, currentSpaceId, newObj);
          }
        }
        return newObj;
      }
      return obj;
    });
  });
};
