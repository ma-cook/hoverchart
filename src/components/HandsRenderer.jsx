import { memo, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { shallow } from 'zustand/shallow';
import * as THREE from 'three';
import useHandTrackingStore from '../stores/handTrackingStore';

// The hand-tracking group lives in the scene graph (NOT parented to the
// camera, because R3F cameras aren't always children of the scene tree).
// Each frame we copy the camera's world transform onto the group, then
// offset HAND_DISTANCE units along the camera's forward axis. Inside that
// group, normalized [0,1] image-space landmarks are scaled by HAND_WORLD_SCALE.
const HAND_DISTANCE = 500;     // units in front of camera
const HAND_WORLD_SCALE = 600;  // multiplier for normalized [0,1] → world units
const JOINT_RADIUS = 20;
const MAX_JOINTS_PER_HAND = 21;

const LEFT_COLOR = '#ff6b6b';
const RIGHT_COLOR = '#4dabf7';

// Shared geometry across both hands so we only allocate once.
const JOINT_GEOMETRY = new THREE.SphereGeometry(JOINT_RADIUS, 8, 6);
const HIDDEN_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
const _tmpMatrix = new THREE.Matrix4();

/**
 * Apply landmarks to an InstancedMesh. Landmarks may be:
 *   - Array of {x,y,z} objects (current store format), or
 *   - Float32Array of length >=63 (future worker format).
 */
function applyLandmarks(mesh, landmarks) {
  if (!mesh) return;
  if (!landmarks || landmarks.length === 0) {
    mesh.count = 0;
    return;
  }
  const count = MAX_JOINTS_PER_HAND;
  const isTyped =
    landmarks.length >= 3 && typeof landmarks[0] === 'number';
  const lmCount = isTyped
    ? Math.min(count, (landmarks.length / 3) | 0)
    : Math.min(count, landmarks.length);

  for (let i = 0; i < count; i++) {
    if (i < lmCount) {
      let x, y;
      if (isTyped) {
        x = landmarks[i * 3 + 0];
        y = landmarks[i * 3 + 1];
      } else {
        const lm = landmarks[i];
        x = lm.x;
        y = lm.y;
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        mesh.setMatrixAt(i, HIDDEN_MATRIX);
        continue;
      }
      _tmpMatrix.makeTranslation(
        (x - 0.5) * HAND_WORLD_SCALE,
        -(y - 0.5) * HAND_WORLD_SCALE,
        0
      );
      mesh.setMatrixAt(i, _tmpMatrix);
    } else {
      mesh.setMatrixAt(i, HIDDEN_MATRIX);
    }
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
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

  // Each frame the scene renders, copy the camera's transform onto the
  // group and push it HAND_DISTANCE units forward. Cheap — useFrame only
  // runs when an invalidate() actually causes a render (the app uses an
  // on-demand frame loop), and we only do a quaternion copy + position set.
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.quaternion.copy(camera.quaternion);
    g.position
      .set(0, 0, -HAND_DISTANCE)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
  });

  // Push landmarks into the instanced meshes whenever hand data changes,
  // and request one render so useFrame above runs at least once.
  useEffect(() => {
    applyLandmarks(leftMeshRef.current, leftHand?.landmarks);
    applyLandmarks(rightMeshRef.current, rightHand?.landmarks);
    invalidate();
  }, [leftHand, rightHand, invalidate]);

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
    </group>
  );
});

export default HandsRenderer;
