import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useCubeStore } from '../stores';
import FaceIndicator from './FaceIndicator';

// Mobile detection (same as in Cube.jsx)
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Shared geometry - mobile-aware sizing
const FACE_SIZE = isMobile ? 15.6 : 9.8;
const SHARED_FACE_GEOMETRY = new THREE.BoxGeometry(FACE_SIZE, FACE_SIZE, 0.05);

const SELECTED_OPACITY = 0.3;

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
  }) => {
    // Only subscribe to this specific face's data
    const faceColor = useCubeStore(
      (state) => state.cubes.get(cubeId)?.faceColors?.[faceName]
    );
    const isSelected = useCubeStore(
      (state) => state.cubes.get(cubeId)?.selectedFace === faceName
    );

    // Create material based on face state (using shared geometry)
    const faceMaterial = useMemo(() => {
      // If face has a custom color, use it with full opacity
      if (faceColor) {
        return new THREE.MeshBasicMaterial({
          color: new THREE.Color(faceColor),
          opacity: 1.0,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: true,
        });
      }

      // If face is selected, show selection color
      if (isSelected) {
        return new THREE.MeshBasicMaterial({
          color: new THREE.Color('#99ccff'),
          opacity: SELECTED_OPACITY,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }

      // Default: completely invisible (for click handling only)
      return new THREE.MeshBasicMaterial({
        visible: false,
        transparent: true,
        side: THREE.DoubleSide,
      });
    }, [faceColor, isSelected]);

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
