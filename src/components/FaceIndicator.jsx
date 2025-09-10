import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';
import { useFaceIndicatorStore } from '../stores';

// Debug flag - set to false to disable console logs
const DEBUG = false;

const FaceIndicator = ({
  id,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  isActive = false,
  isConnected = false,
  showAllCubesIndicators = false,
  selectedIndicatorsLength = 0,
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const { scene, camera } = useThree();
  const [isOccluded, setIsOccluded] = useState(false);

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
      // Throttle updates for performance - occlusion checks are expensive
      if (
        !meshRef.current._lastIndicatorUpdate ||
        Date.now() - meshRef.current._lastIndicatorUpdate > 250 // Check occlusion every 250ms
      ) {
        // Update scale for consistent size
        const worldScale = new THREE.Vector3();
        groupRef.current.getWorldScale(worldScale);
        meshRef.current.scale.set(
          1 / Math.max(0.1, worldScale.x),
          1 / Math.max(0.1, worldScale.y),
          1 / Math.max(0.1, worldScale.z)
        );

        // Check occlusion with raycasting (only if not active/connected and not in connection mode)
        const inConnectionMode =
          showAllCubesIndicators || selectedIndicatorsLength > 0;
        if (!isActive && !isConnected && !inConnectionMode) {
          try {
            const worldPosition = new THREE.Vector3();
            meshRef.current.getWorldPosition(worldPosition);

            // Only do occlusion checking if indicator is reasonably close to camera
            const cameraDistance = camera.position.distanceTo(worldPosition);
            if (cameraDistance < 500) {
              // Reasonable view distance
              const direction = new THREE.Vector3()
                .subVectors(worldPosition, camera.position)
                .normalize();

              const raycaster = new THREE.Raycaster(camera.position, direction);
              raycaster.camera = camera; // Fix LineSegments2 raycasting error
              raycaster.far = cameraDistance - 0.1; // Only check up to indicator position

              // Set global camera reference for LineSegments2
              if (window.camera !== camera) {
                window.camera = camera;
              }

              const intersects = raycaster.intersectObjects(
                scene.children,
                true
              );

              // Check if any solid object is between camera and indicator
              let occluded = false;
              for (const intersect of intersects) {
                if (
                  intersect.object !== meshRef.current &&
                  !intersect.object.userData?.isFaceIndicator &&
                  !intersect.object.userData?.isUI &&
                  intersect.distance < cameraDistance - 0.5
                ) {
                  occluded = true;
                  break;
                }
              }

              setIsOccluded(occluded);
            } else {
              setIsOccluded(false); // Too far to be occluded
            }
          } catch {
            // Fallback: don't hide indicator if raycasting fails
            setIsOccluded(false);
          }
        }

        meshRef.current._lastIndicatorUpdate = Date.now();
      }
    }
  }); // Determine color based on state
  const color = isConnected
    ? '#000000' // Black for connected indicators
    : isActive
    ? '#0088ff' // Blue for selected (not connected)
    : isHovered
    ? '#009909' // Light gray for hover
    : '#00000a'; // Darker gray for normal state

  // Don't render if occluded (except when active, connected, or in connection mode)
  const inConnectionMode =
    showAllCubesIndicators || selectedIndicatorsLength > 0;
  if (isOccluded && !isActive && !isConnected && !inConnectionMode) {
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
