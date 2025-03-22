import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import FaceIndicator from './FaceIndicator';
import TextObjectUI from './TextObjectUI';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import { prepareTextObjectIndicator } from '../utils/connectionUtils';

const TextObject = ({
  id,
  position,
  selected,
  onClick,
  showAllIndicators,
  onIndicatorSelected,
  onIndicatorDeselected,
  globalIndicatorSelected,
  onFaceIndicatorClick,
  connections,
  selectedIndicators,
  indicatorMode,
  onUpdate,
  onDelete,
  registerTransformingObject,
  initialText = '',
  initialTextStyle = { fontSize: 32, color: 'white' },
  initialScale = [15, 10, 1],
  onTransformStart,
  onTransformEnd,
  onResizeStart,
  onResizeEnd,
}) => {
  // DOM Refs
  const groupRef = useRef();
  const transformRef = useRef();
  const uiMenuRef = useRef(null);
  const textAreaRef = useRef();
  const displayRef = useRef();

  // Essential state
  const [text, setText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [isActivelyEditing, setIsActivelyEditing] = useState(false);
  const [textStyle, setTextStyle] = useState(initialTextStyle);
  const [scale, setScale] = useState(initialScale);
  const [indicatorSelected, setIndicatorSelected] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');
  const [isMoving, setIsMoving] = useState(false);

  // UI mode states
  const [showTransform, setShowTransform] = useState(false);
  const [showResizeArrow, setShowResizeArrow] = useState(false);
  const [showResizeControls, setShowResizeControls] = useState(false);
  const [bulletPointMode, setBulletPointMode] = useState(false);

  // Technical refs
  const textUpdateTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);
  const originalScaleRef = useRef(scale);
  const containerDimensionsRef = useRef({ width: 0, height: 0 });
  const startXRef = useRef(0);
  const startWidthRef = useRef(scale[0]);
  const lastUpdateRef = useRef(null);
  const worldMatrixRef = useRef(null);
  const worldPosRef = useRef(null);
  const contentHeightRef = useRef(0);
  const needsFocusRef = useRef(false);
  const initialFocusDoneRef = useRef(false);
  const lastCursorPositionRef = useRef(null);
  const textContentRef = useRef(initialText);
  const connectedLineIdsRef = useRef(new Set());

  // Constants
  const conversionFactor = 30;
  const stringId = String(id);

  // Sync props to state

  // Calculate offset for indicator consistently
  const getIndicatorOffset = useCallback(() => {
    return [0, scale[1] * 0.65, 0];
  }, [scale]);

  // Memoized derived values
  const isIndicatorConnected = useCallback(() => {
    if (!connections || !id) return false;

    return connections.some((conn) => {
      const startId = String(conn.start?.objectId || conn.start?.id);
      const endId = String(conn.end?.objectId || conn.end?.id);
      return stringId === startId || stringId === endId;
    });
  }, [connections, stringId]);

  const shouldShowIndicator = useMemo(() => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected()) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  }, [
    selectedIndicators,
    indicatorMode,
    showAllIndicators,
    globalIndicatorSelected,
    selected,
    isIndicatorConnected,
    indicatorSelected,
  ]);

  // Improved getIndicatorPositions with memoization
  const getIndicatorPositions = useCallback(() => {
    const offset = getIndicatorOffset();
    return { top: offset };
  }, [getIndicatorOffset]);

  // Enhanced: Get connected connection IDs
  useEffect(() => {
    if (!connections || !id) return;

    const connectedIds = new Set();
    connections.forEach((conn) => {
      const startId = String(conn.start?.objectId || conn.start?.id);
      const endId = String(conn.end?.objectId || conn.end?.id);
      if (stringId === startId || stringId === endId) {
        connectedIds.add(conn.id);
      }
    });
    connectedLineIdsRef.current = connectedIds;
  }, [connections, stringId, id]);

  // Enhanced updateWorldMatrix function to better handle connections
  const updateWorldMatrix = useCallback(() => {
    if (!groupRef.current) return null;

    groupRef.current.updateWorldMatrix(true, false);
    const worldMatrix = groupRef.current.matrixWorld.clone();
    worldMatrixRef.current = worldMatrix;

    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);

    // Apply indicator offset
    const offset = new THREE.Vector3(...getIndicatorOffset());
    offset.applyQuaternion(groupRef.current.quaternion);
    const indicatorWorldPos = worldPos.clone().add(offset);

    const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
    const indicatorPosArray = [
      indicatorWorldPos.x,
      indicatorWorldPos.y,
      indicatorWorldPos.z,
    ];

    // Store enhanced connection data in userData for real-time updates
    if (groupRef.current) {
      // Store more precise indicator data directly for connection system to use
      groupRef.current.userData = {
        ...groupRef.current.userData,
        isTextObject: true,
        objectId: stringId,
        type: 'textObject',
        id: stringId,
        indicatorOffset: getIndicatorOffset(),
        indicatorWorldPosition: indicatorPosArray, // More clear naming
        worldPosition: worldPosArray,
        face: 'top',
        isMoving: isMoving,
        _lastUpdateTime: Date.now(), // Add timestamp to track freshness
        connectedLineIds: Array.from(connectedLineIdsRef.current),
        planeData: {
          worldMatrix: Array.from(worldMatrix.elements),
          position: [...worldPosArray],
          scale: [...scale],
          offset: getIndicatorOffset(),
        },
      };
    }

    worldPosRef.current = {
      worldPos: worldPosArray,
      indicatorPos: indicatorPosArray,
      matrix: Array.from(worldMatrix.elements),
    };

    return {
      worldPos: worldPosArray,
      indicatorPos: indicatorPosArray,
      matrix: Array.from(worldMatrix.elements),
    };
  }, [getIndicatorOffset, scale, stringId, isMoving]);

  // Update world position when transform changes
  useEffect(() => {
    updateWorldMatrix();

    // Store connection-relevant data in userData for easy access
    if (groupRef.current) {
      groupRef.current.userData.indicatorOffset = getIndicatorOffset();
      groupRef.current.userData.worldPos = worldPosRef.current;
      groupRef.current.userData.objectType = 'text';
    }
  }, [position, scale, updateWorldMatrix, getIndicatorOffset]);

  const closeAllUIs = useCallback(() => {
    setShowTransform(false);
    setShowResizeArrow(false);
    setShowResizeControls(false);
    setIsEditing(false);
  }, []);

  // Handle selection/deselection
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();

      // Save pending changes when deselected
      if (pendingChangesRef.current && onUpdate) {
        onUpdate(id, pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    }
  }, [selected, closeAllUIs, onIndicatorDeselected, id, onUpdate]);

  // Optimized database update to reduce unnecessary saves
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id) return;

    const currentState = {
      type: 'text',
      position,
      scale,
      text,
      textStyle,
      bulletPointMode,
      lastEditTime: isActivelyEditing ? Date.now() : undefined,
    };

    // Only update if state has changed
    if (
      !lastUpdateRef.current ||
      !isEqual(lastUpdateRef.current, currentState)
    ) {
      const worldInfo = updateWorldMatrix();

      if (worldInfo) {
        currentState.worldPosition = worldInfo.worldPos;
        currentState.indicatorPosition = worldInfo.indicatorPos;
        currentState.planeData = {
          worldMatrix: worldInfo.matrix,
          position: [...position],
          scale: [...scale],
          offset: getIndicatorOffset(),
        };
      }

      lastUpdateRef.current = currentState;
      onUpdate(id, currentState);
    }
  }, [
    id,
    onUpdate,
    position,
    scale,
    text,
    textStyle,
    bulletPointMode,
    isActivelyEditing,
    updateWorldMatrix,
    getIndicatorOffset,
  ]);

  // Modified auto-resize function for the textarea
  const autoResizeTextArea = useCallback(() => {
    if (!textAreaRef.current) return;

    // Reset height to calculate the actual height required
    textAreaRef.current.style.height = 'auto';

    // Get the scrollHeight (actual content height)
    const scrollHeight = textAreaRef.current.scrollHeight;

    // Store height in ref and state
    contentHeightRef.current = scrollHeight;
    setContentHeight(`${scrollHeight}px`);

    // Set the height based on content
    textAreaRef.current.style.height = `${scrollHeight}px`;

    // Update container dimensions for connections
    containerDimensionsRef.current = {
      width: textAreaRef.current.offsetWidth,
      height: scrollHeight,
    };
  }, []);

  // Event handlers
  // Modified text change handler to preserve cursor position
  const handleTextChange = (e) => {
    // Store text in ref instead of state to avoid re-renders
    textContentRef.current = e.target.value;
    setIsActivelyEditing(true);

    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      text: e.target.value,
    };

    if (textUpdateTimeoutRef.current) {
      clearTimeout(textUpdateTimeoutRef.current);
    }

    if (groupRef.current) {
      groupRef.current.userData.isTextEditing = true;
      textUpdateTimeoutRef.current = setTimeout(() => {
        if (groupRef.current) {
          groupRef.current.userData.isTextEditing = false;
        }
      }, 1000);
    }

    // Auto-resize without affecting cursor
    autoResizeTextArea();

    // Update the text state less frequently to avoid cursor jumps
    clearTimeout(textUpdateTimeoutRef.current);
    textUpdateTimeoutRef.current = setTimeout(() => {
      setText(textContentRef.current);
    }, 300); // Debounce state updates
  };

  const handleBlur = (e) => {
    if (
      uiMenuRef.current &&
      e.relatedTarget &&
      uiMenuRef.current.contains(e.relatedTarget)
    ) {
      return;
    }

    // Sync text state with ref value
    setText(textContentRef.current);
    setIsEditing(false);
    setIsActivelyEditing(false);

    if (groupRef.current) {
      groupRef.current.userData.isTextEditing = false;
    }

    updateDatabase();
  };

  // Improved click handler to set focus flags only during initial activation
  const handleDivClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();

    // Only set focus flags when transitioning from non-editing to editing
    if (!isEditing) {
      needsFocusRef.current = true;
      initialFocusDoneRef.current = false;
    }

    // Activate editing mode
    setIsEditing(true);
  };

  // Simplify handleTextClick to use the same logic
  const handleTextClick = (e) => {
    handleDivClick(e);
  };

  // Modified focus effect to respect cursor position after initial focus
  useEffect(() => {
    if (isEditing && needsFocusRef.current && !initialFocusDoneRef.current) {
      // Use a slightly longer timeout to ensure DOM is fully updated
      const focusTimeout = setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();

          // Only set cursor to end during initial focus
          textAreaRef.current.selectionStart = text.length;
          textAreaRef.current.selectionEnd = text.length;

          autoResizeTextArea();
          needsFocusRef.current = false;
          initialFocusDoneRef.current = true;
        }
      }, 50); // Slightly longer timeout for reliable focusing

      return () => clearTimeout(focusTimeout);
    }
  }, [isEditing, text, autoResizeTextArea]);

  // Keep the existing effect for auto-resizing
  useEffect(() => {
    if (isEditing) {
      autoResizeTextArea();
    }
  }, [isEditing, autoResizeTextArea]);

  // Connection indicator click - critical for connection handling
  const handleIndicatorClick = (e) => {
    e.stopPropagation();

    try {
      // Use the utility function for consistent indicator format
      const indicator = prepareTextObjectIndicator(
        groupRef.current,
        id,
        position,
        scale
      );

      if (!indicator) {
        console.error('Failed to prepare text object indicator');
        return;
      }

      // Add additional properties needed for connection visualization
      indicator.faceCenter = indicator.worldPosition;
      indicator.facePosition = indicator.worldPosition;

      setIndicatorSelected(true);
      onIndicatorSelected?.();
      onFaceIndicatorClick?.(indicator);
    } catch (error) {
      console.error('Error in handleIndicatorClick:', error);
    }
  };

  // Resizing handlers
  const handlePointerDown = (e) => {
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = scale[0];
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    onResizeStart?.(id);
  };

  const handlePointerMove = (e) => {
    const dx = e.clientX - startXRef.current;
    const scalingFactor = 0.1;
    const newWidth = startWidthRef.current + dx * scalingFactor;

    // Apply constraints
    const minWidth = 5,
      maxWidth = 200;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setScale([newWidth, scale[1], scale[2]]);

      // Update connections right away on resize
      if (onUpdate && groupRef.current) {
        const worldInfo = updateWorldMatrix();
        if (worldInfo) {
          onUpdate(id, {
            type: 'text',
            scale: [newWidth, scale[1], scale[2]],
            worldPosition: worldInfo.worldPos,
            indicatorPosition: worldInfo.indicatorPos,
            planeData: {
              worldMatrix: worldInfo.matrix,
              position: [...position],
              scale: [newWidth, scale[1], scale[2]],
              offset: getIndicatorOffset(),
            },
            isResizing: true,
          });
        }
      }
    }
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    onResizeEnd?.(id);
    updateDatabase();
  };

  // Enhanced transform handlers for better connection management
  const handleTransformStart = () => {
    registerTransformingObject?.(id, true, position);
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
    setIsMoving(true);
    onTransformStart?.(id);

    // Mark connections as being transformed to prevent jitter
    if (groupRef.current) {
      groupRef.current.userData._transformActive = true;
      groupRef.current.userData._isDragging = true;
    }
  };

  const handleTransformEnd = () => {
    registerTransformingObject?.(id, false);
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }

    // Final position calculation after movement ends
    const worldInfo = updateWorldMatrix();
    if (groupRef.current && onUpdate && worldInfo) {
      // Remove movement flags
      setIsMoving(false);

      if (groupRef.current.userData) {
        groupRef.current.userData._transformActive = false;
        groupRef.current.userData._isDragging = false;
        groupRef.current.userData._textObjectMoving = false;
      }

      // Final update to database with the new positions
      onUpdate(id, {
        position: worldInfo.worldPos,
        worldPosition: worldInfo.worldPos,
        indicatorPosition: worldInfo.indicatorPos,
        scale,
        planeData: {
          worldMatrix: worldInfo.matrix,
          position: worldInfo.worldPos,
          scale: [...scale],
          offset: getIndicatorOffset(),
        },
        _moveComplete: true, // Signal that movement is complete for any listeners
        _moveTimestamp: Date.now(),
      });
    }
    onTransformEnd?.(id);
  };

  // Enhanced handleDrag to update connection points in real-time
  const handleDrag = useCallback(
    (e) => {
      if (!groupRef.current || !onUpdate) return;

      // Update world matrix and position information
      const worldInfo = updateWorldMatrix();
      if (!worldInfo) return;

      // Mark this object as moving to prevent jitter checks
      if (!isMoving) {
        setIsMoving(true);
      }

      // Update connection positions in real-time without database writes
      if (groupRef.current) {
        // Add specific flag for TextObject movement in userData
        groupRef.current.userData._textObjectMoving = true;
        groupRef.current.userData._lastMoveTime = Date.now();
        groupRef.current.userData.indicatorWorldPosition =
          worldInfo.indicatorPos;

        // For connections to find this information directly during movement
        groupRef.current.userData.connectionData = {
          indicatorPosition: worldInfo.indicatorPos,
          worldPosition: worldInfo.worldPos,
          objectId: stringId,
          id: stringId,
          face: 'top',
        };
      }

      // Only update database every 100ms to reduce load during continuous movement
      const throttleTime = 100;
      const now = Date.now();
      if (now - (lastUpdateRef.current?.time || 0) > throttleTime) {
        // Immediate visual update during movement
        onUpdate(id, {
          type: 'text',
          position: worldInfo.worldPos,
          worldPosition: worldInfo.worldPos,
          indicatorPosition: worldInfo.indicatorPos,
          planeData: {
            worldMatrix: worldInfo.matrix,
            position: worldInfo.worldPos,
            scale: [...scale],
            offset: getIndicatorOffset(),
          },
          _transformActive: true, // Skip database updates but keep visual updates
          _isDragging: true, // Indicate this is an active drag operation
        });

        // Store last update time for throttling
        lastUpdateRef.current = {
          ...lastUpdateRef.current,
          time: now,
          position: worldInfo.worldPos,
        };
      }
    },
    [id, onUpdate, scale, updateWorldMatrix, getIndicatorOffset, isMoving]
  );

  const handleScale = (e) => {
    if (!e.target || !e.target.object) return;

    const newScale = [
      e.target.object.scale.x,
      e.target.object.scale.y,
      scale[2], // Keep Z scale unchanged
    ];

    setScale(newScale);

    if (groupRef.current) {
      // Reset actual scale to prevent font scaling
      groupRef.current.scale.set(1, 1, 1);

      const worldInfo = updateWorldMatrix();
      if (worldInfo && onUpdate) {
        onUpdate(id, {
          type: 'text',
          position,
          scale: newScale,
          text,
          textStyle,
          bulletPointMode,
          worldPosition: worldInfo.worldPos,
          indicatorPosition: worldInfo.indicatorPos,
          planeData: {
            worldMatrix: worldInfo.matrix,
            position: [...position],
            scale: [...newScale],
            offset: [0, newScale[1] * 0.65, 0],
          },
          isResizing: true,
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && bulletPointMode) {
      e.preventDefault();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const textAfterCursor = text.slice(cursorPosition);
      const newText = textBeforeCursor + '\n• ' + textAfterCursor;

      setText(newText);
      setTimeout(() => {
        e.target.selectionStart = cursorPosition + 3;
        e.target.selectionEnd = cursorPosition + 3;
      }, 0);
    }
  };

  const handleStyleChange = (newStyle) => {
    if ('bulletPointMode' in newStyle) {
      setBulletPointMode(newStyle.bulletPointMode);
      if (newStyle.bulletPointMode && !text.startsWith('• ')) {
        setText('• ' + text);
      }
    }
    setTextStyle((prev) => ({ ...prev, ...newStyle }));
    updateDatabase();
  };

  // StyleSheet-like objects
  const getTextAreaStyle = () => ({
    autoWrap: 'wrap',
    width: '100%',
    height: contentHeight,
    minHeight: '2em', // Start with small height, will expand
    background: 'rgba(0,0,0,0.5)',
    color: textStyle.color || 'white',
    border: 'none',
    padding: '8px',
    margin: '0',
    resize: 'none',
    fontSize: textStyle.fontSize ? `${textStyle.fontSize}px` : '32px',
    fontFamily: 'Arial',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
    outline: selected ? '1px solid #99ccff' : 'none',
    overflow: 'hidden',
  });

  const getContainerStyle = () => ({
    width: `${scale[0] * 5.3 * conversionFactor}px`,
    height: `${scale[1] * 1.3 * conversionFactor}px`,
    position: 'relative',
    transform: 'scale(1)',
  });

  // Combined scale-related effects
  useEffect(() => {
    originalScaleRef.current = [...scale];

    if ((showResizeControls || showResizeArrow) && groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
    }
  }, [scale, showResizeControls, showResizeArrow]);

  // Combined orbit controls and transform mode effects
  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.setMode('translate');
    }

    return () => {
      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }
    };
  }, []);

  // Update rotation to always face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);

      // Update world matrix when camera angle changes to ensure
      // connection points remain accurate
      if (
        groupRef.current &&
        connections?.some(
          (conn) =>
            conn.start.objectId === stringId || conn.end.objectId === stringId
        )
      ) {
        updateWorldMatrix();
      }
    }
  });

  // Simplified effect that syncs heights on mode switch
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      autoResizeTextArea();
    }
  }, [isEditing, autoResizeTextArea]);

  // Add effect to update height when text changes in either mode
  useEffect(() => {
    if (isEditing) {
      autoResizeTextArea();
    } else if (displayRef.current && contentHeight !== 'auto') {
      displayRef.current.style.height = contentHeight;
    }
  }, [text, isEditing, autoResizeTextArea, contentHeight]);

  // Initialize content height on component mount
  useEffect(() => {
    // Set initial height based on content or a minimum value
    if (text) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        if (displayRef.current) {
          const initialHeight = Math.max(displayRef.current.scrollHeight, 32);
          setContentHeight(`${initialHeight}px`);
        }
      }, 100);
    }
  }, []);

  // Enhanced render with _transformActive flag in userData
  return (
    <>
      <group
        ref={groupRef}
        position={position}
        userData={{
          type: 'textObject',
          id: stringId,
          objectId: stringId,
          isTextEditing: isActivelyEditing,
          containerDimensions: containerDimensionsRef.current,
          indicatorOffset: getIndicatorOffset(),
          face: 'top',
          isMoving: isMoving,
          _transformActive: isMoving,
        }}
      >
        <Html transform position={[0, 0, 0.1]} center>
          <div
            style={getContainerStyle()}
            className="text-object-container"
            onClick={handleDivClick}
          >
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                // Remove value prop to make uncontrolled
                defaultValue={textContentRef.current}
                onChange={handleTextChange}
                onBlur={handleBlur}
                style={getTextAreaStyle()}
                onKeyDown={handleKeyDown}
                placeholder={bulletPointMode ? '• ' : 'Click to edit text...'}
                onClick={(e) => {
                  // Just prevent the click from bubbling
                  e.stopPropagation();
                }}
                // Added onMouseDown to clear auto-focus flags
                onMouseDown={(e) => {
                  e.stopPropagation();
                  needsFocusRef.current = false;
                  initialFocusDoneRef.current = true;
                }}
              />
            ) : (
              <div
                ref={displayRef}
                onClick={handleTextClick}
                style={{
                  ...getTextAreaStyle(),
                  userSelect: 'none',
                  cursor: 'text',
                  width: '100%',
                }}
              >
                {text || 'Click to edit text...'}
              </div>
            )}
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

        {shouldShowIndicator && (
          <FaceIndicator
            position={getIndicatorPositions().top}
            rotation={[0, 0, 0]}
            onClick={handleIndicatorClick}
            isActive={indicatorSelected || isIndicatorConnected()}
            objectId={stringId}
            face="top"
          />
        )}
      </group>

      {/* Transform controls */}
      {showTransform && selected && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          size={0.5}
          mode="translate"
          onObjectChange={handleDrag}
          onDragStart={handleTransformStart}
          onDragEnd={handleTransformEnd}
        />
      )}

      {/* Scale transform controls */}
      {showResizeArrow && selected && (
        <TransformControls
          object={groupRef.current}
          mode="scale"
          size={0.5}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) window.orbitControls.enabled = false;
            onResizeStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) window.orbitControls.enabled = true;
            onResizeEnd?.(id);
          }}
          showX={true}
          showY={true}
          showZ={false}
          space="local"
          onUpdate={() => {
            if (groupRef.current) {
              groupRef.current.scale.set(1, 1, 1);
            }
          }}
        />
      )}

      {/* Resize transform controls */}
      {showResizeControls && selected && (
        <TransformControls
          object={groupRef.current}
          mode="scale"
          size={0.5}
          scale={scale}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            registerTransformingObject?.(id, true);
            onResizeStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            registerTransformingObject?.(id, false);
            onResizeEnd?.(id);

            if (groupRef.current) {
              groupRef.current.scale.set(1, 1, 1);
            }
          }}
          showX={true}
          showY={false}
          showZ={false}
          space="local"
        />
      )}

      {/* Text style UI */}
      {selected && (
        <TextObjectUI
          ref={uiMenuRef}
          text={text}
          textStyle={textStyle}
          onStyleChange={handleStyleChange}
          onDelete={onDelete ? () => onDelete(id) : undefined}
          onTransformToggle={() => setShowTransform((prev) => !prev)}
          onResizeToggle={() => setShowResizeControls((prev) => !prev)}
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
