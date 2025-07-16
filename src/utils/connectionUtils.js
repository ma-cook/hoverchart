import * as THREE from 'three';
import { useConnectionStore } from '../stores';

/**
 * Checks if a connection can be created between two face indicators
 * Allows multiple connections from the same face indicator as long as they don't
 * connect to the exact same destination face indicator
 * Allows connections between different faces of the same object
 * @param {object} startIndicator - The first indicator to connect
 * @param {object} endIndicator - The second indicator to connect
 * @returns {object} - Result with success boolean and message
 */
export const validateConnection = (startIndicator, endIndicator) => {
  if (!startIndicator || !endIndicator) {
    return {
      valid: false,
      message: 'Missing start or end indicator',
    };
  }

  // Extract object IDs and face information
  const startObjectId = String(
    startIndicator.cube?.id || startIndicator.id || startIndicator.objectId
  );
  const endObjectId = String(
    endIndicator.cube?.id || endIndicator.id || endIndicator.objectId
  );
  const startFace = startIndicator.face;
  const endFace = endIndicator.face;

  // Allow connections between different faces of the same object, but prevent face-to-itself connections
  if (startObjectId === endObjectId && startFace === endFace) {
    return {
      valid: false,
      message: 'Cannot connect a face to itself',
    };
  }

  // Check for existing connection between the exact same face pairs only
  // This allows multiple connections from the same face indicator to different destinations
  const connectionStore = useConnectionStore.getState();
  const existingConnection = connectionStore.connections.find(
    (conn) =>
      // Exact same face-to-face connection already exists
      (conn.start?.objectId === startObjectId &&
        conn.start?.face === startFace &&
        conn.end?.objectId === endObjectId &&
        conn.end?.face === endFace) ||
      // Or reverse direction
      (conn.start?.objectId === endObjectId &&
        conn.start?.face === endFace &&
        conn.end?.objectId === startObjectId &&
        conn.end?.face === startFace)
  );

  if (existingConnection) {
    return {
      valid: false,
      message: 'These specific face indicators are already connected',
    };
  }

  return { valid: true };
};

/**
 * Extracts a consistent ID from an indicator object, handling different object types
 * @param {object} indicator - The indicator object
 * @returns {string} - The extracted ID as a string
 */
export const getIndicatorId = (indicator) => {
  if (!indicator) return null;

  // Extract ID based on available properties
  const id = String(
    indicator.cube?.id ||
      indicator.id ||
      indicator.objectId ||
      indicator.cube?.userData?.objectId ||
      (indicator.plane && indicator.plane.userData?.id)
  );

  return id || null;
};

/**
 * Creates the key to track a connection between two objects
 * @param {string} id1 - First object ID
 * @param {string} id2 - Second object ID
 * @returns {string} - Connection key in consistent format
 */
export const getConnectionKey = (id1, id2) => {
  if (!id1 || !id2) return null;

  // Ensure consistent key format (alphabetical order)
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
};

/**
 * Prepares a consistent text object indicator format for connections
 * @param {Object} plane - The text object group reference
 * @param {string|number} id - Object ID
 * @param {Array} position - Object position
 * @param {Array} scale - Object scale
 * @returns {Object} - Formatted indicator object
 */
