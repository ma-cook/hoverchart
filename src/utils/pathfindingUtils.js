import * as THREE from 'three';

// Cache settings
const CACHE_LIFETIME = 2000; // 2 seconds - shorter for responsive path updates when objects move
const POSITION_PRECISION = 2; // Decimal places for position rounding
const CLEAN_PROBABILITY = 0.01; // 1% chance to clean cache per call

// Create cache for intersection and path results
const intersectionCache = new Map();
const pathCache = new Map();

// Track object positions for cache invalidation
const objectPositionCache = new Map(); // objectId -> rounded position string

// Pre-computed math constant for roundForCache
const CACHE_MULTIPLIER = Math.pow(10, POSITION_PRECISION);

// Module-level reusable Vector3 objects to reduce GC pressure in hot paths
const _tempDir = new THREE.Vector3();
const _tempResult = new THREE.Vector3();
const _tempBoxCenter = new THREE.Vector3();
const _tempClosest = new THREE.Vector3();
const _tempLineToCenter = new THREE.Vector3();
const _tempBoxRadiusVec = new THREE.Vector3();
const _tempCurveStart = new THREE.Vector3();
const _tempCurveEnd = new THREE.Vector3();
const _tempCurveDir = new THREE.Vector3();
const _tempRay = new THREE.Ray();
const _tempIntersectTarget = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Worker-precomputed results cache
// ---------------------------------------------------------------------------

/**
 * Cache of results precomputed by the pathfinding Web Worker.
 * Keyed by deterministic string derived from start/end positions + connection IDs.
 * Value: `{ hasIntersections: boolean, pathPoints: number[][] }`
 */
const precomputedResults = new Map();

/** True while a worker batch is in-flight to avoid duplicate dispatches. */
let _workerBusy = false;

/** Check if the pathfinding worker is currently computing. */
export function isWorkerBusy() {
  return _workerBusy;
}

/**
 * Completely clear all path-finding caches.
 * Call this whenever objects move so that intersection checks use fresh geometry.
 */
export function invalidatePathfindingCaches() {
  intersectionCache.clear();
  pathCache.clear();
  precomputedResults.clear();
  // Note: objectPositionCache is intentionally kept so checkObjectMovement keeps working.
}

/**
 * Check if an object has moved significantly and invalidate affected caches
 */
export function checkObjectMovement(objectId, position) {
  if (!objectId || !position) return;

  const roundedPos = roundForCache(position).join(',');
  const cached = objectPositionCache.get(objectId);

  if (cached && cached !== roundedPos) {
    // Object moved - invalidate intersection and path caches
    // This is a simple approach that clears all caches when any object moves
    // For better performance, could track which paths use which objects
    intersectionCache.clear();
    pathCache.clear();
  }

  objectPositionCache.set(objectId, roundedPos);
}

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
    (v) => Math.round(v * CACHE_MULTIPLIER) / CACHE_MULTIPLIER
  );
}

