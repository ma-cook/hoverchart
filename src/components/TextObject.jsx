import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import {
  Html,
  TransformControls as DreiTransformControls,
} from '@react-three/drei'; // <-- Added TransformControls import
import { useFrame } from '@react-three/fiber';
import FaceIndicator from './FaceIndicator';
import TextObjectUI from './TextObjectUI';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';

const TextObject = ({
  position,
  selected,
  onClick,
  onIndicatorSelected,
  onFaceIndicatorClick,
  showAllIndicators,
  globalIndicatorSelected,
  connections,
  selectedIndicators, // Add this prop
  indicatorMode,
  onUpdate, // Add this prop
  id, // Add this prop
  // Add initial props with defaults
  initialText = '',
  initialTextStyle = {
    fontSize: 32,
    color: 'white',
  },
  initialScale = [15, 10, 1],
}) => {
  const groupRef = useRef();
  const uiMenuRef = useRef(null); // New ref for UI menu
  const [text, setText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [textStyle, setTextStyle] = useState(initialTextStyle);
  const [showTransform, setShowTransform] = useState(false); // <-- New state for transform mode
  const [showResizeArrow, setShowResizeArrow] = useState(false);
  const textAreaRef = useRef();
  const displayRef = useRef(); // <-- New ref for non-editing display
  const [bulletPointMode, setBulletPointMode] = useState(false); // New state for bullet point mode
  const [indicatorSelected, setIndicatorSelected] = useState(false);
  const [scale, setScale] = useState(initialScale); // Default size for the text plane
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

  const getIndicatorPositions = () => {
    const textObjectHeight = 10;

    return {
      bottom: [0, -textObjectHeight / 2 - 1, 0],
    };
  };

  const calculateIndicatorPosition = () => {
    const worldMatrix = new THREE.Matrix4();
    const localPos = new THREE.Vector3(...getIndicatorPositions().bottom);
    const scaleMatrix = new THREE.Matrix4();

    if (groupRef.current) {
      // Get the plane's world matrix
      groupRef.current.updateWorldMatrix(true, false);
      worldMatrix.copy(groupRef.current.matrixWorld);

      // Apply scale
      scaleMatrix.makeScale(...scale);
      worldMatrix.multiply(scaleMatrix);

      // Transform the local position to world space
      localPos.applyMatrix4(worldMatrix);
    }

    return [localPos.x, localPos.y, localPos.z];
  };

  const shouldShowIndicator = () => {
    // Show when any indicator is selected globally
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') {
      return true;
    }
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected()) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  };

  const handleIndicatorClick = (e) => {
    e.stopPropagation();

    // Calculate the actual world position of the indicator
    const indicatorPosition = calculateIndicatorPosition();

    // Save detailed indicator data with explicit properties
    const indicator = {
      plane: groupRef.current,
      type: 'text', // Proper type identification
      position: indicatorPosition, // Pre-calculated world position
      worldPosition: indicatorPosition, // Redundant storage for safety
      objectId: id,
      id: id,
      face: 'bottom',
      scale: scale,
      cube: {
        id: id,
        userData: { id: id },
        position: position,
        scale: scale,
      },
      // Extra data for position calculation
      offset: [0, -5 * scale[1], 0],
    };

    // Call parent handlers first to show all indicators
    onIndicatorSelected?.();
    onFaceIndicatorClick?.(indicator);

    // Then update local state
    setIndicatorSelected(true);
  };

  const isIndicatorConnected = () => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
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
    width: `${scale[0] * 5.3 * conversionFactor}px`, // Adjusted multiplier
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
      updateDatabase();
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

  // Add update handler
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id) return;

    const currentState = {
      type: 'text',
      position,
      scale,
      text,
      textStyle,
      bulletPointMode,
    };

    // Only update if something has changed
    if (
      !groupRef.current?.lastUpdate ||
      !isEqual(groupRef.current.lastUpdate, currentState)
    ) {
      groupRef.current.lastUpdate = currentState;
      onUpdate(id, currentState);
    }
  }, [id, onUpdate, position, scale, text, textStyle, bulletPointMode]);

  // Add effect to trigger updates
  useEffect(() => {
    updateDatabase();
  }, [updateDatabase]);

  // Update style change handler in TextObjectUI
  const handleStyleChange = (newStyle) => {
    if ('bulletPointMode' in newStyle) {
      setBulletPointMode(newStyle.bulletPointMode);
      if (newStyle.bulletPointMode && !text.startsWith('• ')) {
        setText('• ' + text);
      }
    }
    setTextStyle((prev) => ({ ...prev, ...newStyle }));
  };

  // Update transform handler
  const handleDrag = useCallback(
    (e) => {
      if (groupRef.current) {
        const newPos = e.target.object.position;
        groupRef.current.position.copy(newPos);

        // Save to database
        onUpdate?.(id, {
          position: [newPos.x, newPos.y, newPos.z],
          type: 'text',
          scale,
          text,
          textStyle,
          bulletPointMode,
        });
      }
    },
    [id, onUpdate, scale, text, textStyle, bulletPointMode]
  );

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        userData={{ type: 'textObject', id: id, objectId: id }} // Add objectId to userData for access
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
        {shouldShowIndicator() && (
          <FaceIndicator
            position={getIndicatorPositions().bottom}
            rotation={[0, 0, 0]}
            onClick={handleIndicatorClick}
            isActive={indicatorSelected || isIndicatorConnected()}
            objectId={id} // Pass objectId explicitly to the FaceIndicator
            face="bottom" // Add face identifier
          />
        )}
      </group>

      {/* Add the new UI outside the main group */}
      {isEditing && (
        <TextObjectUI
          onStyleChange={handleStyleChange}
          followTarget={groupRef}
          menuRef={uiMenuRef} // pass the ref to keep the menu open on focus
          onTransformToggle={() => setShowTransform(true)} // new transform toggle callback
          onResizeToggle={() => setShowResizeArrow((prev) => !prev)}
        />
      )}
    </>
  );
};

export default TextObject;
