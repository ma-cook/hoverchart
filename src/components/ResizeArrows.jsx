import { ArrowHelper } from 'three';

import { extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

extend({ ArrowHelper });

const ResizeArrows = ({ onResize }) => {
  const { scene } = useThree();
  const accumDelta = useRef(0);

  const handlePointerDown = (axis) => {
    if (scene.orbitControls) scene.orbitControls.enabled = false;
    accumDelta.current = 0;

    const handleMove = (e) => {
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Accumulate delta for smoother scaling
      accumDelta.current +=
        Math.abs(movementX) > Math.abs(movementY) ? movementX : -movementY;

      onResize(axis, accumDelta.current * 0.005);
    };

    const handleUp = () => {
      if (scene.orbitControls) scene.orbitControls.enabled = true;
      accumDelta.current = 0;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      {['x', 'y', 'z'].map((axis) => (
        <arrowHelper
          key={axis}
          args={[
            new THREE.Vector3(
              ...(axis === 'x'
                ? [1, 0, 0]
                : axis === 'y'
                ? [0, 1, 0]
                : [0, 0, 1])
            ),
            new THREE.Vector3(0, 0, 0),
            10,
            new THREE.Color(
              axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'blue'
            ),
          ]}
          onPointerDown={(e) => handlePointerDown(axis, e)}
          cursor="pointer"
          pointerEvents="auto"
        />
      ))}
    </>
  );
};

export default ResizeArrows;
