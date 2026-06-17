import { memo, useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { shallow } from 'zustand/shallow';
import * as THREE from 'three';
import useHandTrackingStore from '../stores/handTrackingStore';
import InstancedLine from './InstancedLine';

// The hand-tracking group lives in the scene graph (NOT parented to the
// camera, because R3F cameras aren't always children of the scene tree).
// Each frame we copy the camera's world transform onto the group, then
// offset HAND_DISTANCE units along the camera's forward axis. Inside that
// group, normalized [0,1] image-space landmarks are scaled by HAND_WORLD_SCALE.
const HAND_DISTANCE = 500;     // base z offset in front of camera
const HAND_WORLD_SCALE = 600;  // multiplier for normalized [0,1] → world units
const JOINT_CUBE_SIZE = 12;    // edge length of joint cubes
const BONE_LINE_WIDTH = 3;
const MAX_JOINTS_PER_HAND = 21;
const FLOATS_PER_HAND = MAX_JOINTS_PER_HAND * 3; // 63

// --- Reversed depth-perception parameters ---------------------------------
// In the raw image, a hand close to the webcam occupies a larger area; that
// would normally make the rendered hand look big and near. We invert this:
// we measure the image-space bounding-box diagonal of the landmarks and use
// it both to scale the group inversely AND to push the group further down
// the camera's forward axis when the hand is large in image space.
//
// REFERENCE_HAND_DIAG — the normalized [0,1] bbox-diagonal that maps to
// scale=1.0 and z=HAND_DISTANCE. Tuned for a hand at ~arm's length from
// a 320×240 webcam.
const REFERENCE_HAND_DIAG = 0.4;
// How aggressively scale shrinks as the hand grows. 1.0 = pure inverse;
// values <1 dampen the effect, >1 exaggerate it.
const INVERSE_SCALE_GAMMA = 1.0;
// Extra forward/backward push, in world units, per unit of (size/ref - 1).
// Set to 0 by default: per-frame bbox jitter on the active hand makes the
// z-target wobble, which is perceived as the hand drifting along the
// camera's forward axis. The scale-flip below already conveys the reversed
// depth cue convincingly. Raise this if you want a stronger parallax.
const INVERSE_DEPTH_GAIN = 0;
// Clamp the resulting scale so a tiny detection bbox doesn't blow up to
// absurd sizes and a huge one doesn't collapse to zero.
const MIN_GROUP_SCALE = 0.4;
const MAX_GROUP_SCALE = 2.5;

// Smoothing parameters. Each rendered frame the displayed landmarks chase
// the latest tracker output via exponential smoothing:
//
//     display += (target - display) * (1 - exp(-SMOOTHING_RATE * dt))
//
// SMOOTHING_RATE is in 1/seconds. At 25 the residual halves about every
// 28ms — removes most jitter without introducing visible lag at 60Hz.
// Lower it for more smoothing, raise it for faster response.
const SMOOTHING_RATE = 25;
// When the largest per-coord residual is below this (in normalized [0,1]
// image-space units) the animation is considered settled and we stop
// self-invalidating.
const SETTLED_EPSILON = 1e-4;

const LEFT_COLOR = '#ff6b6b';
const RIGHT_COLOR = '#4dabf7';

// Standard MediaPipe HAND_CONNECTIONS topology (20 bones per hand).
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],            // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],            // Index
  [0, 9], [9, 10], [10, 11], [11, 12],       // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],     // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],     // Pinky
];
const NUM_BONES = HAND_CONNECTIONS.length;

// Shared geometry across both hands so we only allocate once.
const JOINT_GEOMETRY = new THREE.BoxGeometry(
  JOINT_CUBE_SIZE,
  JOINT_CUBE_SIZE,
  JOINT_CUBE_SIZE
);
const HIDDEN_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
const _tmpMatrix = new THREE.Matrix4();

/** Read landmark i from a Float32Array(63) of normalized [0,1] coords. */
function readLandmark(buf, i) {
  const x = buf[i * 3 + 0];
  const y = buf[i * 3 + 1];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [
    (x - 0.5) * HAND_WORLD_SCALE,
    -(y - 0.5) * HAND_WORLD_SCALE,
    0,
  ];
}