// Check if a line intersects a bounding box
function lineIntersectsBoundingBox(line, boundingBox) {
  const lineStart = line.start;
  const lineEnd = line.end;
  const boxMin = boundingBox.min;
  const boxMax = boundingBox.max;

  // If either endpoint is inside the box, it intersects
  if (
    boundingBox.containsPoint(lineStart) ||
    boundingBox.containsPoint(lineEnd)
  ) {
    return true;
  }

  // Ray-box intersection test
  const direction = _tempDir.subVectors(lineEnd, lineStart).normalize();
  const length = lineStart.distanceTo(lineEnd);

  let tMin = 0;
  let tMax = length;

  for (let i = 0; i < 3; i++) {
    const axis = ['x', 'y', 'z'][i];
    const origin = lineStart[axis];
    const dir = direction[axis];

    if (Math.abs(dir) < 1e-8) {
      // Ray is parallel to slab
      if (origin < boxMin[axis] || origin > boxMax[axis]) {
        return false;
      }
    } else {
      const invDir = 1.0 / dir;
      let t1 = (boxMin[axis] - origin) * invDir;
      let t2 = (boxMax[axis] - origin) * invDir;

      if (t1 > t2) [t1, t2] = [t2, t1];

      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);

      if (tMin > tMax) return false;
    }
  }

  return tMin <= length && tMax >= 0;
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

  // NOTE: No hard line-length cutoff here. Very long connections (cross-diagram external
  // connections from merfolk diagrams) must also be checked. The distance filter below
  // handles performance by excluding objects far from the line.

  // Calculate sample points along the line for distance filtering.
  // Five points (start, 1/4, mid, 3/4, end) guarantees any object within 1/4 of the
  // line length from the line is included, regardless of total line length.
  const q1Pos = [
    startPos[0] + (endPos[0] - startPos[0]) * 0.25,
    startPos[1] + (endPos[1] - startPos[1]) * 0.25,
    startPos[2] + (endPos[2] - startPos[2]) * 0.25,
  ];
  const midPos = [
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2,
    (startPos[2] + endPos[2]) / 2,
  ];
  const q3Pos = [
    startPos[0] + (endPos[0] - startPos[0]) * 0.75,
    startPos[1] + (endPos[1] - startPos[1]) * 0.75,
    startPos[2] + (endPos[2] - startPos[2]) * 0.75,
  ];

  // Filter and process objects for intersection testing
  const objectsToTest = objects.filter((obj) => {
    if (!obj?.position || !Array.isArray(obj.position)) return false;

    // Check distance from all five sample points to catch objects anywhere along the line
    const p = obj.position;
    const d = (sp) => Math.pow(p[0]-sp[0],2) + Math.pow(p[1]-sp[1],2) + Math.pow(p[2]-sp[2],2);
    const minDistSquared = Math.min(d(startPos), d(q1Pos), d(midPos), d(q3Pos), d(endPos));
    
    // Threshold: any object within (lineLength/4 + 50 units) of a sample point is tested.
    // Covers the entire line since sample points are spaced every lineLength/4.
    const segLen = lineLength / 4;
    const threshold = (segLen + 50) * (segLen + 50);
    return minDistSquared < threshold;
  });
  // Hoist invariant line vectors (reused across all objectBoxes iterations)
  const cliLineStart = new THREE.Vector3(startPos[0], startPos[1], startPos[2]);
  const cliLineEnd = new THREE.Vector3(endPos[0], endPos[1], endPos[2]);
  const cliLineDir = new THREE.Vector3().subVectors(cliLineEnd, cliLineStart);
  const cliLineLength = cliLineDir.length();
  cliLineDir.normalize();

  const ray = new THREE.Raycaster(cliLineStart, cliLineDir);

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
    const bbox = new THREE.Box3(box.min, box.max);

    // Check if ray intersects box (reuse module-level temp)
    const hitPoint = ray.ray.intersectBox(bbox, _tempResult);

    // Does the line segment actually pass through or near the box?
    _tempBoxCenter.addVectors(box.min, box.max).multiplyScalar(0.5);

    // Project box center onto line segment
    _tempLineToCenter.subVectors(_tempBoxCenter, cliLineStart);
    const projectionLength = _tempLineToCenter.dot(cliLineDir);
    const clampedProjection = Math.max(
      0,
      Math.min(cliLineLength, projectionLength)
    );
    _tempClosest.copy(cliLineStart).addScaledVector(cliLineDir, clampedProjection);

    const distanceToLine = _tempBoxCenter.distanceTo(_tempClosest);
    const boxRadius =
      _tempBoxRadiusVec.subVectors(box.max, box.min).length() * 0.5;

    // Consider it an intersection if:
    // 1. Ray intersects the box AND intersection is within line segment, OR
    // 2. Line segment passes close to the box center
    const rayIntersectsInRange =
      hitPoint && hitPoint.distanceTo(ray.ray.origin) <= cliLineLength;
    const linePassesNearBox = distanceToLine <= boxRadius;

    if (rayIntersectsInRange || linePassesNearBox) {
      intersections.push({
        objectId: box.id,
        objectType: box.type,
        position: hitPoint
          ? [hitPoint.x, hitPoint.y, hitPoint.z]
          : [_tempClosest.x, _tempClosest.y, _tempClosest.z],
        distance: hitPoint
          ? hitPoint.distanceTo(ray.ray.origin)
          : clampedProjection,
        boundingBox: bbox,
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

  // EARLY CHECK: Detect parent-child relationships and container objects
  const startVec = new THREE.Vector3(...startPos);
  const endVec = new THREE.Vector3(...endPos);

  // Ensure consistent string comparison for object IDs
  const startConnIdStr = startConnId?.toString();
  const endConnIdStr = endConnId?.toString();

  if (intersections && intersections.length > 0) {
    for (const int of intersections) {
      if (int.boundingBox && int.objectId) {
        const bbox = int.boundingBox;

        // Check if both endpoints are inside this bounding box
        if (bbox.containsPoint(startVec) && bbox.containsPoint(endVec)) {
          const lineLength = startVec.distanceTo(endVec);
          const bboxSize = new THREE.Vector3().subVectors(bbox.max, bbox.min);
          const avgBboxSize = (bboxSize.x + bboxSize.y + bboxSize.z) / 3;

          // CASE 1: Direct parent-child relationship
          // If this intersection object is one of the connected objects (parent contains child)
          if (
            int.objectId === startConnIdStr ||
            int.objectId === endConnIdStr
          ) {
            const straightPath = [startPos, endPos];
            pathCache.set(pathCacheKey, {
              path: straightPath,
              timestamp: Date.now(),
            });
            return straightPath;
          }

          // CASE 2: Container object (both objects inside a third object)
          // If the bounding box is significantly larger than the connection line,
          // treat this as a container and use straight line
          if (avgBboxSize > lineLength * 2) {
            const straightPath = [startPos, endPos];
            pathCache.set(pathCacheKey, {
              path: straightPath,
              timestamp: Date.now(),
            });
            return straightPath;
          }
        }
      }
    }
  }

  // Detect when objects are inside other objects and use straight lines
  let isParentChildInside = false;
  let parentContainerId = null;

  if (intersections && intersections.length > 0) {
    // First check: traditional parent-child where both endpoints are inside one object
    for (const int of intersections) {
      if (
        (int.objectId === startConnIdStr || int.objectId === endConnIdStr) &&
        int.boundingBox
      ) {
        const bbox = int.boundingBox;
        if (bbox.containsPoint(startVec) && bbox.containsPoint(endVec)) {
          isParentChildInside = true;
          parentContainerId = int.objectId;
          break;
        }
      }
    }

    // Second check: when one or both connected objects are entirely inside another object
    // Check ALL intersections, not just those different from connected objects
    if (!isParentChildInside) {
      for (const int of intersections) {
        if (int.boundingBox) {
          const bbox = int.boundingBox;

          // Check if both connection endpoints are inside this object's bounding box
          const startInside = bbox.containsPoint(startVec);
          const endInside = bbox.containsPoint(endVec);

          if (startInside && endInside) {
            // Check if this is a container (larger than the connection line)
            const lineLength = startVec.distanceTo(endVec);
            const bboxSize = new THREE.Vector3().subVectors(bbox.max, bbox.min);
            const minBboxDimension = Math.min(
              bboxSize.x,
              bboxSize.y,
              bboxSize.z
            );

            // If the bounding box is significantly larger than the connection line,
            // it's likely a container holding both objects
            if (minBboxDimension > lineLength * 1.5) {
              isParentChildInside = true;
              parentContainerId = int.objectId;
              break;
            }
          }
        }
      }
    }
  }

  // Additional check: if intersection detection missed container objects,
  // check if connection line is entirely within any large object
  if (!isParentChildInside && intersections && intersections.length > 0) {
    const lineLength = startVec.distanceTo(endVec);

    // Look for large objects that might contain both endpoints
    for (const int of intersections) {
      if (int.boundingBox) {
        const bbox = int.boundingBox;
        const bboxSize = new THREE.Vector3().subVectors(bbox.max, bbox.min);
        const bboxVolume = bboxSize.x * bboxSize.y * bboxSize.z;

        // If this is a large object (volume-based check)
        if (bboxVolume > lineLength * lineLength * lineLength * 0.1) {
          // Create a slightly smaller bounding box to check if endpoints are well inside
          const margin = Math.min(lineLength * 0.1, 5);
          const innerBbox = bbox.clone();
          innerBbox.min.addScalar(margin);
          innerBbox.max.subScalar(margin);

          if (
            innerBbox.containsPoint(startVec) &&
            innerBbox.containsPoint(endVec)
          ) {
            isParentChildInside = true;
            parentContainerId = int.objectId;
            break;
          }
        }
      }
    }
  }

  // If this is a parent-child-inside case, keep straight ONLY when there are no other intersections.
  // If there are obstacles, we still need to route around them.
  // Keep straight line only if the only intersection is with the parent container (or none)
  if (isParentChildInside) {
    const otherHits = (intersections || []).filter(
      (hit) => hit.objectId !== parentContainerId
    );
    if (otherHits.length === 0) {
      const straightPath = [startPos, endPos];
      pathCache.set(pathCacheKey, {
        path: straightPath,
        timestamp: Date.now(),
      });
      return straightPath;
    }
  }

  // Check for front-facing connections that might not need curves
  const attachmentIntersections = intersections.filter(
    (int) => int.objectId === startConnIdStr || int.objectId === endConnIdStr
  );

  // Filter out intersections that are ONLY the attachment objects themselves
  const obstacleIntersections = intersections.filter(
    (int) => int.objectId !== startConnIdStr && int.objectId !== endConnIdStr
  );

  // Check if this is a front face that doesn't intersect its own attachment object
  let isFrontFaceNoSelfIntersection = false;
  if (attachmentIntersections.length > 0) {
    const attachmentHit = attachmentIntersections[0];
    if (attachmentHit.boundingBox) {
      const attachmentCenter = new THREE.Vector3()
        .addVectors(
          attachmentHit.boundingBox.min,
          attachmentHit.boundingBox.max
        )
        .multiplyScalar(0.5);

      const distToStart = attachmentCenter.distanceTo(startVec);
      const distToEnd = attachmentCenter.distanceTo(endVec);
      const attachmentPoint = distToStart < distToEnd ? startVec : endVec;
      const destinationPoint = distToStart < distToEnd ? endVec : startVec;

      // Calculate face normal and check if it points toward destination
      const faceNormal = new THREE.Vector3()
        .subVectors(attachmentPoint, attachmentCenter)
        .normalize();
      const toDestination = new THREE.Vector3()
        .subVectors(destinationPoint, attachmentPoint)
        .normalize();

      const alignment = faceNormal.dot(toDestination);

      // Check if straight line intersects the attachment object's bounding box
      const line = new THREE.Line3(attachmentPoint, destinationPoint);
      const intersectsAttachment = attachmentHit.boundingBox.intersectsLine
        ? attachmentHit.boundingBox.intersectsLine(line)
        : lineIntersectsBoundingBox(line, attachmentHit.boundingBox);

      if (alignment > 0.5 && !intersectsAttachment) {
        isFrontFaceNoSelfIntersection = true;
      }
    }
  }

  // If front face with no self-intersection, only curve if there are other obstacles
  if (isFrontFaceNoSelfIntersection && obstacleIntersections.length === 0) {
    const straightPath = [startPos, endPos];
    pathCache.set(pathCacheKey, {
      path: straightPath,
      timestamp: Date.now(),
    });
    return straightPath;
  }

  // IMPORTANT: If there are no obstacles (only attachment intersections), use straight line
  if (obstacleIntersections.length === 0) {
    const straightPath = [startPos, endPos];
    pathCache.set(pathCacheKey, {
      path: straightPath,
      timestamp: Date.now(),
    });
    return straightPath;
  }

  // Use multi-segment curves with smart direction selection
  let curveDirections = ['up', 'right', 'left', 'down'];

  // For front faces, prioritize downward curves to avoid curving into object
  if (
    isFrontFaceNoSelfIntersection ||
    (attachmentIntersections.length > 0 && obstacleIntersections.length > 0)
  ) {
    curveDirections = ['down', 'left', 'right', 'up'];
  }

  let bestCurve = null;
  let minIntersections = Infinity;
  for (const direction of curveDirections) {
    const curve = generateMultiSegmentPath(
      startPos,
      endPos,
      intersections,
      direction,
      startConnId,
      endConnId,
      attachmentIntersections.length > 0 ? attachmentIntersections[0] : null
    );
    const count = checkCurveIntersections(curve, intersections);
    if (count < minIntersections) {
      minIntersections = count;
      bestCurve = curve;
    }
  }
  pathCache.set(pathCacheKey, {
    path: bestCurve,
    timestamp: Date.now(),
  });
  return bestCurve;
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

    // Compute segment vectors once per outer iteration
    _tempCurveStart.set(start[0], start[1], start[2]);
    _tempCurveEnd.set(end[0], end[1], end[2]);
    _tempCurveDir.subVectors(_tempCurveEnd, _tempCurveStart);
    const lineLength = _tempCurveDir.length();
    if (lineLength < 0.1) continue;
    _tempCurveDir.normalize();
    _tempRay.set(_tempCurveStart, _tempCurveDir);

    // Check against each intersection's bounding box
    for (const intersection of intersections) {
      if (!intersection.boundingBox) continue;

      if (_tempRay.intersectBox(intersection.boundingBox, _tempIntersectTarget)) {
        const dist = _tempIntersectTarget.distanceTo(_tempCurveStart);
        if (dist <= lineLength) {
          intersectionCount++;
          break;
        }
      }
    }
  }

  return intersectionCount;
}

/**
 * Generate multi-segment path with waypoints for attachment object avoidance
 * Uses Catmull-Rom splines for smooth multi-segment curves
 */
function generateMultiSegmentPath(
  startPos,
  endPos,
  intersections,
  curveDirection,
  startConnId,
  endConnId,
  attachmentHit
) {
  const startVec = new THREE.Vector3(...startPos);
  const endVec = new THREE.Vector3(...endPos);
  const lineDirection = new THREE.Vector3()
    .subVectors(endVec, startVec)
    .normalize();
  const lineLength = startVec.distanceTo(endVec);

  // Ensure consistent string comparison for object IDs
  const startConnIdStr = startConnId?.toString();
  const endConnIdStr = endConnId?.toString();

  // Find attachment object intersections
  const attachmentIntersections = intersections.filter(
    (int) => int.objectId === startConnIdStr || int.objectId === endConnIdStr
  );

  // Use all intersections for avoidance if no attachment intersections
  const avoidanceIntersections =
    attachmentIntersections.length > 0
      ? attachmentIntersections
      : intersections;

  // Calculate avoidance parameters based on largest object size
  let maxObjectSize = 30;
  let attachmentCenter = null;
  avoidanceIntersections.forEach((intersection) => {
    if (intersection.boundingBox) {
      const bbox = intersection.boundingBox;
      const extents = new THREE.Vector3().subVectors(bbox.max, bbox.min);
      const maxDim = Math.max(extents.x, extents.y, extents.z); // less aggressive than diagonal length
      maxObjectSize = Math.max(maxObjectSize, maxDim);
      if (!attachmentCenter) {
        attachmentCenter = new THREE.Vector3()
          .addVectors(bbox.min, bbox.max)
          .multiplyScalar(0.5);
      }
    }
  });

  // Determine which end is closer to the attachment object (attachment point)
  let attachmentPoint = startVec;
  let destinationPoint = endVec;
  if (attachmentCenter) {
    const distToStart = attachmentCenter.distanceTo(startVec);
    const distToEnd = attachmentCenter.distanceTo(endVec);
    if (distToEnd < distToStart) {
      attachmentPoint = endVec;
      destinationPoint = startVec;
    }
  }

  // Create waypoints for multi-segment path
  const waypoints = [];
  waypoints.push(attachmentPoint);

  // Calculate avoidance direction and distance (scaled with object size)
  const baseClearance = maxObjectSize * 0.8 + 15; // Increased base clearance
  const maxClearance = Math.min(lineLength * 0.25, 150); // Increased max clearance
  const minClearance = Math.max(25, maxObjectSize * 0.6); // Size-aware minimum clearance
  const clearanceDistance = Math.min(
    Math.max(baseClearance, minClearance),
    maxClearance
  );

  let avoidanceDirection;
  if (attachmentCenter && attachmentHit) {
    // Use the actual intersection point to calculate a better face normal
    const hitPoint = new THREE.Vector3(...attachmentHit.position);
    const centerPoint = new THREE.Vector3(...attachmentCenter);

    // Calculate face normal from center to hit point
    avoidanceDirection = new THREE.Vector3()
      .subVectors(hitPoint, centerPoint)
      .normalize();

    // If the direction is too weak, fall back to attachment point direction
    if (avoidanceDirection.length() < 0.1) {
      avoidanceDirection = new THREE.Vector3()
        .subVectors(attachmentPoint, centerPoint)
        .normalize();
    }
  } else {
    avoidanceDirection = new THREE.Vector3()
      .crossVectors(lineDirection, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (avoidanceDirection.length() < 0.1) {
      avoidanceDirection.set(0, 1, 0);
    }
  }

  // Store the original outward direction before applying curve preferences
  const originalOutwardDirection = avoidanceDirection.clone();

  // Apply curve direction preference (with reduced influence to maintain face normal priority)
  switch (curveDirection) {
    case 'up':
      avoidanceDirection.y = Math.abs(avoidanceDirection.y) + 0.2;
      avoidanceDirection.normalize();
      break;
    case 'down':
      avoidanceDirection.y = -Math.abs(avoidanceDirection.y) - 0.2;
      avoidanceDirection.normalize();
      break;
    case 'right': {
      const rightPerp = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), lineDirection)
        .normalize();
      if (rightPerp.length() > 0.1) {
        avoidanceDirection.add(rightPerp.multiplyScalar(0.15)).normalize();
      }
      break;
    }
    case 'left': {
      const leftPerp = new THREE.Vector3()
        .crossVectors(lineDirection, new THREE.Vector3(0, 1, 0))
        .normalize();
      if (leftPerp.length() > 0.1) {
        avoidanceDirection.add(leftPerp.multiplyScalar(0.15)).normalize();
      }
      break;
    }
  }

  // Validate that the modified direction is still pointing away from the object center
  if (attachmentCenter) {
    const centerPoint = new THREE.Vector3(...attachmentCenter);
    const testPoint = attachmentPoint
      .clone()
      .add(avoidanceDirection.clone().multiplyScalar(10));
    const distanceFromCenter = testPoint.distanceTo(centerPoint);
    const originalDistanceFromCenter = attachmentPoint.distanceTo(centerPoint);

    // If the modified direction brings us closer to the center, use the original outward direction
    if (distanceFromCenter <= originalDistanceFromCenter) {
      avoidanceDirection = originalOutwardDirection;
    }
  }

  // Special handling for directly facing faces with obstacles between them
  // Check if faces are roughly facing each other and adjust avoidance direction
  if (attachmentCenter) {
    const centerPoint = new THREE.Vector3(...attachmentCenter);
    const faceNormal = avoidanceDirection.clone();
    const connectionDirection = new THREE.Vector3()
      .subVectors(destinationPoint, attachmentPoint)
      .normalize();

    // If face normal is roughly opposite to connection direction (faces facing each other)
    const alignment = faceNormal.dot(connectionDirection);
    if (alignment < -0.3) {
      // Faces are somewhat facing each other
      // Find a perpendicular direction that avoids both objects
      const perpDirection1 = new THREE.Vector3()
        .crossVectors(connectionDirection, new THREE.Vector3(0, 1, 0))
        .normalize();
      const perpDirection2 = new THREE.Vector3()
        .crossVectors(connectionDirection, perpDirection1)
        .normalize();

      // Choose the perpendicular direction that moves away from attachment center
      const testPoint1 = attachmentPoint
        .clone()
        .add(perpDirection1.clone().multiplyScalar(10));
      const testPoint2 = attachmentPoint
        .clone()
        .add(perpDirection2.clone().multiplyScalar(10));
      const dist1 = testPoint1.distanceTo(centerPoint);
      const dist2 = testPoint2.distanceTo(centerPoint);

      // Use the direction that moves further from the attachment center
      const chosenPerp = dist1 > dist2 ? perpDirection1 : perpDirection2;

      // Blend the face normal with the perpendicular direction
      avoidanceDirection = faceNormal
        .clone()
        .multiplyScalar(0.6)
        .add(chosenPerp.multiplyScalar(0.4))
        .normalize();
    }
  }

  // Waypoint 1: Move outward from attachment point (object-size-aware gentle curve)
  const initialOutwardDistance = Math.max(
    clearanceDistance * 0.8,
    maxObjectSize * 0.5
  );
  const outwardPoint = attachmentPoint
    .clone()
    .add(avoidanceDirection.clone().multiplyScalar(initialOutwardDistance));

  // Safety check: ensure waypoint is outside object bounding box
  if (attachmentHit && attachmentHit.boundingBox) {
    const bbox = attachmentHit.boundingBox;
    if (bbox.containsPoint(outwardPoint)) {
      // If waypoint is inside bounding box, push it further out
      const extraDistance = Math.max(maxObjectSize * 0.3, 20);
      outwardPoint.add(
        avoidanceDirection.clone().multiplyScalar(extraDistance)
      );
    }
  }
  waypoints.push([outwardPoint.x, outwardPoint.y, outwardPoint.z]);

  // Waypoint 2: Curve around the object (maintaining strong outward emphasis)
  const midProgress = 0.5;
  const baseMidPoint = new THREE.Vector3()
    .addVectors(attachmentPoint, destinationPoint)
    .multiplyScalar(midProgress);
  const midOutwardDistance = Math.max(
    clearanceDistance * 1.0,
    maxObjectSize * 0.7
  );
  const curvePoint = baseMidPoint
    .clone()
    .add(avoidanceDirection.clone().multiplyScalar(midOutwardDistance));

  // Safety check for curve point as well
  if (attachmentHit && attachmentHit.boundingBox) {
    const bbox = attachmentHit.boundingBox;
    if (bbox.containsPoint(curvePoint)) {
      const extraDistance = Math.max(maxObjectSize * 0.4, 25);
      curvePoint.add(avoidanceDirection.clone().multiplyScalar(extraDistance));
    }
  }
  waypoints.push([curvePoint.x, curvePoint.y, curvePoint.z]);

  // Waypoint 3: Transition back toward destination
  // Scale approach distance with line length so long connections curve gradually
  // instead of making a sharp turn right at the destination.
  const approachBackDistance = Math.max(
    clearanceDistance * 0.4,
    Math.min(lineLength * 0.15, 200)
  );
  const approachSideDistance = Math.max(
    clearanceDistance * 0.2,
    Math.min(lineLength * 0.06, 80)
  );
  const approachPoint = destinationPoint
    .clone()
    .add(lineDirection.clone().multiplyScalar(-approachBackDistance))
    .add(avoidanceDirection.clone().multiplyScalar(approachSideDistance));
  waypoints.push([approachPoint.x, approachPoint.y, approachPoint.z]);

  // End point
  waypoints.push(destinationPoint);

  // If we started from the end point, reverse the waypoints
  if (attachmentPoint.equals(endVec)) {
    waypoints.reverse();
  }

  // Create smooth multi-segment curve using Catmull-Rom spline
  const splinePoints = waypoints.map((wp) => new THREE.Vector3(...wp));
  const curve = new THREE.CatmullRomCurve3(
    splinePoints,
    false,
    'catmullrom',
    0.5
  );
  // More subdivision points for longer curves so they stay smooth
  const subdivisions = Math.max(20, Math.min(waypoints.length * 6, Math.ceil(lineLength / 5)));
  const curvePoints = curve.getPoints(subdivisions);
  return curvePoints.map((point) => [point.x, point.y, point.z]);
}

