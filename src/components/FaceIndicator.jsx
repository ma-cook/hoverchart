import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';
import { useFaceIndicatorStore } from '../stores';
import { frameCounter } from '../utils/frameCounter';

// Debug flag - set to false to disable console logs
const DEBUG = false;

const FaceIndicator = ({
  id,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  isActive = false,
  isConnected = false,
  isFaceSelected = false,
  showAllCubesIndicators = false,
  selectedIndicatorsLength = 0,
}) => {
  const meshRef = useRef();
  const groupRef = useRef();

  // Use Zustand store for hover state
  const isHovered = useFaceIndicatorStore((state) =>
    state.isIndicatorHovered(id)
  );
  const setIndicatorHovered = useFaceIndicatorStore(
    (state) => state.setIndicatorHovered
  );

  // Mark this mesh as a face indicator for raycasting exclusion
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = { isFaceIndicator: true };
    }
  }, []);

  // Only log when DEBUG is true
  useFrame(() => {
    if (meshRef.current && groupRef.current) {
      // PERFORMANCE FIX: Disable expensive occlusion checks with many objects
      // Only do basic scale updates every 500ms (was 250ms)
      if (
        frameCounter.shouldUpdate(meshRef.current._lastIndicatorUpdate, 500)
      ) {
        // Update scale for consistent size
        const worldScale = new THREE.Vector3();
        groupRef.current.getWorldScale(worldScale);
        meshRef.current.scale.set(
          1 / Math.max(0.1, worldScale.x),
          1 / Math.max(0.1, worldScale.y),
          1 / Math.max(0.1, worldScale.z)
        );

        meshRef.current._lastIndicatorUpdate = frameCounter.getTime();
      }
    }
  }); // Determine color based on state
  const color = isConnected
    ? '#000000' // Black for connected indicators
    : isActive
    ? '#0088ff' // Blue for selected (not connected)
    : isFaceSelected
    ? '#ff8800' // Orange for face-selected (new state)
    : isHovered
    ? '#009909' // Green for hover
    : '#666666'; // Gray for normal state

  // Don't render if occluded (except when active, connected, or in connection mode)
  const inConnectionMode =
    showAllCubesIndicators || selectedIndicatorsLength > 0;
  if (!isActive && !isConnected && !isFaceSelected && !inConnectionMode) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        renderOrder={5} // Render after most objects but respect depth
        onClick={(e) => {
          if (e) {
            e.stopPropagation();
          }
          if (DEBUG) console.log('FaceIndicator clicked');
          onClick?.(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIndicatorHovered(id, true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIndicatorHovered(id, false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          opacity={isActive || isConnected ? 1.0 : 0.6}
          transparent={isActive || isConnected ? false : true}
          depthTest={true}
          depthWrite={isActive || isConnected ? true : false}
          side={THREE.FrontSide}
          alphaTest={0.5}
        />
      </mesh>
    </group>
  );
};

// Wrap the component in React.memo to prevent unnecessary re-renders
export default React.memo(FaceIndicator, (prevProps, nextProps) => {
  // Re-render if active state, connected state, connection mode, or position changes
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.showAllCubesIndicators === nextProps.showAllCubesIndicators &&
    prevProps.selectedIndicatorsLength === nextProps.selectedIndicatorsLength &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2]
  );
});
