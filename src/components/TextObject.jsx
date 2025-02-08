import { useRef, useState, useLayoutEffect } from 'react';
import {
  Html,
  TransformControls as DreiTransformControls,
} from '@react-three/drei'; // <-- Added TransformControls import
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI';

const TextObject = ({ position, selected, onClick }) => {
  const groupRef = useRef();
  const uiMenuRef = useRef(null); // New ref for UI menu
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [textStyle, setTextStyle] = useState({});
  const [menuDistance, setMenuDistance] = useState(50);
  const [showTransform, setShowTransform] = useState(false); // <-- New state for transform mode
  const textAreaRef = useRef();
  const displayRef = useRef(); // <-- New ref for non-editing display

  const [scale] = useState([15, 10, 1]); // Default size for the text plane
  const conversionFactor = 30; // Increase conversion factor for larger HTML size

  // Adjust the height of the textarea based on its content
  const adjustHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    adjustHeight();
  };

  // Replace the existing useLayoutEffect:
  useLayoutEffect(() => {
    if (isEditing) {
      requestAnimationFrame(adjustHeight);
    } else {
      adjustDisplayHeight();
    }
  }, [text, isEditing]);

  // New effect to recalculate height when font size changes:
  useLayoutEffect(() => {
    if (isEditing) {
      requestAnimationFrame(adjustHeight);
    } else {
      adjustDisplayHeight();
    }
  }, [textStyle.fontSize]);

  const handleTextClick = (e) => {
    e.stopPropagation();
    onClick();
    setIsEditing(true);
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
    height: 'auto', // <-- Changed from '100%'
    background: 'rgba(0,0,0,0.5)',
    color: textStyle.color || 'white', // <-- Use picked color from state
    border: 'none',
    padding: '8px',
    margin: '0',
    resize: 'none',
    fontSize: textStyle.fontSize ? `${textStyle.fontSize}px` : '32px',
    fontFamily: 'Arial',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word', // ensures long words wrap
    overflowWrap: 'break-word', // additional support for wrapping
    boxSizing: 'border-box',
    outline: selected ? '1px solid #99ccff' : 'none',
    overflow: 'hidden', // Keep only this overflow property
  });

  const getContainerStyle = () => ({
    width: `${scale[0] * 1.3 * conversionFactor}px`, // Adjusted multiplier
    height: `${scale[1] * 1.3 * conversionFactor}px`, // Adjusted multiplier
    position: 'relative',
  });

  // New: Adjust the display div height when not editing
  const adjustDisplayHeight = () => {
    if (displayRef.current) {
      displayRef.current.style.height = 'auto';
      displayRef.current.style.height = `${displayRef.current.scrollHeight}px`;
    }
  };

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
                  left: '50%', // changed from 0 to center horizontally
                  transform: `translate(-50%, -140%) scale(${Math.max(
                    menuDistance / 50,
                    1
                  )})`, // changed translateY from -100% to -110%
                  display: 'flex',
                  justifyContent: 'center', // center content horizontally
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  zIndex: 2,
                  transition: 'transform 0.1s ease-out',
                  // ...other unchanged styles...
                }}
              >
                <TextStyleUIContent
                  uiType="textObject" // indicate text object usage for proper scaling
                  onStyleChange={(newStyle) =>
                    setTextStyle((prev) => ({ ...prev, ...newStyle }))
                  }
                />
                <button
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransform((prev) => !prev);
                  }}
                >
                  ✥
                </button>
              </div>
            )}
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                value={text}
                onChange={handleTextChange}
                onBlur={handleBlur} // Updated onBlur handler
                style={getTextAreaStyle()}
                autoFocus
                placeholder="Click to edit text..."
              />
            ) : (
              <div
                ref={displayRef} // <-- New: attach ref for auto resize
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
      {showTransform && groupRef.current && (
        <DreiTransformControls
          object={groupRef.current}
          mode="translate"
          onDragEnd={() => setShowTransform(false)}
        />
      )}
    </>
  );
};

export default TextObject;
