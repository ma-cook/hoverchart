import * as THREE from 'three';

export const faceMaterialProps = {
  transparent: true,
  opacity: 0.1,
  side: THREE.DoubleSide,
  depthTest: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
};

export const getFaceIndicatorProps = (faceName) => {
  const propsMap = {
    front: { position: [0, 0, 5], rotation: [0, 0, 0] },
    back: { position: [0, 0, -5], rotation: [0, Math.PI, 0] },
    top: { position: [0, 5, 0], rotation: [-Math.PI / 2, 0, 0] },
    bottom: { position: [0, -5, 0], rotation: [Math.PI / 2, 0, 0] },
    right: { position: [5, 0, 0], rotation: [0, Math.PI / 2, 0] },
    left: { position: [-5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  };
  return propsMap[faceName] || { position: [0, 0, 0], rotation: [0, 0, 0] };
};

export const faces = [
  { name: 'front', normal: [0, 0, 1] },
  { name: 'back', normal: [0, 0, -1] },
  { name: 'top', normal: [0, 1, 0] },
  { name: 'bottom', normal: [0, -1, 0] },
  { name: 'right', normal: [1, 0, 0] },
  { name: 'left', normal: [-1, 0, 0] },
];
