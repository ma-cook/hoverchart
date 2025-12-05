// TetrahedronFace.jsx
import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useTetrahedronStore } from '../stores';
import FaceIndicator from './FaceIndicator';
import FaceUI from './FaceUI';
import FaceTextInput from './FaceTextInput';
import TextSprite from './TextSprite';
import TextStyleUI from './TextStyleUI';

const SELECTED_OPACITY = 0.3;
const DEFAULT_OPACITY = 0.1;

// =============================================================================
// PERFORMANCE OPTIMIZATION: Material cache for tetrahedron faces
// Prevents creating new materials on every render - same pattern as CubeFace.jsx
// =============================================================================
const tetrahedronFaceMaterialCache = {
  // Default state - black, very low opacity
  default: {
    color: new THREE.Color('#000000'),
    opacity: DEFAULT_OPACITY,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  },
  // Selected face state - light blue
  selected: {
    color: new THREE.Color('#99ccff'),
    opacity: SELECTED_OPACITY,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  },
  // Colored materials cache by color string
  colored: new Map(),
};

// Get or create a colored material config for tetrahedron faces
const getTetrahedronColoredMaterial = (color) => {
  if (!tetrahedronFaceMaterialCache.colored.has(color)) {
    tetrahedronFaceMaterialCache.colored.set(color, {
      color: new THREE.Color(color),
      opacity: 1.0,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }
  return tetrahedronFaceMaterialCache.colored.get(color);
};

/**
 * TetrahedronFace - Optimized component that only re-renders when its specific face changes
 * This reduces re-renders by isolating face-specific logic
 */
const TetrahedronFace = React.memo(
  ({
    id, // tetrahedron id
    faceName,
    faceData, // { geometry, position, rotation, normal }
    selected,
    onFaceClick,
    onIndicatorClick,
    shouldShowIndicator,

    isIndicatorConnected,
    isIndicatorActive,
    debouncedUpdate,
    onUpdate,
    position,
    color,
    headerText,
    scale,
    faceColors,
    faceTexts,
    faceTextStyles,
    textStyle,
    selectedIndicatorsLength = 0, // Add this prop
    showAllCubesIndicators = false,
  }) => {
    // Subscribe only to this face's specific data
    const faceColor = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.faceColors?.[faceName]
    );
    const isSelectedFace = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.selectedFace === faceName
    );
    const showFaceTextInput = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.showFaceTextInput
    );
    const activeTextFace = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.activeTextFace
    );
    const faceText = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.faceTexts?.[faceName]
    );
    const faceTextStyle = useTetrahedronStore(
      (state) => state.getTetrahedron(id)?.faceTextStyles?.[faceName]
    );

    // Get actions
    const updateTetrahedronFaceColor = useTetrahedronStore(
      (state) => state.updateTetrahedronFaceColor
    );
    const updateTetrahedronFaceText = useTetrahedronStore(
      (state) => state.updateTetrahedronFaceText
    );
    const setTetrahedronShowFaceTextInput = useTetrahedronStore(
      (state) => state.setTetrahedronShowFaceTextInput
    );
    const setTetrahedronSelectedFace = useTetrahedronStore(
      (state) => state.setTetrahedronSelectedFace
    );
    const setTetrahedronActiveTextFace = useTetrahedronStore(
      (state) => state.setTetrahedronActiveTextFace
    );

    // Get cached material config based on face state (avoids creating new THREE.Color on every render)
    const faceMaterial = useMemo(() => {
      if (faceColor) {
        return getTetrahedronColoredMaterial(faceColor);
      }

      if (isSelectedFace) {
        return tetrahedronFaceMaterialCache.selected;
      }

      return tetrahedronFaceMaterialCache.default;
    }, [faceColor, isSelectedFace]);

    // Stable click handler
    const handleClick = useCallback(
      (e) => {
        e.stopPropagation();
        onFaceClick(e, faceName);
      },
      [onFaceClick, faceName]
    );

    // Indicator click handler
    const handleIndicatorClickLocal = useCallback(
      (e) => {
        e.stopPropagation();
        onIndicatorClick(e, faceName);
      },
      [onIndicatorClick, faceName]
    );

    // Face text offset calculation
    const getFaceTextOffset = useCallback((fontSize, faceName) => {
      const baseOffset = fontSize * 0.3;
      switch (faceName) {
        case 'bottom':
          return -baseOffset;
        case 'front':
        case 'left':
        case 'right':
          return baseOffset;
        default:
          return 0;
      }
    }, []);

    // Face text style click handler
    const handleFaceTextStyleClick = useCallback(
      (e, faceName) => {
        e.stopPropagation();
        e.nativeEvent?.stopPropagation?.();
        setTetrahedronActiveTextFace(id, faceName);
        // Note: setActiveTextStyleUI would need to be passed or handled differently
        // For now, assuming it's handled in parent
        return false;
      },
      [id, faceName, setTetrahedronActiveTextFace]
    );

    // Face text style change handler
    const handleFaceTextStyleChange = useCallback(
      (newStyle) => {
        const updatedFaceTextStyles = {
          ...faceTextStyles,
          [faceName]: {
            ...(faceTextStyles?.[faceName] || {}),
            ...newStyle,
          },
        };

        // Update store
        // Note: updateTetrahedronFaceTextStyle might need to be added or use updateTetrahedron
        // For simplicity, using debouncedUpdate

        if (onUpdate) {
          debouncedUpdate(id, {
            color: color,
            headerText: headerText,
            scale: scale,
            position: position,
            faceColors: faceColors,
            faceTexts: faceTexts,
            faceTextStyles: updatedFaceTextStyles,
            textStyle: textStyle,
            type: 'tetrahedron',
          });
        }
      },
      [
        id,
        faceName,
        faceTextStyles,
        debouncedUpdate,
        onUpdate,
        color,
        headerText,
        scale,
        position,
        faceColors,
        faceTexts,
        textStyle,
      ]
    );

    // Determine display states
    const displayIndicator = shouldShowIndicator(faceName);
    const displayFace =
      faceColor ||
      (selected && (isSelectedFace || isIndicatorActive(faceName)));
    const isClickable = selected;
    const shouldShowFaceUI = selected && isSelectedFace && !showFaceTextInput;

    // Calculate render order
    const faceRenderOrder = displayFace ? 100 : isClickable ? 50 : 10;

    // Face text rendering
    const faceTextElement = useMemo(() => {
      if (!faceText) return null;

      const textStyleCombined = faceTextStyle || {
        fontSize: 0.5,
        color: 'black',
        underline: false,
      };
      const yOffset = getFaceTextOffset(textStyleCombined.fontSize, faceName);

      const offsetMultiplier =
        faceName === 'bottom' ? 0.2 : faceColor ? 0.05 : 0.03;
      const offsetPosition = [
        faceData.position[0] + faceData.normal[0] * offsetMultiplier,
        faceData.position[1] + faceData.normal[1] * offsetMultiplier,
        faceData.position[2] + faceData.normal[2] * offsetMultiplier,
      ];

      const currentScale = scale;
      const inverseScale = currentScale.map((s) => 1 / Math.max(0.0001, s));

      return (
        <group
          key={`text-${faceName}`}
          position={offsetPosition}
          rotation={faceData.rotation}
          scale={inverseScale}
        >
          <TextSprite
            text={faceText}
            position={[0, yOffset, 0]}
            followTarget={null}
            onClick={(e) => handleFaceTextStyleClick(e, faceName)}
            style={{
              ...textStyleCombined,
              fixedSize: true,
              isFaceText: true,
              renderOrder: 2,
              depthTest: true,
              depthWrite: true,
            }}
            normal={faceData.normal}
            billboard={false}
            side={THREE.FrontSide}
          />

          {activeTextFace === faceName && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => {
                setTetrahedronActiveTextFace(id, null);
                // setActiveTextStyleUI(null); // Handle in parent
              }}
              currentStyle={faceTextStyle || {}}
            />
          )}
        </group>
      );
    }, [
      faceText,
      faceTextStyle,
      faceName,
      faceData,
      scale,
      faceColor,
      getFaceTextOffset,
      handleFaceTextStyleClick,
      handleFaceTextStyleChange,
      activeTextFace,
      setTetrahedronActiveTextFace,
      id,
    ]);

    return (
      <>
        {/* Face mesh */}
        <mesh
          position={[0, 0, 0]}
          onClick={handleClick}
          renderOrder={faceRenderOrder}
          frustumCulled={false}
        >
          <primitive object={faceData.geometry} />
          <meshBasicMaterial
            {...faceMaterial}
            transparent={true}
            depthWrite={displayFace ? true : false}
            depthTest={true}
            side={THREE.DoubleSide}
            renderOrder={faceRenderOrder}
            visible={displayFace || isClickable}
            alphaTest={displayFace ? 0 : 0.005}
            opacity={
              displayFace ? faceMaterial.opacity : isClickable ? 0.02 : 0.001
            }
          />

          {shouldShowFaceUI && (
            <FaceUI
              position={[0, 1, 0]}
              normal={faceData.normal}
              onColorChange={(color) => {
                const updatedFaceColors = {
                  ...faceColors,
                  [faceName]: color,
                };

                updateTetrahedronFaceColor(id, faceName, color);

                if (onUpdate) {
                  debouncedUpdate(id, {
                    color: color,
                    headerText: headerText,
                    scale: scale,
                    position: position,
                    faceColors: updatedFaceColors,
                    faceTexts: faceTexts,
                    faceTextStyles: faceTextStyles,
                    textStyle: textStyle,
                    type: 'tetrahedron',
                  });
                }
              }}
              face={faceName}
              onTextClick={() => setTetrahedronShowFaceTextInput(id, true)}
            />
          )}

          {showFaceTextInput && isSelectedFace && (
            <FaceTextInput
              position={[0, 6, 0]}
              onTextSubmit={(text) => {
                const updatedTexts = {
                  ...faceTexts,
                  [faceName]: text,
                };

                updateTetrahedronFaceText(id, faceName, text);

                if (onUpdate) {
                  onUpdate(id, {
                    color: color,
                    headerText: headerText,
                    scale: scale,
                    position: position,
                    faceColors: faceColors,
                    faceTexts: updatedTexts,
                    faceTextStyles: faceTextStyles,
                    textStyle: textStyle,
                    type: 'tetrahedron',
                  });
                }

                setTetrahedronShowFaceTextInput(id, false);
                setTetrahedronSelectedFace(id, null);
              }}
              inputId={`tetrahedron-${id}-face-${faceName}`}
            />
          )}

          {displayIndicator && (
            <FaceIndicator
              position={faceData.position}
              rotation={faceData.rotation}
              onClick={handleIndicatorClickLocal}
              isActive={isIndicatorActive(faceName)}
              isConnected={isIndicatorConnected(faceName)}
              objectId={id}
              face={faceName}
              showAllCubesIndicators={showAllCubesIndicators} // Adjust as needed
              selectedIndicatorsLength={selectedIndicatorsLength}
              isFaceSelected={isSelectedFace}
            />
          )}
        </mesh>

        {/* Face text */}
        {faceTextElement}
      </>
    );
  }
);

TetrahedronFace.displayName = 'TetrahedronFace';

export default TetrahedronFace;
