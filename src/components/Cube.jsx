import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import FaceIndicator from './FaceIndicator';
import TextSprite from './TextSprite';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import FaceTextInput from './FaceTextInput';
import { Line } from '@react-three/drei';
import isEqual from 'lodash/isEqual';
import { faces, getFaceIndicatorProps, faceMaterialProps } from './cubeHelpers';

// Constants to avoid recreation
const DEFAULT_COLOR = '#ffffff';
const DEFAULT_OPACITY = 0.1;
const SELECTED_OPACITY = 0.3;
const CUBE_SIZE = 5; // Half-size of cube
const FACE_SIZE = 9.8; // Size of colored face
const FACE_THICKNESS = 0.05; // Thickness of face overlay

/**
 * Optimized Cube component
 */
const Cube = ({
  position,
  scale = [1, 1, 1],
  color = DEFAULT_COLOR,
  faceColors = {},
  faceTexts = {},
  headerText = '',
  textStyle = { fontSize: 1.5, color: 'white', underline: false },
  faceTextStyles = {},
  id,
  selected,
  onClick,
  onFaceIndicatorClick,
  onFaceClick,
  showAllCubesIndicators,
  activeIndicator,
  indicatorMode,
  connections = [],
  selectedIndicators = [],
  activeTextStyleUI,
  setActiveTextStyleUI,
  onUpdate,
  onDelete,
  onTransformStart,
  onTransformEnd,
  onMove,
  registerTransformingObject,
}) => {
  // Refs
  const groupRef = useRef();
  const meshRef = useRef();
  const transformRef = useRef();
  const lastPositionRef = useRef(position);
  const lastUpdateTimeRef = useRef(0);

  // State
  const [selectedFace, setSelectedFace] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [localHeaderText, setLocalHeaderText] = useState(headerText);
  const [showFaceTextInput, setShowFaceTextInput] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showObjectUI, setShowObjectUI] = useState(true);
  const [showHeaderTextStyleUI, setShowHeaderTextStyleUI] = useState(false);
  const [activeTextFace, setActiveTextFace] = useState(null);
  const [localColor, setLocalColor] = useState(color);
  const [localScale, setLocalScale] = useState(scale);
  const [localFaceColors, setLocalFaceColors] = useState(faceColors);
  const [localFaceTexts, setLocalFaceTexts] = useState(faceTexts);
  const [localFaceTextStyles, setLocalFaceTextStyles] = useState(() => {
    // Initialize with default styles for each face if not provided
    const defaultStyles = {
      front: { fontSize: 0.5, color: 'white', underline: false },
      back: { fontSize: 0.5, color: 'white', underline: false },
      top: { fontSize: 0.5, color: 'white', underline: false },
      bottom: { fontSize: 0.5, color: 'white', underline: false },
      right: { fontSize: 0.5, color: 'white', underline: false },
      left: { fontSize: 0.5, color: 'white', underline: false },
    };
    return { ...defaultStyles, ...faceTextStyles };
  });
  const [localTextStyle, setLocalTextStyle] = useState(textStyle);
  const [isScaleModified, setIsScaleModified] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocalHeaderText(headerText);
  }, [headerText]);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  useEffect(() => {
    setLocalScale(scale);
  }, [scale]);

  useEffect(() => {
    setLocalFaceColors(faceColors);
  }, [faceColors]);

  useEffect(() => {
    setLocalFaceTexts(faceTexts);
  }, [faceTexts]);

  useEffect(() => {
    if (!isEqual(localFaceTextStyles, faceTextStyles)) {
      setLocalFaceTextStyles(faceTextStyles);
    }
  }, [faceTextStyles]);

  useEffect(() => {
    if (!isEqual(localTextStyle, textStyle)) {
      setLocalTextStyle(textStyle);
    }
  }, [textStyle]);

  // Update lastPositionRef when position changes
  useEffect(() => {
    lastPositionRef.current = position;
  }, [position]);

  // Reset selection states when cube is deselected
  useEffect(() => {
    if (!selected) {
      setSelectedFace(null);
      setSelectedIndicator(null);
      setShowTransform(false);
      setActiveTextStyleUI(null);
      // Close text style UI menus
      setShowHeaderTextStyleUI(false);
      setActiveTextFace(null);
    }
  }, [selected, setActiveTextStyleUI]);

  // Check if a face is connected via a connection
  const isIndicatorConnected = useCallback(
    (faceName) => {
      return connections.some(
        (conn) =>
          (conn.start?.objectId === id.toString() &&
            conn.start?.face === faceName) ||
          (conn.end?.objectId === id.toString() && conn.end?.face === faceName)
      );
    },
    [connections, id]
  );

  // Check if an indicator should be shown as active
  const isIndicatorActive = useCallback(
    (faceName) => {
      return selectedIndicator === faceName && !isIndicatorConnected(faceName);
    },
    [selectedIndicator, isIndicatorConnected]
  );

  // Calculate UI positions based on cube scale
  const getUIPositions = useMemo(() => {
    const uiOffset = 0.1; // Small z-offset to avoid z-fighting

    return {
      objectUI: [0, CUBE_SIZE + 20 / localScale[1], uiOffset],
      headerInput: [0, CUBE_SIZE + 5 / localScale[1], uiOffset],
      headerText: [0, CUBE_SIZE + 5 / localScale[1], uiOffset],
      textStyleUI: [0, CUBE_SIZE + 7 / localScale[1], uiOffset],
    };
  }, [localScale]);

  // Determine if an indicator should be shown
  const shouldShowIndicator = useCallback(
    (faceName) => {
      // Always show indicators that are connected
      if (isIndicatorConnected(faceName)) {
        return true;
      }

      // Show indicators during connection creation
      if (selectedIndicators.length > 0) {
        return true;
      }

      // Show indicators for selected faces
      if (selectedFace === faceName && selected) {
        return true;
      }

      // Show all indicators when explicitly requested
      if (showAllCubesIndicators && selected) {
        return true;
      }

      // Show indicators based on mode
      switch (indicatorMode) {
        case 'all':
        case 'indicators':
          return selected || showAllCubesIndicators;
        case 'single':
          return (
            (activeIndicator?.cube?.id === id &&
              activeIndicator?.face === faceName) ||
            (selected && faceName === selectedFace)
          );
        default:
          return false;
      }
    },
    [
      isIndicatorConnected,
      selectedIndicators.length,
      selectedFace,
      selected,
      showAllCubesIndicators,
      indicatorMode,
      activeIndicator,
      id,
    ]
  );

  // Cube edge line points
  const cubeLinePoints = useMemo(
    () => [
      // Bottom face edges
      [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],

      // Top face edges
      [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
      [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],

      // Vertical edges connecting top and bottom
      [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
      [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
      [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
    ],
    []
  );

  // Calculate face text offset based on font size
  const getFaceTextOffset = useCallback((fontSize, faceName) => {
    const baseOffset =
      faceName === 'top' ? 0 : faceName === 'bottom' ? 0.2 : 0.5;
    const fontSizeMultiplier = typeof fontSize === 'number' ? fontSize : 0.5;
    const textHeight = fontSizeMultiplier * 0.7;
    const zSafetyMargin = faceName === 'top' ? 0.1 : 0.3;

    return baseOffset + textHeight / 2 + zSafetyMargin;
  }, []);

  // Get material for a face
  const getFaceMaterial = useCallback(
    (faceName) => ({
      ...faceMaterialProps,
      color: localFaceColors[faceName]
        ? new THREE.Color(localFaceColors[faceName])
        : selectedFace === faceName
        ? new THREE.Color('#99ccff')
        : new THREE.Color('#ffffff'),
      opacity: localFaceColors[faceName]
        ? 1.0
        : selectedFace === faceName
        ? SELECTED_OPACITY
        : DEFAULT_OPACITY,
    }),
    [localFaceColors, selectedFace]
  );

  // Event handlers
  const handleSceneClick = useCallback(() => {
    setShowObjectUI(true);
    setShowHeaderTextStyleUI(false); // Close header text style UI
    setActiveTextFace(null); // Reset active text face for face text UI
    setActiveTextStyleUI(null); // Reset active text style UI reference
    onClick();
  }, [onClick, setActiveTextStyleUI]);

  // Add a new effect to close text style UI when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = (event) => {
      // Don't close if clicking within the TextStyleUI components
      if (
        event.target &&
        event.target.closest('.object-ui-content, .color-picker-container')
      ) {
        return;
      }

      // Close text styling UI when clicking elsewhere
      if (showHeaderTextStyleUI || activeTextFace) {
        setShowHeaderTextStyleUI(false);
        setActiveTextFace(null);
        setActiveTextStyleUI(null);
      }
    };

    // Add a global click handler to the window
    window.addEventListener('mousedown', handleGlobalClick);

    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [showHeaderTextStyleUI, activeTextFace, setActiveTextStyleUI]);

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      setSelectedFace(selectedFace === faceName ? null : faceName);
      setShowObjectUI(false);

      onFaceClick?.({
        cube: groupRef.current,
        face: faceName,
        id: id,
      });
    },
    [id, onFaceClick, selectedFace]
  );

  const handleColoredFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      if (selected) {
        handleFaceClick(e, faceName);
      } else {
        handleSceneClick();
      }
    },
    [selected, handleFaceClick, handleSceneClick]
  );

  const handleIndicatorClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();

      setSelectedIndicator(selectedIndicator === faceName ? null : faceName);

      const { position: facePos } = getFaceIndicatorProps(faceName);

      // Create complete indicator data
      const indicatorData = {
        type: 'cube',
        face: faceName,
        cube: {
          id,
          position: lastPositionRef.current,
          scale: localScale,
          userData: { objectId: id.toString() },
        },
        position: lastPositionRef.current,
        faceCenter: facePos,
      };

      // Calculate world position
      const worldPos = new THREE.Vector3(facePos[0], facePos[1], facePos[2]);
      if (groupRef.current?.matrixWorld) {
        worldPos.applyMatrix4(groupRef.current.matrixWorld);
        indicatorData.position = [worldPos.x, worldPos.y, worldPos.z];
      }

      onFaceIndicatorClick?.(indicatorData);
    },
    [id, onFaceIndicatorClick, selectedIndicator, localScale]
  );

  const handleTransformToggle = useCallback(() => {
    setShowTransform((prev) => {
      if (!prev) {
        setIsResizing(false);
      }
      return !prev;
    });
  }, []);

  const handleResizeToggle = useCallback(() => {
    setIsResizing((prev) => {
      if (!prev) {
        setShowTransform(false);
      }
      return !prev;
    });
  }, []);

  const handleHeaderToggle = useCallback(() => {
    setShowHeader(!showHeader);
  }, [showHeader]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      setLocalHeaderText(text);
      if (onUpdate) {
        onUpdate(id, {
          color: localColor,
          headerText: text,
          scale: localScale,
          position: lastPositionRef.current,
          faceColors: localFaceColors,
          faceTexts: localFaceTexts,
          faceTextStyles: localFaceTextStyles,
          textStyle: localTextStyle,
          type: 'cube',
        });
      }
      setShowHeader(false);
      setShowObjectUI(false);
    },
    [
      id,
      onUpdate,
      localColor,
      localScale,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
    ]
  );

  const handleLineColorChange = useCallback(
    (newColor) => {
      setLocalColor(newColor);

      if (onUpdate) {
        // Debounce updates to avoid excessive database writes
        clearTimeout(lastUpdateTimeRef.current);
        lastUpdateTimeRef.current = setTimeout(() => {
          onUpdate(id, {
            color: newColor,
            headerText: localHeaderText,
            scale: localScale,
            position: lastPositionRef.current,
            faceColors: localFaceColors,
            faceTexts: localFaceTexts,
            faceTextStyles: localFaceTextStyles,
            textStyle: localTextStyle,
            type: 'cube',
          });
        }, 300);
      }
    },
    [
      id,
      onUpdate,
      localHeaderText,
      localScale,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
    ]
  );

  const handleFaceColorChange = useCallback(
    (color, face) => {
      const updatedFaceColors = {
        ...localFaceColors,
        [face]: color,
      };

      setLocalFaceColors(updatedFaceColors);

      if (onUpdate) {
        // Debounce updates
        clearTimeout(lastUpdateTimeRef.current);
        lastUpdateTimeRef.current = setTimeout(() => {
          onUpdate(id, {
            color: localColor,
            headerText: localHeaderText,
            scale: localScale,
            position: lastPositionRef.current,
            faceColors: updatedFaceColors,
            faceTexts: localFaceTexts,
            faceTextStyles: localFaceTextStyles,
            textStyle: localTextStyle,
            type: 'cube',
          });
        }, 300);
      }
    },
    [
      id,
      onUpdate,
      localColor,
      localHeaderText,
      localScale,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
    ]
  );

  const handleTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.nativeEvent?.stopPropagation?.();
      setShowHeaderTextStyleUI(true);
      setActiveTextFace(null);
      setActiveTextStyleUI(groupRef.current);
      setSelectedFace(null);
    },
    [setActiveTextStyleUI]
  );

  const handleFaceTextClick = useCallback(() => {
    setShowFaceTextInput(true);
  }, []);

  const handleFaceTextSubmit = useCallback(
    (text) => {
      const updatedTexts = {
        ...localFaceTexts,
        [selectedFace]: text,
      };

      setLocalFaceTexts(updatedTexts);

      if (onUpdate) {
        onUpdate(id, {
          color: localColor,
          headerText: localHeaderText,
          scale: localScale,
          position: lastPositionRef.current,
          faceColors: localFaceColors,
          faceTexts: updatedTexts,
          faceTextStyles: localFaceTextStyles,
          textStyle: localTextStyle,
          type: 'cube',
        });
      }

      setShowFaceTextInput(false);
      setSelectedFace(null);
    },
    [
      id,
      onUpdate,
      localColor,
      localHeaderText,
      localScale,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
      selectedFace,
    ]
  );

  const handleFaceTextStyleClick = useCallback(
    (e, faceName) => {
      if (e) {
        e.stopPropagation();
        e.nativeEvent?.stopPropagation?.();
      }
      setActiveTextStyleUI(groupRef.current);
      setActiveTextFace(faceName);
      setSelectedFace(null);
      setShowFaceTextInput(false);
      // Add this line to trigger the UI
      setShowHeaderTextStyleUI(false);
    },
    [setActiveTextStyleUI]
  );

  const handleStyleChange = useCallback(
    (newStyle) => {
      if (activeTextFace) {
        const updatedFaceTextStyles = {
          ...localFaceTextStyles,
          [activeTextFace]: {
            ...localFaceTextStyles[activeTextFace],
            ...newStyle,
          },
        };

        setLocalFaceTextStyles(updatedFaceTextStyles);

        if (onUpdate) {
          onUpdate(id, {
            color: localColor,
            headerText: localHeaderText,
            scale: localScale,
            position: lastPositionRef.current,
            faceColors: localFaceColors,
            faceTexts: localFaceTexts,
            faceTextStyles: updatedFaceTextStyles,
            textStyle: localTextStyle,
            type: 'cube',
          });
        }
      } else {
        const updatedTextStyle = { ...localTextStyle, ...newStyle };

        setLocalTextStyle(updatedTextStyle);

        if (onUpdate) {
          onUpdate(id, {
            color: localColor,
            headerText: localHeaderText,
            scale: localScale,
            position: lastPositionRef.current,
            faceColors: localFaceColors,
            faceTexts: localFaceTexts,
            faceTextStyles: localFaceTextStyles,
            textStyle: updatedTextStyle,
            type: 'cube',
          });
        }
      }
    },
    [
      id,
      onUpdate,
      localColor,
      localHeaderText,
      localScale,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
      activeTextFace,
    ]
  );

  const handleDrag = useCallback(
    (e) => {
      const newPos = e.target.object.position;
      lastPositionRef.current = [newPos.x, newPos.y, newPos.z];

      // Update object
      if (onUpdate) {
        onUpdate(id, {
          type: 'cube',
          position: [newPos.x, newPos.y, newPos.z],
          scale: localScale,
          color: localColor,
          headerText: localHeaderText,
          faceColors: localFaceColors,
          faceTexts: localFaceTexts,
          faceTextStyles: localFaceTextStyles,
          textStyle: localTextStyle,
        });
      }

      // Call onMove for immediate UI updates
      if (onMove) {
        onMove({
          x: newPos.x,
          y: newPos.y,
          z: newPos.z,
        });
      }
    },
    [
      id,
      onUpdate,
      onMove,
      localScale,
      localColor,
      localHeaderText,
      localFaceColors,
      localFaceTexts,
      localFaceTextStyles,
      localTextStyle,
    ]
  );

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        e.target.object.scale.z,
      ];

      // Only update if the scale change is significant
      const epsilon = 0.0001;
      if (
        Math.abs(newScale[0] - localScale[0]) < epsilon &&
        Math.abs(newScale[1] - localScale[1]) < epsilon &&
        Math.abs(newScale[2] - localScale[2]) < epsilon
      ) {
        return;
      }

      setLocalScale(newScale);
      setIsScaleModified(true);
    },
    [localScale]
  );

  // Update database when scale changes
  useEffect(() => {
    if (isScaleModified) {
      // Update database
      if (onUpdate) {
        onUpdate(id, {
          type: 'cube',
          position: lastPositionRef.current,
          scale: localScale,
          color: localColor,
          headerText: localHeaderText,
          faceColors: localFaceColors,
          faceTexts: localFaceTexts,
          faceTextStyles: localFaceTextStyles,
          textStyle: localTextStyle,
        });
      }

      // Reset flag
      setIsScaleModified(false);

      // Call callback
      if (onTransformEnd) {
        onTransformEnd(id);
      }
    }
  }, [
    isScaleModified,
    onUpdate,
    id,
    localScale,
    localColor,
    localHeaderText,
    localFaceColors,
    localFaceTexts,
    localFaceTextStyles,
    localTextStyle,
    onTransformEnd,
  ]);

  // Render colored faces and indicators
  const renderFaces = useMemo(() => {
    return faces.map(({ name, normal }) => {
      // Skip if face has no color and cube isn't selected/shown
      if (!localFaceColors[name] && !selected && !showAllCubesIndicators) {
        return null;
      }

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const isConnected = isIndicatorConnected(name);
      const isActive = isIndicatorActive(name);

      return (
        <mesh
          key={`face-${name}`}
          position={[facePos[0], facePos[1], facePos[2]]}
          rotation={rotation}
          onClick={(e) => handleColoredFaceClick(e, name)}
          renderOrder={-1} // Lower render order for faces
        >
          <boxGeometry args={[FACE_SIZE, FACE_SIZE, FACE_THICKNESS]} />
          <meshBasicMaterial
            {...getFaceMaterial(name)}
            transparent={true}
            depthWrite={false} // Prevent faces from blocking lines
            side={THREE.FrontSide}
            renderOrder={-1}
          />

          {selected && selectedFace === name && !showFaceTextInput && (
            <FaceUI
              position={[0, 1, 0]}
              normal={normal}
              onColorChange={handleFaceColorChange}
              face={name}
              onTextClick={handleFaceTextClick}
            />
          )}

          {showFaceTextInput && selectedFace === name && (
            <FaceTextInput
              position={[0, 6, 0]}
              onTextSubmit={handleFaceTextSubmit}
            />
          )}

          {shouldShowIndicator(name) && (
            <FaceIndicator
              position={[
                0,
                0,
                FACE_THICKNESS * (localFaceColors[name] ? 1 : 1),
              ]}
              rotation={[0, 0, 0]}
              onClick={(e) => handleIndicatorClick(e, name)}
              isActive={isActive}
              isConnected={isConnected}
              objectId={id}
              face={name}
              renderOrder={20} // Increase render order to ensure visibility
            />
          )}
        </mesh>
      );
    });
  }, [
    localFaceColors,
    selected,
    showAllCubesIndicators,
    isIndicatorConnected,
    isIndicatorActive,
    handleColoredFaceClick,
    getFaceMaterial,
    selectedFace,
    showFaceTextInput,
    shouldShowIndicator,
    handleIndicatorClick,
    handleFaceColorChange,
    handleFaceTextClick,
    handleFaceTextSubmit,
    id,
  ]);

  // Render face texts
  const renderFaceTexts = useMemo(() => {
    return faces.map(({ name, normal }) => {
      if (!localFaceTexts[name]) return null;

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const textStyle = localFaceTextStyles[name];
      const yOffset = getFaceTextOffset(textStyle.fontSize, name);

      // Adjust offset multiplier for colored faces
      const offsetMultiplier =
        name === 'bottom' ? 0.8 : localFaceColors[name] ? 0.1 : 0.05;

      // Calculate position with offset to prevent z-fighting
      const offsetPosition = [
        facePos[0] + normal[0] * offsetMultiplier,
        facePos[1] + normal[1] * offsetMultiplier,
        facePos[2] + normal[2] * offsetMultiplier,
      ];

      // Calculate inverse scale
      const inverseScale = localScale.map((s) => 1 / Math.max(0.0001, s));

      // Special rotation adjustment
      let adjustedRotation;
      if (name === 'left') {
        adjustedRotation = [
          rotation[0],
          rotation[1] + Math.PI / 2,
          rotation[2],
        ];
      } else if (name === 'right') {
        adjustedRotation = [
          rotation[0],
          rotation[1] - Math.PI / 2,
          rotation[2],
        ];
      } else if (name === 'top') {
        adjustedRotation = [
          rotation[0] + Math.PI / 2,
          rotation[1],
          rotation[2],
        ];
      } else if (name === 'bottom') {
        adjustedRotation = [
          rotation[0] - Math.PI / 2,
          rotation[1],
          rotation[2],
        ];
      } else {
        adjustedRotation = rotation;
      }

      return (
        <group
          key={`text-${name}`}
          position={offsetPosition}
          rotation={adjustedRotation}
          scale={inverseScale}
        >
          <TextSprite
            text={localFaceTexts[name]}
            position={[0, yOffset, 0]}
            followTarget={null}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
              handleFaceTextStyleClick(e, name);
              return false; // Prevent event bubbling
            }}
            style={{
              ...textStyle,
              fixedSize: true,
              isFaceText: true,
              renderOrder: 2,
              depthTest: true,
              depthWrite: true,
            }}
            normal={normal}
            billboard={false}
            side={THREE.FrontSide}
          />

          {/* Update condition to show TextStyleUI */}
          {activeTextFace === name && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleStyleChange}
              onClose={() => {
                setActiveTextFace(null);
                setActiveTextStyleUI(null);
                setShowHeaderTextStyleUI(false);
              }}
              currentStyle={localFaceTextStyles[name] || {}}
            />
          )}
        </group>
      );
    });
  }, [
    localFaceTexts,
    localFaceTextStyles,
    localFaceColors,
    localScale,
    getFaceTextOffset,
    handleFaceTextStyleClick,
    handleStyleChange,
    activeTextFace,
    activeTextStyleUI,
  ]);

  return (
    <>
      {/* Main cube group */}
      <group ref={groupRef} position={position} scale={localScale}>
        {/* Invisible hit box */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            handleSceneClick();
          }}
          userData={{
            isCube: true,
            objectId: id.toString(),
          }}
        >
          <boxGeometry args={[10, 10, 10]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Cube edge lines */}
        <Line
          points={cubeLinePoints}
          color={localColor}
          lineWidth={3}
          segments={true}
          renderOrder={1} // Higher render order for cube edges
          transparent={false}
          depthWrite={false}
        />

        {/* Colored faces and indicators */}
        {renderFaces}

        {/* Face text elements */}
        {renderFaceTexts}

        {/* Header text */}
        {localHeaderText && (
          <group
            scale={localScale.map((s) => 1 / Math.max(0.0001, s))}
            position={getUIPositions.headerText}
          >
            <TextSprite
              text={localHeaderText}
              position={[0, 0, 0]}
              followTarget={null}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                handleTextClick(e);
                return false; // Prevent event bubbling
              }}
              style={{
                ...localTextStyle,
                isHeaderText: true,
                fixedSize: false,
              }}
            />

            {/* Remove the activeTextStyleUI condition */}
            {showHeaderTextStyleUI && (
              <TextStyleUI
                position={[0, 2 / localScale[1], 0]}
                followTarget={null}
                onStyleChange={handleStyleChange}
                onClose={() => {
                  setShowHeaderTextStyleUI(false);
                  setActiveTextStyleUI(null);
                }}
                currentStyle={localTextStyle}
              />
            )}
          </group>
        )}

        {/* Object UI */}
        {selected && !showHeader && showObjectUI && (
          <ObjectUI
            position={getUIPositions.objectUI}
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            onResizeToggle={handleResizeToggle}
            onLineColorChange={handleLineColorChange}
            onDelete={() => onDelete?.(id)}
            showTransform={showTransform}
            showHeader={showHeader}
            followTarget={null}
            objectId={id}
          />
        )}

        {/* Header input */}
        {selected && showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            followTarget={null}
            initialText={localHeaderText}
          />
        )}
      </group>

      {/* Transform controls */}
      {selected && showTransform && groupRef.current && (
        <DreiTransformControls
          ref={transformRef}
          object={groupRef.current}
          onObjectChange={handleDrag}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            registerTransformingObject?.(id, true, position);
            onTransformStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            registerTransformingObject?.(id, false);
            onTransformEnd?.(id);
          }}
          mode="translate"
          size={0.5}
        />
      )}

      {/* Scale transform controls */}
      {selected && isResizing && groupRef.current && (
        <DreiTransformControls
          object={groupRef.current}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            registerTransformingObject?.(id, true, position);
            onTransformStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            // No call to onTransformEnd here - it's handled by the isScaleModified effect
          }}
          mode="scale"
          size={0.5}
        />
      )}
    </>
  );
};

