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

  const renderArrow = (axis, arrowRef) => (
    <group>
      {/* Invisible hit area */}
      <mesh
        onPointerDown={() => handlePointerDown(axis)}
        // Increase hit area surface by using a larger plane
        geometry={
          new THREE.PlaneGeometry(
            ARROW_BASE_LENGTH * SCALE_FACTOR * 2,
            ARROW_BASE_LENGTH * SCALE_FACTOR * 2
          )
        }
        material={new THREE.MeshBasicMaterial({ visible: false })}
      />
      {/* Original arrow */}
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(
              axis === 'x' ? 1 : 0,
              axis === 'y' ? 1 : 0,
              axis === 'z' ? 1 : 0
            ),
            new THREE.Vector3(0, 0, 0),
            ARROW_BASE_LENGTH,
            0xffff00,
            ARROW_HEAD_LENGTH,
            ARROW_HEAD_WIDTH
          )
        }
        ref={arrowRef}
        onPointerDown={() => handlePointerDown(axis)}
      />
    </group>
  );

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
      {renderArrow('x', arrowRefs.x)}
      {renderArrow('y', arrowRefs.y)}
      {renderArrow('z', arrowRefs.z)}
    </group>
  );
};

export default ResizeArrows;
