import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { installRaycasterGate, suppressPicking } from '../utils/raycasterGate';
import { bulkImportState } from '../utils/bulkImportState';

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

  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // FIX 3b: One-shot GPU warmup — precompile every material once the bulk
  // import settles, so the first sizeable draw after mounting doesn't stall
  // the frame loop on shader compilation (a multi-second hard block on low-end
  // iGPUs).  compile() is idempotent and reuses already-compiled programs, and
  // only runs once per session.
  const compiledRef = useRef(false);
  const sawImportRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (bulkImportState.active) {
        sawImportRef.current = true;
        return;
      }
      if (!sawImportRef.current || compiledRef.current) {
        if (compiledRef.current) clearInterval(id);
        return;
      }
      compiledRef.current = true;
      clearInterval(id);
      try {
        // compileAsync uses KHR_parallel_shader_compile to warm material
        // programs OFF the main thread.  The previous synchronous gl.compile
        // compiled every material in one task — a multi-second main-thread
        // block it was meant to prevent on low-end iGPUs.  When the extension
        // is missing three resolves after a normal compile, so this degrades
        // gracefully.
        if (typeof gl.compileAsync === 'function') {
          gl.compileAsync(scene, camera).catch(() => { /* ignore */ });
        } else {
          gl.compile(scene, camera);
        }
      } catch { /* ignore */ }
    }, 500);
    return () => clearInterval(id);
  }, [gl, scene, camera]);

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
