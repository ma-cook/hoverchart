import * as THREE from 'three';

/**
 * Checks if a straight line between two points intersects with any objects
 */
export function checkLineIntersection(startPos, endPos, objects) {
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

  // Create simplified bounding boxes for objects
  const objectBoxes = objects
    .filter((obj) => obj.type === 'cube' || obj.type === 'sphere')
    .map((obj) => {
      // Create a simple bounding box
      const center = new THREE.Vector3(...obj.position);
      const size = obj.scale || [1, 1, 1];

      // Size multiplier (cube base size is 10 units)
      const sizeMultiplier = obj.type === 'cube' ? 5 : 5;

      return {
        id: obj.id.toString(),
        min: new THREE.Vector3(
          center.x - sizeMultiplier * size[0],
          center.y - sizeMultiplier * size[1],
          center.z - sizeMultiplier * size[2]
        ),
        max: new THREE.Vector3(
          center.x + sizeMultiplier * size[0],
          center.y + sizeMultiplier * size[1],
          center.z + sizeMultiplier * size[2]
        ),
      };
    });

  // Test for intersections
  const lineLength = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  ).length();

  const intersections = [];

  objectBoxes.forEach((box) => {
    // Create a simple box for intersection testing
    const bbox = new THREE.Box3(box.min, box.max);

    // Check if ray intersects box
    const result = ray.ray.intersectBox(bbox, new THREE.Vector3());
    if (result && result.distanceTo(ray.ray.origin) < lineLength) {
      intersections.push({
        objectId: box.id,
        position: [result.x, result.y, result.z],
        distance: result.distanceTo(ray.ray.origin),
      });
    }
  });

  return intersections.sort((a, b) => a.distance - b.distance);
}

/**
 * Creates a curved path around objects
 */
export function generateCurvedPath(
  startPos,
  endPos,
  intersections,
  startConnId,
  endConnId
) {
  if (intersections.length === 0) {
    // No intersections, return straight line points
    return [startPos, endPos];
  }

  // Filter out objects that are the start or end connection points
  const filteredIntersections = intersections.filter(
    (int) => int.objectId !== startConnId && int.objectId !== endConnId
  );

  if (filteredIntersections.length === 0) {
    return [startPos, endPos];
  }

  // Create a midpoint with offset
  const midX = (startPos[0] + endPos[0]) / 2;
  const midY = (startPos[1] + endPos[1]) / 2;
  const midZ = (startPos[2] + endPos[2]) / 2;

  // Calculate perpendicular offset direction (up vector as default)
  const direction = new THREE.Vector3(
    endPos[0] - startPos[0],
    endPos[1] - startPos[1],
    endPos[2] - startPos[2]
  ).normalize();

  // Cross with up vector to get perpendicular direction
  const perpendicular = new THREE.Vector3()
    .crossVectors(direction, new THREE.Vector3(0, 1, 0))
    .normalize();

  // If perpendicular is too small (line is vertical), use another axis
  if (perpendicular.length() < 0.1) {
    perpendicular
      .crossVectors(direction, new THREE.Vector3(1, 0, 0))
      .normalize();
  }

  // Add an up component to make the curve go above obstacles
  const upComponent = new THREE.Vector3(0, 1, 0);

  // Calculate offset distance based on number of intersections
  const offsetDistance = Math.min(10 + filteredIntersections.length * 5, 30);

  // Combine perpendicular and up vectors
  const offsetVector = new THREE.Vector3()
    .addScaledVector(perpendicular, offsetDistance * 0.5)
    .addScaledVector(upComponent, offsetDistance);

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

  // Generate points along the curve
  return curve.getPoints(10);
}
