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

const Sphere = ({ position, selected, onClick, onMove }) => {
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
    }
  }, [selected]);

  // Store orbitControls when mounted
  useEffect(() => {
    if (contentRef.current && window.orbitControls) {
      contentRef.current.orbitControls = window.orbitControls;
    }
  }, []);

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

  const handleFaceClick = (faceIndex, e) => {
    if (!selected) return; // Ignore clicks if not selected
    e.stopPropagation();
    setHighlightedFaces(new Set([faceIndex]));
    setActiveFace(faceIndex);
    setShowFaceUI(true);
    setShowObjectUI(false); // Hide ObjectUI when face is clicked
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
    onClick();
    setHighlightedFaces(new Set());
    setActiveFace(null);
    setShowFaceUI(false);
    setShowObjectUI(true);
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

    // Get all vertices of the active face
    const positions = geometry[activeFace].attributes.position.array;

    // Calculate center of the face using the first five vertices
    let centerX = 0,
      centerY = 80,
      centerZ = -200;
    let count = 0;

    for (let i = 3; i < 15; i += 3) {
      // Start at 3 to skip center vertex
      centerX += positions[i];
      centerY += positions[i + 1];
      centerZ += positions[i + 2];
      count++;
    }

    centerX /= count;
    centerY /= count;
    centerZ /= count;

    // Calculate normal vector for the face
    const p1 = new THREE.Vector3(positions[3], positions[4], positions[5]);
    const p2 = new THREE.Vector3(positions[6], positions[7], positions[8]);
    const p3 = new THREE.Vector3(positions[9], positions[10], positions[11]);

    const v1 = p2.clone().sub(p1);
    const v2 = p3.clone().sub(p1);
    const normal = v1.cross(v2).normalize();

    const offset = 2;

    return [
      position[0] + (centerX + normal.x * offset) * scale[0],
      position[1] + (centerY + normal.y * offset) * scale[1],
      position[2] + (centerZ + normal.z * offset) * scale[2],
    ];
  };

  return (
    <>
      <group position={position}>
        <group ref={contentRef} scale={scale}>
          <mesh onClick={handleBackgroundClick}>
            <dodecahedronGeometry args={[5]} />
            <meshBasicMaterial visible={false} />
          </mesh>

          {/* Only render clickable faces when selected */}
          {selected &&
            geometry.map((faceGeometry, idx) => (
              <mesh
                key={`face-${idx}`}
                geometry={faceGeometry}
                onClick={(e) => handleFaceClick(idx, e)}
              >
                <meshBasicMaterial
                  color={highlightedFaces.has(idx) ? '#0066ff' : '#ffffff'}
                  transparent
                  opacity={highlightedFaces.has(idx) ? 0.3 : 0.1}
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
            position={getFaceUIPosition()}
            onColorChange={(color) => {
              // Handle face color change
            }}
            face={activeFace}
            onTextClick={() => {
              // Handle face text click
            }}
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
