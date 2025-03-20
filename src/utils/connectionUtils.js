import { objectsAreConnected } from '../services/connectionManager';

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
