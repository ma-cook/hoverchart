import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { installRaycasterGate, suppressPicking } from '../utils/raycasterGate';
import importPerf from '../utils/importPerf';

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

function PickGate({ canvasQuality }) {
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    initializedRef.current = true;
    installRaycasterGate();
  }

  const gl = useThree((s) => s.gl);
  const internal = useThree((s) => s.internal);

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

  // Frame-span probe + one-shot startup diagnostic (?perf only).
  //
  // IMPORTANT: this probe MUST use a non-positive priority. R3F treats any
  // positive useFrame priority as "a subscriber owns the render pass"
  // (internal.priority += 1), which permanently disables the loop's fallback
  // `gl.render(state.scene, state.camera)`. With an EffectComposer mounted
  // (canvasQuality !== 'low') that was masked, but whenever no composer is
  // present (canvasQuality === 'low') it left the canvas never drawn at all —
  // the flat-gray viewport. -9999 keeps the probe first in the subscriber list
  // without touching the render path.
  const diagRef = useRef(false);
  useFrame(() => {
    const now = performance.now();
    const start = window.__perfFrameStart || 0;
    window.__perfFrameStart = now;

    if (importPerf.enabled && !diagRef.current) {
      diagRef.current = true;
      try {
        const ctx = gl.getContext();
        const canvas = gl.domElement;
        // priority===0 means no positive-priority useFrame is mounted, i.e. the
        // loop's own gl.render() will run; >0 means a composer/render owner is
        // present. canvas.width/height of 0 or lost===true explains a blank view.
        console.log(
          `[perf][diag] canvasQuality=${canvasQuality} priority=${internal?.priority} ` +
          `cores=${navigator.hardwareConcurrency} mem=${navigator.deviceMemory} ` +
          `canvas=${canvas?.width}x${canvas?.height} lost=${ctx?.isContextLost?.()}`
        );
      } catch { /* diagnostic only */ }
    }

    if (importPerf.enabled && start) {
      const dt = now - start;
      if (dt > 100) console.log(`[perf][frame] span ${Math.round(dt)}ms`);
      // A multi-second block right after this probe almost certainly ran
      // inside an instrumented work chunk that never got to its end()
      // before the block.  Dump the still-open markers to name that chunk.
      if (dt > 5000) importPerf.dumpOpenMarks();
    }
  }, -9999);

  return null;
}

export default PickGate;
