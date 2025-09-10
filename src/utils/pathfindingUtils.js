import * as THREE from 'three';

/**
 * Checks if a straight line between two points intersects with any objects
 */
export function checkLineIntersection(startPos, endPos, objects) {
  // PATHFINDING FIX: Add targeted debug logging
  const lineLength = Math.sqrt(
    (endPos[0] - startPos[0]) ** 2 +
      (endPos[1] - startPos[1]) ** 2 +
      (endPos[2] - startPos[2]) ** 2
  );

  // Only log for shorter lines where intersections are likely
  if (lineLength < 1000) {
    // Debug logging removed
  }

  // Create a ray for intersection testing
  const direction = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  ).normalize();

  const ray = new THREE.Raycaster(
    new THREE.Vector3(startPos[0], startPos[1], startPos[2]),
    direction
  );

  // Create simplified bounding boxes for objects - include ALL object types
  const objectBoxes = objects
    .filter((obj) => obj.type && obj.position) // Include all objects with valid type and position
    .map((obj) => {
      // PATHFINDING FIX: Better handling of scale property
      let size;
      if (Array.isArray(obj.scale) && obj.scale.length === 3) {
        size = obj.scale;
      } else if (
        typeof obj.scale === 'object' &&
        obj.scale &&
        obj.scale.x !== undefined
      ) {
        size = [obj.scale.x, obj.scale.y, obj.scale.z];
      } else {
        // Missing scale property
        size = [1, 1, 1]; // Safe fallback
      }

      // Create a simple bounding box
      const center = new THREE.Vector3(...obj.position);

      // Size multiplier based on object type (accounting for actual geometry sizes)
      // The visual objects are larger than their base scale, so we need appropriate multipliers
      let sizeMultiplier;
      switch (obj.type) {
        case 'cube':
          sizeMultiplier = 5.0; // Cube visual size is about 5x the scale
          break;
        case 'sphere':
        case 'dodecahedron':
          sizeMultiplier = 5.5; // Dodecahedron visual size for intersection detection
          break;
        case 'tetrahedron':
          sizeMultiplier = 4.0; // Tetrahedron visual size
          break;
        case 'plane':
          sizeMultiplier = 5.0; // Plane visual size
          break;
        case 'text':
          sizeMultiplier = 2.0; // Text objects are smaller
          break;
        default:
          sizeMultiplier = 5.0; // Default size
      }

      // Add padding to ensure we detect intersections with some margin
      const padding = 5; // Reduced padding for more accurate intersection detection

      return {
        id: obj.id.toString(),
        type: obj.type,
        min: new THREE.Vector3(
          center.x - (sizeMultiplier * size[0] + padding),
          center.y - (sizeMultiplier * size[1] + padding),
          center.z - (sizeMultiplier * size[2] + padding)
        ),
        max: new THREE.Vector3(
          center.x + (sizeMultiplier * size[0] + padding),
          center.y + (sizeMultiplier * size[1] + padding),
          center.z + (sizeMultiplier * size[2] + padding)
        ),
      };
    });

  const intersections = [];

  objectBoxes.forEach((box) => {
    // Create a simple box for intersection testing
    const bbox = new THREE.Box3(box.min, box.max);

    // IMPROVED INTERSECTION DETECTION: Check if the line segment intersects the box
    // Create line segment from start to end
    const lineStart = new THREE.Vector3(...startPos);
    const lineEnd = new THREE.Vector3(...endPos);
    const lineDirection = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const lineLength = lineDirection.length();
    lineDirection.normalize();

    // Check if ray intersects box
    const result = ray.ray.intersectBox(bbox, new THREE.Vector3());

    // Additional check: does the line segment actually pass through or near the box?
    const boxCenter = new THREE.Vector3()
      .addVectors(box.min, box.max)
      .multiplyScalar(0.5);
    const closestPointOnLine = new THREE.Vector3();

    // Project box center onto line segment
    const lineToCenter = new THREE.Vector3().subVectors(boxCenter, lineStart);
    const projectionLength = lineToCenter.dot(lineDirection);
    const clampedProjection = Math.max(
      0,
      Math.min(lineLength, projectionLength)
    );
    closestPointOnLine
      .copy(lineStart)
      .add(lineDirection.clone().multiplyScalar(clampedProjection));

    const distanceToLine = boxCenter.distanceTo(closestPointOnLine);
    const boxRadius =
      new THREE.Vector3().subVectors(box.max, box.min).length() * 0.5;

    // Consider it an intersection if:
    // 1. Ray intersects the box AND intersection is within line segment, OR
    // 2. Line segment passes close to the box center
    const rayIntersectsInRange =
      result && result.distanceTo(ray.ray.origin) <= lineLength;
    const linePassesNearBox = distanceToLine <= boxRadius;

    if (rayIntersectsInRange || linePassesNearBox) {
      // Found intersection
      intersections.push({
        objectId: box.id,
        objectType: box.type,
        position: result
          ? [result.x, result.y, result.z]
          : [closestPointOnLine.x, closestPointOnLine.y, closestPointOnLine.z],
        distance: result
          ? result.distanceTo(ray.ray.origin)
          : clampedProjection,
        boundingBox: bbox, // Store the bounding box for further calculations
      });
    }
  });

  return intersections.sort((a, b) => a.distance - b.distance);
}

/**
 * Creates a curved path around objects with improved obstacle avoidance
 */
