import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI'; // Add this import

const TextObject = ({ position, selected, onClick }) => {
  const groupRef = useRef();
  const uiMenuRef = useRef(null); // New ref for UI menu
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

  // Modified onBlur: do not close if focus moves to a child of the UI menu
  const handleBlur = (e) => {
    if (
      uiMenuRef.current &&
      e.relatedTarget &&
      uiMenuRef.current.contains(e.relatedTarget)
    ) {
      return;
    }
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
    fontSize: '32px',
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

  // Add useFrame hook to update rotation so that TextObject always faces the camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
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
            opacity={0}
          />
        </mesh>

        {/* Text area - handles both editing and selection */}
        <Html transform position={[0, 0, 0.1]} center>
          <div style={getContainerStyle()}>
            {isEditing && (
              <div
                ref={uiMenuRef} // Attach ref here
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
                onBlur={handleBlur} // Updated onBlur handler
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
