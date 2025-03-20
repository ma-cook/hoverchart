import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import FaceIndicator from './FaceIndicator';
import TextObjectUI from './TextObjectUI';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';

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

  // UI mode states - these could be consolidated but keeping separate for clarity
  const [showTransform, setShowTransform] = useState(false);
  const [showResizeArrow, setShowResizeArrow] = useState(false);
  const [showResizeControls, setShowResizeControls] = useState(false);
  const [bulletPointMode, setBulletPointMode] = useState(false);

  // Technical refs
  const indicatorSelectedRef = useRef(false);
  const textUpdateTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);
  const originalScaleRef = useRef(scale);
  const containerDimensionsRef = useRef({ width: 0, height: 0 });
  const startXRef = useRef(0);
  const startWidthRef = useRef(scale[0]);

  // Constants
  const conversionFactor = 30;

  // Memoized derived values
  const isIndicatorConnected = useCallback(() => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  }, [connections]);

  const shouldShowIndicator = useMemo(() => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected()) return true;
    if (indicatorSelectedRef.current) return true;
    if (selected) return true;
    return false;
  }, [
    selectedIndicators,
    indicatorMode,
    showAllIndicators,
    globalIndicatorSelected,
    selected,
    isIndicatorConnected,
  ]);

  // Improved getIndicatorPositions with memoization
  const getIndicatorPositions = useCallback(() => {
    const containerHeight = containerDimensionsRef.current.height || 50;
    const yOffset = containerHeight / conversionFactor + 0.25;
    return { bottom: [0, -yOffset, 0] };
  }, [containerDimensionsRef.current.height, conversionFactor]);

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

    pendingChangesRef.current = currentState;

    if (!isEditing && groupRef.current) {
      if (
        !groupRef.current.lastUpdate ||
        !isEqual(groupRef.current.lastUpdate, currentState)
      ) {
        groupRef.current.lastUpdate = currentState;
        onUpdate(id, currentState);
      }
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
    isEditing,
  ]);

  // Improved indicator position calculation
  const calculateIndicatorPosition = useCallback(() => {
    if (!groupRef.current) return [0, 0, 0];

    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);
    const indicatorOffset = getIndicatorPositions().bottom;

    const worldIndicatorPos = [
      worldPosition.x + indicatorOffset[0],
      worldPosition.y + indicatorOffset[1],
      worldPosition.z + indicatorOffset[2],
    ];

    groupRef.current.userData.indicatorPosition = [...worldIndicatorPos];
    return worldIndicatorPos;
  }, [getIndicatorPositions]);

  // Optimized updateIndicatorPosition with better controls
  const updateIndicatorPosition = useCallback(() => {
    if (!groupRef.current) return;

    const indicatorPos = getIndicatorPositions();
    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);
    const worldIndicatorPos = [
      worldPosition.x + indicatorPos.bottom[0],
      worldPosition.y + indicatorPos.bottom[1],
      worldPosition.z + indicatorPos.bottom[2],
    ];

    // Skip update if position hasn't changed significantly
    const currentPos = groupRef.current.userData.indicatorPosition;
    if (
      currentPos &&
      Math.abs(currentPos[0] - worldIndicatorPos[0]) < 0.001 &&
      Math.abs(currentPos[1] - worldIndicatorPos[1]) < 0.001 &&
      Math.abs(currentPos[2] - worldIndicatorPos[2]) < 0.001
    ) {
      return currentPos;
    }

    // Store position in userData
    if (groupRef.current.userData) {
      groupRef.current.userData.indicatorPosition = [...worldIndicatorPos];
      groupRef.current.userData.indicatorOffset = [
        0,
        indicatorPos.bottom[1],
        0,
      ];
      groupRef.current.userData.indicatorLastUpdated = Date.now();
    }

    // Update connection endpoints with rate limiting
    const now = Date.now();

    // Helper function for updating connections if needed
    const updateConnectionsIfNeeded = () => {
      if (!connections) return;

      const lastConnUpdate =
        groupRef.current.userData.lastConnectionUpdate || 0;
      if (now - lastConnUpdate <= 500) return;

      groupRef.current.userData.lastConnectionUpdate = now;

      connections.forEach((conn) => {
        // Update connection endpoints that match this object
        if (conn.start?.objectId === id.toString()) {
          conn.start.position = [...worldIndicatorPos];
          conn.start.worldPosition = [...worldIndicatorPos];
          conn.start._textPositionLocked = true;

          if (conn.start.cube?.userData) {
            conn.start.cube.userData.indicatorPosition = [...worldIndicatorPos];
          }

          if (conn.start.plane?.userData) {
            conn.start.plane.userData.indicatorPosition = [
              ...worldIndicatorPos,
            ];
          }
        }

        if (conn.end?.objectId === id.toString()) {
          conn.end.position = [...worldIndicatorPos];
          conn.end.worldPosition = [...worldIndicatorPos];
          conn.end._textPositionLocked = true;

          if (conn.end.cube?.userData) {
            conn.end.cube.userData.indicatorPosition = [...worldIndicatorPos];
          }

          if (conn.end.plane?.userData) {
            conn.end.plane.userData.indicatorPosition = [...worldIndicatorPos];
          }
        }
      });
    };

    // Update parent via callback with rate limiting
    const updateParentIfNeeded = () => {
      if (!onUpdate) return;

      // Only update if this object is part of a connection
      if (
        !connections?.some(
          (conn) =>
            conn.start?.objectId === id.toString() ||
            conn.end?.objectId === id.toString()
        )
      )
        return;

      // Rate limit to once per second
      const lastParentUpdate = groupRef.current.userData.lastParentUpdate || 0;
      if (now - lastParentUpdate <= 1000) return;

      groupRef.current.userData.lastParentUpdate = now;

      onUpdate(id, {
        indicatorPosition: worldIndicatorPos,
        lastUpdated: now,
        indicatorOffset: [0, indicatorPos.bottom[1], 0],
      });
    };

    // Execute updates
    updateConnectionsIfNeeded();
    updateParentIfNeeded();

    return worldIndicatorPos;
  }, [id, connections, onUpdate, getIndicatorPositions]);

  // DOM element height adjustments
  const adjustHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      setTimeout(updateContainerDimensions, 0);
    }
  };

  const adjustDisplayHeight = () => {
    if (displayRef.current) {
      displayRef.current.style.height = 'auto';
      displayRef.current.style.height = `${displayRef.current.scrollHeight}px`;
      setTimeout(updateContainerDimensions, 0);
    }
  };

  // Container dimensions tracking
  const updateContainerDimensions = () => {
    if (!displayRef.current && !textAreaRef.current) return;

    const element = isEditing ? textAreaRef.current : displayRef.current;
    const height = element?.offsetHeight || 0;
    const width = element?.offsetWidth || 0;

    if (
      height === containerDimensionsRef.current.height &&
      width === containerDimensionsRef.current.width
    )
      return;

    containerDimensionsRef.current = { width, height };

    // Update indicator position if height has changed significantly
    if (Math.abs(height - (containerDimensionsRef.current.height || 0)) > 2) {
      const worldPos = updateIndicatorPosition();

      if (
        connections?.some(
          (conn) =>
            conn.start?.objectId === id.toString() ||
            conn.end?.objectId === id.toString()
        ) &&
        onUpdate &&
        !isActivelyEditing
      ) {
        onUpdate(id, {
          indicatorPosition: worldPos,
          lastUpdated: Date.now(),
          containerHeight: height,
        });
      }
    }
  };

  // Event handlers
  const handleTextChange = (e) => {
    setText(e.target.value);
    setIsActivelyEditing(true);
    adjustHeight();

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
  };

  const handleBlur = (e) => {
    if (
      uiMenuRef.current &&
      e.relatedTarget &&
      uiMenuRef.current.contains(e.relatedTarget)
    ) {
      return;
    }

    setIsEditing(false);
    setIsActivelyEditing(false);

    if (groupRef.current) {
      groupRef.current.userData.isTextEditing = false;
    }

    if (pendingChangesRef.current && onUpdate) {
      onUpdate(id, pendingChangesRef.current);

      if (groupRef.current) {
        groupRef.current.lastUpdate = pendingChangesRef.current;
      }
    }
  };

  // Improve the handleTextClick function to immediately activate editing
  const handleTextClick = (e) => {
    e.stopPropagation();
    onClick();
    setIsEditing(true);

    // Focus the textarea in the next render cycle
    requestAnimationFrame(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    });
  };

  // Modify the div click handler to be more responsive
  const handleDivClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    onClick();
    setIsEditing(true);

    // Focus the textarea immediately after state update
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        // Set cursor position to end of text
        textAreaRef.current.selectionStart = text.length;
        textAreaRef.current.selectionEnd = text.length;
      }
    }, 10);
  };

  const handleIndicatorClick = (e) => {
    e.stopPropagation();

    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);
    const indicatorOffset = getIndicatorPositions().bottom;
    const worldIndicatorPos = [
      worldPosition.x + indicatorOffset[0],
      worldPosition.y + indicatorOffset[1],
      worldPosition.z + indicatorOffset[2],
    ];

    const indicator = {
      plane: groupRef.current,
      type: 'text',
      position: worldIndicatorPos,
      worldPosition: worldIndicatorPos,
      objectId: id,
      id: id,
      face: 'bottom',
      scale: scale,
      cube: {
        id: id,
        position: position,
        scale: scale,
        userData: {
          id: id,
          objectId: id,
          indicatorPosition: worldIndicatorPos,
        },
      },
    };

    onIndicatorSelected?.();
    onFaceIndicatorClick?.(indicator);
    indicatorSelectedRef.current = true;
  };

  // Resizing handlers
  const handlePointerDown = (e) => {
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = scale[0];
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
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
      updateDatabase();
    }
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  // Transform control handlers
  const handleTransformStart = () => {
    registerTransformingObject?.(id, true);
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
  };

  const handleTransformEnd = () => {
    registerTransformingObject?.(id, false);
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }

    if (groupRef.current && onUpdate) {
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);
      onUpdate(id, {
        position: [worldPosition.x, worldPosition.y, worldPosition.z],
        scale,
      });
    }
  };

  const handleDrag = useCallback(
    (e) => {
      if (groupRef.current && onUpdate) {
        const worldPosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPosition);

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

      groupRef.current.userData.currentScale = [...newScale];

      // Update position data for connections
      const indicatorPosition = calculateIndicatorPosition();
      groupRef.current.userData.lastWorldPosition = position.slice();
      groupRef.current.userData.indicatorPosition = indicatorPosition;
      groupRef.current.userData.lastScale = newScale.slice();
      groupRef.current.userData.indicatorOffset = [0, -5 * newScale[1], 0];
      groupRef.current.userData.positionUpdated = Date.now();
    }

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
  };

  // StyleSheet-like objects
  const getTextAreaStyle = () => ({
    autoWrap: 'wrap',
    width: '100%',
    height: 'auto',
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

  // Connection synchronization
  const syncConnectionPositions = useCallback(() => {
    if (!connections || !groupRef.current) return;

    const worldIndicatorPos = updateIndicatorPosition();

    connections.forEach((conn) => {
      // Update start position references
      if (conn.start?.objectId === id.toString()) {
        conn.start.position = [...worldIndicatorPos];
        conn.start.worldPosition = [...worldIndicatorPos];
        conn.start._textPositionLocked = true;

        if (conn.start.cube?.userData) {
          conn.start.cube.userData.indicatorPosition = [...worldIndicatorPos];
        }

        if (conn.start.plane?.userData) {
          conn.start.plane.userData.indicatorPosition = [...worldIndicatorPos];
        }
      }

      // Update end position references
      if (conn.end?.objectId === id.toString()) {
        conn.end.position = [...worldIndicatorPos];
        conn.end.worldPosition = [...worldIndicatorPos];
        conn.end._textPositionLocked = true;

        if (conn.end.cube?.userData) {
          conn.end.cube.userData.indicatorPosition = [...worldIndicatorPos];
        }

        if (conn.end.plane?.userData) {
          conn.end.plane.userData.indicatorPosition = [...worldIndicatorPos];
        }
      }
    });
  }, [connections, id, updateIndicatorPosition]);

  // Effects
  useLayoutEffect(() => {
    if (isEditing) {
      requestAnimationFrame(adjustHeight);
    } else {
      adjustDisplayHeight();
    }
  }, [text, isEditing, textStyle.fontSize]);

  // Combined dimension updates and indicator position updates
  useEffect(() => {
    if (isActivelyEditing) return;

    updateIndicatorPosition();

    const timer = setTimeout(() => {
      updateIndicatorPosition();
      updateContainerDimensions();
    }, 50);

    return () => clearTimeout(timer);
  }, [
    containerDimensionsRef.current.height,
    containerDimensionsRef.current.width,
    text,
    textStyle.fontSize,
    scale,
    position,
    isActivelyEditing,
    updateIndicatorPosition,
  ]);

  // Combined selection effects
  useEffect(() => {
    if (!selected) {
      setShowTransform(false);
      setIsEditing(false);
      indicatorSelectedRef.current = false;

      // Save pending changes when deselected
      if (pendingChangesRef.current && onUpdate) {
        onUpdate(id, pendingChangesRef.current);
        if (groupRef.current) {
          groupRef.current.lastUpdate = pendingChangesRef.current;
        }
        pendingChangesRef.current = null;
      }
    }
  }, [selected, id, onUpdate]);

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

  // Mutation observer for content changes in non-editing mode
  useEffect(() => {
    if (!isEditing && displayRef.current) {
      const observer = new MutationObserver(adjustDisplayHeight);
      observer.observe(displayRef.current, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      return () => observer.disconnect();
    }
  }, [isEditing]);

  // Combined connection sync and database update
  useEffect(() => {
    if (!isActivelyEditing) {
      syncConnectionPositions();
      updateDatabase();
    }
  }, [
    syncConnectionPositions,
    updateDatabase,
    isActivelyEditing,
    scale,
    text.length,
    textStyle.fontSize,
  ]);

  // Cursor positioning effect
  useEffect(() => {
    if (isEditing && text) {
      requestAnimationFrame(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.selectionStart = text.length;
          textAreaRef.current.selectionEnd = text.length;
        }
      });
    }
  }, [isEditing, text.length]);

  // Update rotation to always face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  // Trigger database updates
  useEffect(() => {
    updateDatabase();
  }, [updateDatabase]);

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        userData={{
          type: 'textObject',
          id: id,
          objectId: id,
          isTextEditing: isActivelyEditing,
          containerDimensions: containerDimensionsRef.current,
        }}
      >
        <Html transform position={[0, 0, 0.1]} center>
          <div
            style={getContainerStyle()}
            className="text-object-container"
            onClick={handleDivClick} // Add click handler to parent div for better click area
          >
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                value={text}
                onChange={handleTextChange}
                onBlur={handleBlur}
                style={getTextAreaStyle()}
                onKeyDown={handleKeyDown}
                placeholder={bulletPointMode ? '• ' : 'Click to edit text...'}
                onFocus={(e) => {
                  e.target.selectionStart = text.length;
                  e.target.selectionEnd = text.length;
                }}
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to container
              />
            ) : (
              <div
                ref={displayRef}
                onClick={handleTextClick}
                style={{
                  ...getTextAreaStyle(),
                  userSelect: 'none',
                  cursor: 'text',
                  width: '100%', // Ensure div takes full width for easier clicking
                  minHeight: '2em', // Ensure there's always a clickable area
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
            position={getIndicatorPositions().bottom}
            rotation={[0, 0, 0]}
            onClick={handleIndicatorClick}
            isActive={indicatorSelectedRef.current || isIndicatorConnected()}
            objectId={id}
            face="bottom"
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
          onDragStart={() => {
            if (window.orbitControls) window.orbitControls.enabled = false;
            onTransformStart?.(id);
          }}
          onDragEnd={() => {
            if (window.orbitControls) window.orbitControls.enabled = true;
            onTransformEnd?.(id);
          }}
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
            if (window.orbitControls) window.orbitControls.enabled = false;
            registerTransformingObject?.(id, true);

            if (groupRef.current) {
              originalScaleRef.current = [...scale];
              groupRef.current.userData.scaleBeforeTransform = [...scale];
              groupRef.current.scale.set(scale[0], scale[1], scale[2]);

              setTimeout(() => {
                if (groupRef.current) {
                  groupRef.current.scale.set(scale[0], scale[1], scale[2]);
                }
              }, 0);
            }
          }}
          onDragEnd={() => {
            if (window.orbitControls) window.orbitControls.enabled = true;
            registerTransformingObject?.(id, false);

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
      {selected && isEditing && (
        <TextObjectUI
          ref={uiMenuRef}
          text={text}
          textStyle={textStyle}
          onStyleChange={handleStyleChange}
          onDelete={onDelete}
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
