import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useCameraFollowStore from '../stores/cameraFollowStore';
import useCodeStore from '../stores/codeStore';
import useObjectsStore from '../stores/objectsStore';
import { objectHasCode } from '../services/objectCodeService';
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
 * incident to that object - out to the far endpoint and back - one connection
 * at a time. The camera keeps a FIXED offset from the look-at point, so the
 * viewpoint (angle + distance) never changes; only translation occurs.
 *
 * Any user interaction (pointer / wheel / key) or stopping the follow restores
 * orbit control.
 */
const SAMPLE_SPACING = 25; // world units between resampled path points
const SPEED = 1250; // world units per second along the path
const PAUSE_DURATION_MS = 2000;

const CameraFollowController = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  // Traversal state lives in refs to avoid per-frame store/render churn.
  const activeRef = useRef(null); // { objectId, paths }
  const offsetRef = useRef(new THREE.Vector3()); // camera - target (fixed)
  const pathIndexRef = useRef(0);
  const distanceRef = useRef(0);
  const controlsEnabledRef = useRef(true);
  const lookAtRef = useRef(new THREE.Vector3());
  const phaseRef = useRef('OUTBOUND'); // OUTBOUND | PAUSED | RETURNING
  const pauseUntilRef = useRef(0);
  const lastFollowPairRef = useRef(null);
  const lookAtMarkerRef = useRef(null);

  const syncFollowCodeWindows = (pathMeta) => {
    if (!pathMeta) return;
    const codeStore = useCodeStore.getState();
    const objectsStore = useObjectsStore.getState();
    const activeId = String(activeRef.current?.objectId || '');
    if (!activeId) return;
    const startId = pathMeta.startObjectId ? String(pathMeta.startObjectId) : null;
    const endId = pathMeta.endObjectId ? String(pathMeta.endObjectId) : null;
    const farId = startId === activeId ? endId : (endId === activeId ? startId : (endId || startId));
    if (!farId) return;

    const last = lastFollowPairRef.current;
    if (last && last.connectionId === pathMeta.connectionId && last.farId === farId) {
      codeStore.setFollowActiveConnectionId(pathMeta.connectionId);
      return;
    }

    const objects = objectsStore.objects || [];
    const getObj = (oid) => objects.find((o) => String(o.id) === String(oid)) || null;
    const activeObj = getObj(activeId);
    const farObj = getObj(farId);

    // Close previous follow far window if different
    if (last && last.farId && last.farId !== farId) {
      const prevWinId = codeStore.followWindowByObjectId?.[last.farId];
      if (prevWinId && codeStore.followOpenedWindowIds?.has(prevWinId)) {
        codeStore.closeCodeWindow(prevWinId);
      } else {
        // fallback: find any follow-opened window for that object
        const w = (codeStore.codeWindows || []).find(
          (cw) => String(cw.objectId) === String(last.farId) && codeStore.followOpenedWindowIds?.has(cw.id)
        );
        if (w) codeStore.closeCodeWindow(w.id);
      }
    }

    // Ensure active object window is open if it has code
    if (activeObj && objectHasCode(activeObj)) {
      const existing = (codeStore.codeWindows || []).find((w) => String(w.objectId) === activeId);
      if (existing) {
        // ensure marked as follow-opened
        if (!codeStore.followOpenedWindowIds?.has(existing.id)) {
          codeStore.markFollowWindowOpened(existing.id, activeId);
        }
      } else {
        const wid = codeStore.openCodeWindow(activeId);
        if (wid) codeStore.markFollowWindowOpened(wid, activeId);
      }
    }

    // Open far object window if it has code
    if (farObj && objectHasCode(farObj)) {
      const existing = (codeStore.codeWindows || []).find((w) => String(w.objectId) === farId);
      if (existing) {
        if (!codeStore.followOpenedWindowIds?.has(existing.id)) {
          codeStore.markFollowWindowOpened(existing.id, farId);
        }
      } else {
        const wid = codeStore.openCodeWindow(farId);
        if (wid) codeStore.markFollowWindowOpened(wid, farId);
      }
    }

    codeStore.setFollowActiveConnectionId(pathMeta.connectionId);
    lastFollowPairRef.current = { connectionId: pathMeta.connectionId, activeId, farId };
  };

  const ensureLookAtMarker = () => {
    if (lookAtMarkerRef.current && scene.getObjectById(lookAtMarkerRef.current.id)) return lookAtMarkerRef.current;
    const geometry = new THREE.BoxGeometry(6, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'camera-follow-lookat-marker';
    mesh.renderOrder = 10000;
    scene.add(mesh);
    lookAtMarkerRef.current = mesh;
    return mesh;
  };

  const hideLookAtMarker = () => {
    const marker = lookAtMarkerRef.current;
    if (marker) marker.visible = false;
  };

  const stop = () => {
    const controls = window.orbitControls;
    if (controls) controls.enabled = controlsEnabledRef.current;
    hideLookAtMarker();
    activeRef.current = null;
    phaseRef.current = 'OUTBOUND';
    pauseUntilRef.current = 0;
    lastFollowPairRef.current = null;
    useCodeStore.getState().endFollowSession({ closeFollowOpened: true });
    useCameraFollowStore.getState().stopFollow();
  };

  // React to follow start/stop.
  const activeObjectId = useCameraFollowStore((s) => s.activeObjectId);
  useEffect(() => {
    if (!activeObjectId) {
      // Follow ended externally - restore controls if we were driving them.
      if (activeRef.current) {
        const controls = window.orbitControls;
        if (controls) controls.enabled = controlsEnabledRef.current;
        hideLookAtMarker();
        activeRef.current = null;
        phaseRef.current = 'OUTBOUND';
        pauseUntilRef.current = 0;
        lastFollowPairRef.current = null;
        useCodeStore.getState().endFollowSession({ closeFollowOpened: true });
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
      if (resampled.total > 0) {
        prepared.push({ ...resampled, meta: p });
      }
    }
    if (!prepared.length) {
      useCameraFollowStore.getState().stopFollow();
      return;
    }

    // Capture the fixed camera–target offset; the rig translates by this.
    offsetRef.current.copy(camera.position).sub(controls.target);
    controlsEnabledRef.current = controls.enabled;
    controls.enabled = false;

    useCodeStore.getState().startFollowSession();

    activeRef.current = { objectId: activeObjectId, paths: prepared };
    pathIndexRef.current = 0;
    distanceRef.current = 0;
    phaseRef.current = 'OUTBOUND';
    pauseUntilRef.current = 0;
    lastFollowPairRef.current = null;
    hideLookAtMarker();
    if (prepared[0]?.meta) syncFollowCodeWindows(prepared[0].meta);
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
        hideLookAtMarker();
        activeRef.current = null;
        phaseRef.current = 'OUTBOUND';
        pauseUntilRef.current = 0;
        lastFollowPairRef.current = null;
        useCodeStore.getState().endFollowSession({ closeFollowOpened: true });
        useCameraFollowStore.getState().stopFollow();
      }
      hideLookAtMarker();
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

    const now = performance.now();

    // Handle pause at turnaround (far endpoint)
    if (phaseRef.current === 'PAUSED') {
      if (now >= pauseUntilRef.current) {
        phaseRef.current = 'RETURNING';
      } else {
        invalidate();
        return;
      }
    }

    const dt = Math.min(delta, 0.1); // clamp after stalls / tab switches
    if (phaseRef.current !== 'PAUSED') {
      distanceRef.current += SPEED * dt;
    }

    let resampled = active.paths[pathIndexRef.current];
    if (!resampled) {
      stop();
      return;
    }

    const meta = resampled.meta;
    const turnaround = typeof meta?.turnaroundDistance === 'number' ? meta.turnaroundDistance : Infinity;

    // Check for turnaround/pause
    if (phaseRef.current === 'OUTBOUND' && distanceRef.current >= turnaround) {
      // Clamp to turnaround point for pause
      distanceRef.current = Math.min(distanceRef.current, turnaround);
      phaseRef.current = 'PAUSED';
      pauseUntilRef.current = now + PAUSE_DURATION_MS;
      // Ensure windows are synced for this connection at pause point
      if (meta) syncFollowCodeWindows(meta);
      const point = samplePathAt(resampled, distanceRef.current, lookAtRef.current);
      controls.target.set(point[0], point[1], point[2]);
      camera.position.set(
        point[0] + offsetRef.current.x,
        point[1] + offsetRef.current.y,
        point[2] + offsetRef.current.z
      );
      camera.lookAt(controls.target);
      controls.update();
      const markerPause = ensureLookAtMarker();
      markerPause.position.set(point[0], point[1], point[2]);
      markerPause.visible = true;
      invalidate();
      return;
    }

    // Check if current path completed
    while (resampled && distanceRef.current >= resampled.total) {
      distanceRef.current -= resampled.total;
      pathIndexRef.current += 1;
      phaseRef.current = 'OUTBOUND';
      resampled = active.paths[pathIndexRef.current];
      if (resampled?.meta) {
        syncFollowCodeWindows(resampled.meta);
      }
    }

    if (!resampled) {
      // All connections traversed - auto-end.
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
    const marker = ensureLookAtMarker();
    marker.position.set(point[0], point[1], point[2]);
    marker.visible = true;

    // Keep demand-driven frameloops alive while following.
    invalidate();
  });

  return null;
};

export default CameraFollowController;
