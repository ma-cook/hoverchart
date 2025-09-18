import * as THREE from 'three';

// Cache settings
const CACHE_LIFETIME = 5000; // 5 seconds
const POSITION_PRECISION = 2; // Decimal places for position rounding
const CLEAN_PROBABILITY = 0.01; // 1% chance to clean cache per call

// Create cache for intersection and path results
const intersectionCache = new Map();
const pathCache = new Map();

// Clean old entries from caches periodically
function cleanCaches() {
  const now = Date.now();
  for (const cache of [intersectionCache, pathCache]) {
    for (const [key, value] of cache) {
      if (now - value.timestamp > CACHE_LIFETIME) {
        cache.delete(key);
      }
    }
  }
}

// Round positions for cache keys
function roundForCache(pos) {
  if (!Array.isArray(pos)) return [0, 0, 0];
  return pos.map(
    (v) =>
      Math.round(v * Math.pow(10, POSITION_PRECISION)) /
      Math.pow(10, POSITION_PRECISION)
  );
}

// Generate cache key from positions
function generateCacheKey(startPos, endPos) {
  const roundedStart = roundForCache(startPos);
  const roundedEnd = roundForCache(endPos);
  return `${roundedStart.join(',')}_${roundedEnd.join(',')}`;
}

/**
 * Checks if positions have changed significantly
 */
export function havePositionsChanged(pos1, pos2, threshold = 0.1) {
  if (!Array.isArray(pos1) || !Array.isArray(pos2)) return true;
  return pos1.some((v, i) => Math.abs(v - pos2[i]) > threshold);
}

/**
 * Checks if a straight line between two points intersects with any objects
 */
export function checkLineIntersection(startPos, endPos, objects) {
  if (!startPos || !endPos || !objects) return [];

  // Clean caches periodically
  if (Math.random() < CLEAN_PROBABILITY) {
    cleanCaches();
  }

  // Generate cache key
  const cacheKey = generateCacheKey(startPos, endPos);

  // Check cache first
  const cached = intersectionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_LIFETIME) {
    return cached.intersections;
  }

  // Calculate line length for optimization
  const lineLength = Math.sqrt(
    Math.pow(endPos[0] - startPos[0], 2) +
      Math.pow(endPos[1] - startPos[1], 2) +
      Math.pow(endPos[2] - startPos[2], 2)
  );

  // Skip long lines and cache empty result
  if (lineLength > 1000) {
    const result = [];
    intersectionCache.set(cacheKey, {
      intersections: result,
      timestamp: Date.now(),
    });
    return result;
  }

  // Filter and process objects for intersection testing
  const objectsToTest = objects.filter((obj) => {
    if (!obj?.position || !Array.isArray(obj.position)) return false;

    // Quick distance check to rule out far away objects
    const distanceSquared = obj.position.reduce(
      (sum, val, i) => sum + Math.pow(val - startPos[i], 2),
      0
    );

    // Only check objects within reasonable distance
    return distanceSquared < lineLength * lineLength * 1.5;
  });
  const direction = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  ).normalize();

  const ray = new THREE.Raycaster(
    new THREE.Vector3(startPos[0], startPos[1], startPos[2]),
    direction
  );

  // Create simplified bounding boxes for filtered objects
  const objectBoxes = objectsToTest
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

  // Sort intersections by distance and cache the result
  const result = intersections.sort((a, b) => a.distance - b.distance);

  // Cache the result
  intersectionCache.set(cacheKey, {
    intersections: result,
    timestamp: Date.now(),
  });

  return result;
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
  if (!startPos || !endPos) {
    return [startPos || [0, 0, 0], endPos || [0, 0, 0]];
  }

  const cacheKey = generateCacheKey(startPos, endPos);
  const pathCacheKey = `path_${cacheKey}_${forceCurved}_${startConnId}_${endConnId}`;

  const cachedPath = pathCache.get(pathCacheKey);
  if (cachedPath && Date.now() - cachedPath.timestamp < CACHE_LIFETIME) {
    return cachedPath.path;
  }

  // If not forced curved and no intersections, return and cache straight line
  if (!forceCurved && (!intersections || intersections.length === 0)) {
    const straightPath = [startPos, endPos];
    pathCache.set(pathCacheKey, {
      path: straightPath,
      timestamp: Date.now(),
    });
    return straightPath;
  }

  // Filter out start/end objects
  const relevantIntersections = intersections.filter(
    (int) => int.objectId !== startConnId && int.objectId !== endConnId
  );

  if (!forceCurved && relevantIntersections.length === 0) {
    const straightPath = [startPos, endPos];
    pathCache.set(pathCacheKey, {
      path: straightPath,
      timestamp: Date.now(),
    });
    return straightPath;
  }

  // Calculate multiple curve options and choose the best one
  const curveOptions = [];
  const curveDirections = ['up', 'right', 'left'];

  for (const direction of curveDirections) {
    const curve = generateSingleCurve(
      startPos,
      endPos,
      relevantIntersections,
      direction
    );
    if (curve) {
      curveOptions.push({ curve, direction });
    }
  }

  // Test each curve option and pick the best one
  let bestOption = null;
  let minIntersections = Infinity;

  for (const option of curveOptions) {
    if (!option.curve || option.curve.length <= 2) continue;

    // Quick validation of the curve path
    const intersectionCount = checkCurveIntersections(
      option.curve,
      relevantIntersections
    );
    if (intersectionCount === 0) {
      // Found a perfect path, use it immediately
      const finalPath = option.curve;
      pathCache.set(pathCacheKey, {
        path: finalPath,
        timestamp: Date.now(),
      });
      return finalPath;
    }

    if (intersectionCount < minIntersections) {
      bestOption = option;
      minIntersections = intersectionCount;
    }
  }

  // Use the best available option or fallback to a straight line
  const finalPath = (bestOption && bestOption.curve) || [startPos, endPos];

  // Cache the result
  pathCache.set(pathCacheKey, {
    path: finalPath,
    timestamp: Date.now(),
  });

  return finalPath;
}

/**
 * Check how many objects the curve intersects with
 */
function checkCurveIntersections(curvePoints, intersections) {
  let intersectionCount = 0;

  // Skip expensive checks if there are no intersections to test against
  if (!intersections || intersections.length === 0) {
    return 0;
  }

  // Check each segment of the curve
  for (let i = 0; i < curvePoints.length - 1; i++) {
    const start = curvePoints[i];
    const end = curvePoints[i + 1];

    // Check against each intersection's bounding box
    for (const intersection of intersections) {
      if (!intersection.boundingBox) continue;

      // Create line segment
      const lineStart = new THREE.Vector3(...start);
      const lineEnd = new THREE.Vector3(...end);
      const lineDir = new THREE.Vector3().subVectors(lineEnd, lineStart);
      const lineLength = lineDir.length();

      if (lineLength < 0.1) continue; // Skip tiny segments
      lineDir.normalize();

      // Quick box intersection test
      const ray = new THREE.Ray(lineStart, lineDir);
      const intersectionPoint = new THREE.Vector3();

      if (ray.intersectBox(intersection.boundingBox, intersectionPoint)) {
        // Check if intersection point is within segment bounds
        const dist = intersectionPoint.distanceTo(lineStart);
        if (dist <= lineLength) {
          intersectionCount++;
          break; // Count each object only once
        }
      }
    }
  }

  return intersectionCount;
}

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
