import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { TextStyleUIContent } from './TextStyleUI'; // Add this import

const TextObject = ({ position, selected, onClick }) => {
  const groupRef = useRef();
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [textStyle, setTextStyle] = useState({});

  const [scale] = useState([15, 10, 1]); // Default size for the text plane
  const conversionFactor = 30; // Increase conversion factor for larger HTML size

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleTextClick = (e) => {
    e.stopPropagation();
    onClick();
    setIsEditing(true);
  };

  const handlePlaneClick = (e) => {
    e.stopPropagation();
    onClick();
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const getTextAreaStyle = () => ({
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    padding: '8px',
    margin: '0',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Arial',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    boxSizing: 'border-box',
    outline: selected ? '1px solid #99ccff' : 'none',
    ...textStyle,
  });

  const getContainerStyle = () => ({
    width: `${scale[0] * 1.3 * conversionFactor}px`, // Adjusted multiplier
    height: `${scale[1] * 1.3 * conversionFactor}px`, // Adjusted multiplier
    position: 'relative',
  });

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* Background plane - only handles selection */}
        <mesh onClick={handlePlaneClick}>
          <planeGeometry args={[scale[0] * 1, scale[1] * 1]} />{' '}
          {/* Match with container size */}
          <meshBasicMaterial
            color={selected ? '#99ccff' : '#ffffff'}
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* Text area - handles both editing and selection */}
        <Html transform position={[0, 0, 0.1]} center>
          <div style={getContainerStyle()}>
            {isEditing && (
              <div
                style={{
                  position: 'absolute',
                  top: '-60px',
                  left: 0,
                  right: 0,
                  zIndex: 2,
                }}
              >
                <TextStyleUIContent
                  onStyleChange={(newStyle) =>
                    setTextStyle((prev) => ({ ...prev, ...newStyle }))
                  }
                />
              </div>
            )}
            {isEditing ? (
              <textarea
                value={text}
                onChange={handleTextChange}
                onBlur={handleBlur}
                style={getTextAreaStyle()}
                autoFocus
                placeholder="Click to edit text..."
              />
            ) : (
              <div
                onClick={handleTextClick}
                style={{
                  ...getTextAreaStyle(),
                  userSelect: 'none',
                  cursor: 'text',
                }}
              >
                {text || 'Click to edit text...'}
              </div>
            )}
          </div>
        </Html>
      </group>
    </>
  );
};

export default TextObject;
