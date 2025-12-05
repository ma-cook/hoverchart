import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import React from 'react';
import { useFaceIndicatorStore } from '../stores';

// Debug flag - set to false to disable console logs
const DEBUG = false;

// Shared geometry for all face indicators - avoids creating new geometry per instance
const SHARED_INDICATOR_GEOMETRY = new THREE.BoxGeometry(0.5, 0.5, 0.5);

// =============================================================================
// PERFORMANCE OPTIMIZATION: Material cache for face indicators
// Prevents creating new materials on every render - same pattern as CubeFace.jsx
// =============================================================================
const indicatorMaterialCache = {
  // Connected state - black, fully opaque
  connected: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#000000'),
    opacity: 1.0,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  }),
  // Active state - blue, fully opaque
  active: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#0088ff'),
    opacity: 1.0,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  }),
  // Face selected state - orange, semi-transparent
  faceSelected: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ff8800'),
    opacity: 0.6,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }),
  // Hovered state - green, semi-transparent
  hovered: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#009909'),
    opacity: 0.6,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }),
  // Normal/default state - gray, semi-transparent
  normal: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#666666'),
    opacity: 0.6,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }),
};

// Helper function to get the appropriate cached material based on state
const getIndicatorMaterial = (isConnected, isActive, isFaceSelected, isHovered) => {
  if (isConnected) return indicatorMaterialCache.connected;
  if (isActive) return indicatorMaterialCache.active;
  if (isFaceSelected) return indicatorMaterialCache.faceSelected;
  if (isHovered) return indicatorMaterialCache.hovered;
  return indicatorMaterialCache.normal;
};

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

  // PERFORMANCE OPTIMIZATION: Removed useFrame for scale normalization
  // Indicators now scale with their parent cube, which is more intuitive
  // (bigger cube = bigger indicators) and eliminates per-frame cost

  // Get cached material based on state (avoids creating new materials on each render)
  const material = useMemo(
    () => getIndicatorMaterial(isConnected, isActive, isFaceSelected, isHovered),
    [isConnected, isActive, isFaceSelected, isHovered]
  );

  // Don't render if occluded (except when active, connected, or in connection mode)
  const inConnectionMode =
    showAllCubesIndicators || selectedIndicatorsLength > 0;
  if (!isActive && !isConnected && !isFaceSelected && !inConnectionMode) {
    return null;
  }

  return (
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
      geometry={SHARED_INDICATOR_GEOMETRY}
      material={material}
    />
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