/** Apply a Float32Array(63) of normalized landmarks to an InstancedMesh. */
function applyJoints(mesh, buf, visibleCount) {
  if (!mesh) return;
  if (visibleCount === 0) {
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
    return;
  }
  for (let i = 0; i < MAX_JOINTS_PER_HAND; i++) {
    const p = i < visibleCount ? readLandmark(buf, i) : null;
    if (p) {
      _tmpMatrix.makeTranslation(p[0], p[1], p[2]);
      mesh.setMatrixAt(i, _tmpMatrix);
    } else {
      mesh.setMatrixAt(i, HIDDEN_MATRIX);
    }
  }
  mesh.count = MAX_JOINTS_PER_HAND;
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Build the flat point array consumed by InstancedLine: for each bone, the
 * start and end joint coordinates concatenated.
 *   [x0,y0,z0, x1,y1,z1,  x2,y2,z2, x3,y3,z3, ...]
 *
 * When either endpoint is missing we collapse the bone to a degenerate
 * (zero-length, zero-position) segment so InstancedLine doesn't draw it
 * but the array length stays constant for stable buffer reuse.
 */
function buildBonePoints(buf, visibleCount) {
  if (visibleCount === 0) return [];
  const out = new Array(NUM_BONES * 6);
  let needsAny = false;
  for (let b = 0; b < NUM_BONES; b++) {
    const [a, c] = HAND_CONNECTIONS[b];
    const pa = a < visibleCount ? readLandmark(buf, a) : null;
    const pc = c < visibleCount ? readLandmark(buf, c) : null;
    const off = b * 6;
    if (pa && pc) {
      out[off + 0] = pa[0]; out[off + 1] = pa[1]; out[off + 2] = pa[2];
      out[off + 3] = pc[0]; out[off + 4] = pc[1]; out[off + 5] = pc[2];
      needsAny = true;
    } else {
      out[off + 0] = 0; out[off + 1] = 0; out[off + 2] = 0;
      out[off + 3] = 0; out[off + 4] = 0; out[off + 5] = 0;
    }
  }
  return needsAny ? out : [];
}

/**
 * Per-hand smoothing state. `target` is the latest landmarks from the
 * tracker; `display` is what's currently rendered. Mutated in-place every
 * frame from `useFrame` — kept in a ref so we don't trigger React work.
 */
function makeHandState() {
  return {
    target: new Float32Array(FLOATS_PER_HAND),
    display: new Float32Array(FLOATS_PER_HAND),
    visible: 0,            // 0 or MAX_JOINTS_PER_HAND
    targetVisible: 0,      // requested visibility
    initialized: false,    // first ever detection — snap, don't lerp
  };
}

const HandsRenderer = memo(function HandsRenderer() {
  const { enabled, leftHand, rightHand } = useHandTrackingStore(
    (s) => ({
      enabled: s.enabled,
      leftHand: s.leftHand,
      rightHand: s.rightHand,
    }),
    shallow
  );
  const { camera, invalidate } = useThree();
  const groupRef = useRef(null);
  const leftMeshRef = useRef(null);
  const rightMeshRef = useRef(null);

  // Persistent smoothing state. Refs (not state) so per-frame mutation
  // doesn't trigger React reconciliation.
  const leftStateRef = useRef(makeHandState());
  const rightStateRef = useRef(makeHandState());
  // Smoothed depth/scale derived from active hand's image-space size.
  const depthStateRef = useRef({ scale: 1, z: HAND_DISTANCE });

  // Bone arrays go through useState so InstancedLine sees a new identity
  // and pushes updated buffers. One setState per animated frame per hand
  // is cheap relative to the GPU work the line shader does anyway.
  const [leftBones, setLeftBones] = useState([]);
  const [rightBones, setRightBones] = useState([]);

  // ---- Tracker → smoothing target ------------------------------------
  useEffect(() => {
    const lh = leftHand?.landmarks;
    const st = leftStateRef.current;
    if (lh && lh.length >= FLOATS_PER_HAND) {
      st.target.set(lh.subarray(0, FLOATS_PER_HAND));
      st.targetVisible = MAX_JOINTS_PER_HAND;
      // First detection or returning from absence: snap so the hand
      // doesn't glide in from a stale display position.
      if (!st.initialized || st.visible === 0) {
        st.display.set(st.target);
        st.visible = MAX_JOINTS_PER_HAND;
        st.initialized = true;
      }
    } else {
      // Hand disappeared — hide immediately, no fade-out.
      st.targetVisible = 0;
      st.visible = 0;
    }
    invalidate();
  }, [leftHand, invalidate]);

  useEffect(() => {
    const rh = rightHand?.landmarks;
    const st = rightStateRef.current;
    if (rh && rh.length >= FLOATS_PER_HAND) {
      st.target.set(rh.subarray(0, FLOATS_PER_HAND));
      st.targetVisible = MAX_JOINTS_PER_HAND;
      if (!st.initialized || st.visible === 0) {
        st.display.set(st.target);
        st.visible = MAX_JOINTS_PER_HAND;
        st.initialized = true;
      }
    } else {
      st.targetVisible = 0;
      st.visible = 0;
    }
    invalidate();
  }, [rightHand, invalidate]);

  // ---- Per-frame: align group to camera, lerp displayed landmarks ----
  useFrame((_, delta) => {
    // Early-exit when hand tracking is disabled — saves smoothing,
    // matrix writes, setBones state updates, and bbox computation.
    if (!useHandTrackingStore.getState().enabled) return;

    // alpha varies with delta so perceived smoothing rate is
    // frame-rate-independent.
    const alpha = 1 - Math.exp(-SMOOTHING_RATE * delta);
    let stillAnimating = false;

    const pairs = [
      [leftStateRef.current, leftMeshRef.current, setLeftBones],
      [rightStateRef.current, rightMeshRef.current, setRightBones],
    ];
    for (const [st, mesh, setBones] of pairs) {
      const desiredVisible = st.targetVisible;
      let maxResidual = 0;

      if (desiredVisible > 0) {
        for (let i = 0; i < FLOATS_PER_HAND; i++) {
          const t = st.target[i];
          const d = st.display[i];
          const next = d + (t - d) * alpha;
          st.display[i] = next;
          const r = Math.abs(t - next);
          if (r > maxResidual) maxResidual = r;
        }
        st.visible = MAX_JOINTS_PER_HAND;
      } else {
        st.visible = 0;
      }

      applyJoints(mesh, st.display, st.visible);
      setBones(buildBonePoints(st.display, st.visible));

      if (desiredVisible > 0 && maxResidual > SETTLED_EPSILON) {
        stillAnimating = true;
      }
    }

    // ---- Reversed depth: derive scale + z offset from active hand size --
    // We pick whichever hand is currently visible (prefer left) and use its
    // smoothed display landmarks to compute a normalized bbox diagonal.
    let activeSt = null;
    if (leftStateRef.current.visible > 0) activeSt = leftStateRef.current;
    else if (rightStateRef.current.visible > 0) activeSt = rightStateRef.current;

    let targetScale = 1;
    let targetZ = HAND_DISTANCE;
    if (activeSt) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const buf = activeSt.display;
      for (let i = 0; i < MAX_JOINTS_PER_HAND; i++) {
        const x = buf[i * 3 + 0];
        const y = buf[i * 3 + 1];
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (Number.isFinite(minX) && maxX > minX) {
        const dx = maxX - minX;
        const dy = maxY - minY;
        const diag = Math.sqrt(dx * dx + dy * dy) || REFERENCE_HAND_DIAG;
        const ratio = diag / REFERENCE_HAND_DIAG;
        // Inverse scale: bigger image-space hand → smaller rendered group.
        const rawScale = 1 / Math.pow(ratio, INVERSE_SCALE_GAMMA);
        targetScale = Math.min(MAX_GROUP_SCALE, Math.max(MIN_GROUP_SCALE, rawScale));
        // Push group further when image hand is large; pull closer when small.
        targetZ = HAND_DISTANCE + (ratio - 1) * INVERSE_DEPTH_GAIN;
      }
    }

    // Smooth scale + z so they don't jitter with per-frame bbox noise.
    const ds = depthStateRef.current;
    ds.scale += (targetScale - ds.scale) * alpha;
    ds.z += (targetZ - ds.z) * alpha;
    if (
      Math.abs(targetScale - ds.scale) > 1e-3 ||
      Math.abs(targetZ - ds.z) > 0.5
    ) {
      stillAnimating = true;
    }

    const g = groupRef.current;
    if (g) {
      g.quaternion.copy(camera.quaternion);
      g.position
        .set(0, 0, -ds.z)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      g.scale.setScalar(ds.scale);
    }

    // Self-pump until both hands settle, so smoothing keeps progressing
    // between tracker updates (the worker only fires ~5–10 times/sec).
    if (stillAnimating) invalidate();
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={leftMeshRef}
        args={[JOINT_GEOMETRY, undefined, MAX_JOINTS_PER_HAND]}
        frustumCulled={false}
        renderOrder={9998}
      >
        <meshBasicMaterial
          attach="material"
          color={LEFT_COLOR}
          depthTest={false}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={rightMeshRef}
        args={[JOINT_GEOMETRY, undefined, MAX_JOINTS_PER_HAND]}
        frustumCulled={false}
        renderOrder={9998}
      >
        <meshBasicMaterial
          attach="material"
          color={RIGHT_COLOR}
          depthTest={false}
          depthWrite={false}
        />
      </instancedMesh>
      {leftBones.length > 0 && (
        <InstancedLine
          points={leftBones}
          color={LEFT_COLOR}
          lineWidth={BONE_LINE_WIDTH}
          depthWrite={false}
        />
      )}
      {rightBones.length > 0 && (
        <InstancedLine
          points={rightBones}
          color={RIGHT_COLOR}
          lineWidth={BONE_LINE_WIDTH}
          depthWrite={false}
        />
      )}
    </group>
  );
});

export default HandsRenderer;
