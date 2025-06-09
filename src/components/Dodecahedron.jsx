import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import ObjectUI from './ObjectUI';
import TextSprite from './TextSprite';
import HeaderInput from './HeaderInput';

import TextStyleUI from './TextStyleUI';
import FaceUI from './FaceUI';
import FaceTextInput from './FaceTextInput';
import FaceIndicator from './FaceIndicator'; // Add this import
import isEqual from 'lodash/isEqual';

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
  connections, // Add this prop
  selectedIndicators, // Add this prop
  indicatorMode,
  onUpdate, // Add this prop
  onDelete, // Add new prop
  id, // Add this prop
  // Add default values for props
  headerText: initialHeaderText = '',
  scale: initialScale = [1, 1, 1],
  lineColor: initialLineColor = 'black',
  faceColors: initialFaceColors = {},
  faceTexts: initialFaceTexts = {},
  faceTextStyles: initialFaceTextStyles = {},
  headerStyle: initialHeaderStyle = {
    fontSize: 'medium',
    color: 'black',
    underline: false,
  },
}) => {
  // Initialize state with props instead of defaults
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [scale, setScale] = useState(() => [...initialScale]);
  const [headerStyle, setHeaderStyle] = useState(initialHeaderStyle);
  const [lineColor, setLineColor] = useState(initialLineColor);
  const [faceColors, setFaceColors] = useState(initialFaceColors);
  const [faceTexts, setFaceTexts] = useState(initialFaceTexts);
  const [faceTextStyles, setFaceTextStyles] = useState(initialFaceTextStyles);
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [highlightedFaces, setHighlightedFaces] = useState(new Set());
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [activeFace, setActiveFace] = useState(null);
  const [showFaceUI, setShowFaceUI] = useState(false);
  const [showObjectUI, setShowObjectUI] = useState(true);
  const [showFaceTextInput, setShowFaceTextInput] = useState(false);
  const [activeFaceText, setActiveFaceText] = useState(null); // Add state to track which face text is being edited
  const [showFaceTextStyleMenu, setShowFaceTextStyleMenu] = useState(false); // Add state for style menu visibility
  const [selectedIndicator, setSelectedIndicator] = useState(null); // Add new state for indicator selection
  const [isConnected, setIsConnected] = useState(false); // Add new state to track if this dodecahedron is part of a connection
  const [connectedFaces, setConnectedFaces] = useState(new Set()); // Add new state for connected faces
  const [isScaleModified, setIsScaleModified] = useState(false);
  const contentRef = useRef();
  const faceUIGroupRef = useRef(); // Add this new ref for FaceUI container
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
    // Reverse vertex order for faces 0, 6, and 11 to fix their orientation
    const faces = [
      [0, 12, 13, 1, 8], // Face 0 - reversed order
      [0, 16, 17, 3, 12],
      [0, 8, 11, 4, 16],
      [1, 19, 5, 11, 8],
      [1, 13, 2, 18, 19],
      [2, 13, 12, 3, 9],
      [2, 9, 10, 6, 18], // Face 6 - reversed order
      [3, 17, 7, 10, 9],
      [4, 11, 5, 14, 15],
      [4, 15, 7, 17, 16],
      [5, 19, 18, 6, 14],
      [6, 10, 7, 15, 14], // Face 11 - reversed order
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

  // Update isIndicatorConnected function to be more robust
  const isIndicatorConnected = useCallback(
    (faceIndex) => {
      return connections?.some(
        (conn) =>
          (conn.start.objectId === id.toString() &&
            parseInt(conn.start.face) === faceIndex) ||
          (conn.end.objectId === id.toString() &&
            parseInt(conn.end.face) === faceIndex)
      );
    },
    [connections, id]
  );

  // Now the effects can use isIndicatorConnected
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

  // Update effect for connection tracking to be more thorough
  useEffect(() => {
    const connected = new Set();
    connections?.forEach((conn) => {
      if (conn.start.objectId === id.toString()) {
        connected.add(parseInt(conn.start.face));
      }
      if (conn.end.objectId === id.toString()) {
        connected.add(parseInt(conn.end.face));
      }
    });
    setConnectedFaces(connected);
    setIsConnected(connected.size > 0);
  }, [connections, id]);

  // Add an effect to reset selectedIndicator when connections change
  useEffect(() => {
    if (connections?.length > 0) {
      // If this dodecahedron's selected indicator is part of a connection, reset it
      if (
        selectedIndicator !== null &&
        isIndicatorConnected(selectedIndicator)
      ) {
        setSelectedIndicator(null);
      }
    }
  }, [connections, selectedIndicator, isIndicatorConnected]);

  // Add useCallback for updating database
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id) return;

    const currentState = {
      type: 'sphere',
      position,
      scale,
      lineColor,
      headerText,
      headerStyle,
      // Map numeric indices for 12 faces
      faceColors: Object.fromEntries(
        Array(12)
          .fill(null)
          .map((_, idx) => [idx, faceColors[idx] || null])
      ),
      faceTexts: Object.fromEntries(
        Array(12)
          .fill('')
          .map((_, idx) => [idx, faceTexts[idx] || ''])
      ),
      faceTextStyles: Object.fromEntries(
        Array(12)
          .fill(null)
          .map((_, idx) => [
            idx,
            faceTextStyles[idx] || {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
          ])
      ),
    };

    // Only update if something has changed
    const lastUpdate = contentRef.current?.lastUpdate;
    if (!lastUpdate || !isEqual(lastUpdate, currentState)) {
      contentRef.current.lastUpdate = currentState;
      onUpdate(id, currentState);
    }
  }, [
    id,
    position,
    scale,
    lineColor,
    headerText,
    headerStyle,
    faceColors,
    faceTexts,
    faceTextStyles,
    onUpdate,
  ]);
  // Add debounced update to prevent excessive database calls
  const debouncedUpdateTimeoutRef = useRef(null);
  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    // Skip updates during initial render to prevent thousands of simultaneous calls
    // when camera moves between cells and loads many objects at once
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    // Clear any pending update
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
    }

    // Debounce property updates to prevent excessive calls
    debouncedUpdateTimeoutRef.current = setTimeout(() => {
      updateDatabase();
    }, 100); // 100ms debounce delay

    // Cleanup timeout on unmount
    return () => {
      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
      }
    };
  }, [updateDatabase]);

  const handleTransformToggle = () => {
    // When enabling transform mode, we should disable resize mode
    setShowTransform((prev) => {
      if (!prev) {
        setIsResizing(false);
      }
      return !prev;
    });
  };

  const handleHeaderToggle = () => {
    setShowHeader(!showHeader);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    setShowHeader(false);
  };

  const handleResizeToggle = () => {
    // When enabling resize mode, we should disable transform mode
    setIsResizing((prev) => {
      if (!prev) {
        setShowTransform(false);
      }
      return !prev;
    });
  };

  // Add effect to update database when resize operation changes the scale
  useEffect(() => {
    if (isScaleModified) {
      updateDatabase();
      setIsScaleModified(false);
    }
  }, [scale, isScaleModified, updateDatabase]);

  const handleDrag = (e) => {
    // Get new position from the transform controls event
    const newPos = e.target.object.position;

    // Save to database
    if (onUpdate) {
      onUpdate(id, {
        type: 'sphere',
        position: [newPos.x, newPos.y, newPos.z],
        scale,
        lineColor,
        headerText,
        headerStyle,
        faceColors,
        faceTexts,
        faceTextStyles,
      });
    }

    // Update UI immediately
    if (onMove) {
      onMove({
        x: newPos.x,
        y: newPos.y,
        z: newPos.z,
      });
    }
  };

  // Add handler for scale changes from TransformControls
  const handleScale = (e) => {
    // Get new scale from the transform controls event
    const newScale = [
      e.target.object.scale.x,
      e.target.object.scale.y,
      e.target.object.scale.z,
    ];

    // Update scale state
    setScale(newScale);
    setIsScaleModified(true);
  };

  // Split face click into two separate handlers
  const handleFaceClick = (faceIndex, e) => {
    e.stopPropagation();
    if (!selected) {
      handleBackgroundClick(e); // Select dodecahedron first
      return;
    }
    setHighlightedFaces(new Set([faceIndex]));
    setActiveFace(faceIndex);
    setShowFaceUI(true);
    setShowObjectUI(false); // Hide ObjectUI when face is clicked
    setShowFaceTextStyleMenu(false); // Close text style menu when clicking a different face
    setActiveFaceText(null); // Clear active face text

    // Don't select the indicator when clicking on the face
    // Remove any code that would set selectedIndicator here
  };

  // Add a handler to receive connection state from parent
  const handleIndicatorClick = (faceIndex, e) => {
    if (e) e.stopPropagation();
    const { center } = getFaceInfo(faceIndex);

    // Toggle indicator selection
    if (selectedIndicator === faceIndex) {
      // Deselect if already selected
      setSelectedIndicator(null);
    } else {
      // Select this indicator
      setSelectedIndicator(faceIndex);
    }

    // Create the indicator data with consistent ID format
    const stringId = String(id);
    const indicator = {
      type: 'sphere',
      face: faceIndex,
      cube: {
        id: stringId,
        position: position,
        scale: scale,
        userData: {
          objectId: stringId,
        },
      },
      position: center,
      faceCenter: center,
      id: stringId,
      objectId: stringId,
    };

    // Notify parent component
    onIndicatorSelected?.();
    onFaceIndicatorClick?.(indicator);
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
    onClick(); // Select the dodecahedron first
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
      updateDatabase();
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
      updateDatabase();
    }
  };

  // Calculate positions relative to sphere's scale
  const getUIPosition = () => {
    const sphereHeight = 10 * scale[1];
    const topEdgeOffset = sphereHeight / 2;
    return [position[0], position[1] + topEdgeOffset + 20, position[2]];
  };

  const getHeaderPosition = () => {
    // A dodecahedron has a radius of approximately 5 units based on the geometry
    const dodecahedronRadius = 5; // Use the actual 5-unit base radius
    // Position exactly 10 units above the top edge of the dodecahedron
    return [
      position[0],
      position[1] + dodecahedronRadius + 5, // Exactly 10 units above the top
      position[2],
    ];
  };

  const getFaceUIPosition = (faceIndex, offset = 3) => {
    const { center, normal } = getFaceInfo(faceIndex);

    // Use the normal vector to offset the UI position from the face center
    return [
      center[0] + normal[0] + offset,
      center[1] + normal[1] + offset,
      center[2] + normal[2] + offset,
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

    // Create a normalized normal vector
    const normalVector = new THREE.Vector3(...normal).normalize();

    // Create look-at matrix
    const lookAtMatrix = new THREE.Matrix4();

    // The "up" direction affects text orientation
    // Use a consistent up vector (world Y) as a starting point
    const upVector = new THREE.Vector3(0, 1, 0);

    // Calculate a right vector that's perpendicular to normal and up
    const rightVector = new THREE.Vector3()
      .crossVectors(upVector, normalVector)
      .normalize();

    // If right vector is too small (normal is parallel to up), use another axis
    if (rightVector.length() < 0.1) {
      upVector.set(0, 0, 1); // Use Z as up instead
      rightVector.crossVectors(upVector, normalVector).normalize();
    }

    // Calculate a corrected up vector perpendicular to both normal and right
    const correctedUp = new THREE.Vector3()
      .crossVectors(normalVector, rightVector)
      .normalize();

    // Set up the lookAt matrix
    lookAtMatrix.makeBasis(rightVector, correctedUp, normalVector);

    // Create Euler rotation from matrix
    const rotation = new THREE.Euler();
    rotation.setFromRotationMatrix(lookAtMatrix);

    return rotation;
  };

  // Update shouldShowFaceIndicator logic to keep indicators visible when connected
  const shouldShowFaceIndicator = (faceIndex) => {
    // Always show indicators that are part of connections
    if (isIndicatorConnected(faceIndex)) return true;

    // Show when any indicator is selected globally
    if (selectedIndicators?.length > 0) return true;

    // Show all indicators when in indicators mode
    if (indicatorMode === 'indicators') return true;

    if (showAllIndicators || globalIndicatorSelected) return true;
    if (connectedFaces.has(faceIndex)) return true;
    if (selectedIndicator === faceIndex) return true;

    return false;
  };

  // Update the position calculations to account for object's position and scale
  const getFaceTextInputPosition = (faceIndex) => {
    const { center, normal } = getFaceInfo(faceIndex);
    const offset = 6; // Offset distance from face
    return [
      center[0] + normal[0] * offset,
      center[1] + normal[1] * offset,
      center[2] + normal[2] * offset,
    ];
  };

  const getHeaderInputPosition = () => {
    // Use absolute positioning with fixed distance from top of dodecahedron
    // This matches the approach used in the Cube component
    return [0, 5 + 5, 0]; // 5 (radius) + 5 (fixed offset) units up
  };

  return (
    <>
      {/* Remove the outer position group and apply position directly to content group */}
      <group ref={contentRef} position={position} scale={scale}>
        {/* Add invisible helper mesh for better click detection */}
        <mesh onClick={handleBackgroundClick} visible={false}>
          <sphereGeometry args={[6, 32, 32]} />{' '}
          {/* Slightly larger than dodecahedron */}
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Original background mesh */}
        <mesh
          onClick={handleBackgroundClick}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <dodecahedronGeometry args={[5.1]} />{' '}
          {/* Slightly larger than face geometries */}
          <meshBasicMaterial visible={false} transparent={false} opacity={1} />
        </mesh>

        {/* Modified face rendering to handle colors correctly */}
        {geometry.map((faceGeometry, idx) => (
          <mesh
            key={`face-${idx}`}
            geometry={faceGeometry}
            onClick={(e) => {
              e.stopPropagation();
              if (!selected) {
                handleBackgroundClick(e);
              } else {
                handleFaceClick(idx, e);
              }
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <meshBasicMaterial
              color={
                faceColors[idx] || // Custom color if set
                (selected && highlightedFaces.has(idx) ? '#0066ff' : 'black') // Only show highlight when selected
              }
              transparent
              opacity={
                selected
                  ? highlightedFaces.has(idx)
                    ? 0.3
                    : 0.1
                  : faceColors[idx]
                  ? 1.0
                  : 0 // Hide faces without custom colors when not selected
              }
              side={THREE.FrontSide} // Changed from DoubleSide to FrontSide
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        ))}

        {/* Wireframe lines */}
        {points.map((linePoints, idx) => (
          <Line key={idx} points={linePoints} color={lineColor} lineWidth={1} />
        ))}

        {/* Add face texts - modified for consistent scaling and rotation regardless of dodecahedron size */}
        {Object.entries(faceTexts).map(([faceIndex, text]) => {
          if (!text) return null;
          const faceIdx = Number(faceIndex);
          const { position, normal } = getFaceTextPosition(faceIdx);
          const textStyle = faceTextStyles[faceIndex] || {
            fontSize: 0.5,
            color: 'black',
            underline: false,
          };

          const inverseScale = scale.map((s) => 1 / Math.max(0.0001, s));
          const faceRotation = getFaceRotation(faceIdx);

          // Adjust position slightly outward along the normal to prevent z-fighting
          const adjustedPosition = [
            position[0] + normal[0] * 0.01,
            position[1] + normal[1] * 0.01,
            position[2] + normal[2] * 0.01,
          ];

          return (
            <group
              key={`face-text-${faceIndex}`}
              position={adjustedPosition}
              rotation={faceRotation}
              scale={inverseScale}
            >
              <TextSprite
                text={text}
                position={[0, 0, 0]}
                style={{
                  ...textStyle,
                  fixedSize: true,
                  isFaceText: true,
                  renderOrder: 2,
                  depthTest: true,
                  depthWrite: false,
                }}
                onClick={(e) => handleFaceTextClick(faceIdx, e)}
                billboard={false}
                side={THREE.FrontSide}
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
        {geometry.map((_, idx) => {
          const { center } = getFaceInfo(idx);
          const rotation = getFaceRotation(idx);
          const isConnected = isIndicatorConnected(idx);

          // Only show indicator as selected (blue) if it was directly clicked
          // and is not connected
          const isSelected = selectedIndicator === idx && !isConnected;

          return shouldShowFaceIndicator(idx) ? (
            <FaceIndicator
              key={`indicator-${idx}`}
              position={center}
              rotation={rotation}
              onClick={(e) => handleIndicatorClick(idx, e)}
              isActive={isSelected}
              isConnected={isConnected}
            />
          ) : null;
        })}
      </group>

      {/* Move UI elements outside main group but keep them following contentRef */}
      {selected && showObjectUI && !showHeader && (
        <ObjectUI
          position={[getUIPosition()]}
          onTransformToggle={handleTransformToggle}
          onHeaderToggle={handleHeaderToggle}
          onResizeToggle={handleResizeToggle}
          onLineColorChange={handleLineColorChange}
          onDelete={() => onDelete?.(id)} // Pass the delete handler with this object's ID
          showTransform={showTransform}
          showHeader={showHeader}
          followTarget={contentRef}
        />
      )}

      {selected && showFaceUI && activeFace !== null && (
        <group ref={faceUIGroupRef} position={position} scale={scale}>
          <FaceUI
            position={getFaceUIPosition(activeFace)}
            onColorChange={(color) => {
              setFaceColors((prev) => ({
                ...prev,
                [activeFace]: color,
              }));
            }}
            face={activeFace}
            onTextClick={handleFaceTextButtonClick}
            followTarget={contentRef}
          />
        </group>
      )}

      {selected && showHeader && (
        <group position={position}>
          <group scale={scale}>
            <group scale={scale.map((s) => 1 / Math.max(s, 0.0001))}>
              <HeaderInput
                position={getHeaderInputPosition()}
                onTextSubmit={handleHeaderSubmit}
                followTarget={null} // Remove followTarget as it's handled by the parent group positioning
              />
            </group>
          </group>
        </group>
      )}

      {headerText && (
        <TextSprite
          text={headerText}
          position={getHeaderPosition()}
          // If followTarget is causing issues, we can modify how it's used
          followTarget={contentRef}
          onClick={handleHeaderClick}
          style={{
            ...headerStyle,
            isHeaderText: true,
            isDodecahedronHeader: true,
            fixedDistance: true, // Add this to ensure consistent distance if supported
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
        <DreiTransformControls
          object={contentRef.current}
          onObjectChange={handleScale}
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
          mode="scale"
          space="local"
          size={1}
          matrixAutoUpdate={false} // Add this to prevent matrix recursion
        />
      )}

      {selected && showFaceTextInput && activeFace !== null && (
        <group position={position} scale={scale}>
          <FaceTextInput
            position={getFaceTextInputPosition(activeFace)}
            onTextSubmit={handleFaceTextSubmit}
          />
        </group>
      )}

      {/* Add TextStyleUI for face text */}
      {showFaceTextStyleMenu && activeFaceText !== null && (
        <TextStyleUI
          position={(() => {
            const { position } = getFaceTextPosition(activeFaceText);
            // Apply offset in world space, not in scaled space
            return [position[0], position[1] + 2 * (1 / scale[1]), position[2]];
          })()}
          followTarget={contentRef}
          onStyleChange={handleFaceTextStyleChange}
          uiType="faceText" // Add this prop to show limited options
        />
      )}

      {/* Update TransformControls to use contentRef */}
      {selected && showTransform && contentRef.current && (
        <DreiTransformControls
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

export default Sphere;
