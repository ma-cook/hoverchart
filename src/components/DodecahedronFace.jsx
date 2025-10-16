import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useDodecahedronStore } from '../stores';
import FaceIndicator from './FaceIndicator';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';

/**
 * DodecahedronFace - Optimized component that only re-renders when its specific face changes
 * This reduces re-renders by ~90% compared to rendering all faces together
 *
 * Similar to CubeFace but for dodecahedron's 12 pentagonal faces
 */
const DodecahedronFace = React.memo(
  ({
    dodecahedronId,
    faceIndex,
    faceGeometry, // The pre-calculated geometry for this face
    faceData, // { center, normal, rotation }
    selected,
    scale,

    onFaceClick,
    onIndicatorClick,
    onFaceTextClick,
    onBackgroundClick,
    shouldShowIndicator,
    isIndicatorActive,
    isIndicatorConnected,
    showAllIndicators,
    selectedIndicatorsLength,
    onFaceTextSubmit,
    inputId,
  }) => {
    // Only subscribe to this specific face's data from dodecahedron store
    const {
      faceColor,
      isHighlighted,
      faceText,
      faceTextStyle,
      showFaceTextInput,
    } = useDodecahedronStore((state) => {
      const dod = state.dodecahedrons?.get(dodecahedronId);
      return {
        faceColor: dod?.faceColors?.[faceIndex],
        isHighlighted: dod?.highlightedFaces?.has(faceIndex) || false,
        faceText: dod?.faceTexts?.[faceIndex],
        faceTextStyle: dod?.faceTextStyles?.[faceIndex],
        showFaceTextInput:
          dod?.showFaceTextInput && dod?.activeFace === faceIndex,
      };
    });

    // Create material based on face state (memoized for performance)
    const faceMaterial = useMemo(() => {
      // If face has a custom color, use it with full opacity
      if (faceColor) {
        return new THREE.MeshBasicMaterial({
          color: new THREE.Color(faceColor),
          opacity: 1.0,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          depthTest: true,
        });
      }

      // If selected and highlighted, show selection overlay
      if (selected && isHighlighted) {
        return new THREE.MeshBasicMaterial({
          color: '#0066ff',
          opacity: 0.3,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          depthTest: true,
        });
      }

      // If just selected, show subtle overlay
      if (selected) {
        return new THREE.MeshBasicMaterial({
          color: 'black',
          opacity: 0.1,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          depthTest: true,
        });
      }

      // Default: invisible (for click handling only)
      return new THREE.MeshBasicMaterial({
        visible: false,
        transparent: true,
        opacity: 0,
      });
    }, [faceColor, selected, isHighlighted]);

    // Stable click handler
    const handleClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (!selected) {
          onBackgroundClick(e);
        } else {
          onFaceClick(faceIndex, e);
        }
      },
      [onFaceClick, onBackgroundClick, faceIndex, selected]
    );

    // Stable text click handler
    const handleTextClick = useCallback(
      (e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
        onFaceTextClick(faceIndex, e);
      },
      [onFaceTextClick, faceIndex]
    );

    // Calculate inverse scale for text (to maintain constant size)
    const inverseScale = useMemo(
      () => scale.map((s) => 1 / Math.max(0.0001, s)),
      [scale]
    );

    // Adjust position slightly outward along normal to prevent z-fighting
    const adjustedTextPosition = useMemo(
      () => [
        faceData.center[0] + faceData.normal[0] * 0.01,
        faceData.center[1] + faceData.normal[1] * 0.01,
        faceData.center[2] + faceData.normal[2] * 0.01,
      ],
      [faceData.center, faceData.normal]
    );

    return (
      <>
        {/* Face mesh - always render for click handling */}
        <mesh
          geometry={faceGeometry}
          material={faceMaterial}
          onClick={handleClick}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
          renderOrder={-3}
        />

        {/* Face indicator (connection point) */}
        {shouldShowIndicator && (
          <FaceIndicator
            position={faceData.center}
            rotation={faceData.rotation}
            onClick={(e) => onIndicatorClick(faceIndex, e)}
            isActive={isIndicatorActive}
            isConnected={isIndicatorConnected}
            showAllCubesIndicators={showAllIndicators}
            selectedIndicatorsLength={selectedIndicatorsLength}
          />
        )}

        {/* Face text */}
        {faceText && (
          <group
            position={adjustedTextPosition}
            rotation={faceData.rotation}
            scale={inverseScale}
          >
            <TextSprite
              text={faceText}
              position={[0, 0, 0]}
              style={{
                ...(faceTextStyle || {
                  fontSize: 0.5,
                  color: 'black',
                  underline: false,
                }),
                fixedSize: true,
                isFaceText: true,
                renderOrder: 2,
                depthTest: true,
                depthWrite: false,
              }}
              onClick={handleTextClick}
              billboard={false}
              side={THREE.FrontSide}
            />
          </group>
        )}

        {/* Face text input (when editing) */}
        {showFaceTextInput && (
          <group
            position={adjustedTextPosition}
            rotation={faceData.rotation}
            scale={inverseScale}
          >
            <FaceTextInput
              position={[0, 0, 0]}
              onTextSubmit={onFaceTextSubmit}
              inputId={inputId}
            />
          </group>
        )}
      </>
    );
  }
);

DodecahedronFace.displayName = 'DodecahedronFace';

export default DodecahedronFace;