// ---------------------------------------------------------------------------
// Worker-backed batch precomputation
// ---------------------------------------------------------------------------

/**
 * Build the cache key used for the precomputed results map.
 * Must be deterministic for the same logical connection.
 */
function precomputeCacheKey(startPos, endPos, startConnId, endConnId) {
  const rs = roundForCache(startPos);
  const re = roundForCache(endPos);
  return `${rs.join(',')}|${re.join(',')}|${startConnId}|${endConnId}`;
}

/** True once the pathfinding worker has delivered results into the
 *  main-thread precomputed cache.  Lets renderers distinguish a warm cache
 *  (the sync fallback is cheap) from a cold one (every miss pays the full
 *  O(objects) checkLineIntersection pass). */
export function hasPrecomputedPathCache() {
  return precomputedResults.size > 0;
}

/**
 * Look up a worker-precomputed result.
 *
 * @returns {{ hasIntersections: boolean, pathPoints: number[][] } | null}
 */
export function getPrecomputedResult(startPos, endPos, startConnId, endConnId) {
  if (precomputedResults.size === 0) return null;
  const key = precomputeCacheKey(startPos, endPos, startConnId, endConnId);
  return precomputedResults.get(key) || null;
}

/**
 * Combined helper: returns a precomputed path if available, otherwise
 * falls back to synchronous computation on the main thread.
 *
 * @returns {{ hasIntersections: boolean, pathPoints: number[][] }}
 */
