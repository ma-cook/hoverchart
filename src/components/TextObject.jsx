import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import {
  Html,
  TransformControls as DreiTransformControls,
} from '@react-three/drei'; // <-- Added TransformControls import
import { useFrame } from '@react-three/fiber';

import TextObjectUI from './TextObjectUI';

const TextObject = ({ position, selected, onClick }) => {
  const groupRef = useRef();
  const uiMenuRef = useRef(null); // New ref for UI menu
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [textStyle, setTextStyle] = useState({});
  const [showTransform, setShowTransform] = useState(false); // <-- New state for transform mode
  const [showResizeArrow, setShowResizeArrow] = useState(false);
  const textAreaRef = useRef();
  const displayRef = useRef(); // <-- New ref for non-editing display
  const [bulletPointMode, setBulletPointMode] = useState(false); // New state for bullet point mode

  const [scale, setScale] = useState([15, 10, 1]); // Default size for the text plane
  const conversionFactor = 30; // Increase conversion factor for larger HTML size

  // New refs for tracking drag start
  const startXRef = useRef(0);
  const startWidthRef = useRef(scale[0]);

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
    }
  });

  // Add effect to close transform controls on deselect
  useEffect(() => {
    if (!selected) {
      setShowTransform(false);
    }
  }, [selected]);

  // New pointer event handlers for resizing width
  const handlePointerDown = (e) => {
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = scale[0];
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    const dx = e.clientX - startXRef.current;
    // Adjust the scaling factor to make resizing more responsive
    const scalingFactor = 0.1; // Make this smaller for finer control
    const newWidth = startWidthRef.current + dx * scalingFactor;

    // Set minimum and maximum width constraints
    const minWidth = 5;
    const maxWidth = 200;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setScale([newWidth, scale[1], scale[2]]);
    }
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  // Add new handler for bullet points
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && bulletPointMode) {
      e.preventDefault();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const textAfterCursor = text.slice(cursorPosition);
      const newText = textBeforeCursor + '\n• ' + textAfterCursor;
      setText(newText);

      // Set cursor position after bullet point
      setTimeout(() => {
        e.target.selectionStart = cursorPosition + 3;
        e.target.selectionEnd = cursorPosition + 3;
      }, 0);
    }
  };

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        userData={{ type: 'textObject' }}
      >
        {/* Background plane - only handles selection */}

        {/* Text area - handles both editing and selection */}
        <Html transform position={[0, 0, 0.1]} center>
          <div style={getContainerStyle()} className="text-object-container">
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                value={text}
                onChange={handleTextChange}
                onBlur={handleBlur} // Updated onBlur handler
                style={getTextAreaStyle()}
                autoFocus
                onKeyDown={handleKeyDown} // New onKeyDown handler
                placeholder={bulletPointMode ? '• ' : 'Click to edit text...'} // Updated placeholder
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
            {/* Render the integrated resize arrow only if toggled on */}
            {showResizeArrow && (
              <div
                className="resize-arrow"
                onPointerDown={handlePointerDown}
                style={{ cursor: 'ew-resize' }}
              >
                →
              </div>
            )}
          </div>
        </Html>
      </group>

      {/* Add the new UI outside the main group */}
      {isEditing && (
        <TextObjectUI
          onStyleChange={(newStyle) => {
            if ('bulletPointMode' in newStyle) {
              setBulletPointMode(newStyle.bulletPointMode);
              if (newStyle.bulletPointMode && !text.startsWith('• ')) {
                setText('• ' + text);
              }
            }
            setTextStyle((prev) => ({ ...prev, ...newStyle }));
          }}
          followTarget={groupRef}
          menuRef={uiMenuRef} // pass the ref to keep the menu open on focus
          onTransformToggle={() => setShowTransform(true)} // new transform toggle callback
          onResizeToggle={() => setShowResizeArrow((prev) => !prev)}
        />
      )}

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
