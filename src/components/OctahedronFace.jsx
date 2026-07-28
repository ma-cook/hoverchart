import React, { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useOctahedronStore } from '../stores';
import { shallow } from 'zustand/shallow';
import FaceIndicator from './FaceIndicator';
import FaceUI from './FaceUI';
import FaceTextInput from './FaceTextInput';
import AtlasTextSprite from './AtlasTextSprite';
import TextStyleUI from './TextStyleUI';

const SELECTED_OPACITY = 0.3;
const DEFAULT_OPACITY = 0.1;

const octahedronFaceMaterialCache = {
  default: {
    color: new THREE.Color('#000000'),
    opacity: DEFAULT_OPACITY,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  },
  selected: {
    color: new THREE.Color('#99ccff'),
    opacity: SELECTED_OPACITY,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  },
  colored: new Map(),
};

const getOctahedronColoredMaterial = (color) => {
  if (!octahedronFaceMaterialCache.colored.has(color)) {
    octahedronFaceMaterialCache.colored.set(color, {
      color: new THREE.Color(color),
      opacity: 1.0,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }
  return octahedronFaceMaterialCache.colored.get(color);
};

const OctahedronFace = React.memo(
  ({
    id,
    faceName,
    faceData,
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
    selectedIndicatorsLength = 0,
    showAllCubesIndicators = false,
    showFaceText = true,
  }) => {
    const { faceColor, isSelectedFace, showFaceTextInput, activeTextFace, faceText, faceTextStyle } =
      useOctahedronStore(
        (state) => {
          const oct = state.getOctahedron(id);
          return {
            faceColor: oct?.faceColors?.[faceName],
            isSelectedFace: oct?.selectedFace === faceName,
            showFaceTextInput: oct?.showFaceTextInput,
            activeTextFace: oct?.activeTextFace,
            faceText: oct?.faceTexts?.[faceName],
            faceTextStyle: oct?.faceTextStyles?.[faceName],
          };
        },
        shallow
      );

    const {
      updateOctahedronFaceColor,
      updateOctahedronFaceText,
      setOctahedronShowFaceTextInput,
      setOctahedronSelectedFace,
      setOctahedronActiveTextFace,
    } = useOctahedronStore.getState();

    const faceMaterial = useMemo(() => {
      if (faceColor) {
        return getOctahedronColoredMaterial(faceColor);
      }
      if (isSelectedFace) {
        return octahedronFaceMaterialCache.selected;
      }
      return octahedronFaceMaterialCache.default;
    }, [faceColor, isSelectedFace]);

    const handleClick = useCallback(
      (e) => {
        e.stopPropagation();
        onFaceClick(e, faceName);
      },
      [onFaceClick, faceName]
    );

    const handleIndicatorClickLocal = useCallback(
      (e) => {
        e.stopPropagation();
        onIndicatorClick(e, faceName);
      },
      [onIndicatorClick, faceName]
    );

    const getFaceTextOffset = useCallback((fontSize, _faceName) => {
      const baseOffset = fontSize * 0.3;
      return baseOffset;
    }, []);

    const handleFaceTextStyleClick = useCallback(
      (e, faceName) => {
        e.stopPropagation();
        e.nativeEvent?.stopPropagation?.();
        setOctahedronActiveTextFace(id, faceName);
        return false;
      },
      [id, faceName, setOctahedronActiveTextFace]
    );

    const handleFaceTextStyleChange = useCallback(
      (newStyle) => {
        const updatedFaceTextStyles = {
          ...faceTextStyles,
          [faceName]: {
            ...(faceTextStyles?.[faceName] || {}),
            ...newStyle,
          },
        };

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
            type: 'octahedron',
          });
        }
      },
      [
        id, faceName, faceTextStyles, debouncedUpdate, onUpdate,
        color, headerText, scale, position, faceColors, faceTexts, textStyle,
      ]
    );

    const displayIndicator = shouldShowIndicator(faceName);
    const displayFace = faceColor || (selected && (isSelectedFace || isIndicatorActive(faceName)));
    const isClickable = selected;
    const shouldShowFaceUI = selected && isSelectedFace && !showFaceTextInput;
    const faceRenderOrder = displayFace ? 100 : isClickable ? 50 : 10;

    const faceTextElement = useMemo(() => {
      if (!faceText || !showFaceText) return null;

      const textStyleCombined = faceTextStyle || {
        fontSize: 0.5, color: 'black', underline: false,
      };
      const yOffset = getFaceTextOffset(textStyleCombined.fontSize, faceName);

      const offsetMultiplier = faceColor ? 0.05 : 0.03;
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
          <AtlasTextSprite
            text={faceText}
            position={[0, yOffset, 0]}
            followTarget={null}
            onClick={(e) => handleFaceTextStyleClick(e, faceName)}
            style={{
              ...textStyleCombined,
              isFaceText: true,
              depthTest: true,
              depthWrite: true,
            }}
            normal={faceData.normal}
            billboard={false}
            side={THREE.FrontSide}
            renderOrder={2}
          />

          {activeTextFace === faceName && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => {
                setOctahedronActiveTextFace(id, null);
              }}
              currentStyle={faceTextStyle || {}}
            />
          )}
        </group>
      );
    }, [
      faceText, showFaceText, faceTextStyle, faceName, faceData, scale, faceColor,
      getFaceTextOffset, handleFaceTextStyleClick, handleFaceTextStyleChange,
      activeTextFace, setOctahedronActiveTextFace, id,
    ]);

    return (
      <>
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
            opacity={displayFace ? faceMaterial.opacity : isClickable ? 0.02 : 0.001}
          />

          {shouldShowFaceUI && (
            <FaceUI
              position={[0, 1, 0]}
              normal={faceData.normal}
              onColorChange={(color) => {
                const updatedFaceColors = { ...faceColors, [faceName]: color };
                updateOctahedronFaceColor(id, faceName, color);
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
                    type: 'octahedron',
                  });
                }
              }}
              face={faceName}
              onTextClick={() => setOctahedronShowFaceTextInput(id, true)}
            />
          )}

          {showFaceTextInput && isSelectedFace && (
            <FaceTextInput
              position={[0, 6, 0]}
              onTextSubmit={(text) => {
                const updatedTexts = { ...faceTexts, [faceName]: text };
                updateOctahedronFaceText(id, faceName, text);
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
                    type: 'octahedron',
                  });
                }
                setOctahedronShowFaceTextInput(id, false);
                setOctahedronSelectedFace(id, null);
              }}
              inputId={`octahedron-${id}-face-${faceName}`}
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
              showAllCubesIndicators={showAllCubesIndicators}
              selectedIndicatorsLength={selectedIndicatorsLength}
              isFaceSelected={isSelectedFace}
            />
          )}
        </mesh>

        {faceTextElement}
      </>
    );
  }
);

OctahedronFace.displayName = 'OctahedronFace';

export default OctahedronFace;
