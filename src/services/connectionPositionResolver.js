import { calculateFaceWorldPosition } from '../components/cubeHelpers';
import { calculateFacePosition } from '../utils/facePositionUtils';

/**
 * Resolve connection positions to match current object positions
 * This is crucial for connections loaded from database that may have outdated position data
 * @param {Array} connections - Array of connections to resolve
 * @param {Array} objects - Array of current objects with up-to-date positions
 * @returns {Array} - Connections with resolved positions
 */
export const resolveConnectionPositions = (connections, objects) => {
  if (
    !connections ||
    !objects ||
    connections.length === 0 ||
    objects.length === 0
  ) {
    return connections || [];
  }

  return connections.map((connection) => {
    if (!connection.start?.objectId || !connection.end?.objectId) {
      return connection;
    }

    // Find the current objects by ID
    const startObject = objects.find(
      (obj) => obj.id.toString() === connection.start.objectId.toString()
    );
    const endObject = objects.find(
      (obj) => obj.id.toString() === connection.end.objectId.toString()
    ); // If either object isn't found, return the connection as-is
    if (!startObject || !endObject) {
      return connection;
    }

    // Create resolved connection with updated positions
    const resolvedConnection = { ...connection }; // Resolve start position
    resolvedConnection.start = resolveConnectionEndpoint(
      connection.start,
      startObject
    );

    // Resolve end position
    resolvedConnection.end = resolveConnectionEndpoint(
      connection.end,
      endObject
    );

    return resolvedConnection;
  });
};

/**
 * Resolve a single connection endpoint (start or end) against current object position
 * @param {Object} endpoint - Connection endpoint data
 * @param {Object} currentObject - Current object with up-to-date position
 * @param {String} type - 'start' or 'end' for logging
 * @returns {Object} - Resolved endpoint data
 */
const resolveConnectionEndpoint = (endpoint, currentObject) => {
  const resolvedEndpoint = { ...endpoint };

  try {
    // For face-based connections (cubes, dodecahedrons), recalculate face position
    if (endpoint.face && endpoint.type !== 'text') {
      let faceWorldPosition;
      // Detect object type by face identifier
      if (typeof endpoint.face === 'number') {
        // Dodecahedron: face is a number (0-11)
        // Create an indicator object for calculateFacePosition
        const dodecahedronIndicator = {
          type: 'dodecahedron',
          face: endpoint.face,
          faceCenter: endpoint.faceCenter,
          cube: {
            position: currentObject.position,
            scale: currentObject.scale || [1, 1, 1],
          },
          position: currentObject.position,
          objectId: currentObject.id,
        };

        faceWorldPosition = calculateFacePosition(dodecahedronIndicator);
      } else {
        // Cube: face is a string ('top', 'bottom', etc.)
        faceWorldPosition = calculateFaceWorldPosition(
          currentObject.position,
          currentObject.scale || [1, 1, 1],
          endpoint.face
        );
      } // Update all position fields to maintain consistency
      resolvedEndpoint.position = faceWorldPosition;
      resolvedEndpoint.worldPosition = faceWorldPosition;
      resolvedEndpoint.facePosition = faceWorldPosition;
    }
    // For text objects, calculate indicator position
    else if (endpoint.type === 'text') {
      // Create indicator object for text position calculation
      const textIndicator = {
        type: 'text',
        objectId: currentObject.id,
        position: currentObject.position,
        scale: currentObject.scale || [15, 10, 1],
        // Preserve existing plane and planeData if available
        plane: endpoint.plane,
        planeData: endpoint.planeData,
      };

      const calculatedPosition = calculateFacePosition(textIndicator);

      // Update all position fields
      resolvedEndpoint.position = calculatedPosition;
      resolvedEndpoint.worldPosition = calculatedPosition;
      resolvedEndpoint.facePosition = calculatedPosition;
    } // For other object types, use object center position
    else {
      resolvedEndpoint.position = currentObject.position;
      resolvedEndpoint.worldPosition = currentObject.position;
      resolvedEndpoint.facePosition = currentObject.position;
    }

    // Update cube data to reflect current object
    if (resolvedEndpoint.cube) {
      resolvedEndpoint.cube = {
        ...resolvedEndpoint.cube,
        position: currentObject.position,
        scale: currentObject.scale || resolvedEndpoint.cube.scale || [1, 1, 1],
      };
    }
  } catch {
    // Error resolving position for connection
    // Fallback to object position
    resolvedEndpoint.position = currentObject.position;
    resolvedEndpoint.worldPosition = currentObject.position;
  }

  return resolvedEndpoint;
};

/**
 * Check if connection positions need resolution (are they outdated?)
 * @param {Object} connection - Connection to check
 * @param {Array} objects - Current objects
 * @returns {Boolean} - True if positions need resolution
 */
export const connectionNeedsPositionResolution = (connection, objects) => {
  if (!connection.start?.objectId || !connection.end?.objectId) {
    return false;
  }

  const startObject = objects.find(
    (obj) => obj.id.toString() === connection.start.objectId.toString()
  );
  const endObject = objects.find(
    (obj) => obj.id.toString() === connection.end.objectId.toString()
  );

  if (!startObject || !endObject) {
    return false;
  }

  // Compare stored connection positions with current object positions
  // If they're significantly different, resolution is needed
  const POSITION_TOLERANCE = 1.0; // 1 unit tolerance

  const startPositionChanged = !positionsEqual(
    connection.start.position,
    startObject.position,
    POSITION_TOLERANCE
  );

  const endPositionChanged = !positionsEqual(
    connection.end.position,
    endObject.position,
    POSITION_TOLERANCE
  );

  return startPositionChanged || endPositionChanged;
};

/**
 * Compare two positions with tolerance
 * @param {Array} pos1 - First position [x, y, z]
 * @param {Array} pos2 - Second position [x, y, z]
 * @param {Number} tolerance - Tolerance for comparison
 * @returns {Boolean} - True if positions are equal within tolerance
 */
const positionsEqual = (pos1, pos2, tolerance = 0.1) => {
  if (!pos1 || !pos2) return false;
  if (!Array.isArray(pos1) || !Array.isArray(pos2)) return false;
  if (pos1.length !== 3 || pos2.length !== 3) return false;

  return (
    Math.abs(pos1[0] - pos2[0]) <= tolerance &&
    Math.abs(pos1[1] - pos2[1]) <= tolerance &&
    Math.abs(pos1[2] - pos2[2]) <= tolerance
  );
};