export const prepareTextObjectIndicator = (plane, id, position, scale) => {
  if (!plane) return null;

  try {
    // Get world position
    const worldPos = new THREE.Vector3();
    plane.getWorldPosition(worldPos);

    // Calculate indicator offset based on scale
    const offset = [0, scale[1] * 0.65, 0];

    // Apply offset to position
    const offsetVec = new THREE.Vector3(...offset);
    offsetVec.applyQuaternion(plane.quaternion);
    const indicatorPos = new THREE.Vector3(
      worldPos.x + offsetVec.x,
      worldPos.y + offsetVec.y,
      worldPos.z + offsetVec.z
    );

    // Extract matrix data
    plane.updateWorldMatrix(true, false);
    const worldMatrix = plane.matrixWorld.clone();

    // Create indicator object
    return {
      plane,
      type: 'text',
      position: [indicatorPos.x, indicatorPos.y, indicatorPos.z],
      worldPosition: [indicatorPos.x, indicatorPos.y, indicatorPos.z],
      objectId: String(id),
      id: String(id),
      face: 'top',
      scale,
      planeData: {
        worldMatrix: Array.from(worldMatrix.elements),
        position: [worldPos.x, worldPos.y, worldPos.z],
        scale,
        offset,
      },
      cube: {
        id: String(id),
        position: [worldPos.x, worldPos.y, worldPos.z],
        scale,
        userData: {
          id: String(id),
          objectId: String(id),
          indicatorPosition: [indicatorPos.x, indicatorPos.y, indicatorPos.z],
        },
      },
    };
  } catch (error) {
    console.error('Error preparing text object indicator:', error);
    return null;
  }
};

/**
 * Store-based utility functions for connection management
 */

/**
 * Check if two objects are connected using the connection store
 * @param {string} objectId1 - First object ID
 * @param {string} objectId2 - Second object ID
 * @returns {boolean} - True if objects are connected
 */
export const objectsAreConnectedInStore = (objectId1, objectId2) => {
  const connectionStore = useConnectionStore.getState();
  const connections = connectionStore.connections;

  return connections.some(
    (conn) =>
      (conn.start?.objectId === String(objectId1) &&
        conn.end?.objectId === String(objectId2)) ||
      (conn.start?.objectId === String(objectId2) &&
        conn.end?.objectId === String(objectId1))
  );
};

/**
 * Get all connections for a specific object using the connection store
 * @param {string} objectId - Object ID
 * @returns {Array} - Array of connections involving the object
 */
export const getConnectionsForObject = (objectId) => {
  const connectionStore = useConnectionStore.getState();
  return connectionStore.getConnectionsByObject(String(objectId));
};

/**
 * Create a new connection in the store
 * @param {Object} startPoint - Start point data
 * @param {Object} endPoint - End point data
 * @returns {string} - Connection ID
 */
export const createConnectionInStore = (startPoint, endPoint) => {
  const connectionStore = useConnectionStore.getState();
  const connectionId = connectionStore.generateConnectionId();

  connectionStore.createConnection(connectionId, {
    start: startPoint,
    end: endPoint,
  });

  return connectionId;
};

/**
 * Update connection positions when objects move
 * @param {string} objectId - Object that moved
 * @param {Array} newPosition - New position [x, y, z]
 */
export const updateConnectionPositionsInStore = (objectId, newPosition) => {
  const connectionStore = useConnectionStore.getState();
  connectionStore.updateConnectionPositions(String(objectId), newPosition);
};

/**
 * Remove all connections for an object when it's deleted
 * @param {string} objectId - Object being deleted
 */
export const removeConnectionsForObject = (objectId) => {
  const connectionStore = useConnectionStore.getState();
  connectionStore.deleteConnectionsByObject(String(objectId));
};

/**
 * Get connection creation mode state
 * @returns {boolean} - True if in connection creation mode
 */
export const isInConnectionCreationMode = () => {
  const connectionStore = useConnectionStore.getState();
  return connectionStore.connectionCreationMode;
};

/**
 * Start connection creation mode
 * @param {Object} startPoint - Starting point for connection
 */
export const startConnectionCreation = (startPoint) => {
  const connectionStore = useConnectionStore.getState();
  connectionStore.startConnectionCreation(startPoint);
};

/**
 * Complete connection creation
 * @param {Object} endPoint - End point for connection
 * @returns {string|null} - Connection ID if successful, null if failed
 */
export const completeConnectionCreation = (endPoint) => {
  const connectionStore = useConnectionStore.getState();
  return connectionStore.completeConnectionCreation(endPoint);
};

/**
 * Cancel connection creation mode
 */
export const cancelConnectionCreation = () => {
  const connectionStore = useConnectionStore.getState();
  connectionStore.cancelConnectionCreation();
};
