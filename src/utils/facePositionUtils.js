import * as THREE from 'three';

// =============================================================================
// PERFORMANCE OPTIMIZATION: Module-level reusable THREE objects
// Avoids GC pressure by reusing these instead of creating new objects each call
// =============================================================================
const tempWorldPos = new THREE.Vector3();
const tempWorldScale = new THREE.Vector3();
const tempOffsetVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();

// PERFORMANCE: Hoisted regex to avoid re-creation per call
const NUMERIC_FACE_RE = /^\d+$/;

// PERFORMANCE: Pre-computed dodecahedron geometry — vertices, faces, and
// face centers are constants that never change. Computing them once at
// module load eliminates ~40 array allocations per dodecahedron face lookup.
const _PHI = (1 + Math.sqrt(5)) / 2;
const _DODECA_SCALE = 5;
const _DODECA_VERTICES = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  [0, -_PHI, -1 / _PHI], [0, _PHI, -1 / _PHI],
  [0, _PHI, 1 / _PHI], [0, -_PHI, 1 / _PHI],
  [-1 / _PHI, 0, -_PHI], [1 / _PHI, 0, -_PHI],
  [1 / _PHI, 0, _PHI], [-1 / _PHI, 0, _PHI],
  [-_PHI, -1 / _PHI, 0], [-_PHI, 1 / _PHI, 0],
  [_PHI, 1 / _PHI, 0], [_PHI, -1 / _PHI, 0],
];
const _DODECA_FACES = [
  [0, 12, 13, 1, 8], [0, 16, 17, 3, 12], [0, 8, 11, 4, 16],
  [1, 19, 5, 11, 8], [1, 13, 2, 18, 19], [2, 13, 12, 3, 9],
  [2, 9, 10, 6, 18], [3, 17, 7, 10, 9], [4, 11, 5, 14, 15],
  [4, 15, 7, 17, 16], [5, 19, 18, 6, 14], [6, 10, 7, 15, 14],
];
// Pre-computed face centers (local-space, already scaled by _DODECA_SCALE)
const _DODECA_FACE_CENTERS = _DODECA_FACES.map((face) => {
  let cx = 0, cy = 0, cz = 0;
  for (const vi of face) {
    cx += _DODECA_VERTICES[vi][0];
    cy += _DODECA_VERTICES[vi][1];
    cz += _DODECA_VERTICES[vi][2];
  }
  const n = face.length;
  return [cx / n * _DODECA_SCALE, cy / n * _DODECA_SCALE, cz / n * _DODECA_SCALE];
});

