import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Global picking gate for very large diagrams.
//
// Every pointer move normally triggers R3F raycasting against every
// interactive mesh, including custom O(N) raycasters that iterate all
// connection segments. On ~100k-object scenes this alone drops frames to
// near zero whenever the mouse moves. This module patches
// THREE.Raycaster#intersectObjects so that:
//   - while the camera is moving, picking is suppressed entirely plus a
//     short tail after motion stops (hover re-checks right after you stop);
//   - when idle, picks run at most once per PICK_MIN_INTERVAL_MS (~30Hz),
//     which caps worst-case cost regardless of mouse polling rate.
//
// Clicks are unaffected except within the short post-motion suppression
// window (<200ms), where a click right after orbiting may fall through.

const MOTION_TAIL_MS = 150;
const PICK_MIN_INTERVAL_MS = 33;
const POS_EPSILON_SQ = 1e-4;
const ROT_EPSILON = 1e-5;

let suppressedUntil = 0;
let lastPickAt = -1e9;
let installed = false;

export const suppressPicking = (ms = MOTION_TAIL_MS) => {
  const until = performance.now() + ms;
  if (until > suppressedUntil) suppressedUntil = until;
};

export const isPickingSuppressed = () => performance.now() < suppressedUntil;

const installPickGate = () => {
  if (installed) return;
  installed = true;
  const gate = (original) =>
    function (...args) {
      const now = performance.now();
      if (now < suppressedUntil || now - lastPickAt < PICK_MIN_INTERVAL_MS) {
        return [];
      }
      lastPickAt = now;
      return original.apply(this, args);
    };
  THREE.Raycaster.prototype.intersectObjects = gate(
    THREE.Raycaster.prototype.intersectObjects
  );
};

const _prevPos = new THREE.Vector3();
const _prevQuat = new THREE.Quaternion();

function PickGate() {
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    initializedRef.current = true;
    installPickGate();
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

  return null;
}

export default PickGate;
