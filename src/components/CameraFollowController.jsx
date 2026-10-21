import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useCameraFollowStore from '../stores/cameraFollowStore';
import {
  buildFollowPaths,
  resamplePath,
  samplePathAt,
} from '../utils/connectionFollowPath';

/**
 * Camera "follow" mode controller.
 *
 * Mounted once in the scene. When cameraFollowStore reports an active object,
 * this walks the camera rig (camera + orbit target) along every connection line
 * incident to that object — out to the far endpoint and back — one connection
 * at a time. The camera keeps a FIXED offset from the look-at point, so the
 * viewpoint (angle + distance) never changes; only translation occurs.
 *
 * Any user interaction (pointer / wheel / key) or stopping the follow restores
 * orbit control.
 */
const SAMPLE_SPACING = 25; // world units between resampled path points
const SPEED = 2500; // world units per second along the path

const CameraFollowController = () => {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  // Traversal state lives in refs to avoid per-frame store/render churn.
  const activeRef = useRef(null); // { objectId, paths }
  const offsetRef = useRef(new THREE.Vector3()); // camera - target (fixed)
  const pathIndexRef = useRef(0);
  const distanceRef = useRef(0);
  const controlsEnabledRef = useRef(true);
  const lookAtRef = useRef(new THREE.Vector3());

  const stop = () => {
    const controls = window.orbitControls;
    if (controls) controls.enabled = controlsEnabledRef.current;
    activeRef.current = null;
    useCameraFollowStore.getState().stopFollow();
  };

  // React to follow start/stop.
  const activeObjectId = useCameraFollowStore((s) => s.activeObjectId);
  useEffect(() => {
    if (!activeObjectId) {
      // Follow ended externally — restore controls if we were driving them.
      if (activeRef.current) {
        const controls = window.orbitControls;
        if (controls) controls.enabled = controlsEnabledRef.current;
        activeRef.current = null;
      }
      return;
    }

    const handle = window.cameraRef;
    const camera = handle?.camera;
    const controls = window.orbitControls;
    if (!camera || !controls) {
      // Camera not ready; cancel to avoid a stuck active state.
      useCameraFollowStore.getState().stopFollow();
      return;
    }

    const paths = buildFollowPaths(activeObjectId);
    if (!paths.length) {
      useCameraFollowStore.getState().stopFollow();
      return;
    }

    // Resample each round-trip path for constant-speed travel.
    const prepared = [];
    for (const p of paths) {
      const resampled = resamplePath(p.points, SAMPLE_SPACING);
      if (resampled.total > 0) prepared.push(resampled);
    }
    if (!prepared.length) {
      useCameraFollowStore.getState().stopFollow();
      return;
    }

    // Capture the fixed camera↔target offset; the rig translates by this.
    offsetRef.current.copy(camera.position).sub(controls.target);
    controlsEnabledRef.current = controls.enabled;
    controls.enabled = false;

    activeRef.current = { objectId: activeObjectId, paths: prepared };
    pathIndexRef.current = 0;
    distanceRef.current = 0;
    invalidate();
  }, [activeObjectId, gl, invalidate]);

  // Cancel on user interaction while following.
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return undefined;
    const cancel = () => {
      if (activeRef.current) stop();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') cancel();
    };
    dom.addEventListener('pointerdown', cancel);
    dom.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      dom.removeEventListener('pointerdown', cancel);
      dom.removeEventListener('wheel', cancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [gl]);

  // Ensure cleanup on unmount.
  useEffect(
    () => () => {
      if (activeRef.current) {
        const controls = window.orbitControls;
        if (controls) controls.enabled = controlsEnabledRef.current;
        activeRef.current = null;
        useCameraFollowStore.getState().stopFollow();
      }
    },
    []
  );

  useFrame((_state, delta) => {
    const active = activeRef.current;
    if (!active) return;

    const handle = window.cameraRef;
    const camera = handle?.camera;
    const controls = window.orbitControls;
    if (!camera || !controls) {
      stop();
      return;
    }

    const dt = Math.min(delta, 0.1); // clamp after stalls / tab switches
    distanceRef.current += SPEED * dt;

    let resampled = active.paths[pathIndexRef.current];
    while (resampled && distanceRef.current >= resampled.total) {
      distanceRef.current -= resampled.total;
      pathIndexRef.current += 1;
      resampled = active.paths[pathIndexRef.current];
    }

    if (!resampled) {
      // All connections traversed — auto-end.
      stop();
      return;
    }

    const point = samplePathAt(resampled, distanceRef.current, lookAtRef.current);

    // Rig translation: target + camera move by the same fixed offset.
    controls.target.set(point[0], point[1], point[2]);
    camera.position.set(
      point[0] + offsetRef.current.x,
      point[1] + offsetRef.current.y,
      point[2] + offsetRef.current.z
    );
    camera.lookAt(controls.target);
    controls.update();

    // Keep demand-driven frameloops alive while following.
    invalidate();
  });

  return null;
};

export default CameraFollowController;
