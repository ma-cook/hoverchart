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

    // For cube, tetrahedron, or dodecahedron indicators - with safer error handling
    // Also include sphere for auto-correction to dodecahedron
    if (
      indicator.type === 'cube' ||
      indicator.type === 'sphere' ||
      indicator.type === 'tetrahedron' ||
      indicator.type === 'dodecahedron'
    ) {
      try {
        // CRITICAL FIX: Auto-correct all sphere types to dodecahedron FIRST
        // Spheres are just the old name for dodecahedrons - convert immediately
        if (indicator.type === 'sphere') {
          // console.log(
          //   `🔧 Auto-correcting type from 'sphere' to 'dodecahedron' (sphere is old name for dodecahedron)`
          // );
          indicator.type = 'dodecahedron';
        }

        // CRITICAL FIX: Auto-correct misclassified dodecahedrons BEFORE any other processing
        // This must happen first to avoid race conditions with early returns
        if (typeof indicator.face === 'number' && indicator.face >= 6) {
          // console.log(
          //   `🔧 Auto-correcting type from '${indicator.type}' to 'dodecahedron' based on face ${indicator.face}`
          // );
          indicator.type = 'dodecahedron';
        }

        // Debug logging for type detection issues - DISABLED for performance
        // if (indicator.face && typeof indicator.face === 'number') {
        //   console.log('🔍 Face position calculation debug:', {
        //     indicatorType: indicator.type,
        //     faceValue: indicator.face,
        //     faceType: typeof indicator.face,
        //     objectId: indicator.objectId,
        //     hasPosition: !!(indicator.cube?.position || indicator.position),
        //   });
        // }
        // Removed excessive logging for performance

        // Get position data safely
        let worldPos;

        // Get position from the indicator if available, or from the data if stored
        const position = indicator.cube?.position || indicator.position;

        if (!position) {
          // Removed excessive logging for performance
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

        // Removed excessive logging for performance

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
        if (indicator.type === 'tetrahedron') {
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
        } else if (indicator.type === 'dodecahedron') {
          // Dodecahedron face offset calculation
          // First check if we have a stored faceCenter (from second click or stored data)
          if (
            Array.isArray(indicator.faceCenter) &&
            indicator.faceCenter.some((val) => val !== 0)
          ) {
            // Check if this is a manual connection by looking at the faceCenter values
            // Manual connections from Dodecahedron component might store local coordinates
            const objectPosition = indicator.cube?.position ||
              indicator.position || [0, 0, 0];
            const objectScale = indicator.cube?.scale ||
              indicator.scale || [1, 1, 1];

            // Check if faceCenter seems to be in local coordinates (small values)
            const maxAbsValue = Math.max(...indicator.faceCenter.map(Math.abs));
            const isLikelyLocalCoordinates = maxAbsValue < 10; // Local coords are usually < 10

            if (isLikelyLocalCoordinates) {
              // This appears to be local coordinates, so we need to transform them
              const scaledFaceCenter = [
                indicator.faceCenter[0] * objectScale[0],
                indicator.faceCenter[1] * objectScale[1],
                indicator.faceCenter[2] * objectScale[2],
              ];

              const worldFacePosition = [
                objectPosition[0] + scaledFaceCenter[0],
                objectPosition[1] + scaledFaceCenter[1],
                objectPosition[2] + scaledFaceCenter[2],
              ];

              // console.log(
              //   '🎯 Dodecahedron face position (local to world transformation):',
              //   {
              //     objectId: indicator.objectId,
              //     localFaceCenter: indicator.faceCenter,
              //     maxAbsValue: maxAbsValue,
              //     isLikelyLocalCoordinates: true,
              //     objectScale: objectScale,
              //     scaledFaceCenter: scaledFaceCenter,
              //     objectPosition: objectPosition,
              //     worldFacePosition: worldFacePosition,
              //   }
              // );

              return worldFacePosition;
            } else {
              // This appears to be world coordinates already - debug disabled for performance
              // console.log(
              //   '🎯 Using stored faceCenter as world position (manual connection style):',
              //   {
              //     objectId: indicator.objectId,
              //     storedFaceCenter: indicator.faceCenter,
              //     maxAbsValue: maxAbsValue,
              //     isLikelyLocalCoordinates: false,
              //     objectPosition: objectPosition,
              //     usingFaceCenterDirectly: true,
              //   }
              // );

              return indicator.faceCenter;
            }
          } else {
            // Fallback: Calculate face position using the same geometry as Dodecahedron component
            // This ensures manual connections match the actual face positions
            const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
            const vertices = [
              [-1, -1, -1],
              [1, -1, -1],
              [1, 1, -1],
              [-1, 1, -1], // back face vertices
              [-1, -1, 1],
              [1, -1, 1],
              [1, 1, 1],
              [-1, 1, 1], // front face vertices
              [0, -phi, -1 / phi],
              [0, phi, -1 / phi],
              [0, phi, 1 / phi],
              [0, -phi, 1 / phi], // top/bottom middle vertices
              [-1 / phi, 0, -phi],
              [1 / phi, 0, -phi],
              [1 / phi, 0, phi],
              [-1 / phi, 0, phi], // left/right middle vertices
              [-phi, -1 / phi, 0],
              [phi, -1 / phi, 0],
              [phi, 1 / phi, 0],
              [-phi, 1 / phi, 0], // front/back middle vertices
            ];

            // Face definitions (12 pentagonal faces) - MUST MATCH Dodecahedron component
            const faces = [
              [4, 11, 15, 7, 10], // Face 0
              [1, 8, 0, 12, 13], // Face 1
              [5, 17, 1, 13, 14], // Face 2
              [4, 16, 0, 8, 11], // Face 3
              [2, 9, 3, 19, 10], // Face 4
              [6, 14, 15, 11, 10], // Face 5 (bottom)
              [7, 15, 14, 6, 18], // Face 6
              [5, 14, 6, 10, 11], // Face 7 - This is the 'front-bottom' face
              [1, 17, 18, 2, 13], // Face 8
              [0, 16, 19, 3, 12], // Face 9
              [2, 18, 17, 5, 9], // Face 10
              [3, 9, 12, 13, 19], // Face 11 (top)
            ];

            // Get the face index
            let faceIndex = 0;
            if (typeof indicator.face === 'number') {
              faceIndex = indicator.face;
            } else if (
              typeof indicator.face === 'string' &&
              /^\d+$/.test(indicator.face)
            ) {
              faceIndex = parseInt(indicator.face);
            }

            // Ensure face index is within bounds
            if (faceIndex < 0 || faceIndex >= faces.length) {
              console.warn(
                `Invalid dodecahedron face index ${faceIndex}, using face 0`
              );
              faceIndex = 0;
            }

            // Calculate the actual face center by averaging vertices of the pentagonal face
            const faceVertices = faces[faceIndex];
            let faceCenter = [0, 0, 0];

            for (const vertexIndex of faceVertices) {
              faceCenter[0] += vertices[vertexIndex][0];
              faceCenter[1] += vertices[vertexIndex][1];
              faceCenter[2] += vertices[vertexIndex][2];
            }

            // Average the vertices
            faceCenter = faceCenter.map((coord) => coord / faceVertices.length);

            // The face center is now in local coordinates matching the Dodecahedron component
            // Scale by 6 to match the dodecahedron radius used in the component
            const DODECAHEDRON_SCALE = 6;

            // Normalize and scale - DON'T apply worldScale as dodecahedron geometry is already properly scaled
            const length = Math.sqrt(
              faceCenter[0] ** 2 + faceCenter[1] ** 2 + faceCenter[2] ** 2
            );
            faceOffset = new THREE.Vector3(
              (faceCenter[0] / length) * DODECAHEDRON_SCALE,
              (faceCenter[1] / length) * DODECAHEDRON_SCALE,
              (faceCenter[2] / length) * DODECAHEDRON_SCALE
            );

            // console.log('🎯 Calculated dodecahedron face position:', {
            //   face: indicator.face,
            //   faceIndex: faceIndex,
            //   faceCenter: faceCenter,
            //   normalized: [
            //     faceCenter[0] / length,
            //     faceCenter[1] / length,
            //     faceCenter[2] / length,
            //   ],
            //   scaledOffset: {
            //     x: faceOffset.x,
            //     y: faceOffset.y,
            //     z: faceOffset.z,
            //   },
            // });
          }
        } else {
          // Standard cube face offset calculation
          // Removed excessive logging for performance

          // Handle numeric faces that might be intended for dodecahedrons
          let cubeFace = indicator.face;
          if (
            typeof indicator.face === 'number' ||
            /^\d+$/.test(indicator.face)
          ) {
            const faceIndex = parseInt(indicator.face);
            console.warn(
              `⚠️ Numeric face (${faceIndex}) found on ${indicator.type} - this might be a dodecahedron misclassified as cube`
            );

            // Map numeric faces to cube faces (0-5 for cube faces)
            const numericToCubeFace = {
              0: 'front', // 0 -> front
              1: 'back', // 1 -> back
              2: 'right', // 2 -> right
              3: 'left', // 3 -> left
              4: 'top', // 4 -> top
              5: 'bottom', // 5 -> bottom
            };

            if (faceIndex >= 0 && faceIndex <= 5) {
              cubeFace = numericToCubeFace[faceIndex];
              console.log(
                `🔄 Mapped numeric cube face ${faceIndex} to '${cubeFace}'`
              );
            } else {
              console.warn(
                `⚠️ Numeric face ${faceIndex} out of range for cube (0-5), using 'front'`
              );
              cubeFace = 'front';
            }
          }

          switch (cubeFace) {
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
              console.warn(
                '⚠️ Unknown face type, using center position:',
                cubeFace,
                'Original face:',
                indicator.face,
                'Type:',
                indicator.type
              );
              faceOffset = new THREE.Vector3(0, 0, 0);
          }

          // Face offset calculated for cube
        }

        // Add the offset to the world position
        worldPos.add(faceOffset);

        const finalResult = [worldPos.x, worldPos.y, worldPos.z];

        // Debug final result for corrected dodecahedrons
        if (
          indicator.face &&
          typeof indicator.face === 'number' &&
          indicator.face >= 4
        ) {
          // console.log('🎯 Final corrected position:', {
          //   objectId: indicator.objectId,
          //   originalType: 'sphere', // We know it was corrected from sphere
          //   correctedType: indicator.type,
          //   face: indicator.face,
          //   finalPosition: finalResult,
          //   faceOffsetApplied: {
          //     x: faceOffset.x,
          //     y: faceOffset.y,
          //     z: faceOffset.z,
          //   },
          // });
        }

        return finalResult;
      } catch (error) {
        console.error(
          '❌ Error in calculateFacePosition for cube/tetrahedron/dodecahedron:',
          error,
          {
            indicator,
            type: indicator.type,
            face: indicator.face,
            hasPosition: !!(indicator.cube?.position || indicator.position),
          }
        );

        // Fallback to object center position if available
        const fallbackPosition = indicator.cube?.position || indicator.position;
        if (Array.isArray(fallbackPosition) && fallbackPosition.length === 3) {
          // Removed excessive logging for performance
          return fallbackPosition;
        }

        return [0, 0, 0];
      }
    }

    // Fallback for unknown indicator types
    return Array.isArray(indicator.position) ? indicator.position : [0, 0, 0];
  } catch {
    return [0, 0, 0];
  }
};
