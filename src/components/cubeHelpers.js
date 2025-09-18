import * as THREE from 'three';

export const faceMaterialProps = {
  transparent: true,
  opacity: 0.1, // Reverted back to original value
  side: THREE.DoubleSide, // Changed to DoubleSide for better interaction when camera is inside
  depthTest: true,
  depthWrite: false, // Disable depth write to allow nested interactions
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
};

export const getFaceIndicatorProps = (faceName) => {
  switch (faceName) {
    case 'front':
      return {
        position: [0, 0, 5],
        rotation: [0, 0, 0],
        normal: [0, 0, 1],
      };
    case 'back':
      return {
        position: [0, 0, -5],
        rotation: [0, 0, 0],
        normal: [0, 0, -1],
      };
    case 'top':
      return {
        position: [0, 5, 0],
        rotation: [-Math.PI / 2, 0, 0],
        normal: [0, 1, 0],
      };
    case 'bottom':
      return {
        position: [0, -5, 0],
        rotation: [Math.PI / 2, 0, 0],
        normal: [0, -1, 0],
      };
    case 'right':
      return {
        position: [5, 0, 0],
        rotation: [0, Math.PI / 2, 0],
        normal: [1, 0, 0],
      };
    case 'left':
      return {
        position: [-5, 0, 0],
        rotation: [0, -Math.PI / 2, 0],
        normal: [-1, 0, 0],
      };
    default:
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        normal: [0, 0, 1],
      };
  }
};

export const faces = [
  { name: 'front', normal: [0, 0, 1] },
  { name: 'back', normal: [0, 0, -1] },
  { name: 'top', normal: [0, 1, 0] },
  { name: 'bottom', normal: [0, -1, 0] },
  { name: 'right', normal: [1, 0, 0] },
  { name: 'left', normal: [-1, 0, 0] },
];

// Calculate world position of a face on a cube
export const calculateFaceWorldPosition = (
  cubePosition,
  cubeScale,
  faceName
) => {
  const worldPos = Array.isArray(cubePosition)
    ? new THREE.Vector3(cubePosition[0], cubePosition[1], cubePosition[2])
    : new THREE.Vector3(cubePosition.x, cubePosition.y, cubePosition.z);

  const worldScale = Array.isArray(cubeScale)
    ? new THREE.Vector3(cubeScale[0], cubeScale[1], cubeScale[2])
    : new THREE.Vector3(cubeScale.x, cubeScale.y, cubeScale.z);

  const cubeSize = 5; // Half-size of cube
  let faceOffset;

  switch (faceName) {
    case 'top':
      faceOffset = new THREE.Vector3(0, cubeSize * worldScale.y, 0);
      break;
    case 'bottom':
      faceOffset = new THREE.Vector3(0, -cubeSize * worldScale.y, 0);
      break;
    case 'front':
      faceOffset = new THREE.Vector3(0, 0, cubeSize * worldScale.z);
      break;
    case 'back':
      faceOffset = new THREE.Vector3(0, 0, -cubeSize * worldScale.z);
      break;
    case 'right':
      faceOffset = new THREE.Vector3(cubeSize * worldScale.x, 0, 0);
      break;
    case 'left':
      faceOffset = new THREE.Vector3(-cubeSize * worldScale.x, 0, 0);
      break;
    default:
      faceOffset = new THREE.Vector3(0, 0, 0);
  }

  worldPos.add(faceOffset);
  return [worldPos.x, worldPos.y, worldPos.z];
};
