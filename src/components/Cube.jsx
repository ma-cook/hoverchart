import { useRef, useState } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import TransformControls from './TransformControls';
import HeaderInput from './HeaderInput';
import TextSprite from './TextSprite';

const Cube = ({ position, selected, onClick, onMove }) => {
  const [selectedFace, setSelectedFace] = useState(null);
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const contentRef = useRef();

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
    <group>
      <group ref={contentRef} position={position}>
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
              position={[-5.01, 0, 0]}
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

        {headerText && <TextSprite text={headerText} position={[0, 12, 0]} />}

        {/* Move ObjectUI inside content group */}
        {selected && (
          <ObjectUI
            position={[0, 15, 0]}
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            showTransform={showTransform}
            showHeader={showHeader}
          />
        )}
      </group>

      {selected && showTransform && contentRef.current && (
        <TransformControls object={contentRef.current} onDrag={handleDrag} />
      )}
    </group>
  );
};

Cube.displayName = 'Cube'; // <-- Add this line
export default Cube;
