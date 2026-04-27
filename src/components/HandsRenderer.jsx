import { memo, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { shallow } from 'zustand/shallow';
import useHandTrackingStore from '../stores/handTrackingStore';
import InstancedLine from './InstancedLine';

// Coordinate mapping: normalized MediaPipe landmark [0,1] → world-space offset from camera
const HAND_SCALE_X = 200;   // horizontal spread in world units
const HAND_SCALE_Y = 150;   // vertical spread in world units
const HAND_SCALE_Z = 100;   // depth spread in world units

// Debug geometry settings — kept intentionally low-poly for performance
const JOINT_SPHERE_RADIUS = 0.4;
const JOINT_SPHERE_WIDTH_SEGMENTS = 8;
const JOINT_SPHERE_HEIGHT_SEGMENTS = 6;
const BONE_LINE_WIDTH = 1;

// Standard MediaPipe HAND_CONNECTIONS topology (20 bones)
const HAND_CONNECTIONS = [
  // Thumb chain
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger chain
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger chain
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger chain
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky chain
  [0, 17], [17, 18], [18, 19], [19, 20],
];

function HandJoints({ landmarks, color, camera }) {
  // Map normalized landmarks to world space anchored at camera position.
  // camera reference is stable; landmarks change each hand-tracking frame.
  const worldPoints = useMemo(
    () =>
      landmarks.map((lm) => [
        camera.position.x + (lm.x - 0.5) * HAND_SCALE_X,
        camera.position.y - (lm.y - 0.5) * HAND_SCALE_Y,
        camera.position.z - lm.z * HAND_SCALE_Z,
      ]),
    [landmarks, camera]
  );

  // Build flat point array for InstancedLine: [x0,y0,z0, x1,y1,z1, ...] per bone
  const bonePoints = useMemo(() => {
    const pts = [];
    for (const [a, b] of HAND_CONNECTIONS) {
      pts.push(...worldPoints[a], ...worldPoints[b]);
    }
    return pts;
  }, [worldPoints]);

  return (
    <>
      {worldPoints.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[JOINT_SPHERE_RADIUS, JOINT_SPHERE_WIDTH_SEGMENTS, JOINT_SPHERE_HEIGHT_SEGMENTS]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <InstancedLine points={bonePoints} color={color} lineWidth={BONE_LINE_WIDTH} />
    </>
  );
}

const HandsRenderer = memo(function HandsRenderer() {
  const { enabled, leftHand, rightHand } = useHandTrackingStore(
    (s) => ({ enabled: s.enabled, leftHand: s.leftHand, rightHand: s.rightHand }),
    shallow
  );
  const { camera } = useThree();

  if (!enabled || (!leftHand && !rightHand)) return null;

  return (
    <>
      {leftHand && (
        <HandJoints landmarks={leftHand} color="#ff6b6b" camera={camera} />
      )}
      {rightHand && (
        <HandJoints landmarks={rightHand} color="#4dabf7" camera={camera} />
      )}
    </>
  );
});

export default HandsRenderer;
