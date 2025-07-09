/**
 * Snapping utilities for aligning objects to axes
 */

import * as THREE from 'three';

/**
 * Threshold distance for snapping to an axis (in scene units)
 */
const SNAP_THRESHOLD = 10;

/**
 * Calculates if a position should snap to any axis of nearby objects
 * @param {Array} position - [x, y, z] position to check for snapping
 * @param {Array} objects - Array of all objects in the scene
 * @param {String} currentObjectId - ID of the object being moved (to exclude from snap calculations)
 * @returns {Object|null} - Object containing snap information or null if no snapping needed
 * @returns {Array} result.position - Snapped position [x, y, z]
 * @returns {String} result.snapToObjectId - ID of the object being snapped to
 * @returns {String} result.snapAxis - The axis being snapped to ('x', 'y', or 'z')
 * @returns {Array} result.linePoints - Points for the indicator line ([start, end])
 */
export const calculateAxisSnap = (position, objects, currentObjectId) => {
  try {
    // Validate inputs thoroughly
    if (!position || !Array.isArray(position) || position.length !== 3) {
      console.warn('Invalid position in calculateAxisSnap', position);
      return null;
    }

    // Ensure position contains valid numbers
    if (position.some((coord) => typeof coord !== 'number' || isNaN(coord))) {
      console.warn('Position contains non-numeric values', position);
      return null;
    }

    // Skip if no objects data
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      return null;
    }

    // Ensure we have a valid ID
    if (!currentObjectId) {
      console.warn('Missing currentObjectId in calculateAxisSnap');
      return null;
    }

    // Convert position to THREE.Vector3 for easier calculations
    const currentPosition = new THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );

    // Keep track of the closest axis and its distance
    let closestAxis = null;
    let closestDistance = SNAP_THRESHOLD;
    let closestAxisOrigin = null;
    let snapToObjectId = null;

    // Check each object for potential axis snaps
    for (const obj of objects) {
      // Skip the current object itself and objects without position
      if (obj.id === currentObjectId || !obj.position) continue;

      const objPosition = new THREE.Vector3(
        obj.position[0],
        obj.position[1],
        obj.position[2]
      );

      // Check snapping to X-axis of this object
      const distanceToXAxis = distanceToAxis(currentPosition, objPosition, 'x');
      if (distanceToXAxis < closestDistance) {
        closestDistance = distanceToXAxis;
        closestAxis = 'x';
        closestAxisOrigin = objPosition.clone();
        snapToObjectId = obj.id;
      }

      // Check snapping to Y-axis of this object
      const distanceToYAxis = distanceToAxis(currentPosition, objPosition, 'y');
      if (distanceToYAxis < closestDistance) {
        closestDistance = distanceToYAxis;
        closestAxis = 'y';
        closestAxisOrigin = objPosition.clone();
        snapToObjectId = obj.id;
      }

      // Check snapping to Z-axis of this object
      const distanceToZAxis = distanceToAxis(currentPosition, objPosition, 'z');
      if (distanceToZAxis < closestDistance) {
        closestDistance = distanceToZAxis;
        closestAxis = 'z';
        closestAxisOrigin = objPosition.clone();
        snapToObjectId = obj.id;
      }
    }

    // If we found an axis to snap to, calculate the snapped position
    if (closestAxis) {
      // Create a projection of the current position onto the closest axis
      const snappedPosition = projectPointOntoAxis(
        currentPosition,
        closestAxisOrigin,
        closestAxis
      );

      // Create line points for the visual indicator
      // These will form a dotted line along the axis between the object and the snapped position
      const lineStart = [
        closestAxisOrigin.x,
        closestAxisOrigin.y,
        closestAxisOrigin.z,
      ];

      const lineEnd = [snappedPosition.x, snappedPosition.y, snappedPosition.z];

      // Return both the snapped position and information needed for visual indicator
      return {
        position: [snappedPosition.x, snappedPosition.y, snappedPosition.z],
        snapToObjectId: snapToObjectId,
        snapAxis: closestAxis,
        linePoints: [lineStart, lineEnd],
        referenceObjectPosition: lineStart,
      };
    }

    // No snapping needed
    return null;
  } catch (error) {
    console.error('Error in calculateAxisSnap:', error);
    return null;
  }
};

/**
 * Calculate the distance from a point to an axis
 * @param {THREE.Vector3} point - The point to check
 * @param {THREE.Vector3} axisOrigin - Origin point of the axis
 * @param {string} axisName - Which axis to check ('x', 'y', or 'z')
 * @returns {number} - Distance from point to axis
 */
function distanceToAxis(point, axisOrigin, axisName) {
  // Calculate the distance from the point to the specified axis

  // Create a vector representing the axis direction
  const axisDirection = new THREE.Vector3();
  if (axisName === 'x') {
    axisDirection.set(1, 0, 0);
  } else if (axisName === 'y') {
    axisDirection.set(0, 1, 0);
  } else if (axisName === 'z') {
    axisDirection.set(0, 0, 1);
  }

  // Calculate the vector from axisOrigin to the point
  const toPoint = point.clone().sub(axisOrigin);

  // Project this vector onto the axis direction to get the parallel component
  const projectionLength = toPoint.dot(axisDirection);
  const projectionVector = axisDirection
    .clone()
    .multiplyScalar(projectionLength);

  // The perpendicular component is the difference between the original vector and its projection
  const perpendicularVector = toPoint.clone().sub(projectionVector);

  // The length of this perpendicular component is the distance to the axis
  return perpendicularVector.length();
}

/**
 * Projects a point onto an axis, maintaining the position along that axis
 * @param {THREE.Vector3} point - The point to project
 * @param {THREE.Vector3} axisOrigin - Origin point of the axis
 * @param {string} axisName - Which axis to project onto ('x', 'y', or 'z')
 * @returns {THREE.Vector3} - The projected point on the axis
 */
function projectPointOntoAxis(point, axisOrigin, axisName) {
  // Create a copy of the original point
  const projectedPoint = point.clone();

  // Replace the coordinates perpendicular to the specified axis with the axis origin's coordinates
  switch (axisName) {
    case 'x':
      // Maintain x-coordinate, replace y and z with the axis origin's values
      projectedPoint.y = axisOrigin.y;
      projectedPoint.z = axisOrigin.z;
      break;
    case 'y':
      // Maintain y-coordinate, replace x and z with the axis origin's values
      projectedPoint.x = axisOrigin.x;
      projectedPoint.z = axisOrigin.z;
      break;
    case 'z':
      // Maintain z-coordinate, replace x and y with the axis origin's values
      projectedPoint.x = axisOrigin.x;
      projectedPoint.y = axisOrigin.y;
      break;
  }

  return projectedPoint;
}
