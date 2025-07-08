import * as THREE from 'three';

// Calculate the midpoint between two positions
export function calculateMidpoint(pos1, pos2) {
  // Handle vector objects with x,y,z properties
  if (pos1 && pos2 && pos1.x !== undefined && pos2.x !== undefined) {
    return [
      (pos1.x + pos2.x) / 2,
      (pos1.y + pos2.y) / 2,
      (pos1.z + pos2.z) / 2,
    ];
  }

  // Handle arrays [x,y,z]
  if (Array.isArray(pos1) && Array.isArray(pos2)) {
    return [
      (pos1[0] + pos2[0]) / 2,
      (pos1[1] + pos2[1]) / 2,
      (pos1[2] + pos2[2]) / 2,
    ];
  }

  // Fallback
  return [0, 0, 0];
}

// More precise midpoint calculation that can be used with THREE.Vector3 objects
export function calculateMidpointVector(pos1, pos2) {
  // Convert to Vector3 if they're arrays
  const v1 = Array.isArray(pos1)
    ? new THREE.Vector3(...pos1)
    : new THREE.Vector3(pos1.x, pos1.y, pos1.z);
  const v2 = Array.isArray(pos2)
    ? new THREE.Vector3(...pos2)
    : new THREE.Vector3(pos2.x, pos2.y, pos2.z);

  // Calculate midpoint
  return new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
}

// Additional utility for calculating a point along a line at a given fraction (0-1)
export function lerp(a, b, t) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }
  return 0;
}

// Check if a position change is just jitter
export function checkPositionJitter(oldPos, newPos, threshold = 0.001) {
  if (!oldPos || !newPos) return false;

  // Handle array positions
  if (Array.isArray(oldPos) && Array.isArray(newPos)) {
    return (
      Math.abs(oldPos[0] - newPos[0]) < threshold &&
      Math.abs(oldPos[1] - newPos[1]) < threshold &&
      Math.abs(oldPos[2] - newPos[2]) < threshold
    );
  }

  // Handle Vector3 or object positions
  return (
    Math.abs(oldPos.x - newPos.x) < threshold &&
    Math.abs(oldPos.y - newPos.y) < threshold &&
    Math.abs(oldPos.z - newPos.z) < threshold
  );
}

// Export other position-related utilities...
