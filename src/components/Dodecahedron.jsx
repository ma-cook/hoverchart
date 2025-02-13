import React, { useRef, useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import ObjectUI from './ObjectUI';
import TextSprite from './TextSprite';
import HeaderInput from './HeaderInput';
import ResizeArrows from './ResizeArrows';
import TextStyleUI from './TextStyleUI';
import FaceUI from './FaceUI';
import FaceTextInput from './FaceTextInput';
import FaceIndicator from './FaceIndicator'; // Add this import

const Sphere = ({
  position,
  selected,
  onClick,
  onMove,
  showAllIndicators, // Make sure this prop is passed
  onIndicatorDeselected,
  globalIndicatorSelected,
  onFaceIndicatorClick, // Add this prop
  onIndicatorSelected, // Add this prop
}) => {
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [scale, setScale] = useState([1, 1, 1]);
  const [isResizing, setIsResizing] = useState(false);
  const [highlightedFaces, setHighlightedFaces] = useState(new Set());
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [headerStyle, setHeaderStyle] = useState({
    fontSize: 'medium',
    color: 'white',
    underline: false,
  });
  const [lineColor, setLineColor] = useState('white');
  const [activeFace, setActiveFace] = useState(null);
  const [showFaceUI, setShowFaceUI] = useState(false);
  const [showObjectUI, setShowObjectUI] = useState(true);
  const [faceTexts, setFaceTexts] = useState({});
  const [showFaceTextInput, setShowFaceTextInput] = useState(false);
  const [faceTextStyles, setFaceTextStyles] = useState({}); // Add new state for face text styles
  const [activeFaceText, setActiveFaceText] = useState(null); // Add state to track which face text is being edited
  const [showFaceTextStyleMenu, setShowFaceTextStyleMenu] = useState(false); // Add state for style menu visibility
  const [faceColors, setFaceColors] = useState({}); // Add new state for face colors
  const [selectedIndicator, setSelectedIndicator] = useState(null); // Add new state for indicator selection
  const [isConnected, setIsConnected] = useState(false); // Add new state to track if this dodecahedron is part of a connection
  const contentRef = useRef();
  const points = React.useMemo(() => {
    // Golden ratio for dodecahedron calculations
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = 5; // Scale factor to match previous size

    // Vertices of a dodecahedron
    const vertices = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [0, -phi, -1 / phi],
      [0, phi, -1 / phi],
      [0, phi, 1 / phi],
      [0, -phi, 1 / phi],
      [-1 / phi, 0, -phi],
      [1 / phi, 0, -phi],
      [1 / phi, 0, phi],
      [-1 / phi, 0, phi],
      [-phi, -1 / phi, 0],
      [-phi, 1 / phi, 0],
      [phi, 1 / phi, 0],
      [phi, -1 / phi, 0],
    ].map((v) => v.map((coord) => coord * scale));

    // Define edges of the dodecahedron
    const edges = [
      [0, 8],
      [0, 12],
      [0, 16],
      [1, 8],
      [1, 13],
      [1, 19],
      [2, 9],
      [2, 13],
      [2, 18],
      [3, 9],
      [3, 12],
      [3, 17],
      [4, 11],
      [4, 15],
      [4, 16],
      [5, 11],
      [5, 14],
      [5, 19],
      [6, 10],
      [6, 14],
      [6, 18],
      [7, 10],
      [7, 15],
      [7, 17],
      [8, 11],
      [9, 10],
      [12, 13],
      [14, 15],
      [16, 17],
      [18, 19],
    ];

    // Convert edges to lines
    return edges.map(([a, b]) => [vertices[a], vertices[b]]);
  }, []);

  const geometry = React.useMemo(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = 5;

    // Vertices of a dodecahedron
    const vertices = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [0, -phi, -1 / phi],
      [0, phi, -1 / phi],
      [0, phi, 1 / phi],
      [0, -phi, 1 / phi],
      [-1 / phi, 0, -phi],
      [1 / phi, 0, -phi],
      [1 / phi, 0, phi],
      [-1 / phi, 0, phi],
      [-phi, -1 / phi, 0],
      [-phi, 1 / phi, 0],
      [phi, 1 / phi, 0],
      [phi, -1 / phi, 0],
    ].map((v) => v.map((coord) => coord * scale));

    // Define faces of the dodecahedron (pentagon vertex indices)
    const faces = [
      [0, 8, 1, 13, 12],
      [0, 16, 17, 3, 12],
      [0, 8, 11, 4, 16],
      [1, 19, 5, 11, 8],
      [1, 13, 2, 18, 19],
      [2, 13, 12, 3, 9],
      [2, 18, 6, 10, 9],
      [3, 17, 7, 10, 9],
      [4, 11, 5, 14, 15],
      [4, 15, 7, 17, 16],
      [5, 19, 18, 6, 14],
      [6, 14, 15, 7, 10],
    ];

    // Create geometries for each face
    return faces.map((faceIndices) => {
      const faceGeometry = new THREE.BufferGeometry();
      const faceVertices = faceIndices.map((index) => vertices[index]);

      // Add center point of pentagon
      const center = faceVertices.reduce(
        (acc, v) => acc.map((coord, i) => coord + v[i] / 5),
        [0, 0, 0]
      );

      // Create triangles from center to each edge
      const triangleVertices = [];
      for (let i = 0; i < 5; i++) {
        triangleVertices.push(
          ...center,
          ...faceVertices[i],
          ...faceVertices[(i + 1) % 5]
        );
      }

      faceGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(triangleVertices, 3)
      );
      faceGeometry.computeVertexNormals();
      return faceGeometry;
    });
  }, []);

  // Reset states when deselected
  useEffect(() => {
    if (!selected) {
      setShowTransform(false);
      setHighlightedFaces(new Set()); // Clear highlighted faces when deselected
      setShowFaceTextStyleMenu(false); // Add this line
      setActiveFaceText(null); // Add this line
      // Don't reset selectedIndicator here
    }
  }, [selected]);

  // Store orbitControls when mounted
  useEffect(() => {
    if (contentRef.current && window.orbitControls) {
      contentRef.current.orbitControls = window.orbitControls;
    }
  }, []);

  // Add effect for handling global clicks
  useEffect(() => {
    const handleGlobalClick = () => {
      if (showFaceTextStyleMenu) {
        setShowFaceTextStyleMenu(false);
        setActiveFaceText(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showFaceTextStyleMenu]);

  const handleTransformToggle = () => {
    setShowTransform(!showTransform);
  };

  const handleHeaderToggle = () => {
    setShowHeader(!showHeader);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    setShowHeader(false);
  };

  const handleResizeToggle = () => {
    setIsResizing(!isResizing);
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1, z: 2 }[axis];
    setScale((prevScale) => {
      const newScale = [...prevScale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      return newScale;
    });
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

  // Split face click into two separate handlers
  const handleFaceClick = (faceIndex, e) => {
    if (!selected) return; // Ignore clicks if not selected
    e.stopPropagation();
    setHighlightedFaces(new Set([faceIndex]));
    setActiveFace(faceIndex);
    setShowFaceUI(true);
    setShowObjectUI(false); // Hide ObjectUI when face is clicked
    setShowFaceTextStyleMenu(false); // Close text style menu when clicking a different face
    setActiveFaceText(null); // Clear active face text
  };

  // Add a handler to receive connection state from parent
  const handleIndicatorClick = (faceIndex, e) => {
    if (!selected) return;
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    // First, show all indicators
    onIndicatorSelected(); // Now this function will be defined
    setSelectedIndicator(faceIndex);

    const { center } = getFaceInfo(faceIndex);
    onFaceIndicatorClick({
      cube: contentRef.current,
      face: faceIndex,
      type: 'sphere',
      faceCenter: center,
    });
  };

  const handleHeaderClick = (e) => {
    e.stopPropagation();
    setShowStyleMenu(!showStyleMenu);
  };

  const handleStyleChange = (newStyle) => {
    setHeaderStyle((prev) => ({ ...prev, ...newStyle }));
  };

  const handleLineColorChange = (color) => {
    setLineColor(color);
  };

  const handleBackgroundClick = (e) => {
    e.stopPropagation();
    e.nativeEvent?.stopPropagation?.();
    onClick();
    setHighlightedFaces(new Set());
    setActiveFace(null);
    setShowFaceUI(false);
    setShowObjectUI(true);
    setShowFaceTextStyleMenu(false); // Add this line
    setActiveFaceText(null); // Add this line
    // Clear indicator state if connected
    if (isConnected) {
      setSelectedIndicator(null);
      onIndicatorDeselected();
    }
  };

  const handleFaceTextSubmit = (text) => {
    if (activeFace !== null) {
      setFaceTexts((prev) => ({
        ...prev,
        [activeFace]: text,
      }));
      setShowFaceTextInput(false);
    }
  };

  const handleFaceTextButtonClick = () => {
    setShowFaceTextInput(true);
    setShowFaceTextStyleMenu(false); // Hide style menu when adding new text
  };

  // Update text click handler to distinguish between clicking text vs button
  const handleFaceTextClick = (faceIndex, e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // Add this line to prevent global click
    setActiveFaceText(faceIndex);
    setShowFaceTextStyleMenu(true);
    setShowFaceTextInput(false);
  };

  const handleFaceTextStyleChange = (newStyle) => {
    if (activeFaceText !== null) {
      setFaceTextStyles((prev) => ({
        ...prev,
        [activeFaceText]: {
          ...(prev[activeFaceText] || {}),
          ...newStyle,
        },
      }));
    }
  };

  // Calculate positions relative to sphere's scale
  const getUIPosition = () => {
    const sphereHeight = 10 * scale[1];
    const topEdgeOffset = sphereHeight / 2;
    return [position[0], position[1] + topEdgeOffset + 20, position[2]];
  };

  const getHeaderPosition = () => {
    const sphereHeight = 10 * scale[1];
    const topEdgeOffset = sphereHeight / 2;
    return [
      position[0],
      position[1] + topEdgeOffset + 100 * scale[1], // Increased offset and made it scale-dependent
      position[2],
    ];
  };

  const getFaceUIPosition = () => {
    if (activeFace === null || !contentRef.current) return [0, 0, 0];

    const faceGeometry = geometry[activeFace];
    const positions = faceGeometry.attributes.position.array;

    // Calculate center of the face
    let centerX = 0,
      centerY = 0,
      centerZ = 0;
    for (let i = 0; i < positions.length; i += 3) {
      centerX += positions[i];
      centerY += positions[i + 1];
      centerZ += positions[i + 2];
    }
    const vertexCount = positions.length / 3;

    return [
      centerX / vertexCount,
      centerY / vertexCount + 2, // Add small offset above face
      centerZ / vertexCount,
    ];
  };

  // Modify getFaceTextPosition to include normal vector for orientation
  const getFaceTextPosition = (faceIndex) => {
    const faceGeometry = geometry[faceIndex];
    const positions = faceGeometry.attributes.position.array;
    const normals = faceGeometry.attributes.normal.array;

    // Calculate center of the face
    let centerX = 0,
      centerY = 0,
      centerZ = 0;
    for (let i = 0; i < positions.length; i += 3) {
      centerX += positions[i];
      centerY += positions[i + 1];
      centerZ += positions[i + 2];
    }
    const vertexCount = positions.length / 3;

    // Get face normal (using first normal from geometry)
    const normalX = normals[0];
    const normalY = normals[1];
    const normalZ = normals[2];

    // Create offset vector from normal
    const OFFSET_DISTANCE = 0.2; // Adjust this value to control how far text floats
    const offsetX = normalX * OFFSET_DISTANCE;
    const offsetY = normalY * OFFSET_DISTANCE;
    const offsetZ = normalZ * OFFSET_DISTANCE;

    return {
      position: [
        centerX / vertexCount + offsetX,
        centerY / vertexCount + offsetY,
        centerZ / vertexCount + offsetZ,
      ],
      normal: [normalX, normalY, normalZ],
    };
  };

  // Add function to calculate face center and normal
  const getFaceInfo = (faceIndex) => {
    const faceGeometry = geometry[faceIndex];
    const positions = faceGeometry.attributes.position.array;
    const normals = faceGeometry.attributes.normal.array;

    let centerX = 0,
      centerY = 0,
      centerZ = 0;
    for (let i = 0; i < positions.length; i += 3) {
      centerX += positions[i];
      centerY += positions[i + 1];
      centerZ += positions[i + 2];
    }
    const vertexCount = positions.length / 3;

    return {
      center: [
        centerX / vertexCount,
        centerY / vertexCount,
        centerZ / vertexCount,
      ],
      normal: [normals[0], normals[1], normals[2]],
    };
  };

  // Add getFaceRotation function
  const getFaceRotation = (faceIndex) => {
    const { normal } = getFaceInfo(faceIndex);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.lookAt(
      new THREE.Vector3(...normal),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0)
    );
    const rotation = new THREE.Euler();
    rotation.setFromRotationMatrix(rotationMatrix);
    return rotation;
  };

  // Update the shouldShowIndicators condition to consider connection state
  const shouldShowIndicators =
    selected || globalIndicatorSelected || selectedIndicator !== null;

  return (
    <>
      <group position={position}>
        <group ref={contentRef} scale={scale}>
          {/* Add invisible hit sphere for better click detection */}
          <mesh
            onClick={handleBackgroundClick}
            onPointerDown={(e) => e.stopPropagation()}
            renderOrder={-1} // Render before other meshes
          >
            <sphereGeometry args={[7]} />{' '}
            {/* Larger than dodecahedron to ensure good hit detection */}
            <meshBasicMaterial
              visible={false}
              side={THREE.DoubleSide}
              transparent={false}
              opacity={1}
            />
          </mesh>

          {/* Original background mesh */}
          <mesh
            onClick={handleBackgroundClick}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <dodecahedronGeometry args={[5.1]} />{' '}
            {/* Slightly larger than face geometries */}
            <meshBasicMaterial
              visible={false}
              side={THREE.DoubleSide}
              transparent={false}
              opacity={1}
            />
          </mesh>

          {/* Modified face rendering to handle colors correctly */}
          {geometry.map((faceGeometry, idx) => (
            <mesh
              key={`face-${idx}`}
              geometry={faceGeometry}
              onClick={(e) => selected && handleFaceClick(idx, e)}
            >
              <meshBasicMaterial
                color={
                  faceColors[idx] || // Custom color if set
                  (selected && highlightedFaces.has(idx) ? '#0066ff' : 'white') // Only show highlight when selected
                }
                transparent
                opacity={
                  selected
                    ? highlightedFaces.has(idx)
                      ? 0.3
                      : 0.1
                    : faceColors[idx]
                    ? 0.3
                    : 0 // Hide faces without custom colors when not selected
                }
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}

          {/* Wireframe lines */}
          {points.map((linePoints, idx) => (
            <Line
              key={idx}
              points={linePoints}
              color={lineColor}
              lineWidth={1}
            />
          ))}

          {/* Add face texts - modified for double-sided visibility */}
          {Object.entries(faceTexts).map(([faceIndex, text]) => {
            const { position, normal } = getFaceTextPosition(Number(faceIndex));
            const textStyle = faceTextStyles[faceIndex] || {
              fontSize: 0.5,
              color: 'white',
              underline: false,
            };

            return (
              <group key={`face-text-${faceIndex}`}>
                {/* Outside facing text */}
                <TextSprite
                  text={text}
                  position={position}
                  style={{
                    ...textStyle,
                    fixedSize: true,
                    isFaceText: true,
                  }}
                  onClick={(e) => handleFaceTextClick(Number(faceIndex), e)}
                  billboard={false}
                  normal={normal}
                />
                {/* Inside facing text */}
                <TextSprite
                  text={text}
                  position={position}
                  style={{
                    ...textStyle,
                    fixedSize: true,
                    isFaceText: true,
                  }}
                  onClick={(e) => handleFaceTextClick(Number(faceIndex), e)}
                  billboard={false}
                  normal={normal.map((n) => -n)}
                />
              </group>
            );
          })}

          {/* Main face indicator for active face */}
          {selected && activeFace !== null && (
            <FaceIndicator
              key={`main-indicator-${activeFace}`}
              position={getFaceInfo(activeFace).center}
              rotation={getFaceRotation(activeFace)}
              onClick={(e) => handleIndicatorClick(activeFace, e)}
              isActive={selectedIndicator === activeFace} // Now highlights only on indicator click
            />
          )}

          {/* Update indicator cubes rendering */}
          {shouldShowIndicators &&
            geometry.map((_, idx) => {
              const { center } = getFaceInfo(idx);
              const rotation = getFaceRotation(idx);
              const shouldShow =
                showAllIndicators ||
                globalIndicatorSelected ||
                selectedIndicator !== null;
              return shouldShow ? (
                <FaceIndicator
                  key={`indicator-${idx}`}
                  position={center}
                  rotation={rotation}
                  onClick={(e) => handleIndicatorClick(idx, e)}
                  isActive={selectedIndicator === idx} // Highlight only if explicitly clicked
                />
              ) : null;
            })}
        </group>

        {selected && showObjectUI && !showHeader && (
          <ObjectUI
            position={getUIPosition()}
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            onResizeToggle={handleResizeToggle}
            onLineColorChange={handleLineColorChange}
            showTransform={showTransform}
            showHeader={showHeader}
            followTarget={contentRef}
          />
        )}

        {selected && showFaceUI && activeFace !== null && (
          <FaceUI
            position={(() => {
              const pos = getFaceUIPosition();
              pos[1] += 5; // Only modify the z coordinate
              return pos;
            })()}
            onColorChange={(color) => {
              setFaceColors((prev) => ({
                ...prev,
                [activeFace]: color,
              }));
            }}
            face={activeFace}
            onTextClick={handleFaceTextButtonClick} // Changed to use new handler
            followTarget={contentRef} // Add this prop
          />
        )}

        {selected && showHeader && (
          <HeaderInput
            position={getHeaderPosition()}
            onTextSubmit={handleHeaderSubmit}
            followTarget={contentRef}
          />
        )}

        {headerText && (
          <TextSprite
            text={headerText}
            position={getHeaderPosition()}
            followTarget={contentRef}
            onClick={handleHeaderClick}
            style={{
              ...headerStyle,
              isHeaderText: true,
              isDodecahedronHeader: true,
            }}
          />
        )}

        {showStyleMenu && headerText && (
          <TextStyleUI
            position={getHeaderPosition()}
            followTarget={contentRef}
            onStyleChange={handleStyleChange}
          />
        )}

        {selected && isResizing && contentRef.current && (
          <ResizeArrows onResize={handleResize} object={contentRef.current} />
        )}

        {selected && showFaceTextInput && activeFace !== null && (
          <FaceTextInput
            position={getFaceUIPosition()}
            onTextSubmit={handleFaceTextSubmit}
          />
        )}

        {/* Add TextStyleUI for face text */}
        {showFaceTextStyleMenu && activeFaceText !== null && (
          <TextStyleUI
            position={(() => {
              const { position } = getFaceTextPosition(activeFaceText);
              return [position[0], position[1] + 2, position[2]];
            })()}
            followTarget={contentRef}
            onStyleChange={handleFaceTextStyleChange}
            uiType="faceText" // Add this prop to show limited options
          />
        )}
      </group>

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

export default Sphere;
