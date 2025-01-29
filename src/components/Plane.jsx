import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI'; // Add this import

const Plane = ({ position = [0, 0, 0], selected, onClick }) => {
  const groupRef = useRef();
  const { camera } = useThree();
  const size = 5;
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

  // Add deselection effect
  useEffect(() => {
    if (!selected) {
      setShowTextStyleUI(false);
      setShowUI(false);
      setShowTextInput(false);
    }
  }, [selected]);

  // Create a utility function to close all UIs
  const closeAllUIs = () => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    closeAllUIs(); // Close all UIs first
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

  return (
    <group ref={groupRef} position={position}>
      <mesh onClick={handleClick}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          color={color || (selected ? '#99ccff' : 'white')}
          transparent
          opacity={color ? 1 : selected ? 0.5 : 0.1}
          depthWrite={!!color}
        />
      </mesh>
      <Line points={points} color={selected ? 'blue' : 'white'} lineWidth={1} />

      {selected && showUI && (
        <FaceUI
          position={[0, 6, 0]}
          onColorChange={handleColorChange}
          face="front"
          onTextClick={() => handleTextClick()} // Pass the function directly
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
        />
      )}

      {showTextStyleUI && (
        <TextStyleUI
          position={[0, 6, 0]}
          onStyleChange={handleTextStyleChange}
          onClose={() => closeAllUIs()} // Use closeAllUIs here
        />
      )}
    </group>
  );
};

export default Plane;
