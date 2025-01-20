import { useRef, useState, useEffect } from 'react';
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

const Cube = ({ position, selected, onClick, onMove }) => {
  const [selectedFace, setSelectedFace] = useState(null);
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const contentRef = useRef();
  const nonScaledRef = useRef(); // New ref for non-scaled elements
  const [scale, setScale] = useState([1, 1, 1]); // Existing scale state
  const [isResizing, setIsResizing] = useState(false); // Existing isResizing state

  // Reset selectedFace and showTransform when the cube is deselected
  useEffect(() => {
    if (!selected) {
      setSelectedFace(null);
      setShowTransform(false); // Ensure TransformControls are hidden
    }
  }, [selected]);

  // Store orbitControls in the mesh's userData when mounted
  useEffect(() => {
    if (contentRef.current && window.orbitControls) {
      contentRef.current.orbitControls = window.orbitControls;
      nonScaledRef.current.orbitControls = window.orbitControls;
    }
  }, []);

  const handleFaceClick = (e, faceName) => {
    e.stopPropagation();
    setSelectedFace(selectedFace === faceName ? null : faceName);
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
    setShowTransform(!showTransform);
  };

  const handleHeaderToggle = () => {
    console.log('Header toggle clicked');
    setShowHeader(!showHeader);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    setShowHeader(false);
  };

  const handleResizeToggle = () => {
    setIsResizing(!isResizing);
    if (isResizing) {
      // Exiting resize mode
      console.log('Exited resize mode');
    } else {
      // Entering resize mode
      console.log('Entered resize mode');
    }
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1, z: 2 }[axis];
    setScale((prevScale) => {
      const newScale = [...prevScale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      return newScale;
    });
  };

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

  const faceMaterialProps = {
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthTest: false,
  };

  const getFaceMaterial = (faceName) => ({
    ...faceMaterialProps,
    color:
      selectedFace === faceName
        ? new THREE.Color('#99ccff')
        : new THREE.Color('#ffffff'),
    opacity: selectedFace === faceName ? 0.5 : 0.1,
  });

  return (
    <>
      <group>
        <group position={position}>
          <group ref={contentRef} scale={scale}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <boxGeometry args={[10, 10, 10]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            {selected && (
              <>
                {/* Front face */}
                <mesh
                  position={[0, 0, 5.01]}
                  onClick={(e) => handleFaceClick(e, 'front')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('front')} />
                  {selectedFace === 'front' && (
                    <FaceUI position={[0, 6, 0]} normal={[0, 0, 1]} />
                  )}
                </mesh>

                {/* Back face */}
                <mesh
                  position={[0, 0, -5.01]}
                  rotation={[0, Math.PI, 0]}
                  onClick={(e) => handleFaceClick(e, 'back')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('back')} />
                  {selectedFace === 'back' && (
                    <FaceUI position={[0, 6, 0]} normal={[0, 0, -1]} />
                  )}
                </mesh>

                {/* Top face */}
                <mesh
                  position={[0, 5.01, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  onClick={(e) => handleFaceClick(e, 'top')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('top')} />
                  {selectedFace === 'top' && (
                    <FaceUI position={[0, 0, -6]} normal={[0, 1, 0]} />
                  )}
                </mesh>

                {/* Bottom face */}
                <mesh
                  position={[0, -5.01, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  onClick={(e) => handleFaceClick(e, 'bottom')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('bottom')} />
                  {selectedFace === 'bottom' && (
                    <FaceUI position={[0, 0, -6]} normal={[0, -1, 0]} />
                  )}
                </mesh>

                {/* Right face */}
                <mesh
                  position={[5.01, 0, 0]}
                  rotation={[0, Math.PI / 2, 0]}
                  onClick={(e) => handleFaceClick(e, 'right')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('right')} />
                  {selectedFace === 'right' && (
                    <FaceUI position={[0, 6, 0]} normal={[1, 0, 0]} />
                  )}
                </mesh>

                {/* Left face */}
                <mesh
                  position={[-5.01, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                  onClick={(e) => handleFaceClick(e, 'left')}
                  renderOrder={1}
                >
                  <planeGeometry args={[10.2, 10.2]} />
                  <meshBasicMaterial {...getFaceMaterial('left')} />
                  {selectedFace === 'left' && (
                    <FaceUI position={[0, 6, 0]} normal={[-1, 0, 0]} />
                  )}
                </mesh>
              </>
            )}
            <Line
              points={points}
              color={selected ? 'blue' : 'black'}
              lineWidth={1}
              segments={true}
            />
            {selected && showHeader && (
              <HeaderInput
                position={[0, 12, 0]}
                onTextSubmit={handleHeaderSubmit}
              />
            )}
            {headerText && (
              <TextSprite text={headerText} position={[0, 12, 0]} />
            )}
            {/* Conditionally render ObjectUI only when not editing header */}
            {selected && !showHeader && (
              <ObjectUI
                position={[0, 10, 0]}
                onTransformToggle={handleTransformToggle}
                onHeaderToggle={handleHeaderToggle}
                onResizeToggle={handleResizeToggle} // Passed handleResizeToggle to ObjectUI
                showTransform={showTransform}
                showHeader={showHeader}
              />
            )}
          </group>
          {/* Pass contentRef.current to ResizeArrows */}
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