// Apply memo with custom comparison to optimize renders
export default React.memo(Cube, (prevProps, nextProps) => {
  // Always re-render when selection changes
  if (prevProps.selected !== nextProps.selected) return false;

  // Re-render when indicator mode or visibility changes
  if (prevProps.showAllCubesIndicators !== nextProps.showAllCubesIndicators)
    return false;
  if (prevProps.indicatorMode !== nextProps.indicatorMode) return false;
  if (prevProps.globalIndicatorSelected !== nextProps.globalIndicatorSelected)
    return false;

  // Re-render when position, scale, or color changes
  if (!isEqual(prevProps.position, nextProps.position)) return false;
  if (!isEqual(prevProps.scale, nextProps.scale)) return false;
  if (prevProps.color !== nextProps.color) return false;

  // Re-render when text or styles change
  if (prevProps.headerText !== nextProps.headerText) return false;
  if (!isEqual(prevProps.textStyle, nextProps.textStyle)) return false;
  if (!isEqual(prevProps.faceColors, nextProps.faceColors)) return false;
  if (!isEqual(prevProps.faceTexts, nextProps.faceTexts)) return false;
  if (!isEqual(prevProps.faceTextStyles, nextProps.faceTextStyles))
    return false;

  // Re-render when selected indicators change
  if (
    prevProps.selectedIndicators?.length !==
    nextProps.selectedIndicators?.length
  )
    return false;

  // Only check connections that affect this cube
  const prevConnected = prevProps.connections.some(
    (conn) =>
      conn.start?.objectId === prevProps.id.toString() ||
      conn.end?.objectId === prevProps.id.toString()
  );

  const nextConnected = nextProps.connections.some(
    (conn) =>
      conn.start?.objectId === nextProps.id.toString() ||
      conn.end?.objectId === nextProps.id.toString()
  );

  if (prevConnected !== nextConnected) return false;

  // Default to not re-rendering if no significant changes
  return true;
});
