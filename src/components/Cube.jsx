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
import { useThree } from '@react-three/fiber'; // Import useThree

const FaceIndicator = ({ position, rotation, onClick }) => {
  const { scene, camera, gl } = useThree(); // Add gl to destructuring
  const isDragging = useRef(false);
  const [arrowEnd, setArrowEnd] = useState(null);
  const meshRef = useRef();
  const groupRef = useRef();
  const startPosRef = useRef(null);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    isDragging.current = true;
    if (scene.orbitControls) scene.orbitControls.enabled = false;

    // Get the indicator's actual world position
    const startPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(startPos);

    // Store the position for drawing the arrow
    startPosRef.current = startPos.clone();
    setArrowEnd({
      start: startPos.clone(),
      end: startPos.clone(),
    });

    const handlePointerMove = (event) => {
      if (!startPosRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Create end position
      const endPos = new THREE.Vector3(x, y, 0.5);
      endPos.unproject(camera);
      endPos.sub(camera.position).normalize();

      const distance = camera.position.distanceTo(startPosRef.current);
      endPos.multiplyScalar(distance).add(camera.position);

      // Validate end position
      if (isNaN(endPos.x) || isNaN(endPos.y) || isNaN(endPos.z)) {
        console.warn('Invalid end position:', endPos);
        return;
      }

      setArrowEnd({
        start: startPosRef.current.clone(),
        end: endPos,
      });
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      setArrowEnd(null);
      startPosRef.current = null;
      if (scene.orbitControls) scene.orbitControls.enabled = true;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          if (!isDragging.current) {
            onClick(e);
          }
        }}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="blue" opacity={0.8} transparent />
      </mesh>
      {arrowEnd && arrowEnd.start && arrowEnd.end && (
        <group>
          <Line
            points={[arrowEnd.start.toArray(), arrowEnd.end.toArray()]}
            color="blue"
            lineWidth={2}
            segments // Use segments prop for better performance
          />
          <mesh position={arrowEnd.end.toArray()}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>
      )}
    </group>
  );
};

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
    depthWrite: false,
  });

  // Calculate header position relative to cube's top edge
  const getHeaderPosition = () => {
    const cubeHeight = 10 * scale[1]; // cube height * y-scale
    const topEdgeOffset = cubeHeight / 2; // half height since cube is centered
    return [
      position[0], // x
      position[1] + topEdgeOffset + 15, // y (15 units above top edge)
      position[2], // z
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
  const getHeaderInputPosition = () => {
    const cubeHeight = 10 * scale[1];
    const topEdgeOffset = cubeHeight / 2;
    return [
      position[0],
      position[1] + topEdgeOffset + 10, // 10 units above top edge
      position[2],
    ];
  };

  const getFaceIndicatorProps = (faceName) => {
    const props = {
      front: { position: [0, 0, 5], rotation: [0, 0, 0] },
      back: { position: [0, 0, -5], rotation: [0, Math.PI, 0] },
      top: { position: [0, 5, 0], rotation: [-Math.PI / 2, 0, 0] },
      bottom: { position: [0, -5, 0], rotation: [Math.PI / 2, 0, 0] },
      right: { position: [5, 0, 0], rotation: [0, Math.PI / 2, 0] },
      left: { position: [-5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    }[faceName];

    return props || { position: [0, 0, 0], rotation: [0, 0, 0] };
  };

  const faces = [
    { name: 'front', normal: [0, 0, 1] },
    { name: 'back', normal: [0, 0, -1] },
    { name: 'top', normal: [0, 1, 0] },
    { name: 'bottom', normal: [0, -1, 0] },
    { name: 'right', normal: [1, 0, 0] },
    { name: 'left', normal: [-1, 0, 0] },
  ];

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
                {faces.map(({ name, normal }) => {
                  const { position: facePos, rotation } =
                    getFaceIndicatorProps(name);
                  return (
                    <mesh
                      key={name}
                      position={[facePos[0], facePos[1], facePos[2]]}
                      rotation={rotation}
                      onClick={(e) => handleFaceClick(e, name)}
                      renderOrder={2} // Increased render order
                    >
                      <boxGeometry args={[10.4, 10.4, 0.2]} />{' '}
                      {/* Changed to box with small depth */}
                      <meshBasicMaterial {...getFaceMaterial(name)} />
                      {selectedFace === name && (
                        <>
                          <FaceUI position={[0, 6, 0]} normal={normal} />
                          <FaceIndicator
                            position={[0, 0, 0.2]} // Moved slightly outward
                            rotation={[0, 0, 0]}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Indicator clicked on ${name} face`);
                            }}
                          />
                        </>
                      )}
                    </mesh>
                  );
                })}
              </>
            )}
            <Line
              points={points}
              color={selected ? 'blue' : 'white'}
              lineWidth={1}
              segments={true}
            />
          </group>
          {/* Move ObjectUI outside scaled group and update position */}
          {selected && !showHeader && (
            <ObjectUI
              position={getUIPosition()}
              onTransformToggle={handleTransformToggle}
              onHeaderToggle={handleHeaderToggle}
              onResizeToggle={handleResizeToggle} // Passed handleResizeToggle to ObjectUI
              showTransform={showTransform}
              showHeader={showHeader}
              followTarget={contentRef}
            />
          )}
          {/* Update header elements positions */}
          {selected && showHeader && (
            <HeaderInput
              position={getHeaderInputPosition()}
              onTextSubmit={handleHeaderSubmit}
              followTarget={contentRef}
            />
          )}
          {headerText && (
            <TextSprite
              text={headerText}
              position={getHeaderPosition()}
              followTarget={contentRef}
            />
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
