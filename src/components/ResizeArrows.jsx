import { ArrowHelper } from 'three';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

extend({ ArrowHelper });

const ResizeArrows = ({ onResize, object }) => {
  const { scene, camera } = useThree();
  const groupRef = useRef();
  const arrowRefs = {
    x: useRef(),
    y: useRef(),
    z: useRef(),
  };

  const ARROW_BASE_LENGTH = 10;
  const ARROW_HEAD_LENGTH = 3;
  const ARROW_HEAD_WIDTH = 1.5;
  const SCALE_FACTOR = 0.5; // Add scale dampening factor
  const MAX_HEAD_LENGTH = 3;
  const MAX_HEAD_WIDTH = 2;

  useFrame(() => {
    if (groupRef.current && object) {
      groupRef.current.position.copy(object.position);

      ['x', 'y', 'z'].forEach((axis) => {
        if (arrowRefs[axis].current) {
          const arrow = arrowRefs[axis].current;

          // Apply dampening to scale
          const axisScale = 1 + (object.scale[axis] - 1) * SCALE_FACTOR;

          const direction = new THREE.Vector3(
            axis === 'x' ? 1 : 0,
            axis === 'y' ? 1 : 0,
            axis === 'z' ? 1 : 0
          );

          if (camera.position[axis] < groupRef.current.position[axis]) {
            direction.multiplyScalar(-1);
          }

          const scaledHeadLength = Math.min(
            ARROW_HEAD_LENGTH * axisScale,
            MAX_HEAD_LENGTH
          );
          const scaledHeadWidth = Math.min(
            ARROW_HEAD_WIDTH * axisScale,
            MAX_HEAD_WIDTH
          );

          arrow.setDirection(direction);
          arrow.setLength(
            ARROW_BASE_LENGTH * axisScale,
            scaledHeadLength,
            scaledHeadWidth
          );
        }
      });
    }
  });

  const handlePointerDown = (axis) => {
    if (scene.orbitControls) scene.orbitControls.enabled = false;

    const handleMove = (e) => {
      // Calculate delta from mouse movement
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Use the dominant movement direction
      const currentDelta =
        Math.abs(movementX) > Math.abs(movementY) ? movementX : -movementY;

      // Only send the difference from last frame
      onResize(axis, currentDelta * 0.1);
    };

    const handleUp = () => {
      if (scene.orbitControls) scene.orbitControls.enabled = true;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <group ref={groupRef}>
      {['x', 'y', 'z'].map((axis) => (
        <arrowHelper
          key={axis}
          ref={arrowRefs[axis]}
          args={[
            new THREE.Vector3(
              ...(axis === 'x'
                ? [1, 0, 0]
                : axis === 'y'
                ? [0, 1, 0]
                : [0, 0, 1])
            ),
            new THREE.Vector3(0, 0, 0),
            1, // Increased base length by 3 units (from 10 to 13)
            new THREE.Color(
              axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'blue'
            ),
          ]}
          onPointerDown={(e) => handlePointerDown(axis, e)}
          cursor="pointer"
          pointerEvents="auto"
        />
      ))}
    </group>
  );
};

export default ResizeArrows;
