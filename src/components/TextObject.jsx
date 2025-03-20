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
import debounce from 'lodash/debounce'; // Add debounce import

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

  // Add state to track text editing activity
  const [isActivelyEditing, setIsActivelyEditing] = useState(false);
  const textUpdateTimeoutRef = useRef(null);

  // Add a ref to track unsaved changes
  const pendingChangesRef = useRef(null);

  // Add a ref to track original scale before transforms
  const originalScaleRef = useRef(scale);

  // Add a ref to track container dimensions
  const containerDimensionsRef = useRef({ width: 0, height: 0 });

  // Update originalScaleRef whenever scale changes
  useEffect(() => {
    originalScaleRef.current = [...scale];
  }, [scale]);

  // Modify updateDatabase to check if we should actually update
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id) return;

    // If editing, store changes but don't send to server
    const currentState = {
      type: 'text',
      position,
      scale,
      text,
      textStyle,
      bulletPointMode,
      lastEditTime: isActivelyEditing ? Date.now() : undefined,
    };

    // Store current state for later update
    pendingChangesRef.current = currentState;

    // Only update server if not actively editing text
    if (!isEditing) {
      // Only update if something has changed
      if (
        !groupRef.current?.lastUpdate ||
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
    isEditing, // Add this dependency
  ]);

  // Now define debouncedTextUpdate after updateDatabase
  const debouncedTextUpdate = useCallback(
    debounce(() => {
      setIsActivelyEditing(false);
    }, 500),
    []
  );

  // Adjust the height of the textarea based on its content
  const adjustHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;

      // Update container dimensions after height adjustment
      setTimeout(updateContainerDimensions, 0);
    }
  };

  // Modify handleTextChange to update local state without server updates
  const handleTextChange = (e) => {
    setText(e.target.value);
    setIsActivelyEditing(true);
    adjustHeight();

    // Store the change but don't send to server yet
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      text: e.target.value,
    };

    // Clear any pending update timeout
    if (textUpdateTimeoutRef.current) {
      clearTimeout(textUpdateTimeoutRef.current);
    }

    // Flag the text object in userData to prevent connection updates
    if (groupRef.current) {
      groupRef.current.userData.isTextEditing = true;

      // Clear the flag after editing stops
      textUpdateTimeoutRef.current = setTimeout(() => {
        if (groupRef.current) {
          groupRef.current.userData.isTextEditing = false;
        }
      }, 1000);
    }
  };

  // Improved getIndicatorPositions function that uses actual container dimensions
  const getIndicatorPositions = () => {
    // Get current container height - make sure we have a real value
    const containerHeight = containerDimensionsRef.current.height || 50;

    // Convert to scene units - use a direct conversion that accounts for text size
    const yOffset = containerHeight / conversionFactor + 0.25; // Add small buffer for spacing

    // Position should be bottom-center of the actual text container
    return {
      bottom: [0, -yOffset, 0],
    };
  };

  // Function to update container dimensions
  const updateContainerDimensions = () => {
    if (displayRef.current || textAreaRef.current) {
      // Get height from either the display div or textarea, whichever is active
      const element = isEditing ? textAreaRef.current : displayRef.current;
      const height = element?.offsetHeight || 0;
      const width = element?.offsetWidth || 0;

      const dimensionsChanged =
        height !== containerDimensionsRef.current.height ||
        width !== containerDimensionsRef.current.width;

      if (dimensionsChanged) {
        // Update stored dimensions
        containerDimensionsRef.current = { width, height };

        // If dimensions changed significantly, update indicator position
        if (
          Math.abs(height - (containerDimensionsRef.current.height || 0)) > 2
        ) {
          // Immediately update indicator position
          updateIndicatorPosition();

          // Force a refresh of connection positions if needed
          if (
            connections?.some(
              (conn) =>
                conn.start?.objectId === id.toString() ||
                conn.end?.objectId === id.toString()
            )
          ) {
            // Notify parent about position changes
            // This could trigger connection updates
            const worldPos = updateIndicatorPosition();
            if (onUpdate && !isActivelyEditing) {
              onUpdate(id, {
                indicatorPosition: worldPos,
                lastUpdated: Date.now(),
                containerHeight: height,
              });
            }
          }
        }
      }
    }
  };

  // Improve the indicator position calculation to handle scale changes properly
  const calculateIndicatorPosition = () => {
    // Get the group’s world position
    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);
    // Compute offset from container dimensions via getIndicatorPositions()
    const indicatorOffset = getIndicatorPositions().bottom;
    const worldIndicatorPos = [
      worldPosition.x + indicatorOffset[0],
      worldPosition.y + indicatorOffset[1],
      worldPosition.z + indicatorOffset[2],
    ];
    // Store it for connectionManager use
    groupRef.current.userData.indicatorPosition = [...worldIndicatorPos];
    return worldIndicatorPos;
  };

  // Add this function to ensure connections receive accurate position data
  // Modify updateIndicatorPosition to properly update ALL connection references
  const updateIndicatorPosition = () => {
    if (!groupRef.current) return;

    // Calculate the updated indicator position
    const indicatorPos = getIndicatorPositions();
    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);
    const worldIndicatorPos = [
      worldPosition.x + indicatorPos.bottom[0],
      worldPosition.y + indicatorPos.bottom[1],
      worldPosition.z + indicatorPos.bottom[2],
    ];

    // Store consistently in ALL relevant locations
    if (groupRef.current.userData) {
      // 1. Store in the group's userData (primary reference)
      groupRef.current.userData.indicatorPosition = [...worldIndicatorPos];
      groupRef.current.userData.indicatorOffset = [
        0,
        indicatorPos.bottom[1],
        0,
      ];
      groupRef.current.userData.indicatorLastUpdated = Date.now();
    }

    // 2. Update ALL connection references that use this text object
    if (connections) {
      connections.forEach((conn) => {
        // Check if this text object is part of the connection
        if (conn.start?.objectId === id.toString()) {
          // Update ALL possible storage locations
          conn.start.position = [...worldIndicatorPos];

          // Update the plane reference
          if (conn.start.plane) {
            conn.start.plane.userData = conn.start.plane.userData || {};
            conn.start.plane.userData.indicatorPosition = [
              ...worldIndicatorPos,
            ];
            conn.start.plane.userData.indicatorOffset = [
              0,
              indicatorPos.bottom[1],
              0,
            ];
          }

          // Update the cube reference (some connections use this instead)
          if (conn.start.cube) {
            conn.start.cube.userData = conn.start.cube.userData || {};
            conn.start.cube.userData.indicatorPosition = [...worldIndicatorPos];
          }

          // Store as worldPosition too (used by ConnectionUpdater)
          conn.start.worldPosition = [...worldIndicatorPos];
        }

        if (conn.end?.objectId === id.toString()) {
          // Same updates for end position
          conn.end.position = [...worldIndicatorPos];

          if (conn.end.plane) {
            conn.end.plane.userData = conn.end.plane.userData || {};
            conn.end.plane.userData.indicatorPosition = [...worldIndicatorPos];
            conn.end.plane.userData.indicatorOffset = [
              0,
              indicatorPos.bottom[1],
              0,
            ];
          }

          if (conn.end.cube) {
            conn.end.cube.userData = conn.end.cube.userData || {};
            conn.end.cube.userData.indicatorPosition = [...worldIndicatorPos];
          }

          conn.end.worldPosition = [...worldIndicatorPos];
        }
      });
    }

    // 3. Also update any stored reference in the parent via callback
    if (
      onUpdate &&
      connections?.some(
        (conn) =>
          conn.start?.objectId === id.toString() ||
          conn.end?.objectId === id.toString()
      )
    ) {
      onUpdate(id, {
        indicatorPosition: worldIndicatorPos,
        lastUpdated: Date.now(),
        indicatorOffset: [0, indicatorPos.bottom[1], 0],
      });
    }

    return worldIndicatorPos;
  };

  // Call this function whenever position or scale changes
  // Add this effect to update indicator position when container dimensions change
  useEffect(() => {
    // Skip updates during text editing to prevent jitter
    if (isActivelyEditing) return;

    // Use immediate update instead of RAF to ensure position is updated before render
    updateIndicatorPosition();

    // Schedule another update after DOM measurements have settled
    const timer = setTimeout(() => {
      updateIndicatorPosition();
    }, 50);

    return () => clearTimeout(timer);
  }, [
    containerDimensionsRef.current.height,
    containerDimensionsRef.current.width,
    // Add these dependencies to ensure position updates when they change
    text,
    textStyle.fontSize,
    scale,
    position,
  ]);

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

  // Update the handleIndicatorClick function to match exactly what Plane.jsx does
  const handleIndicatorClick = (e) => {
    e.stopPropagation();

    // ✅ Get the actual world position from the THREE.js world matrix
    const worldPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPosition);

    // ✅ Calculate indicator position as offset from world position
    const indicatorOffset = getIndicatorPositions().bottom;
    const worldIndicatorPos = [
      worldPosition.x + indicatorOffset[0],
      worldPosition.y + indicatorOffset[1],
      worldPosition.z + indicatorOffset[2],
    ];

    // IMPORTANT: Create an indicator object with the EXACT property structure that Plane.jsx uses
    const indicator = {
      plane: groupRef.current,
      type: 'text',
      // ✅ These two properties are crucial and must be properly calculated world positions
      position: worldIndicatorPos, // Connection system uses this primarily
      worldPosition: worldIndicatorPos, // This is the backup the system checks
      objectId: id,
      id: id,
      face: 'bottom',
      scale: scale,
      // The cube reference structure must match what Plane.jsx provides
      cube: {
        id: id,
        position: position, // Original object position
        scale: scale,
        userData: {
          id: id,
          objectId: id,
          // This needs to exactly match what ConnectionUpdater looks for
          indicatorPosition: worldIndicatorPos,
        },
      },
    };

    onIndicatorSelected?.();
    onFaceIndicatorClick?.(indicator);
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

  // Modify this effect to ensure cursor positioning works properly
  useEffect(() => {
    if (isEditing && text) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          // Set cursor position to the end of the text
          textAreaRef.current.selectionStart = text.length;
          textAreaRef.current.selectionEnd = text.length;
        }
      });
    }
  }, [isEditing, text.length]);

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
    setIsActivelyEditing(false);

    // Clear any editing flags
    if (groupRef.current) {
      groupRef.current.userData.isTextEditing = false;
    }

    // Now that editing is complete, save the changes to the server
    if (pendingChangesRef.current && onUpdate) {
      onUpdate(id, pendingChangesRef.current);

      // Update lastUpdate to prevent duplicate updates
      if (groupRef.current) {
        groupRef.current.lastUpdate = pendingChangesRef.current;
      }
    }
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

      // Update container dimensions after height adjustment
      setTimeout(updateContainerDimensions, 0);
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

  // Modified scale handler that preserves object initialization state
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

      // Store the new scale in userData for transform controls to access
      groupRef.current.userData.currentScale = [...newScale];

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

  // Update effect for selection change to save pending changes
  useEffect(() => {
    if (!selected && pendingChangesRef.current && onUpdate) {
      // When deselected, save any pending changes
      onUpdate(id, pendingChangesRef.current);

      // Update lastUpdate to prevent duplicate updates
      if (groupRef.current) {
        groupRef.current.lastUpdate = pendingChangesRef.current;
      }

      // Clear pending changes
      pendingChangesRef.current = null;
    }
  }, [selected, id, onUpdate]);

  // Add an effect to update container dimensions when text or scale changes
  useEffect(() => {
    // Short delay to ensure DOM is updated
    const timer = setTimeout(updateContainerDimensions, 50);
    return () => clearTimeout(timer);
  }, [text, scale, textStyle.fontSize]);

  // Add mutation observer for content changes in non-editing mode
  useEffect(() => {
    if (!isEditing && displayRef.current) {
      const observer = new MutationObserver(() => {
        adjustDisplayHeight();
      });

      observer.observe(displayRef.current, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, [isEditing]);

  // Add a function to explicitly sync connections whenever indicator position changes
  const syncConnectionPositions = useCallback(() => {
    if (!connections || !groupRef.current) return;

    const worldIndicatorPos = updateIndicatorPosition();

    // Find and update any connections using this text object
    connections.forEach((conn) => {
      if (conn.start?.objectId === id.toString()) {
        // Force update ALL position fields
        conn.start.position = [...worldIndicatorPos];
        conn.start.worldPosition = [...worldIndicatorPos];

        // Set a flag to prevent other systems from overwriting this position
        conn.start._textPositionLocked = true;

        // Update references inside connection object
        if (conn.start.cube?.userData) {
          conn.start.cube.userData.indicatorPosition = [...worldIndicatorPos];
        }

        if (conn.start.plane?.userData) {
          conn.start.plane.userData.indicatorPosition = [...worldIndicatorPos];
        }
      }

      if (conn.end?.objectId === id.toString()) {
        // Similar updates for end position
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
  }, [id, connections, updateIndicatorPosition]);

  // Add useEffect to call syncConnectionPositions whenever needed
  useEffect(() => {
    if (!isActivelyEditing) {
      // Run this once immediately
      syncConnectionPositions();

      // And schedule another sync after a short delay
      const timer = setTimeout(syncConnectionPositions, 100);
      return () => clearTimeout(timer);
    }
  }, [
    syncConnectionPositions,
    isActivelyEditing,
    scale,
    text,
    position,
    textStyle.fontSize,
  ]);

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        userData={{
          type: 'textObject',
          id: id,
          objectId: id,
          isTextEditing: isActivelyEditing, // Add editing flag to userData
          containerDimensions: containerDimensionsRef.current, // Include container dimensions
        }}
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
                // Don't use autoFocus as it can conflict with programmatic focus
                onKeyDown={handleKeyDown} // New onKeyDown handler
                placeholder={bulletPointMode ? '• ' : 'Click to edit text...'} // Updated placeholder
                // Add this onFocus handler to ensure cursor is at the end
                onFocus={(e) => {
                  e.target.selectionStart = text.length;
                  e.target.selectionEnd = text.length;
                }}
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
          scale={scale} // Pass the current scale explicitly
          onObjectChange={handleScale}
          onDragStart={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            registerTransformingObject?.(id, true);

            // Immediately apply the current scale to the object
            if (groupRef.current) {
              // Store the original scale for reference
              originalScaleRef.current = [...scale];

              // Apply current scale right before drag starts
              groupRef.current.userData.scaleBeforeTransform = [...scale];
              groupRef.current.scale.set(scale[0], scale[1], scale[2]);

              // Force update to ensure changes are applied before first drag event
              setTimeout(() => {
                if (groupRef.current) {
                  // Apply a second time to make sure it sticks
                  groupRef.current.scale.set(scale[0], scale[1], scale[2]);
                }
              }, 0);
            }
          }}
          onDragEnd={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            registerTransformingObject?.(id, false);

            // Reset scale to 1 after dragging ends
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
