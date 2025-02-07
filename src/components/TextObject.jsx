import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI'; // Remove TextStyleUI import

const TextObject = ({ position, selected, onClick }) => {
  const groupRef = useRef();
  const uiMenuRef = useRef(null); // New ref for UI menu
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [textStyle, setTextStyle] = useState({});
  const [menuDistance, setMenuDistance] = useState(50);

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
    autoWrap: 'wrap',
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
    wordWrap: 'break-word', // <-- New: ensure long words wrap in div
    overflowWrap: 'break-word', // <-- New: additional support for wrapping
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
      const distance = camera.position.distanceTo(groupRef.current.position);
      setMenuDistance(distance * 3); // Increased from 0.06 to 0.15
    }
  });

  return (
    <>
      <group ref={groupRef} position={position}>
        {/* Background plane - only handles selection */}

        {/* Text area - handles both editing and selection */}
        <Html transform position={[0, 0, 0.1]} center>
          <div style={getContainerStyle()}>
            {isEditing && (
              <div
                ref={uiMenuRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  transform: `translateY(-100%) scale(${menuDistance / 50})`,
                  transformOrigin: 'bottom center',
                  marginBottom: '10px',
                  zIndex: 2,
                  transition: 'transform 0.1s ease-out', // <-- New: smooth scaling transition
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
