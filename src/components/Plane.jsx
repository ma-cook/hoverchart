import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI'; // Add this import
import { TransformControls } from '@react-three/drei'; // Add this import
import ResizeArrows from './ResizeArrows'; // Fix import statement to use default import

const Plane = ({ position = [0, 0, 0], selected, onClick }) => {
  const groupRef = useRef();
  const meshRef = useRef(); // Add meshRef
  const { camera } = useThree();
  const size = 5;
  const width = 10,
    height = 10; // dimensions used in planeGeometry
  const [color, setColor] = useState(null);
  const [showUI, setShowUI] = useState(false);
  const [text, setText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textStyle, setTextStyle] = useState({
    fontSize: 0.5,
    color: 'white',
    underline: false,
  });
  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [scale, setScale] = useState([1, 1, 1]);

  // Wrap closeAllUIs in useCallback and declare it before it’s used
  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
  }, []); // No dependencies as setters are stable

  const points = [
    new Vector3(-size, -size, 0),
    new Vector3(size, -size, 0),
    new Vector3(size, size, 0),
    new Vector3(-size, size, 0),
    new Vector3(-size, -size, 0),
  ];

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  // Update deselection effect to include TextStyleUI
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
    }
  }, [selected, closeAllUIs]); // Added closeAllUIs as dependency

  // Close TextStyleUI when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Check if click is outside the TextStyleUI and the text
      const isTextStyleUIClick = e.target.closest('.text-style-ui');
      const isTextClick = e.target.closest('.text-sprite');

      if (!isTextStyleUIClick && !isTextClick) {
        setShowTextStyleUI(false);
      }
    };

    if (showTextStyleUI) {
      window.addEventListener('click', handleGlobalClick);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showTextStyleUI]);

  const handleColorChange = (newColor) => {
    setColor(newColor);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    closeAllUIs(); // This will close TextStyleUI as well
    setShowUI(true); // Then show the main UI
  };

  const handleTextClick = () => {
    closeAllUIs(); // Close all UIs first
    setShowTextInput(true);
  };

  const handleTextSubmit = (newText) => {
    setText(newText);
    closeAllUIs();
  };

  const handleTextStyleChange = (newStyle) => {
    setTextStyle((prev) => ({ ...prev, ...newStyle }));
  };

  const handleTextSpriteClick = (e) => {
    e.stopPropagation();
    closeAllUIs(); // Close all UIs first
    setShowTextStyleUI(true);
  };

  const handleTransformToggle = () => {
    setShowTransform((prev) => !prev);
    setShowUI(false); // Hide UI when transform is active
  };

  const handleResizeToggle = () => {
    setIsResizing((prev) => {
      if (!prev) {
        setShowTransform(false); // Disable transform when enabling resize
      }
      return !prev;
    });
    setShowUI(false);
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1 }[axis]; // Only allow x and y resize for plane
    if (axisIndex !== undefined) {
      setScale((prevScale) => {
        const newScale = [...prevScale];
        newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
        return newScale;
      });
    }
  };

  // Compute margin offset so arrows appear outside the plane edges
  const arrowMargin = 1; // extra unit margin
  const computedArrowOffset = {
    x: (width / 2) * scale[0] + arrowMargin,
    y: (height / 2) * scale[1] + arrowMargin,
    z: 0,
  };

  const handleDrag = (e) => {
    // Update position from transform controls
    if (groupRef.current) {
      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);
    }
  };

  return (
    <>
      <group ref={groupRef} position={position}>
        <group scale={scale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={color || (selected ? '#99ccff' : 'white')}
              transparent
              opacity={color ? 1 : selected ? 0.1 : 0}
              depthWrite={!!color}
            />
          </mesh>
          <Line
            points={points}
            color={selected ? 'blue' : 'white'}
            lineWidth={2}
          />
        </group>

        {selected && showUI && (
          <FaceUI
            position={[0, 10, 0]}
            onColorChange={handleColorChange}
            face="front"
            onTextClick={handleTextClick}
            isPlane={true} // Add this prop
            onTransformToggle={handleTransformToggle} // Add this prop
            onResizeToggle={handleResizeToggle} // Add this prop
          />
        )}

        {showTextInput && (
          <FaceTextInput position={[0, 6, 0]} onTextSubmit={handleTextSubmit} />
        )}

        {text && (
          <TextSprite
            text={text}
            position={[0, 0, 0.1]}
            style={textStyle}
            fixedSize={true}
            onClick={handleTextSpriteClick}
            billboard={false}
          />
        )}

        {showTextStyleUI && (
          <TextStyleUI
            position={[0, 6, 0]}
            onStyleChange={handleTextStyleChange}
            onClose={() => closeAllUIs()} // Use closeAllUIs here
          />
        )}

        {/* Add ResizeArrows when resizing */}
        {selected && isResizing && meshRef.current && (
          <ResizeArrows
            onResize={handleResize}
            object={meshRef.current}
            planeMode={true} // Optional: add this prop to ResizeArrows to only show x/y arrows
            arrowOffset={computedArrowOffset} // Pass computed offset
          />
        )}
      </group>
      {/* Add TransformControls outside the group */}
      {selected && showTransform && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
        />
      )}
    </>
  );
};

export default Plane;
