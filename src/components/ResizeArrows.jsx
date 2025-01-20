import { ArrowHelper } from 'three';
import { extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';

extend({ ArrowHelper });

const ResizeArrows = ({ onResize }) => {
  const { scene } = useThree();

  const handlePointerDown = (axis) => {
    // Access controls directly from scene
    if (scene.orbitControls) scene.orbitControls.enabled = false;

    const handleMove = (e) => {
      const delta = e.movementX || e.movementY || 0;
      onResize(axis, delta * 0.01);
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