export function computeConnectionPath(
  startPos,
  endPos,
  objects,
  startConnId,
  endConnId
) {
  // 1. Worker-precomputed cache
  const precomputed = getPrecomputedResult(
    startPos, endPos, startConnId, endConnId
  );
  if (precomputed) return precomputed;

  // 2. Sync fallback (still uses its own TTL caches)
  const intersections = checkLineIntersection(startPos, endPos, objects);
  const hasIntersections =
    intersections !== null &&
    intersections !== undefined &&
    intersections.length > 0;
  const pathPoints = hasIntersections
    ? generateCurvedPath(
        startPos, endPos, intersections, startConnId, endConnId, true
      )
    : [startPos, endPos];
  return { hasIntersections, pathPoints };
}

/**
 * Dispatch a batch of connection path computations to the Web Worker.
 *
 * Call this whenever the connection list or object positions change.
 * Results populate `precomputedResults` so that subsequent sync calls
 * to `computeConnectionPath` / `getPrecomputedResult` are instant.
 *
 * This is fire-and-forget — it does NOT trigger React re-renders.
 * Results are picked up passively on the next natural render cycle.
 *
 * @param {Array<{id: string, startPos: number[], endPos: number[],
 *                 startConnId: string, endConnId: string}>} requests
 * @param {Array<{id: string, type: string, position: number[],
 *                 scale: number[]}>} objects — plain serialisable object data
 * @returns {Promise<void>}
 */
