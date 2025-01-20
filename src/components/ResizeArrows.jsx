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

  useFrame(() => {
    if (groupRef.current && object) {
      groupRef.current.position.copy(object.position);
      const distance = camera.position.distanceTo(groupRef.current.position);
      const scale = distance * 0.03;

      // Get relative camera position
      const localCameraPos = new THREE.Vector3()
        .copy(camera.position)
        .sub(groupRef.current.position);

      // Check camera position relative to each axis and flip arrows if needed
      ['x', 'y', 'z'].forEach((axis) => {
        if (arrowRefs[axis].current) {
          const arrow = arrowRefs[axis].current;
          const direction = new THREE.Vector3(
            axis === 'x' ? 1 : 0,
            axis === 'y' ? 1 : 0,
            axis === 'z' ? 1 : 0
          );

          // Flip direction if camera is on the negative side of the axis
          if (localCameraPos[axis] < 0) {
            direction.multiplyScalar(-1);
          }

          arrow.setDirection(direction);
          arrow.setLength(3 * scale, 1 * scale, 0.5 * scale);
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
            25, // Base length
            new THREE.Color(
              axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'blue'
            ),
            5, // Base head length
            2, // Base head width
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
