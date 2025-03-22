import { objectsAreConnected } from '../services/connectionManager';
import * as THREE from 'three';

/**
 * Checks if a connection can be created between two objects
 * @param {object} startObj - The first object to connect
 * @param {object} endObj - The second object to connect
 * @returns {object} - Result with success boolean and message
 */
export const validateConnection = (startObj, endObj) => {
  if (!startObj || !endObj) {
    return {
      valid: false,
      message: 'Missing start or end object',
    };
  }

  // Standardize IDs
  const startId = String(startObj.id);
  const endId = String(endObj.id);

  // Check for self-connection
  if (startId === endId) {
    return {
      valid: false,
      message: 'Cannot connect an object to itself',
    };
  }

  // Check for existing connection
  if (objectsAreConnected(startId, endId)) {
    return {
      valid: false,
      message: 'Objects are already connected',
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
 * Prepares a standardized indicator object for text objects
 * @param {object} textObject - The text object reference
 * @param {string} id - The text object ID
 * @param {array} position - The object position
 * @param {array} scale - The object scale
 * @returns {object} - Standardized indicator object for connections
 */
export const prepareTextObjectIndicator = (textObject, id, position, scale) => {
  if (!textObject || !id) return null;

  const worldPos = new THREE.Vector3();
  const offset = new THREE.Vector3(0, scale[1] * 0.65, 0);

  textObject.updateWorldMatrix(true, false);
  textObject.getWorldPosition(worldPos);

  offset.applyQuaternion(textObject.quaternion);
  worldPos.add(offset);

  const positionArray = [worldPos.x, worldPos.y, worldPos.z];
  const stringId = String(id);

  return {
    type: 'text',
    position: positionArray,
    worldPosition: positionArray,
    face: 'top',
    facePosition: positionArray, // Add facePosition for connection lines
    faceCenter: positionArray, // Add faceCenter for consistent API
    plane: textObject,
    scale: [...scale],
    planeData: {
      position: [...position],
      scale: [...scale],
      worldMatrix: Array.from(textObject.matrixWorld.elements),
      offset: [0, scale[1] * 0.65, 0],
    },
    cube: {
      id: stringId,
      position,
      scale,
      userData: { objectId: stringId },
    },
    id: stringId,
    objectId: stringId,
  };
};
