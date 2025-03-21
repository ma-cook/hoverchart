import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';

// Debug flag - set to false to disable console logs
const DEBUG = false;

const FaceIndicator = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  isActive = false,
  isConnected = false,
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Only log when DEBUG is true
  if (DEBUG) {
    console.log('FaceIndicator rendering', { position, isActive, isConnected });
  }

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

  // Determine color based on state
  const color = isConnected
    ? '#ffffff' // White for connected indicators
    : isActive
    ? '#0088ff' // Blue for selected (not connected)
    : hovered
    ? '#aaaaaa' // Light gray for hover
    : '#777777'; // Darker gray for normal state

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
          if (DEBUG) console.log('FaceIndicator clicked');
          onClick?.(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          opacity={isActive || isConnected ? 1.0 : 0.6}
          transparent={true}
          depthTest={true}
          depthWrite={false} // Change to false to prevent z-fighting
          side={THREE.FrontSide}
          polygonOffset={true}
          polygonOffsetFactor={2} // Increase this value to push further behind faces
          polygonOffsetUnits={2} // Increase this value to push further behind faces
          renderOrder={-1} // Make this negative to ensure it's behind colored faces
        />
      </mesh>
    </group>
  );
};

// Wrap the component in React.memo to prevent unnecessary re-renders
export default React.memo(FaceIndicator, (prevProps, nextProps) => {
  // Re-render if active state, connected state, or position changes
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2]
  );
});
