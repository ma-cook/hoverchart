import * as THREE from 'three';

/**
 * Calculates the position of a face indicator in world space
 * @param {Object} indicator - The face indicator object
 * @param {Array} objects - Array of all objects in the scene
 * @returns {Array} - [x, y, z] coordinates in world space
 */
export const calculateFacePosition = (indicator, objects) => {
  // Handle null/undefined indicator
  if (!indicator) {
    return [0, 0, 0];
  }

  try {
    // Add specific handling for text object indicators
    if (indicator.type === 'text') {
      try {
        // First priority: Check for valid user data indicator position
        if (
          indicator.plane?.userData?.indicatorPosition &&
          Array.isArray(indicator.plane.userData.indicatorPosition) &&
          indicator.plane.userData.indicatorPosition.length === 3 &&
          indicator.plane.userData.indicatorPosition.some((n) => n !== 0)
        ) {
          return indicator.plane.userData.indicatorPosition;
        }

        // Second priority: Check for isValidTextObjectPosition flag with good position
        if (
          indicator.isValidTextObjectPosition &&
          Array.isArray(indicator.position) &&
          indicator.position.length === 3 &&
          indicator.position.some((n) => n !== 0)
        ) {
          return indicator.position;
        }

        // Third priority: Extract from stored position
        if (
          Array.isArray(indicator.position) &&
          indicator.position.length === 3 &&
          indicator.position.some((n) => n !== 0)
        ) {
          return indicator.position;
        }

        // Fourth priority: Calculate from object position and scale
        if (indicator.objectId && objects) {
          const textObj = objects.find(
            (obj) => obj.id.toString() === indicator.objectId.toString()
          );

          if (textObj) {
            const pos = textObj.position;
            const scale = textObj.scale || [15, 10, 1];

            // Calculate position at the bottom of the text object
            return [pos[0], pos[1] - 5 * scale[1], pos[2]];
          }
        }

        // Fifth priority: Try to get position from the plane reference
        if (indicator.plane) {
          try {
            // Extract world position from the group reference
            const worldPos = new THREE.Vector3();
            indicator.plane.updateWorldMatrix(true, false);
            indicator.plane.getWorldPosition(worldPos);

            // Get scale from indicator or use defaults
            const scale = indicator.scale || [15, 10, 1];

            // Apply offset based on scale
            return [worldPos.x, worldPos.y - 5 * scale[1], worldPos.z];
          } catch {
            // Error getting position from text plane
          }
        }

        // Final fallback: use any available position information
        if (
          indicator.worldPosition &&
          indicator.worldPosition.some((n) => n !== 0)
        ) {
          return indicator.worldPosition;
        } else if (
          indicator.position &&
          indicator.position.some((n) => n !== 0)
        ) {
          return indicator.position;
        } else if (indicator.cube?.position) {
          const pos = indicator.cube.position;
          const scale = indicator.cube.scale || [15, 10, 1];
          return [pos[0], pos[1] - 5 * scale[1], pos[2]];
        }

        return [0, 0, 0];
      } catch {
        return indicator.position || [0, 0, 0];
      }
    }

    // For plane indicators
    if (indicator.type === 'plane') {
      try {
        // First, check if we have a valid stored world position
        if (
          Array.isArray(indicator.worldPosition) &&
          indicator.worldPosition.length === 3 &&
          indicator.worldPosition.every(
            (n) => typeof n === 'number' && !isNaN(n)
          )
        ) {
          return indicator.worldPosition;
        }

        // Second, check if we have valid stored position
        if (
          Array.isArray(indicator.position) &&
          indicator.position.length === 3 &&
          indicator.position.every((n) => typeof n === 'number' && !isNaN(n))
        ) {
          return indicator.position;
        }

        // Third, try to calculate from planeData
        if (indicator.planeData) {
          // Ensure we have valid planeData
          const { position, scale, worldMatrixArray } = indicator.planeData;

          if (Array.isArray(position) && Array.isArray(scale)) {
            // If we have worldMatrixArray elements, use them
            if (
              worldMatrixArray &&
              Array.isArray(worldMatrixArray) &&
              worldMatrixArray.length === 16
            ) {
              const worldPos = new THREE.Vector3(0, -5 * scale[1], 0);
              const matrix = new THREE.Matrix4().fromArray(worldMatrixArray);
              worldPos.applyMatrix4(matrix);
              return [worldPos.x, worldPos.y, worldPos.z];
            }

            // Fallback: calculate estimated position from components
            const worldPos = new THREE.Vector3();
            worldPos.x = position[0];
            worldPos.y = position[1] - 5 * scale[1]; // Apply offset directly
            worldPos.z = position[2];
            return [worldPos.x, worldPos.y, worldPos.z];
          }
        }

        // Fourth, try to calculate from plane reference (live object)
        if (
          indicator.plane &&
          typeof indicator.plane.getWorldPosition === 'function'
        ) {
          try {
            const worldPos = new THREE.Vector3();
            indicator.plane.updateWorldMatrix(true, false);
            indicator.plane.getWorldPosition(worldPos);

            // Apply offset
            const offset = indicator.offset || [
              0,
              -5 * (indicator.scale?.[1] || 1),
              0,
            ];
            worldPos.add(new THREE.Vector3(...offset));

            return [worldPos.x, worldPos.y, worldPos.z];
          } catch {
            // Error getting position from plane reference
          }
        }

        // Final fallback: if we have any position at all, use it
        if (indicator.position) {
          return Array.isArray(indicator.position)
            ? indicator.position
            : [0, 0, 0];
        }

        // Absolute last resort
        if (indicator.cube?.position) {
          const pos = indicator.cube.position;
          const scale = indicator.cube.scale || [1, 1, 1];
          return Array.isArray(pos)
            ? [pos[0], pos[1] - 5 * scale[1], pos[2]]
            : [0, 0, 0];
        }

        return [0, 0, 0];
      } catch {
        return [0, 0, 0];
      }
    }

    // For cube, sphere, or tetrahedron indicators - with safer error handling
    if (
      indicator.type === 'cube' ||
      indicator.type === 'sphere' ||
      indicator.type === 'tetrahedron'
    ) {
      try {
        // Get position data safely
        let worldPos;

        // Get position from the indicator if available, or from the data if stored
        const position = indicator.cube?.position || indicator.position;

        if (!position) {
          return [0, 0, 0];
        }

        // Convert to Vector3 if it's an array
        if (Array.isArray(position)) {
          worldPos = new THREE.Vector3(
            Number(position[0]) || 0,
            Number(position[1]) || 0,
            Number(position[2]) || 0
          );
        } else {
          worldPos = new THREE.Vector3(
            Number(position.x) || 0,
            Number(position.y) || 0,
            Number(position.z) || 0
          );
        }

        // Get scale safely
        const scale = indicator.cube?.scale || [1, 1, 1];
        let worldScale;

        if (Array.isArray(scale)) {
          worldScale = new THREE.Vector3(
            Math.max(0.1, Number(scale[0]) || 1),
            Math.max(0.1, Number(scale[1]) || 1),
            Math.max(0.1, Number(scale[2]) || 1)
          );
        } else {
          worldScale = new THREE.Vector3(
            Math.max(0.1, Number(scale.x) || 1),
            Math.max(0.1, Number(scale.y) || 1),
            Math.max(0.1, Number(scale.z) || 1)
          );
        }

        // Calculate the offset based on face name and object size
        let objectSize = 5; // Default size for cubes
        if (indicator.type === 'tetrahedron') {
          objectSize = 5; // Tetrahedron size constant
        }

        let faceOffset;
        if (
          indicator.type === 'sphere' &&
          Array.isArray(indicator.faceCenter)
        ) {
          const localFacePos = new THREE.Vector3(...indicator.faceCenter);

          localFacePos.multiply(worldScale);

          const finalPos = [
            worldPos.x + localFacePos.x,
            worldPos.y + localFacePos.y,
            worldPos.z + localFacePos.z,
          ];

          return finalPos;
        } else if (indicator.type === 'tetrahedron') {
          // Tetrahedron face offset calculation - use accurate face centers
          // Tetrahedron vertices (same as in component)
          const TETRAHEDRON_SIZE = 5;
          const tetrahedronVertices = [
            [0, TETRAHEDRON_SIZE, 0], // top vertex
            [-TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-left-front
            [TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-right-front
            [0, -TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE * 1.5], // bottom-back
          ];

          let faceCenter;
          switch (indicator.face) {
            case 'bottom': {
              // Bottom face: vertices 1, 2, 3 (bottom triangle)
              faceCenter = [
                (tetrahedronVertices[1][0] +
                  tetrahedronVertices[2][0] +
                  tetrahedronVertices[3][0]) /
                  3,
                (tetrahedronVertices[1][1] +
                  tetrahedronVertices[2][1] +
                  tetrahedronVertices[3][1]) /
                  3,
                (tetrahedronVertices[1][2] +
                  tetrahedronVertices[2][2] +
                  tetrahedronVertices[3][2]) /
                  3,
              ];
              break;
            }
            case 'front': {
              // Front face: vertices 0, 2, 1 (top, bottom-right-front, bottom-left-front)
              faceCenter = [
                (tetrahedronVertices[0][0] +
                  tetrahedronVertices[2][0] +
                  tetrahedronVertices[1][0]) /
                  3,
                (tetrahedronVertices[0][1] +
                  tetrahedronVertices[2][1] +
                  tetrahedronVertices[1][1]) /
                  3,
                (tetrahedronVertices[0][2] +
                  tetrahedronVertices[2][2] +
                  tetrahedronVertices[1][2]) /
                  3,
              ];
              break;
            }
            case 'left': {
              // Left face: vertices 0, 1, 3 (top, bottom-left-front, bottom-back)
              faceCenter = [
                (tetrahedronVertices[0][0] +
                  tetrahedronVertices[1][0] +
                  tetrahedronVertices[3][0]) /
                  3,
                (tetrahedronVertices[0][1] +
                  tetrahedronVertices[1][1] +
                  tetrahedronVertices[3][1]) /
                  3,
                (tetrahedronVertices[0][2] +
                  tetrahedronVertices[1][2] +
                  tetrahedronVertices[3][2]) /
                  3,
              ];
              break;
            }
            case 'right': {
              // Right face: vertices 0, 3, 2 (top, bottom-back, bottom-right-front)
              faceCenter = [
                (tetrahedronVertices[0][0] +
                  tetrahedronVertices[3][0] +
                  tetrahedronVertices[2][0]) /
                  3,
                (tetrahedronVertices[0][1] +
                  tetrahedronVertices[3][1] +
                  tetrahedronVertices[2][1]) /
                  3,
                (tetrahedronVertices[0][2] +
                  tetrahedronVertices[3][2] +
                  tetrahedronVertices[2][2]) /
                  3,
              ];
              break;
            }
            default:
              faceCenter = [0, 0, 0];
          }

          // Apply scaling to face center
          faceOffset = new THREE.Vector3(
            faceCenter[0] * worldScale.x,
            faceCenter[1] * worldScale.y,
            faceCenter[2] * worldScale.z
          );
        } else {
          // Standard cube face offset calculation
          switch (indicator.face) {
            case 'top':
              faceOffset = new THREE.Vector3(0, objectSize * worldScale.y, 0);
              break;
            case 'bottom':
              faceOffset = new THREE.Vector3(0, -objectSize * worldScale.y, 0);
              break;
            case 'front':
              faceOffset = new THREE.Vector3(0, 0, objectSize * worldScale.z);
              break;
            case 'back':
              faceOffset = new THREE.Vector3(0, 0, -objectSize * worldScale.z);
              break;
            case 'right':
              faceOffset = new THREE.Vector3(objectSize * worldScale.x, 0, 0);
              break;
            case 'left':
              faceOffset = new THREE.Vector3(-objectSize * worldScale.x, 0, 0);
              break;
            default:
              faceOffset = new THREE.Vector3(0, 0, 0);
          }
        }

        // Add the offset to the world position
        worldPos.add(faceOffset);

        return [worldPos.x, worldPos.y, worldPos.z];
      } catch {
        return [0, 0, 0];
      }
    }

    // Fallback for unknown indicator types
    return Array.isArray(indicator.position) ? indicator.position : [0, 0, 0];
  } catch {
    return [0, 0, 0];
  }
};