export function generateCurvedPath(
  startPos,
  endPos,
  intersections,
  startConnId,
  endConnId,
  forceCurved = false
) {
  // If not forced to be curved and no intersections, return straight line
  if (!forceCurved && intersections.length === 0) {
    return [startPos, endPos];
  }

  // Filter out objects that are the start or end connection points
  const filteredIntersections = intersections.filter(
    (int) => int.objectId !== startConnId && int.objectId !== endConnId
  );

  // If not forced to be curved and no relevant intersections, return straight line
  if (!forceCurved && filteredIntersections.length === 0) {
    return [startPos, endPos];
  }

  // Calculate line direction and length
  const direction = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  );
  direction.normalize();

  // Calculate multiple curve options and choose the best one
  const curveOptions = [];

  // Option 1: Curve upward
  const upwardCurve = generateSingleCurve(
    startPos,
    endPos,
    filteredIntersections,
    'up'
  );
  curveOptions.push({ curve: upwardCurve, direction: 'up' });

  // Option 2: Curve to the right (perpendicular to line direction)
  const rightCurve = generateSingleCurve(
    startPos,
    endPos,
    filteredIntersections,
    'right'
  );
  curveOptions.push({ curve: rightCurve, direction: 'right' });

  // Option 3: Curve to the left
  const leftCurve = generateSingleCurve(
    startPos,
    endPos,
    filteredIntersections,
    'left'
  );
  curveOptions.push({ curve: leftCurve, direction: 'left' });

  // Test each curve option and pick the first one that doesn't intersect
  for (const option of curveOptions) {
    // Validate that this curve doesn't intersect with objects
    // We'll use a simpler validation for now and can enhance it later
    if (option.curve && option.curve.length > 2) {
      return option.curve;
    }
  }

  // Fallback: return the upward curve even if not perfect
  const finalCurve = upwardCurve || [startPos, endPos];

  return finalCurve;
}

/**
 * Generate a single curve in a specific direction
 */
function generateSingleCurve(startPos, endPos, intersections, curveDirection) {
  // Create a midpoint with offset
  const midX = (startPos[0] + endPos[0]) / 2;
  const midY = (startPos[1] + endPos[1]) / 2;
  const midZ = (startPos[2] + endPos[2]) / 2;

  // Calculate perpendicular offset direction based on curve direction
  const direction = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  ).normalize();

  let offsetVector;

  // Calculate offset distance based on intersecting objects' sizes and line length
  // Find the largest intersecting object to determine appropriate curve size
  let maxObjectSize = 20; // Minimum curve offset
  intersections.forEach((intersection) => {
    if (intersection.boundingBox) {
      const box = intersection.boundingBox;
      const boxWidth = Math.abs(box.max.x - box.min.x);
      const boxHeight = Math.abs(box.max.y - box.min.y);
      const boxDepth = Math.abs(box.max.z - box.min.z);
      const maxBoxDimension = Math.max(boxWidth, boxHeight, boxDepth);
      maxObjectSize = Math.max(maxObjectSize, maxBoxDimension);
    }
  });

  const lineLength = new THREE.Vector3(...startPos).distanceTo(
    new THREE.Vector3(...endPos)
  );

  // Adaptive curve sizing:
  // - Base offset should be at least half the largest object size
  // - Add extra offset based on number of intersections
  // - Scale with line length for long connections
  // - Cap at reasonable maximum to avoid extreme curves
  const baseDistance = maxObjectSize * 0.6 + intersections.length * 15;
  const scalingFactor = Math.min(lineLength / 500, 3.0); // Scale up for longer lines, cap at 3x
  const adaptiveOffset = baseDistance * scalingFactor;
  const offsetDistance = Math.min(adaptiveOffset, lineLength * 0.4); // Allow up to 40% of line length

  switch (curveDirection) {
    case 'up':
      // Always curve upward
      offsetVector = new THREE.Vector3(0, offsetDistance, 0);
      break;
    case 'right': {
      // Cross with up vector to get right direction
      const rightPerp = new THREE.Vector3()
        .crossVectors(direction, new THREE.Vector3(0, 1, 0))
        .normalize();
      if (rightPerp.length() < 0.1) {
        // Line is vertical, use X axis
        offsetVector = new THREE.Vector3(
          offsetDistance,
          offsetDistance * 0.5,
          0
        );
      } else {
        offsetVector = rightPerp.multiplyScalar(offsetDistance);
        offsetVector.y += offsetDistance * 0.3; // Add slight upward component
      }
      break;
    }
    case 'left': {
      // Cross with up vector to get left direction
      const leftPerp = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), direction)
        .normalize();
      if (leftPerp.length() < 0.1) {
        // Line is vertical, use negative X axis
        offsetVector = new THREE.Vector3(
          -offsetDistance,
          offsetDistance * 0.5,
          0
        );
      } else {
        offsetVector = leftPerp.multiplyScalar(offsetDistance);
        offsetVector.y += offsetDistance * 0.3; // Add slight upward component
      }
      break;
    }
    default:
      // Default to upward
      offsetVector = new THREE.Vector3(0, offsetDistance, 0);
  }

  // Calculate control point
  const controlPoint = [
    midX + offsetVector.x,
    midY + offsetVector.y,
    midZ + offsetVector.z,
  ];

  // Create a quadratic bezier curve
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...startPos),
    new THREE.Vector3(...controlPoint),
    new THREE.Vector3(...endPos)
  );

  // Generate more points for smoother curves and better intersection detection
  const curvePoints = curve.getPoints(15);
  return curvePoints.map((point) => [point.x, point.y, point.z]);
}
