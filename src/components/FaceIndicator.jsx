import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FaceIndicator = ({ position, rotation, onClick, isActive }) => {
  const meshRef = useRef();
  const groupRef = useRef();

  useFrame(() => {
    if (meshRef.current && groupRef.current) {
      const worldScale = new THREE.Vector3();
      groupRef.current.getWorldScale(worldScale);
      meshRef.current.scale.set(
        1 / worldScale.x,
        1 / worldScale.y,
        1 / worldScale.z
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
          e.stopPropagation();
          onClick(e);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={isActive ? '#4488ff' : 'blue'}
          opacity={0.8}
          transparent
        />
      </mesh>
    </group>
  );
};

export default FaceIndicator;
