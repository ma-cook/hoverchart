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
    onFaceClick?.({ cube: contentRef.current, face: faceName });
  };

  const handleSceneClick = () => {
    setShowObjectUI(true); // Show ObjectUI when cube body is clicked
    onClick();
  };

  const handleDrag = (newPosition) => {
    if (onMove) {
      onMove({
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
      });
    }
  };

  const handleTransformToggle = () => {
    setShowTransform((prev) => {
      // If enabling transform controls, disable resize mode
      if (!prev) {
        setIsResizing(false);
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
    onFaceIndicatorClick?.({ cube: contentRef.current, face: faceName });
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

  // Calculate header position relative to cube's top edge
  const getHeaderPosition = () => {
    return [
      position[0],
      position[1], // Base position, offset handled in TextSprite
      position[2],
    ];
  };

  // Calculate UI position relative to cube's top edge
  const getUIPosition = () => {
    const cubeHeight = 10 * scale[1]; // cube height * y-scale
    const topEdgeOffset = cubeHeight / 2; // half height since cube is centered
    return [
      position[0], // x
      position[1] + topEdgeOffset + 20, // y (20 units above top edge)
      position[2], // z
    ];
  };

  // Calculate header input position relative to cube's top edge

  const isIndicatorActive = (faceName) => {
    return selectedIndicators.some(
      (indicator) =>
        indicator.cube === contentRef.current && indicator.face === faceName
    );
  };

  const isIndicatorConnected = (faceName) => {
    return connections.some(
      (conn) =>
        (conn.start.cube === contentRef.current &&
          conn.start.face === faceName) ||
        (conn.end.cube === contentRef.current && conn.end.face === faceName)
    );
  };

  // Update shouldShowIndicator to hide unconnected indicators after connection
  const shouldShowIndicator = (faceName) => {
    // Always show indicators for connected faces
    if (isIndicatorConnected(faceName)) {
      return true;
    }

    // Show all indicators when in connection mode and no connection exists yet
    if (selectedIndicators.length > 0 && !isIndicatorConnected(faceName)) {
      return true;
    }

    // Show all indicators when in indicators mode and no connections exist
    if (indicatorMode === 'indicators' && connections.length === 0) {
      return true;
    }

    // For other cases, maintain existing logic
    if (!selected) return false;

    switch (indicatorMode) {
      case 'all':
        return showAllIndicators;
      case 'single':
        return (
          activeIndicator?.cube === contentRef.current &&
          activeIndicator?.face === faceName
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
    const baseOffset = 1; // Base distance from face
    const fontSizeMultiplier = typeof fontSize === 'number' ? fontSize : 0.5;
    const textHeight = fontSizeMultiplier * 0.7; // Match TEXT_HEIGHT from TextSprite
    return baseOffset + textHeight / 2; // Add half text height to keep bottom at base offset
  };

  return (
    <>
      <group>
        <group position={position}>
          <group ref={contentRef} scale={scale}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleSceneClick();
              }}
              userData={{ isCube: true }} // Add this to identify cube clicks
            >
              <boxGeometry args={[10, 10, 10]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {/* Always render colored faces */}
            {faces.map(({ name, normal }) => {
              if (!faceColors[name]) return null; // Only render if face has color
              const { position: facePos, rotation } =
                getFaceIndicatorProps(name);
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
                          position={[0, 0, 0]}
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
              const { position: facePos, rotation } =
                getFaceIndicatorProps(name);
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
              const { position: facePos, rotation } =
                getFaceIndicatorProps(name);
              const inverseScale = scale.map((s) => 1 / s);
              // Calculate base position without scale
              const basePosition = [facePos[0], facePos[1], facePos[2]];
              const textStyle = faceTextStyles[name];
              const yOffset = getFaceTextOffset(textStyle.fontSize);
              return (
                faceTexts[name] && (
                  <group
                    key={`text-${name}`}
                    position={basePosition}
                    rotation={rotation}
                    scale={inverseScale}
                  >
                    <TextSprite
                      text={faceTexts[name]}
                      position={[0, yOffset, 0.2]} // Keep offset constant relative to face
                      followTarget={null}
                      onClick={(e) => handleFaceTextStyleClick(e, name)}
                      style={{
                        ...textStyle,
                        fixedSize: true,
                        isFaceText: true,
                      }}
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
                      {selectedFace === name &&
                        selected &&
                        !showFaceTextInput && (
                          <FaceUI
                            position={[0, 16, 0]}
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
          </group>
          {/* Move ObjectUI outside scaled group and update position */}
          {selected && !showHeader && showObjectUI && contentRef.current && (
            <ObjectUI
              key={contentRef.current.uuid} // <-- New: force remount when cube selection changes
              position={[getUIPosition()]}
              onTransformToggle={handleTransformToggle}
              onHeaderToggle={handleHeaderToggle}
              onResizeToggle={handleResizeToggle} // Passed handleResizeToggle to ObjectUI
              onLineColorChange={handleLineColorChange} // <-- New prop
              showTransform={showTransform}
              showHeader={showHeader}
              followTarget={contentRef}
              objectId={contentRef.current.uuid} // Add this prop
            />
          )}
          {/* Update header elements positions */}
          {selected && showHeader && (
            <HeaderInput
              position={[0, 10, 0]}
              onTextSubmit={handleHeaderSubmit}
              followTarget={contentRef}
            />
          )}
          {headerText && (
            <>
              <TextSprite
                text={headerText}
                position={getHeaderPosition()}
                followTarget={contentRef}
                onClick={handleTextClick}
                style={{
                  ...textStyle,
                  isHeaderText: true, // Add this prop
                  fixedSize: false, // Allow camera-based scaling
                }}
              />
              {showHeaderTextStyleUI &&
                activeTextStyleUI === contentRef.current && (
                  <TextStyleUI
                    position={getHeaderPosition()}
                    followTarget={contentRef}
                    onStyleChange={handleStyleChange}
                    onClose={() => {
                      setShowHeaderTextStyleUI(false);
                      setActiveTextStyleUI(null);
                    }}
                  />
                )}
            </>
          )}
          {selected && isResizing && contentRef.current && (
            <ResizeArrows onResize={handleResize} object={contentRef.current} />
          )}
        </group>
      </group>
      {/* Move TransformControls outside all groups to prevent scale inheritance */}
      {selected && showTransform && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onDrag={handleDrag}
          mode="translate"
          space="world"
          size={1}
          position={position}
        />
      )}
    </>
  );
};

Cube.displayName = 'Cube';
export default Cube;
