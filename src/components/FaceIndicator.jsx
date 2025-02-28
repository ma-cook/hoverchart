import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FaceIndicator = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  isActive,
}) => {
  const meshRef = useRef();
  const groupRef = useRef();

  // Add debug logging to see if this component is rendering
  console.log('FaceIndicator rendering', { position, isActive });

  useFrame(() => {
    if (meshRef.current && groupRef.current) {
      const worldScale = new THREE.Vector3();
      groupRef.current.getWorldScale(worldScale);
      // Make indicator size consistent regardless of parent scale
      meshRef.current.scale.set(
        1 / Math.max(0.1, worldScale.x),
        1 / Math.max(0.1, worldScale.y),
        1 / Math.max(0.1, worldScale.z)
      );
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          if (e) {
            e.stopPropagation();
          }
          console.log('FaceIndicator clicked');
          onClick?.(e);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={isActive ? '#4488ff' : '#ffffff'}
          opacity={0.9}
          transparent
        />
      </mesh>
    </group>
  );
};

export default FaceIndicator;
