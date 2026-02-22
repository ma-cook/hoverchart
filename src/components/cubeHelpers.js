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

// Pre-allocated temp vectors to avoid allocations per call
const _worldPos = new THREE.Vector3();
const _worldScale = new THREE.Vector3();
const _faceOffset = new THREE.Vector3();

// Calculate world position of a face on a cube
export const calculateFaceWorldPosition = (
  cubePosition,
  cubeScale,
  faceName
) => {
  if (Array.isArray(cubePosition)) {
    _worldPos.set(cubePosition[0], cubePosition[1], cubePosition[2]);
  } else {
    _worldPos.set(cubePosition.x, cubePosition.y, cubePosition.z);
  }

  if (Array.isArray(cubeScale)) {
    _worldScale.set(cubeScale[0], cubeScale[1], cubeScale[2]);
  } else {
    _worldScale.set(cubeScale.x, cubeScale.y, cubeScale.z);
  }

  const cubeSize = 5; // Half-size of cube

  switch (faceName) {
    case 'top':
      _faceOffset.set(0, cubeSize * _worldScale.y, 0);
      break;
    case 'bottom':
      _faceOffset.set(0, -cubeSize * _worldScale.y, 0);
      break;
    case 'front':
      _faceOffset.set(0, 0, cubeSize * _worldScale.z);
      break;
    case 'back':
      _faceOffset.set(0, 0, -cubeSize * _worldScale.z);
      break;
    case 'right':
      _faceOffset.set(cubeSize * _worldScale.x, 0, 0);
      break;
    case 'left':
      _faceOffset.set(-cubeSize * _worldScale.x, 0, 0);
      break;
    default:
      _faceOffset.set(0, 0, 0);
  }

  _worldPos.add(_faceOffset);
  return [_worldPos.x, _worldPos.y, _worldPos.z];
};
