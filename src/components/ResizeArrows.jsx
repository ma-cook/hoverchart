import { ArrowHelper } from 'three';

import { extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';

extend({ ArrowHelper });

const ResizeArrows = ({ onResize, object }) => {
  const { scene } = useThree();

  // Get current position from the object
  const position = object
    ? [object.position.x, object.position.y, object.position.z]
    : [0, 0, 0];

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
      onResize(axis, currentDelta * 0.005);
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
    <group position={position}>
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
            15, // Increased from 10 to 15 for larger arrows
            new THREE.Color(
              axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'blue'
            ),
            3, // headLength (added)
            2, // headWidth (added)
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
