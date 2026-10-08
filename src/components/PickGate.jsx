import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { installRaycasterGate, suppressPicking } from '../utils/raycasterGate';

// Camera-motion detector for the global picking gate.
//
// The gate itself lives in utils/raycasterGate.js because it must patch
// Raycaster#intersectObject (the singular method R3F actually calls, not
// the plural one) and must rate-limit with a per-object result cache rather
// than by returning []. This component only reports camera motion so picking
// can be suppressed while the user orbits/pans.
//
// The exported isPickingSuppressed() is also used by the Global* renderers
// to defer full buffer rebuilds until motion settles.

export { suppressPicking, isPickingSuppressed } from '../utils/raycasterGate';

const POS_EPSILON_SQ = 1e-4;
const ROT_EPSILON = 1e-5;

const _prevPos = new THREE.Vector3();
const _prevQuat = new THREE.Quaternion();

function PickGate() {
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    initializedRef.current = true;
    installRaycasterGate();
  }

  useFrame(({ camera }) => {
    const rotated = 1 - Math.abs(_prevQuat.dot(camera.quaternion));
    if (
      _prevPos.distanceToSquared(camera.position) > POS_EPSILON_SQ ||
      rotated > ROT_EPSILON
    ) {
      suppressPicking();
      _prevPos.copy(camera.position);
      _prevQuat.copy(camera.quaternion);
    }
  });

  useFrame(() => { window.__perfFrameStart = performance.now(); }, 9999);
  useFrame(() => {
    const start = window.__perfFrameStart || 0;
    if (start) {
      const dt = performance.now() - start;
      if (dt > 100) console.log(`[perf][frame] span ${Math.round(dt)}ms`);
    }
  }, -9999);

  return null;
}

export default PickGate;
