import React, { useRef, useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import TransformControls from './TransformControls';

const Cube = ({ position, selected, onClick, onMove }) => {
  const groupRef = useRef();
  const [selectedFace, setSelectedFace] = useState(null);
  const [showTransform, setShowTransform] = useState(false);

  // Reset selectedFace when cube is deselected
  useEffect(() => {
    if (!selected) {
      setSelectedFace(null);
    }
  }, [selected]);

  const size = 5; // Half-size since points are from center

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
    <group position={position}>
      <group ref={groupRef}>
        {/* Invisible box for cube selection */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <boxGeometry args={[10, 10, 10]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Only show faces when cube is selected */}
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
      </group>

      {selected && showTransform && (
        <TransformControls
          object={groupRef.current}
          onDrag={(pos) => {
            if (onMove) {
              onMove({
                x: pos.x,
                y: pos.y,
                z: pos.z,
              });
            }
          }}
        />
      )}

      {selected && (
        <ObjectUI
          onTransformToggle={handleTransformToggle}
          showTransform={showTransform}
        />
      )}
    </group>
  );
};

export default Cube;
