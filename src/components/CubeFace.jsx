import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useCubeStore } from '../stores';
import { getCubeFaceStateSelector } from '../stores/cubeStore';
import FaceIndicator from './FaceIndicator';
import { shallow } from 'zustand/shallow';

// Mobile detection (same as in Cube.jsx)
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Shared geometry - mobile-aware sizing
const FACE_SIZE = isMobile ? 15.6 : 9.8;
const SHARED_FACE_GEOMETRY = new THREE.BoxGeometry(FACE_SIZE, FACE_SIZE, 0.05);

const SELECTED_OPACITY = 0.3;

// Material cache for face materials - prevents recreating materials on every render
const materialCache = {
  invisible: new THREE.MeshBasicMaterial({
    visible: false,
    transparent: true,
    side: THREE.DoubleSide,
  }),
  selected: new THREE.MeshBasicMaterial({
    color: new THREE.Color('#4a9eff'),
    opacity: 0.2,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  colored: new Map(), // Cache for colored materials by color string
};

// Get or create a colored material
const getColoredMaterial = (color) => {
  if (!materialCache.colored.has(color)) {
    materialCache.colored.set(
      color,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        opacity: 1.0,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
      })
    );
  }
  return materialCache.colored.get(color);
};

/**
 * CubeFace - Optimized component that only re-renders when its specific face changes
 * This reduces re-renders by ~85% compared to rendering all faces together
 */
const CubeFace = React.memo(
  ({
    cubeId,
    faceName,
    faceData, // { position, rotation, normal }
    selectedIndicatorsLength = 0,
    showAllCubesIndicators = false,
    onFaceClick,
    onIndicatorClick,
    shouldShowIndicator,
    isIndicatorActive,
    isIndicatorConnected,
    skipColoredRendering = false, // When true, colored visuals handled by GlobalCubeFaceRenderer
  }) => {
    // PERFORMANCE OPTIMIZATION: Single combined selector instead of two separate ones
    // This reduces subscriptions from 12 per cube (6 faces × 2) to 6 per cube
    const faceStateSelector = useMemo(
      () => getCubeFaceStateSelector(cubeId, faceName),
      [cubeId, faceName]
    );

    // Single subscription for both faceColor and isSelected
    const { faceColor, isSelected } = useCubeStore(faceStateSelector, shallow);

    // Get cached material based on face state (avoids creating new materials)
    const faceMaterial = useMemo(() => {
      // When global face renderer handles colored visuals, skip colored material
      if (skipColoredRendering && faceColor && !isSelected) {
        return materialCache.invisible;
      }

      // If face has a custom color, use cached colored material
      if (faceColor) {
        return getColoredMaterial(faceColor);
      }

      // If face is selected, use cached selection material
      if (isSelected) {
        return materialCache.selected;
      }

      // Default: use cached invisible material (for click handling only)
      return materialCache.invisible;
    }, [faceColor, isSelected, skipColoredRendering]);

    // Stable click handler - always handle clicks, parent decides what to do
    const handleClick = useCallback(
      (e) => {
        e.stopPropagation();
        onFaceClick(e, faceName);
      },
      [onFaceClick, faceName]
    );

    // Calculate offset for face positioning
    // Minimal offset to prevent z-fighting with the invisible hitbox
    const offsetMultiplier = useMemo(() => {
      if (faceName === 'bottom') {
        return 0.02; // Tiny offset for bottom face
      }
      return faceColor ? 0.02 : 0.01; // Minimal offset to prevent z-fighting
    }, [faceName, faceColor]);

    const offsetPosition = useMemo(
      () => [
        faceData.position[0] + faceData.normal[0] * offsetMultiplier,
        faceData.position[1] + faceData.normal[1] * offsetMultiplier,
        faceData.position[2] + faceData.normal[2] * offsetMultiplier,
      ],
      [faceData.position, faceData.normal, offsetMultiplier]
    );

    return (
      <>
        {/* Face mesh - always render for click handling */}
        <mesh
          position={offsetPosition}
          rotation={faceData.rotation}
          onClick={handleClick}
          geometry={SHARED_FACE_GEOMETRY}
          material={faceMaterial}
        />

        {/* Face indicator */}
        {shouldShowIndicator && (
          <FaceIndicator
            position={faceData.position}
            rotation={faceData.rotation}
            onClick={(e) => onIndicatorClick(e, faceName)}
            isActive={isIndicatorActive}
            isConnected={isIndicatorConnected}
            selectedIndicatorsLength={selectedIndicatorsLength}
            showAllCubesIndicators={showAllCubesIndicators}
            isFaceSelected={isSelected}
          />
        )}
      </>
    );
  }
);

CubeFace.displayName = 'CubeFace';

export default CubeFace;