export async function precomputePathsBatch(requests, objects) {
  if (_workerBusy || !requests || requests.length === 0) {
    return;
  }

  let workerProxy;
  try {
    // Lazy import to avoid bundling worker code into the main chunk when
    // the feature isn't used (e.g. SSR, tests).
    const { getPathfindingWorker } = await import(
      '../workers/pathfindingWorkerClient.js'
    );
    workerProxy = getPathfindingWorker();
  } catch {
    // Worker unavailable (e.g. SharedArrayBuffer restrictions, test env).
    return;
  }

  _workerBusy = true;

  try {
    // Invalidate worker-side caches too, so it recomputes from scratch.
    await workerProxy.invalidateCaches();

    const results = await workerProxy.computePathsBatch(requests, objects);

    // Build O(1) lookup for matching requests to results.
    const requestsById = new Map(requests.map(r => [r.id, r]));

    // Populate the main-thread precomputed map.
    // PERF FIX: do NOT clear the map per batch.  Results are keyed by
    // positions + connection ids, so stale entries simply stop being hit;
    // wiping here threw away every earlier batch's results during imports,
    // forcing O(C*N) recomputation once mounting settled.  Real object
    // moves still invalidate via invalidatePathfindingCaches().
    for (const res of results) {
      const req = requestsById.get(res.id);
      if (!req) continue;
      const key = precomputeCacheKey(
        req.startPos, req.endPos, req.startConnId, req.endConnId
      );
      precomputedResults.set(key, {
        hasIntersections: res.hasIntersections,
        pathPoints: res.pathPoints,
      });
    }
  } catch (err) {
    console.warn('[pathfinding] Worker batch failed:', err);
  } finally {
    _workerBusy = false;
  }
}

