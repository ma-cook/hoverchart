import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import { Html, TransformControls } from '@react-three/drei'; // Add TransformControls import
import { useFrame } from '@react-three/fiber';
import FaceIndicator from './FaceIndicator';
import TextObjectUI from './TextObjectUI';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';

const TextObject = ({
  id,
  position,
  selected,
  onClick,
  showAllIndicators,
  onIndicatorSelected,
  globalIndicatorSelected,
  onFaceIndicatorClick,
  connections,
  selectedIndicators,
  indicatorMode,
  onUpdate,
  onDelete,
  registerTransformingObject, // Add this prop
  initialText = '',
  initialTextStyle = { fontSize: 32, color: 'white' },
  initialScale = [15, 10, 1],
  onTransformStart, // Add this prop
  onTransformEnd, // Add this prop
  onResizeStart, // Add this prop
  onResizeEnd, // Add this prop
}) => {
  const groupRef = useRef();
  const transformRef = useRef(); // Add ref for transform controls
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
  const [showResizeControls, setShowResizeControls] = useState(false); // Add this state

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

  // Improve the indicator position calculation to handle scale changes properly
  const calculateIndicatorPosition = () => {
    if (!groupRef.current) return [0, 0, 0];

    // Get the current world position of the group
    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);

    // Calculate a stable offset based on current scale
    const verticalOffset = -5 * scale[1];

    // Store this position in the ref for persistence
    const stablePosition = [
      worldPosition.x,
      worldPosition.y + verticalOffset,
      worldPosition.z,
    ];

    // Store stable position in userData for connection updates
    if (groupRef.current.userData) {
      groupRef.current.userData.indicatorPosition = [...stablePosition];
      groupRef.current.userData.indicatorLastUpdated = Date.now();
    }

    return stablePosition;
  };

  // Add this function to ensure connections receive accurate position data
  const updateIndicatorPosition = () => {
    if (!groupRef.current) return;

    const position = calculateIndicatorPosition();

    // Update userData with reliable position information for connections
    if (groupRef.current.userData) {
      groupRef.current.userData.lastWorldPosition = [...position];
      groupRef.current.userData.lastScale = [...scale];
      groupRef.current.userData.indicatorOffset = [0, -5 * scale[1], 0];
      groupRef.current.userData.positionUpdated = Date.now();
    }
  };

  // Call this function whenever position or scale changes
  useEffect(() => {
    updateIndicatorPosition();
  }, [position, scale]);

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

  // Update handleIndicatorClick to store better position data
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
        userData: {
          id: id,
          indicatorPosition: indicatorPosition,
          lastUpdated: Date.now(),
        },
        position: position,
        scale: scale,
      },
      // Store explicit offset for better position recalculation
      offset: [0, -5 * scale[1], 0],
      // Add a property to help the ConnectionUpdater identify this as a valid position
      isValidTextObjectPosition: true,
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
    transform: 'scale(1)', // Ensure text doesn't scale with the container
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

  // Add handlers for transform controls
  const handleTransformStart = () => {
    if (registerTransformingObject) {
      registerTransformingObject(id, true);
    }
    // Disable orbit controls during transform
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
  };

  const handleTransformEnd = () => {
    if (registerTransformingObject) {
      registerTransformingObject(id, false);
    }
    // Re-enable orbit controls after transform
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }

    // Update position in database when transform ends
    if (groupRef.current && onUpdate) {
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);
      onUpdate(id, {
        position: [worldPosition.x, worldPosition.y, worldPosition.z],
        scale,
      });
    }
  };

  const handleTransformChange = () => {
    if (groupRef.current && onUpdate) {
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);

      // Just update local state during transform
      // The position will be saved to database when transform ends
    }
  };

  // Add effect to update TransformControls mode
  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.setMode('translate');
    }
  }, [transformRef.current]);

  // Add effect to handle disabling orbit controls when transform controls are active
  useEffect(() => {
    return () => {
      // Make sure orbit controls are re-enabled when component unmounts
      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }
    };
  }, []);

  // Add handler for transform changes
  const handleDrag = useCallback(
    (e) => {
      if (groupRef.current && onUpdate) {
        const worldPosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPosition);

        // Update position immediately for smooth dragging
        onUpdate(id, {
          type: 'text',
          position: [worldPosition.x, worldPosition.y, worldPosition.z],
          scale,
          text,
          textStyle,
          bulletPointMode,
        });
      }
    },
    [id, onUpdate, scale, text, textStyle, bulletPointMode]
  );

  // Add useEffect to handle editing state when selection changes
  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);

  // Modify the handler for scale changes during resize
  const handleScale = (e) => {
    if (!e.target || !e.target.object) return;

    const newScale = [
      e.target.object.scale.x,
      e.target.object.scale.y,
      scale[2], // Keep Z scale unchanged
    ];

    setScale(newScale);

    // Reset the object's actual scale to prevent text font scaling
    if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);

      // Update indicator position immediately after scale change
      const indicatorPosition = calculateIndicatorPosition();

      // Update with comprehensive position data for connections
      groupRef.current.userData.lastWorldPosition = position.slice();
      groupRef.current.userData.indicatorPosition = indicatorPosition;
      groupRef.current.userData.lastScale = newScale.slice();
      groupRef.current.userData.indicatorOffset = [0, -5 * newScale[1], 0];
      groupRef.current.userData.positionUpdated = Date.now();
    }

    // Update database with new scale
    if (onUpdate) {
      onUpdate(id, {
        type: 'text',
        position,
        scale: newScale,
        text,
        textStyle,
        bulletPointMode,
        isResizing: true,
      });
    }
  };

  // Add an effect to reset scale after transform controls are done
  useEffect(() => {
    if (showResizeControls || showResizeArrow) {
      // When resize mode is activated, ensure group scale is reset to 1
      if (groupRef.current) {
        groupRef.current.scale.set(1, 1, 1);
      }
    }
  }, [showResizeControls, showResizeArrow]);

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

      {/* Add TransformControls outside the group to prevent camera issues */}
      {showTransform && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          onChange={handleTransformChange}
          size={0.5}
          mode="translate" // Default to translate mode
          onObjectChange={handleDrag}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            onTransformStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            onTransformEnd?.(id);
          }}
        />
      )}

      {/* Add scaling TransformControls */}
      {showResizeArrow && selected && (
        <TransformControls
          object={groupRef.current}
          mode="scale"
          size={0.5}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            onResizeStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            onResizeEnd?.(id);
          }}
          showX={true}
          showY={true}
          showZ={false}
          space="local"
          onUpdate={() => {
            // Reset the object's actual scale after each update
            if (groupRef.current) {
              groupRef.current.scale.set(1, 1, 1);
            }
          }}
        />
      )}

      {/* Add scaling TransformControls when needed */}
      {showResizeControls && selected && (
        <TransformControls
          object={groupRef.current}
          mode="scale"
          size={0.5}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            registerTransformingObject?.(id, true); // Use registerTransformingObject here
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            registerTransformingObject?.(id, false); // Use registerTransformingObject here
          }}
          showX={true}
          showY={false}
          showZ={false}
          space="local"
          onUpdate={() => {
            // Reset the object's actual scale after each update
            if (groupRef.current) {
              groupRef.current.scale.set(1, 1, 1);
            }
          }}
        />
      )}

      {/* Only show UI when both selected AND editing */}
      {selected && isEditing && (
        <TextObjectUI
          ref={uiMenuRef} // Just pass the ref directly, don't pass as menuRef prop
          text={text}
          textStyle={textStyle}
          onStyleChange={handleStyleChange}
          onDelete={onDelete}
          onTransformToggle={() => setShowTransform((prev) => !prev)}
          onResizeToggle={() => setShowResizeControls((prev) => !prev)} // Toggle drei resize controls
          showTransform={showTransform}
          showResizeArrow={showResizeArrow}
          setShowResizeArrow={setShowResizeArrow}
          followTarget={groupRef}
        />
      )}
    </>
  );
};

export default TextObject;
