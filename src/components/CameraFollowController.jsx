import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useCameraFollowStore from '../stores/cameraFollowStore';
import useCodeStore from '../stores/codeStore';
import useObjectsStore from '../stores/objectsStore';
import { objectHasCode } from '../services/objectCodeService';
import {
  buildFollowPaths,
  buildFollowPathsForConnections,
  resamplePath,
  samplePathAt,
} from '../utils/connectionFollowPath';

/**
 * Camera "follow" mode controller.
 *
 * Mounted once in the scene. Two scopes:
 *  - object:      walks every connection line incident to the followed object,
 *                 out to the far endpoint and back, one connection at a time.
 *  - connections: walks the highlighted data-path connections as directional
 *                 runs (branching produces several runs), pausing at every
 *                 intermediate node on the way out, then returning pause-free.
 *
 * The camera keeps a FIXED offset from the look-at point, so the viewpoint
 * (angle + distance) never changes; only translation occurs.
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
  const activeRef = useRef(null); // { mode, objectId, connectionId, paths }
  const offsetRef = useRef(new THREE.Vector3()); // camera - target (fixed)
  const pathIndexRef = useRef(0);
  const distanceRef = useRef(0);
  const controlsEnabledRef = useRef(true);
  const lookAtRef = useRef(new THREE.Vector3());
  const phaseRef = useRef('OUTBOUND'); // OUTBOUND | PAUSED | RETURNING
  const pauseResumePhaseRef = useRef('RETURNING'); // phase to resume after a pause
  const pauseUntilRef = useRef(0);
  const lastFollowPairRef = useRef(null);
  const lookAtMarkerRef = useRef(null);

  const syncFollowCodeWindows = (pathMeta, segmentMeta) => {
    if (!pathMeta) return;
    const codeStore = useCodeStore.getState();
    const objectsStore = useObjectsStore.getState();
    const active = activeRef.current;
    const isConnections = active?.mode === 'connections';
    const segment = segmentMeta || pathMeta.segments?.[0] || pathMeta;

    const activeId = isConnections
      ? segment?.startObjectId != null
        ? String(segment.startObjectId)
        : ''
      : String(active?.objectId || '');
    if (!activeId) return;

    const startId = segment?.startObjectId != null ? String(segment.startObjectId) : null;
    const endId = segment?.endObjectId != null ? String(segment.endObjectId) : null;
    // Connections mode follows the segment direction: active = start node,
    // far = end node. Object mode keeps the followed object as active.
    const farId = isConnections
      ? endId || startId
      : startId === activeId
        ? endId
        : endId === activeId
          ? startId
          : endId || startId;
    if (!farId) return;

    const connectionId = segment?.connectionId ?? pathMeta.connectionId;

    const last = lastFollowPairRef.current;
    if (last && last.connectionId === connectionId && last.farId === farId) {
      codeStore.setFollowActiveConnectionId(connectionId);
      layoutFollowWindows(activeId, farId);
      return;
    }

    const objects = objectsStore.objects || [];
    const getObj = (oid) => objects.find((o) => String(o.id) === String(oid)) || null;
    const activeObj = getObj(activeId);
    const farObj = getObj(farId);

    if (isConnections) {
      // Keep only the current node pair; close stale follow-opened windows.
      const keep = new Set([activeId, farId]);
      for (const cw of codeStore.codeWindows || []) {
        if (!codeStore.followOpenedWindowIds?.has(cw.id)) continue;
        const oid = cw.objectId != null ? String(cw.objectId) : null;
        if (!oid || !keep.has(oid)) codeStore.closeCodeWindow(cw.id);
      }
    } else if (last && last.farId && last.farId !== farId) {
      // Close previous follow far window if different
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

    codeStore.setFollowActiveConnectionId(connectionId);
    lastFollowPairRef.current = { connectionId, activeId, farId };
    try {
      requestAnimationFrame(() => layoutFollowWindows(activeId, farId));
    } catch {
      layoutFollowWindows(activeId, farId);
    }
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

  const layoutFollowWindows = (activeId, farId) => {
    const codeStore = useCodeStore.getState();
    const margin = 16;
    const width = Math.min(560, Math.max(420, window.innerWidth * 0.3));
    const headerHeight = 60;
    const totalH = Math.max(200, window.innerHeight - headerHeight - 80);
    const gap = 10;
    const halfH = Math.floor((totalH - gap) / 2);
    const rightX = window.innerWidth - width - margin;
    const topY = headerHeight;

    const getWinId = (oid) => {
      if (!oid) return null;
      const mapped = codeStore.followWindowByObjectId?.[oid];
      if (mapped && (codeStore.codeWindows || []).some((w) => w.id === mapped)) return mapped;
      const w = (codeStore.codeWindows || []).find((cw) => String(cw.objectId) === String(oid));
      return w?.id || null;
    };

    const srcWinId = getWinId(activeId);
    const dstWinId = getWinId(farId);
    if (srcWinId) {
      codeStore.setCodeWindowLayout(srcWinId, { x: rightX, y: topY, width, height: halfH });
    }
    if (dstWinId && dstWinId !== srcWinId) {
      codeStore.setCodeWindowLayout(dstWinId, { x: rightX, y: topY + halfH + gap, width, height: halfH });
    } else if (dstWinId && dstWinId === srcWinId && srcWinId) {
      codeStore.setCodeWindowLayout(srcWinId, { x: rightX, y: topY, width, height: totalH });
    }
  };

  const getPathSegments = (meta, turnaround) => {
    if (Array.isArray(meta?.segments) && meta.segments.length) {
      return meta.segments;
    }
    return [
      {
        connectionId: meta?.connectionId,
        startObjectId: meta?.startObjectId,
        endObjectId: meta?.endObjectId,
        startDistance: 0,
        endDistance: turnaround,
        speedMultiplier: meta?.speedMultiplier ?? 1,
      },
    ];
  };

  // Arc-length position on the OUTBOUND leg. The return leg mirrors it.
  const mirrorDistance = (distance, turnaround, total) => {
    if (distance <= turnaround) return Math.max(0, distance);
    return Math.max(0, Math.min(turnaround, total - distance));
  };

  const segmentAtOutbound = (segments, outbound) => {
    for (const segment of segments) {
      if (outbound <= segment.endDistance + 1e-6) return segment;
    }
    return segments[segments.length - 1];
  };

  // Distance of the next intermediate node ahead (excludes the turnaround).
  const nextNodeDistance = (segments, distance, turnaround) => {
    let best = Infinity;
    for (const segment of segments) {
      if (
        segment.endDistance > distance + 1e-6 &&
        segment.endDistance < turnaround - 1e-6 &&
        segment.endDistance < best
      ) {
        best = segment.endDistance;
      }
    }
    return best;
  };

  const nextSegmentAfter = (segments, distance) => {
    for (const segment of segments) {
      if (segment.endDistance > distance + 1e-6) return segment;
    }
    return null;
  };

  const stop = () => {
    const controls = window.orbitControls;
    if (controls) controls.enabled = controlsEnabledRef.current;
    hideLookAtMarker();
    activeRef.current = null;
    phaseRef.current = 'OUTBOUND';
    pauseResumePhaseRef.current = 'RETURNING';
    pauseUntilRef.current = 0;
    lastFollowPairRef.current = null;
    useCodeStore.getState().endFollowSession({ closeFollowOpened: true });
    useCameraFollowStore.getState().stopFollow();
  };

  // React to follow start/stop.
  const followMode = useCameraFollowStore((s) => s.followMode);
  const activeObjectId = useCameraFollowStore((s) => s.activeObjectId);
  const activeConnectionId = useCameraFollowStore((s) => s.activeConnectionId);
  const followConnectionIds = useCameraFollowStore((s) => s.followConnectionIds);
  useEffect(() => {
    if (!followMode) {
      // Follow ended externally - restore controls if we were driving them.
      if (activeRef.current) {
        const controls = window.orbitControls;
        if (controls) controls.enabled = controlsEnabledRef.current;
        hideLookAtMarker();
        activeRef.current = null;
        phaseRef.current = 'OUTBOUND';
        pauseResumePhaseRef.current = 'RETURNING';
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

    const paths =
      followMode === 'connections'
        ? buildFollowPathsForConnections(followConnectionIds, activeConnectionId)
        : buildFollowPaths(activeObjectId);
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

    const followPathObjectIds = [];
    const seenPathObjectIds = new Set();
    const addPathObjectId = (id) => {
      if (id == null) return;
      const key = String(id);
      if (seenPathObjectIds.has(key)) return;
      seenPathObjectIds.add(key);
      followPathObjectIds.push(key);
    };
    if (followMode === 'object') addPathObjectId(activeObjectId);
    for (const path of prepared) {
      addPathObjectId(path.meta?.startObjectId);
      addPathObjectId(path.meta?.endObjectId);
      for (const segment of path.meta?.segments || []) {
        addPathObjectId(segment.startObjectId);
        addPathObjectId(segment.endObjectId);
      }
    }
    useCameraFollowStore.getState().setFollowPathObjectIds(followPathObjectIds);

    activeRef.current = {
      mode: followMode,
      objectId: followMode === 'object' ? String(activeObjectId) : null,
      connectionId:
        followMode === 'connections' && activeConnectionId != null
          ? String(activeConnectionId)
          : null,
      paths: prepared,
    };
    pathIndexRef.current = 0;
    distanceRef.current = 0;
    phaseRef.current = 'OUTBOUND';
    pauseResumePhaseRef.current = 'RETURNING';
    pauseUntilRef.current = 0;
    lastFollowPairRef.current = null;
    hideLookAtMarker();
    if (prepared[0]?.meta) {
      const firstMeta = prepared[0].meta;
      syncFollowCodeWindows(firstMeta, firstMeta.segments?.[0] || firstMeta);
    }
    invalidate();
  }, [followMode, activeObjectId, activeConnectionId, followConnectionIds, gl, invalidate]);

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
        pauseResumePhaseRef.current = 'RETURNING';
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

    if (phaseRef.current === 'PAUSED') {
      if (now >= pauseUntilRef.current) {
        phaseRef.current = pauseResumePhaseRef.current;
      } else {
        invalidate();
        return;
      }
    }

    const poseTo = (resampled, distance) => {
      const point = samplePathAt(resampled, distance, lookAtRef.current);
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
      invalidate();
    };

    let resampled = active.paths[pathIndexRef.current];
    if (!resampled) {
      stop();
      return;
    }

    let meta = resampled.meta;
    let turnaround =
      typeof meta?.turnaroundDistance === 'number'
        ? meta.turnaroundDistance
        : resampled.total / 2;
    let segments = getPathSegments(meta, turnaround);

    // Advance at the speed of the segment currently under the camera. On the
    // return leg the outbound distance is mirrored, so each connection keeps
    // its own speed in both directions.
    const dt = Math.min(delta, 0.1); // clamp after stalls / tab switches
    if (phaseRef.current !== 'PAUSED') {
      const outbound = mirrorDistance(
        distanceRef.current,
        turnaround,
        resampled.total
      );
      const segment = segmentAtOutbound(segments, outbound);
      const speedMult = segment?.speedMultiplier ?? meta?.speedMultiplier ?? 1;
      distanceRef.current += SPEED * speedMult * dt;
    }

    if (phaseRef.current === 'OUTBOUND') {
      // Pause at every intermediate node before the turnaround.
      const nodeDistance = nextNodeDistance(
        segments,
        distanceRef.current,
        turnaround
      );
      if (distanceRef.current >= nodeDistance) {
        distanceRef.current = nodeDistance;
        phaseRef.current = 'PAUSED';
        pauseResumePhaseRef.current = 'OUTBOUND';
        pauseUntilRef.current = now + PAUSE_DURATION_MS;
        if (meta) {
          // Show the node we just reached and the node ahead.
          const upcoming =
            nextSegmentAfter(segments, nodeDistance) ||
            segmentAtOutbound(segments, nodeDistance);
          syncFollowCodeWindows(meta, upcoming);
        }
        poseTo(resampled, distanceRef.current);
        return;
      }

      if (distanceRef.current >= turnaround) {
        // Clamp to the turnaround point for the far-end pause.
        distanceRef.current = Math.min(distanceRef.current, turnaround);
        phaseRef.current = 'PAUSED';
        pauseResumePhaseRef.current = 'RETURNING';
        pauseUntilRef.current = now + PAUSE_DURATION_MS;
        if (meta) {
          const lastSegment = segments[segments.length - 1];
          // Connections mode sits on the turnaround node, so show it as the
          // active window heading back to the previous node.
          syncFollowCodeWindows(
            meta,
            active.mode === 'connections'
              ? {
                  ...lastSegment,
                  startObjectId: lastSegment.endObjectId,
                  endObjectId: lastSegment.startObjectId,
                }
              : lastSegment
          );
        }
        poseTo(resampled, distanceRef.current);
        return;
      }
    }

    // Path complete → advance to the next path.
    while (resampled && distanceRef.current >= resampled.total) {
      distanceRef.current -= resampled.total;
      pathIndexRef.current += 1;
      phaseRef.current = 'OUTBOUND';
      pauseResumePhaseRef.current = 'RETURNING';
      resampled = active.paths[pathIndexRef.current];
      if (!resampled) break;
      meta = resampled.meta;
      turnaround =
        typeof meta?.turnaroundDistance === 'number'
          ? meta.turnaroundDistance
          : resampled.total / 2;
      segments = getPathSegments(meta, turnaround);
      if (meta) syncFollowCodeWindows(meta, segments[0]);
    }

    if (!resampled) {
      // All connections traversed - auto-end.
      stop();
      return;
    }

    poseTo(resampled, distanceRef.current);
  });

  return null;
};

export default CameraFollowController;