// PERFORMANCE: Pre-computed tetrahedron face centers (local-space)
const _TETRA_SIZE = 5;
const _TETRA_VERTICES = [
  [0, _TETRA_SIZE, 0],
  [-_TETRA_SIZE, -_TETRA_SIZE, _TETRA_SIZE],
  [_TETRA_SIZE, -_TETRA_SIZE, _TETRA_SIZE],
  [0, -_TETRA_SIZE, -_TETRA_SIZE * 1.5],
];
const _avg3 = (a, b, c) => [(a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3, (a[2]+b[2]+c[2])/3];
const _TETRA_FACE_CENTERS = {
  bottom: _avg3(_TETRA_VERTICES[1], _TETRA_VERTICES[2], _TETRA_VERTICES[3]),
  front:  _avg3(_TETRA_VERTICES[0], _TETRA_VERTICES[2], _TETRA_VERTICES[1]),
  left:   _avg3(_TETRA_VERTICES[0], _TETRA_VERTICES[1], _TETRA_VERTICES[3]),
  right:  _avg3(_TETRA_VERTICES[0], _TETRA_VERTICES[3], _TETRA_VERTICES[2]),
};

// Pre-computed map for numeric-to-cube-face conversion
const _NUMERIC_TO_CUBE_FACE = {
  0: 'front', 1: 'back', 2: 'right', 3: 'left', 4: 'top', 5: 'bottom',
};

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
            // Extract world position from the group reference - using reusable vector
            indicator.plane.updateWorldMatrix(true, false);
            indicator.plane.getWorldPosition(tempWorldPos);

            // Get scale from indicator or use defaults
            const scale = indicator.scale || [15, 10, 1];

            // Apply offset based on scale
            return [tempWorldPos.x, tempWorldPos.y - 5 * scale[1], tempWorldPos.z];
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
            // If we have worldMatrixArray elements, use them - using reusable objects
            if (
              worldMatrixArray &&
              Array.isArray(worldMatrixArray) &&
              worldMatrixArray.length === 16
            ) {
              tempWorldPos.set(0, -5 * scale[1], 0);
              tempMatrix.fromArray(worldMatrixArray);
              tempWorldPos.applyMatrix4(tempMatrix);
              return [tempWorldPos.x, tempWorldPos.y, tempWorldPos.z];
            }

            // Fallback: calculate estimated position from components - using reusable vector
            tempWorldPos.set(
              position[0],
              position[1] - 5 * scale[1], // Apply offset directly
              position[2]
            );
            return [tempWorldPos.x, tempWorldPos.y, tempWorldPos.z];
          }
        }

        // Fourth, try to calculate from plane reference (live object) - using reusable vectors
        if (
          indicator.plane &&
          typeof indicator.plane.getWorldPosition === 'function'
        ) {
          try {
            indicator.plane.updateWorldMatrix(true, false);
            indicator.plane.getWorldPosition(tempWorldPos);

            // Apply offset using reusable vector
            const offset = indicator.offset || [
              0,
              -5 * (indicator.scale?.[1] || 1),
              0,
            ];
            tempOffsetVec.set(offset[0], offset[1], offset[2]);
            tempWorldPos.add(tempOffsetVec);

            return [tempWorldPos.x, tempWorldPos.y, tempWorldPos.z];
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
        let _worldPos;

        // Get position from the indicator if available, or from the data if stored
        const position = indicator.cube?.position || indicator.position;

        if (!position) {
          // Removed excessive logging for performance
          return [0, 0, 0];
        }

        // Convert to Vector3 if it's an array - using reusable vector
        if (Array.isArray(position)) {
          tempWorldPos.set(
            Number(position[0]) || 0,
            Number(position[1]) || 0,
            Number(position[2]) || 0
          );
        } else {
          tempWorldPos.set(
            Number(position.x) || 0,
            Number(position.y) || 0,
            Number(position.z) || 0
          );
        }

        // Removed excessive logging for performance

        // Get scale safely - using reusable vector
        const scale = indicator.cube?.scale || [1, 1, 1];

        if (Array.isArray(scale)) {
          tempWorldScale.set(
            Math.max(0.1, Number(scale[0]) || 1),
            Math.max(0.1, Number(scale[1]) || 1),
            Math.max(0.1, Number(scale[2]) || 1)
          );
        } else {
          tempWorldScale.set(
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
          // PERFORMANCE: Use pre-computed tetrahedron face centers (module-level constants)
          const faceCenter = _TETRA_FACE_CENTERS[indicator.face] || [0, 0, 0];

          // Apply scaling to face center — reuse tempOffsetVec
          faceOffset = tempOffsetVec.set(
            faceCenter[0] * tempWorldScale.x,
            faceCenter[1] * tempWorldScale.y,
            faceCenter[2] * tempWorldScale.z
          );
        } else if (indicator.type === 'dodecahedron') {
          // Dodecahedron face positioning - USE EXACT SAME LOGIC AS Dodecahedron component FaceIndicator

          // If we have a stored faceCenter (from markdown service), use it directly
          if (
            Array.isArray(indicator.faceCenter) &&
            indicator.faceCenter.some((val) => val !== 0)
          ) {
            const objectPosition = indicator.cube?.position ||
              indicator.position || [0, 0, 0];
            const objectScale = indicator.cube?.scale ||
              indicator.scale || [1, 1, 1];

            // The faceCenter is local coordinates - transform to world coordinates
            // This matches exactly how Dodecahedron component transforms getFaceInfo().center
            const worldFaceCenter = [
              objectPosition[0] + indicator.faceCenter[0] * objectScale[0],
              objectPosition[1] + indicator.faceCenter[1] * objectScale[1],
              objectPosition[2] + indicator.faceCenter[2] * objectScale[2],
            ];

            return worldFaceCenter;
          } else {
            // Fallback: Use the same calculation as the main case, but calculate faceCenter first
            const objectPosition = indicator.cube?.position ||
              indicator.position || [0, 0, 0];
            const objectScale = indicator.cube?.scale ||
              indicator.scale || [1, 1, 1];

            // Get face index
            let faceIndex = 0;
            if (typeof indicator.face === 'number') {
              faceIndex = indicator.face;
            } else if (
              typeof indicator.face === 'string' &&
              NUMERIC_FACE_RE.test(indicator.face)
            ) {
              faceIndex = parseInt(indicator.face);
            }

            // PERFORMANCE: Use pre-computed dodecahedron face centers (module-level constants)
            const localFaceCenter = (faceIndex >= 0 && faceIndex < _DODECA_FACE_CENTERS.length)
              ? _DODECA_FACE_CENTERS[faceIndex]
              : [0, 0, 0];

            // Transform to world coordinates the same way as the main case
            const worldFaceCenter = [
              objectPosition[0] + localFaceCenter[0] * objectScale[0],
              objectPosition[1] + localFaceCenter[1] * objectScale[1],
              objectPosition[2] + localFaceCenter[2] * objectScale[2],
            ];

            return worldFaceCenter;
          }
        } else {
          // Standard cube face offset calculation
          // Removed excessive logging for performance

          // Handle numeric faces that might be intended for dodecahedrons
          let cubeFace = indicator.face;
          if (
            typeof indicator.face === 'number' ||
            NUMERIC_FACE_RE.test(indicator.face)
          ) {
            const faceIndex = parseInt(indicator.face);
            console.warn(
              `⚠️ Numeric face (${faceIndex}) found on ${indicator.type} - this might be a dodecahedron misclassified as cube`
            );

            if (faceIndex >= 0 && faceIndex <= 5) {
              cubeFace = _NUMERIC_TO_CUBE_FACE[faceIndex];
            } else {
              console.warn(
                `⚠️ Numeric face ${faceIndex} out of range for cube (0-5), using 'front'`
              );
              cubeFace = 'front';
            }
          }

          // PERFORMANCE: Reuse tempOffsetVec instead of allocating new THREE.Vector3()
          switch (cubeFace) {
            case 'top':
              faceOffset = tempOffsetVec.set(0, objectSize * tempWorldScale.y, 0);
              break;
            case 'bottom':
              faceOffset = tempOffsetVec.set(0, -objectSize * tempWorldScale.y, 0);
              break;
            case 'front':
              faceOffset = tempOffsetVec.set(0, 0, objectSize * tempWorldScale.z);
              break;
            case 'back':
              faceOffset = tempOffsetVec.set(0, 0, -objectSize * tempWorldScale.z);
              break;
            case 'right':
              faceOffset = tempOffsetVec.set(objectSize * tempWorldScale.x, 0, 0);
              break;
            case 'left':
              faceOffset = tempOffsetVec.set(-objectSize * tempWorldScale.x, 0, 0);
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
              faceOffset = tempOffsetVec.set(0, 0, 0);
          }

          // Face offset calculated for cube
        }

        // Add the offset to the world position
        tempWorldPos.add(faceOffset);

        const finalResult = [tempWorldPos.x, tempWorldPos.y, tempWorldPos.z];

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
