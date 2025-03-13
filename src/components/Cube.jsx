import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Line,
  TransformControls as DreiTransformControls,
} from '@react-three/drei';
import * as THREE from 'three';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import HeaderInput from './HeaderInput';
import TextSprite from './TextSprite';
import ResizeArrows from './ResizeArrows'; // Ensure ResizeArrows is imported
import TextStyleUI from './TextStyleUI';
import FaceTextInput from './FaceTextInput';
import FaceIndicator from './FaceIndicator'; // <-- New import
import { getFaceIndicatorProps, faces, faceMaterialProps } from './cubeHelpers'; // <-- New import

const Cube = ({
  position,
  selected,
  onClick,
  onMove,
  onFaceIndicatorClick,
  onFaceClick,
  showAllIndicators,
  activeIndicator,
  indicatorMode,
  connections,
  selectedIndicators,
  activeTextStyleUI,
  setActiveTextStyleUI,
  onUpdate,
  id,
  // Add default values for optional props
  headerText: initialHeaderText = '',
  scale: initialScale = [1, 1, 1],
  color: initialColor = 'white',
  faceColors: initialFaceColors = {
    front: null,
    back: null,
    top: null,
    bottom: null,
    right: null,
    left: null,
  },
  faceTexts: initialFaceTexts = {
    front: '',
    back: '',
    top: '',
    bottom: '',
    right: '',
    left: '',
  },
  textStyle: initialTextStyle = {
    fontSize: 1.5,
    color: 'white',
    underline: false,
  },
  faceTextStyles: initialFaceTextStyles = {
    front: { fontSize: 0.5, color: 'white', underline: false },
    back: { fontSize: 0.5, color: 'white', underline: false },
    top: { fontSize: 0.5, color: 'white', underline: false },
    bottom: { fontSize: 0.5, color: 'white', underline: false },
    right: { fontSize: 0.5, color: 'white', underline: false },
    left: { fontSize: 0.5, color: 'white', underline: false },
  },
}) => {
  const [selectedFace, setSelectedFace] = useState(null);
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const contentRef = useRef();
  const nonScaledRef = useRef(); // New ref for non-scaled elements
  const [scale, setScale] = useState(initialScale); // Existing scale state
  const [isResizing, setIsResizing] = useState(false); // Existing isResizing state
  const [faceColors, setFaceColors] = useState(initialFaceColors);
  const [textStyle, setTextStyle] = useState(() => ({
    fontSize: 1.5,
    color: 'white',
    underline: false,
    ...initialTextStyle, // Immediately apply any provided styles
  }));

  const [faceTextStyles, setFaceTextStyles] = useState(() => ({
    front: { fontSize: 0.5, color: 'white', underline: false },
    back: { fontSize: 0.5, color: 'white', underline: false },
    top: { fontSize: 0.5, color: 'white', underline: false },
    bottom: { fontSize: 0.5, color: 'white', underline: false },
    right: { fontSize: 0.5, color: 'white', underline: false },
    left: { fontSize: 0.5, color: 'white', underline: false },
    ...initialFaceTextStyles, // Immediately apply any provided styles
  }));
  const [showObjectUI, setShowObjectUI] = useState(true); // Add this state
  const [showFaceTextInput, setShowFaceTextInput] = useState(false);
  const [faceTexts, setFaceTexts] = useState(initialFaceTexts);
  const [activeTextFace, setActiveTextFace] = useState(null);
  const [showHeaderTextStyleUI, setShowHeaderTextStyleUI] = useState(false);
  const [color, setColor] = useState(initialColor);

  // Add a lastPositionRef to track real position
  const lastPositionRef = useRef(position);

  // Update position ref when position prop changes
  useEffect(() => {
    lastPositionRef.current = position;
  }, [position]);

  // Update color when prop changes
  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  // Add useEffect to update faceTexts when props change
  useEffect(() => {
    setFaceTexts(initialFaceTexts);
  }, [initialFaceTexts]);

  // Add effects to update states when props change
  useEffect(() => {
    if (
      initialTextStyle &&
      JSON.stringify(textStyle) !== JSON.stringify(initialTextStyle)
    ) {
      setTextStyle(initialTextStyle);
    }
  }, [initialTextStyle]);

  useEffect(() => {
    if (
      initialFaceTextStyles &&
      JSON.stringify(faceTextStyles) !== JSON.stringify(initialFaceTextStyles)
    ) {
      setFaceTextStyles(initialFaceTextStyles);
    }
  }, [initialFaceTextStyles]);

  // Add effect to update headerText when prop changes
  useEffect(() => {
    setHeaderText(initialHeaderText);
  }, [initialHeaderText]);

  const handleLineColorChange = useCallback(
    (newColor) => {
      console.log('Changing color to:', newColor); // Add debug log
      setColor(newColor);
      if (onUpdate) {
        onUpdate(id, {
          color: newColor,
          headerText,
          scale,
          position,
          faceColors,
          faceTexts,
          faceTextStyles,
          textStyle,
          type: 'cube',
        });
      }
    },
    [
      id,
      onUpdate,
      headerText,
      scale,
      position,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
    ]
  );

  // Reset selectedFace and showTransform when the cube is deselected
  useEffect(() => {
    if (!selected) {
      setSelectedFace(null);
      setShowTransform(false); // Ensure TransformControls are hidden
      setActiveTextStyleUI(false); // Add this line to close TextStyleUI
    }
  }, [selected, setSelectedFace, setShowTransform, setActiveTextStyleUI]); // Added missing dependencies

  // Store orbitControls in the mesh's userData when mounted
  useEffect(() => {
    if (contentRef.current && window.orbitControls) {
      contentRef.current.orbitControls = window.orbitControls;
      if (nonScaledRef.current) {
        // Ensure nonScaledRef.current exists
        nonScaledRef.current.orbitControls = window.orbitControls;
      }
    }
  }, [contentRef, nonScaledRef]); // Added refs as dependencies

  const handleFaceClick = (e, faceName) => {
    e.stopPropagation();
    setSelectedFace(selectedFace === faceName ? null : faceName);
    setShowObjectUI(false); // Hide ObjectUI when face is clicked

    // When clicking a face, set indicator mode to single and make this the active indicator
    onFaceClick?.({
      cube: contentRef.current,
      face: faceName,
      id: id, // Explicitly include ID
    });
  };

  const handleSceneClick = () => {
    setShowObjectUI(true); // Show ObjectUI when cube body is clicked
    onClick();
  };

  // Update handleDrag to handle first drag specially
  const handleDrag = (e) => {
    // Get new position from the transform controls event
    const newPos = e.target.object.position;

    // Update our position ref
    lastPositionRef.current = [newPos.x, newPos.y, newPos.z];

    if (onUpdate) {
      onUpdate(id, {
        type: 'cube',
        position: [newPos.x, newPos.y, newPos.z],
        scale,
        color,
        headerText,
        faceColors,
        faceTexts,
        faceTextStyles,
        textStyle,
      });
    }

    // Also call onMove for immediate UI updates
    if (onMove) {
      onMove({
        x: newPos.x,
        y: newPos.y,
        z: newPos.z,
      });
    }
  };

  // Add this function to detect when transform controls are attached
  const transformControlsRef = useRef();

  // Update handleTransformToggle
  const handleTransformToggle = () => {
    setShowTransform((prev) => {
      // If enabling transform controls, disable resize mode
      if (!prev) {
        setIsResizing(false);

        // Don't modify position directly, the TransformControls will handle it
        // The position is now managed by the outer group to avoid jumps
      }
      return !prev;
    });
  };

  const handleHeaderToggle = () => {
    console.log('Header toggle clicked');
    setShowHeader(!showHeader);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    if (onUpdate) {
      onUpdate(id, {
        color,
        headerText: text, // Pass the new header text
        scale,
        position,
        faceColors,
        faceTexts,
        faceTextStyles,
        textStyle,
        type: 'cube',
      });
    }
    setShowHeader(false);
    setShowObjectUI(false); // Hide ObjectUI after header text is submitted
  };

  const handleResizeToggle = () => {
    setIsResizing((prev) => {
      // If enabling resize mode, disable transform controls
      if (!prev) {
        setShowTransform(false);
      }
      return !prev;
    });
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1, z: 2 }[axis];
    setScale((prevScale) => {
      const newScale = [...prevScale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      return newScale;
    });
  };

  const handleIndicatorClick = (e, faceName) => {
    e.stopPropagation();

    // Get face indicator props for this face
    const { position: facePos } = getFaceIndicatorProps(faceName);

    // Create the complete indicator data
    const indicatorData = {
      type: 'cube',
      face: faceName,
      cube: {
        id,
        position,
        scale,
        userData: { objectId: id.toString() },
        // Only include essential properties
      },
      position: position, // Use cube's position as base
      faceCenter: facePos,
    };

    // Calculate world position (from local face position)
    const worldPos = new THREE.Vector3(facePos[0], facePos[1], facePos[2]);
    worldPos.applyMatrix4(
      contentRef.current?.matrixWorld || new THREE.Matrix4()
    );
    indicatorData.position = [worldPos.x, worldPos.y, worldPos.z];

    // Call the handler with complete data
    onFaceIndicatorClick?.(indicatorData);
  };

  const handleColorChange = (color, face) => {
    setFaceColors((prev) => ({
      ...prev,
      [face]: color,
    }));
  };

  const handleTextClick = (e) => {
    e.stopPropagation();
    setShowHeaderTextStyleUI(true);
    setActiveTextFace(null);
    setActiveTextStyleUI(contentRef.current);
    setShowObjectUI(false);
    setSelectedFace(null);
  };

  const handleStyleChange = (newStyle) => {
    if (activeTextFace) {
      const updatedFaceTextStyles = {
        ...faceTextStyles,
        [activeTextFace]: { ...faceTextStyles[activeTextFace], ...newStyle },
      };
      setFaceTextStyles(updatedFaceTextStyles);
      if (onUpdate) {
        onUpdate(id, {
          color,
          headerText,
          scale,
          position,
          faceColors,
          faceTexts,
          faceTextStyles: updatedFaceTextStyles,
          textStyle,
          type: 'cube',
        });
      }
    } else {
      const updatedTextStyle = { ...textStyle, ...newStyle };
      setTextStyle(updatedTextStyle);
      if (onUpdate) {
        onUpdate(id, {
          color,
          headerText,
          scale,
          position,
          faceColors,
          faceTexts,
          faceTextStyles,
          textStyle: updatedTextStyle,
          type: 'cube',
        });
      }
    }
  };

  const handleFaceTextSubmit = (text) => {
    const updatedTexts = {
      ...faceTexts,
      [selectedFace]: text,
    };
    setFaceTexts(updatedTexts);
    if (onUpdate) {
      onUpdate(id, {
        color,
        headerText,
        scale,
        position,
        faceColors,
        faceTexts: updatedTexts, // Pass the updated texts
        faceTextStyles,
        textStyle,
        type: 'cube',
      });
    }
    setShowFaceTextInput(false);
    setSelectedFace(null);
  };

  const handleFaceTextClick = () => {
    setShowFaceTextInput(true);
  };

  const handleFaceTextStyleClick = (e, faceName) => {
    if (e) {
      e.stopPropagation();
    }
    setShowHeaderTextStyleUI(false);
    setActiveTextFace(faceName);
    setActiveTextStyleUI(contentRef.current);
    setShowObjectUI(false);
    setSelectedFace(null);
    setShowFaceTextInput(false);
  };

  // Remove the global click handler effect since it won't work reliably
  // with Three.js events
  useEffect(() => {
    if (!selected) {
      setSelectedFace(null);
      setShowTransform(false);
      setActiveTextStyleUI(false);
    }
  }, [selected]);

  // Add useEffect to persist state changes
  useEffect(() => {
    if (onUpdate && id) {
      onUpdate(id, {
        color,
        headerText,
        scale,
        position,
        faceColors,
        faceTexts,
        faceTextStyles,
        textStyle,
        type: 'cube',
      });
    }
  }, [
    id,
    color,
    headerText,
    scale,
    position,
    faceColors,
    faceTexts,
    faceTextStyles,
    textStyle,
    onUpdate,
  ]);

  // Add an effect to keep contentRef position in sync when transform is active
  useEffect(() => {
    if (showTransform && contentRef.current) {
      // Ensure object position matches our tracked position
      contentRef.current.position.set(
        lastPositionRef.current[0],
        lastPositionRef.current[1],
        lastPositionRef.current[2]
      );
    }
  }, [showTransform]);

  const size = 5; // Half-size since points are from center

  // Define cube vertices (corners)
  const points = [
    // Bottom face edges
    [-size, -size, -size],
    [-size, -size, size],
    [-size, -size, size],
    [size, -size, size],
    [size, -size, size],
    [size, -size, -size],
    [size, -size, -size],
    [-size, -size, -size],

    // Top face edges
    [-size, size, -size],
    [-size, size, size],
    [-size, size, size],
    [size, size, size],
    [size, size, size],
    [size, size, -size],
    [size, size, -size],
    [-size, size, -size],

    // Vertical edges connecting top and bottom
    [-size, -size, -size],
    [-size, size, -size],
    [size, -size, -size],
    [size, size, -size],
    [-size, -size, size],
    [-size, size, size],
    [size, -size, size],
    [size, size, size],
  ];

  const getFaceMaterial = (faceName) => ({
    ...faceMaterialProps,
    color: faceColors[faceName]
      ? new THREE.Color(faceColors[faceName])
      : selectedFace === faceName
      ? new THREE.Color('#99ccff')
      : new THREE.Color('#ffffff'),
    opacity: faceColors[faceName]
      ? 1.0
      : selectedFace === faceName
      ? 0.1
      : 0.05,
    depthWrite: !!faceColors[faceName],
  });

  // Update the position calculation functions to use consistent logic like Plane and Dodecahedron
  const getUIPositions = () => {
    // Use the base size without scale since the group already applies scale
    const cubeHalfSize = 5; // Fixed half-size of cube (unscaled)
    const zOffset = 0.1; // Small z-offset to avoid z-fighting

    return {
      objectUI: [0, cubeHalfSize + 20 / scale[1], zOffset], // Divide by scale to compensate
      headerInput: [0, cubeHalfSize + 5 / scale[1], zOffset], // Keep 5 units above cube regardless of scale
      headerText: [0, cubeHalfSize + 5 / scale[1], zOffset], // Keep 5 units above cube regardless of scale
      textStyleUI: [0, cubeHalfSize + 7 / scale[1], zOffset], // 7 units above for style UI
    };
  };

  // Replace the old getUIPosition function with this new implementation

  // Calculate header input position relative to cube's top edge

  const isIndicatorActive = (faceName) => {
    return selectedIndicators.some(
      (indicator) =>
        indicator.cube === contentRef.current && indicator.face === faceName
    );
  };

  // Update the isIndicatorConnected function to be more robust
  const isIndicatorConnected = (faceName) => {
    return connections.some(
      (conn) =>
        // Check for object ID match rather than reference equality
        (conn.start.objectId === id.toString() &&
          conn.start.face === faceName) ||
        (conn.end.objectId === id.toString() && conn.end.face === faceName)
    );
  };

  // Update shouldShowIndicator to make indicators visible on face click
  const shouldShowIndicator = (faceName) => {
    // Always show indicator if the face is connected
    if (isIndicatorConnected(faceName)) {
      return true;
    }

    // Show indicators when in connection creation mode
    if (selectedIndicators.length > 0) {
      return true;
    }

    // Show indicator for selected face
    if (selectedFace === faceName && selected) {
      return true;
    }

    // Show all indicators when explicitly requested
    if (showAllIndicators && selected) {
      return true;
    }

    // Show indicators based on mode
    switch (indicatorMode) {
      case 'all':
        return selected || showAllIndicators;
      case 'indicators':
        return selected || showAllIndicators;
      case 'single':
        return (
          (activeIndicator?.cube?.id === id &&
            activeIndicator?.face === faceName) ||
          (selected && faceName === selectedFace)
        );
      default:
        return false;
    }
  };

  // Add a handler for colored face clicks
  const handleColoredFaceClick = (e, name) => {
    e.stopPropagation();
    // Only handle face click if cube is already selected
    if (selected) {
      handleFaceClick(e, name);
    } else {
      // If cube isn't selected, handle as a cube click first
      handleSceneClick();
    }
  };

  // Add helper function to calculate text offset based on font size
  const getFaceTextOffset = (fontSize) => {
    // Create a more consistent offset regardless of face size
    const baseOffset = 0.5; // Base distance from face
    const fontSizeMultiplier = typeof fontSize === 'number' ? fontSize : 0.5;
    const textHeight = fontSizeMultiplier * 0.7; // Match TEXT_HEIGHT from TextSprite
    return baseOffset + textHeight / 2; // Add half text height to position text better
  };

  const getFaceUIPosition = (faceName) => {
    switch (faceName) {
      case 'front':
        return [0, 1, 0];
      case 'back':
        return [0, 0, 0];
      case 'top':
        return [0, 0, 0];
      case 'bottom':
        return [0, 0, 0];
      case 'right':
        return [0, 0, 0];
      case 'left':
        return [0, 0, 0];
      default:
        return [0, 0, 0];
    }
  };

  return (
    <>
      {/* Simplify group structure - single group with position */}
      <group ref={contentRef} position={position} scale={scale}>
        <mesh
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

        {/* Always render colored faces */}
        {faces.map(({ name, normal }) => {
          if (!faceColors[name]) return null; // Only render if face has color
          const { position: facePos, rotation } = getFaceIndicatorProps(name);
          const uiPos = getFaceUIPosition(name);
          return (
            <mesh
              key={`colored-${name}`}
              position={[facePos[0], facePos[1], facePos[2]]}
              rotation={rotation}
              onClick={(e) => handleColoredFaceClick(e, name)}
              renderOrder={1}
            >
              <boxGeometry args={[9.8, 9.9, 0.2]} />
              <meshBasicMaterial
                color={faceColors[name]}
                opacity={1.0}
                transparent={false}
                depthWrite={true}
                polygonOffset={true} // <-- Enable polygon offset
                polygonOffsetFactor={-1} // <-- Push face slightly back
                polygonOffsetUnits={-4} // <-- Fine tune offset
              />
              {selected && ( // Only render these when cube is selected
                <>
                  {selectedFace === name && !showFaceTextInput && (
                    <FaceUI
                      position={uiPos}
                      normal={normal}
                      onColorChange={handleColorChange}
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
                </>
              )}
            </mesh>
          );
        })}

        {/* Render all face indicators in a separate pass */}
        {faces.map(({ name }) => {
          const { position: facePos, rotation } = getFaceIndicatorProps(name);
          return (
            shouldShowIndicator(name) && (
              <mesh
                key={`indicator-${name}`}
                position={[facePos[0], facePos[1], facePos[2]]}
                rotation={rotation}
                renderOrder={3}
              >
                <FaceIndicator
                  position={[0, 0, 0.3]}
                  rotation={[0, 0, 0]}
                  onClick={(e) => handleIndicatorClick(e, name)}
                  isActive={isIndicatorActive(name)}
                />
              </mesh>
            )
          );
        })}

        {/* Update face text rendering with dynamic positioning */}
        {faces.map(({ name }) => {
          const { position: facePos, rotation } = getFaceIndicatorProps(name);

          // Calculate inverse scale for each dimension, with minimum value to prevent division by zero
          const inverseScale = scale.map((s) => 1 / Math.max(0.0001, s));

          // Calculate base position that will be affected by the cube's scale
          const basePosition = [facePos[0], facePos[1], facePos[2]];
          const textStyle = faceTextStyles[name];
          const yOffset = getFaceTextOffset(textStyle.fontSize);

          return (
            faceTexts[name] && (
              <group
                key={`text-${name}`}
                position={basePosition}
                rotation={rotation}
                // Apply inverse scale to counteract the cube's scale
                scale={inverseScale}
              >
                <TextSprite
                  text={faceTexts[name]}
                  // Keep z offset slightly larger to ensure text is visible above face
                  position={[0, yOffset, 0.2]}
                  followTarget={null}
                  onClick={(e) => handleFaceTextStyleClick(e, name)}
                  style={{
                    ...textStyle,
                    fixedSize: true,
                    isFaceText: true,
                  }}
                  // Provide face normal to help with text orientation
                  normal={getFaceIndicatorProps(name).normal}
                />
                {activeTextFace === name &&
                  activeTextStyleUI === contentRef.current && (
                    <TextStyleUI
                      position={[0, 6, 0]}
                      onStyleChange={handleStyleChange}
                      onClose={() => {
                        setActiveTextFace(null);
                        setActiveTextStyleUI(null);
                      }}
                    />
                  )}
              </group>
            )
          );
        })}

        {/* Render selection-dependent faces and UI */}
        {(selected || showAllIndicators) && (
          <>
            {faces.map(({ name, normal }) => {
              if (faceColors[name]) return null; // Skip if face is colored
              const { position: facePos, rotation } =
                getFaceIndicatorProps(name);
              const uiPos = getFaceUIPosition(name);
              return (
                <mesh
                  key={`ui-${name}`}
                  position={[facePos[0], facePos[1], facePos[2]]}
                  rotation={rotation}
                  onClick={(e) => handleFaceClick(e, name)}
                  renderOrder={2}
                >
                  <boxGeometry args={[10.4, 10.4, 0.2]} />
                  <meshBasicMaterial {...getFaceMaterial(name)} />
                  {selectedFace === name && selected && !showFaceTextInput && (
                    <FaceUI
                      position={uiPos}
                      normal={normal}
                      onColorChange={handleColorChange}
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
                      position={[0, 0, 0.2]}
                      rotation={[0, 0, 0]}
                      onClick={(e) => handleIndicatorClick(e, name)}
                      isActive={isIndicatorActive(name)}
                    />
                  )}
                </mesh>
              );
            })}
          </>
        )}

        <Line
          points={points}
          color={color} // Use color instead of lineColor
          lineWidth={1}
          segments={true}
          polygonOffset // <-- Enable polygon offset for the edge lines
          polygonOffsetFactor={1} // <-- Bring lines forward
          polygonOffsetUnits={1} // <-- Fine tune the offset
        />

        {/* Move UI elements inside main group */}
        {selected && !showHeader && showObjectUI && (
          <ObjectUI
            key={`ui-${id}`}
            position={getUIPositions().objectUI}
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            onResizeToggle={handleResizeToggle}
            onLineColorChange={handleLineColorChange}
            showTransform={showTransform}
            showHeader={showHeader}
            followTarget={null} // Important: Don't set followTarget here, it's already within the group
            objectId={id}
          />
        )}

        {/* Keep other UI elements inside main group with local positions */}
        {selected && showHeader && (
          <HeaderInput
            position={getUIPositions().headerInput}
            onTextSubmit={handleHeaderSubmit}
            followTarget={null} // Remove followTarget here too
          />
        )}
        {headerText && (
          <>
            {/* Calculate inverse scale to cancel out parent group scaling */}
            {(() => {
              // Calculate inverse scale with protection against division by zero
              const inverseScale = scale.map((s) => 1 / Math.max(0.0001, s));
              return (
                <group
                  scale={inverseScale}
                  position={getUIPositions().headerText}
                >
                  <TextSprite
                    text={headerText}
                    position={[0, 0, 0]}
                    followTarget={null}
                    onClick={handleTextClick}
                    style={{
                      ...textStyle,
                      isHeaderText: true,
                      fixedSize: false, // Allow camera-based scaling
                    }}
                  />
                  {showHeaderTextStyleUI &&
                    activeTextStyleUI === contentRef.current && (
                      <TextStyleUI
                        position={[0, 2 / scale[1], 0]} // Adjust position slightly upward
                        followTarget={null}
                        onStyleChange={handleStyleChange}
                        onClose={() => {
                          setShowHeaderTextStyleUI(false);
                          setActiveTextStyleUI(null);
                        }}
                      />
                    )}
                </group>
              );
            })()}
          </>
        )}
        {selected && isResizing && contentRef.current && (
          <ResizeArrows onResize={handleResize} object={contentRef.current} />
        )}
      </group>

      {/* Update TransformControls to target the main group */}
      {selected && showTransform && contentRef.current && (
        <DreiTransformControls
          ref={transformControlsRef}
          object={contentRef.current}
          onObjectChange={handleDrag}
          onDragStart={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = false;
            }
          }}
          onDragEnd={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = true;
            }
          }}
          mode="translate"
          space="world"
          size={1}
        />
      )}
    </>
  );
};

Cube.displayName = 'Cube';
export default Cube;
