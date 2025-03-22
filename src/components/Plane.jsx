import {
  Line,
  TransformControls as DreiTransformControls,
} from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI';
import HeaderInput from './HeaderInput';
import FaceIndicator from './FaceIndicator';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';

const Plane = ({
  position = [0, 0, 0],
  selected,
  onClick,
  onIndicatorSelected,
  onIndicatorDeselected,
  onFaceIndicatorClick,
  showAllIndicators,
  globalIndicatorSelected,
  connections,
  selectedIndicators,
  indicatorMode,
  id,
  onUpdate,
  onDelete, // Add this prop
  scale: initialScale = [1, 1, 1],
  color: initialColor = null,
  headerText: initialHeaderText = '',
  borderStyle: initialBorderStyle = 'solid',
  borderColor: initialBorderColor = 'white',
  lineThickness: initialLineThickness = 1,
  headerStyle: initialHeaderStyle = {
    fontSize: 1.5,
    color: 'white',
    underline: false,
  },
  faceText: initialFaceText = '',
  faceTextStyle: initialFaceTextStyle = {
    fontSize: 0.5,
    color: 'white',
    underline: false,
  },
  onTransformStart,
  onTransformEnd,
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const contentRef = useRef();
  const { camera } = useThree();
  const size = 5;

  const [showUI, setShowUI] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showHeaderStyleUI, setShowHeaderStyleUI] = useState(false);
  const [indicatorSelected, setIndicatorSelected] = useState(false);

  const [currentScale, setCurrentScale] = useState(initialScale);
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [currentHeaderText, setCurrentHeaderText] = useState(initialHeaderText);
  const [currentHeaderStyle, setCurrentHeaderStyle] =
    useState(initialHeaderStyle);
  const [currentBorderStyle, setCurrentBorderStyle] =
    useState(initialBorderStyle);
  const [currentBorderColor, setCurrentBorderColor] =
    useState(initialBorderColor);
  const [currentLineThickness, setCurrentLineThickness] =
    useState(initialLineThickness);
  const [currentFaceText, setCurrentFaceText] = useState(initialFaceText);
  const [currentFaceTextStyle, setCurrentFaceTextStyle] =
    useState(initialFaceTextStyle);
  const [isScaleModified, setIsScaleModified] = useState(false);

  // Last update ref to avoid redundant database updates
  const lastUpdateRef = useRef(null);
  // Last world position ref for connection calculations
  const lastWorldPosRef = useRef(null);

  // Sync props to state
  useEffect(() => {
    if (initialScale !== undefined) setCurrentScale(initialScale);
  }, [initialScale]);
  useEffect(() => {
    if (initialColor !== undefined) setCurrentColor(initialColor);
  }, [initialColor]);
  useEffect(() => {
    if (initialHeaderText !== undefined)
      setCurrentHeaderText(initialHeaderText);
  }, [initialHeaderText]);
  useEffect(() => {
    if (initialBorderStyle !== undefined)
      setCurrentBorderStyle(initialBorderStyle);
  }, [initialBorderStyle]);
  useEffect(() => {
    if (initialBorderColor !== undefined)
      setCurrentBorderColor(initialBorderColor);
  }, [initialBorderColor]);
  useEffect(() => {
    if (initialLineThickness !== undefined)
      setCurrentLineThickness(initialLineThickness);
  }, [initialLineThickness]);
  useEffect(() => {
    if (initialHeaderStyle !== undefined)
      setCurrentHeaderStyle(initialHeaderStyle);
  }, [initialHeaderStyle]);
  useEffect(() => {
    if (initialFaceText !== undefined) setCurrentFaceText(initialFaceText);
  }, [initialFaceText]);
  useEffect(() => {
    if (initialFaceTextStyle !== undefined)
      setCurrentFaceTextStyle(initialFaceTextStyle);
  }, [initialFaceTextStyle]);

  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
    setShowHeader(false);
    setShowHeaderStyleUI(false);
  }, []);

  const points = [
    new Vector3(-size, -size, 0),
    new Vector3(size, -size, 0),
    new Vector3(size, size, 0),
    new Vector3(-size, size, 0),
    new Vector3(-size, -size, 0),
  ];

  // Keep plane facing camera
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  // Handle selection/deselection
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();
    } else if (!indicatorSelected) {
      setShowUI(true);
    }
  }, [selected, closeAllUIs, onIndicatorDeselected, indicatorSelected]);

  // Handle global clicks for UI elements
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isTextStyleUIClick = e.target.closest('.text-style-ui');
      const isTextClick = e.target.closest('.text-sprite');
      if (!isTextStyleUIClick && !isTextClick) {
        setShowTextStyleUI(false);
      }
    };

    if (showTextStyleUI) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showTextStyleUI]);

  // Update world position when transform changes
  useEffect(() => {
    if (groupRef.current && contentRef.current) {
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      lastWorldPosRef.current = [worldPos.x, worldPos.y, worldPos.z];
      groupRef.current._worldMatrix = groupRef.current.matrixWorld.clone();
    }
  }, [position, currentScale]);

  // Update database with state changes
  useEffect(() => {
    if (!onUpdate || !id) return;

    const currentState = {
      type: 'plane',
      position,
      scale: currentScale,
      color: currentColor,
      headerText: currentHeaderText,
      headerStyle: currentHeaderStyle,
      borderStyle: currentBorderStyle,
      borderColor: currentBorderColor,
      lineThickness: currentLineThickness,
      faceText: currentFaceText,
      faceTextStyle: currentFaceTextStyle,
    };

    // Only update if state has changed
    if (
      !lastUpdateRef.current ||
      !isEqual(lastUpdateRef.current, currentState)
    ) {
      lastUpdateRef.current = currentState;
      onUpdate(id, currentState);
    }
  }, [
    id,
    onUpdate,
    position,
    currentScale,
    currentColor,
    currentHeaderText,
    currentHeaderStyle,
    currentBorderStyle,
    currentBorderColor,
    currentLineThickness,
    currentFaceText,
    currentFaceTextStyle,
  ]);

  // Add a timeout ref to properly manage debounce
  const scaleTimeoutRef = useRef(null);

  // Replace the scale handling mechanism with a ref-based approach
  const pendingScaleRef = useRef(null);
  const isTransformingRef = useRef(false);

  // Completely rewrite the handleScale function to avoid state update cycles
  const handleScale = (e) => {
    if (!e.target || !e.target.object) return;

    // Store scale values in the ref instead of setting state immediately
    pendingScaleRef.current = [
      e.target.object.scale.x,
      e.target.object.scale.y,
      currentScale[2], // Keep Z scale unchanged
    ];

    // Flag that we're in a transform operation
    isTransformingRef.current = true;

    // Set a timeout to apply the scale change after the current render cycle
    if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);

    scaleTimeoutRef.current = setTimeout(() => {
      if (pendingScaleRef.current) {
        // Apply the pending scale and reset the flag
        setCurrentScale(pendingScaleRef.current);
        pendingScaleRef.current = null;
      }
    }, 50); // Very short timeout to break the render cycle
  };

  // Add effect to handle the transform end event separately from scale changes
  useEffect(() => {
    if (isTransformingRef.current && !pendingScaleRef.current) {
      isTransformingRef.current = false;

      // Now that we've applied the scale and we're not transforming, update the database
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          position,
          scale: currentScale,
          color: currentColor,
          headerText: currentHeaderText,
          headerStyle: currentHeaderStyle,
          borderStyle: currentBorderStyle,
          borderColor: currentBorderColor,
          lineThickness: currentLineThickness,
          faceText: currentFaceText,
          faceTextStyle: currentFaceTextStyle,
        });
      }

      // Call transform end callback
      if (onTransformEnd) {
        onTransformEnd(id);
      }
    }
  }, [currentScale, isTransformingRef.current]);

  // Add an extra cleanup step to prevent any lingering updates
  useEffect(() => {
    return () => {
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
      isTransformingRef.current = false;
      pendingScaleRef.current = null;
    };
  }, []);

  // Handle dragging for position updates - improve this to save to database
  const handleDrag = (e) => {
    if (groupRef.current) {
      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);

      // Calculate the new world position with offset
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      lastWorldPosRef.current = worldPosArray;

      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      // Update any connected connection points in real-time
      if (connections) {
        connections.forEach((conn) => {
          // Update start position if this plane is the start object
          if (
            conn.start?.objectId === String(id) ||
            conn.start?.plane === groupRef.current
          ) {
            conn.start.position = [...worldPosArray];
            conn.start.worldPosition = [...worldPosArray];
            conn.start.facePosition = [...worldPosArray];
            conn.start.faceCenter = [...worldPosArray];
          }

          // Update end position if this plane is the end object
          if (
            conn.end?.objectId === String(id) ||
            conn.end?.plane === groupRef.current
          ) {
            conn.end.position = [...worldPosArray];
            conn.end.worldPosition = [...worldPosArray];
            conn.end.facePosition = [...worldPosArray];
            conn.end.faceCenter = [...worldPosArray];
          }
        });
      }

      // Add these critical properties to userData to help ConnectionUpdater
      if (groupRef.current) {
        groupRef.current.userData = {
          ...groupRef.current.userData,
          isPlane: true,
          objectId: String(id),
          id: String(id),
          indicatorOffset: [0, -5 * currentScale[1], 0],
          indicatorWorldPosition: worldPosArray,
          worldPosition: worldPosArray,
          facePosition: worldPosArray,
          isMoving: true,
          _lastUpdateTime: Date.now(),
          _isDragging: true,
        };
      }

      // Always update position in database during drag with all connection data
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          position: [newPos.x, newPos.y, newPos.z],
          worldPosition: worldPosArray,
          planeData: {
            worldMatrix,
            position: [newPos.x, newPos.y, newPos.z],
            scale: currentScale,
            offset: [0, -5 * currentScale[1], 0],
          },
          _isDragging: true,
          _indicatorWorldPosition: worldPosArray,
        });
      }
    }
  };

  // Add transform start/end handlers
  const handleTransformStart = () => {
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
    if (onTransformStart) {
      onTransformStart(id);
    }
  };

  const handleTransformEnd = () => {
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }

    // Final position update at transform end - crucial for database saving
    if (groupRef.current && onUpdate) {
      const newPos = groupRef.current.position;

      // Calculate world data for connections
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      // Update any connected connection points one final time
      if (connections) {
        connections.forEach((conn) => {
          // Update start position if this plane is the start object
          if (
            conn.start?.objectId === String(id) ||
            conn.start?.plane === groupRef.current
          ) {
            conn.start.position = [...worldPosArray];
            conn.start.worldPosition = [...worldPosArray];
            conn.start.facePosition = [...worldPosArray];
            conn.start.faceCenter = [...worldPosArray];
          }

          // Update end position if this plane is the end object
          if (
            conn.end?.objectId === String(id) ||
            conn.end?.plane === groupRef.current
          ) {
            conn.end.position = [...worldPosArray];
            conn.end.worldPosition = [...worldPosArray];
            conn.end.facePosition = [...worldPosArray];
            conn.end.faceCenter = [...worldPosArray];
          }
        });
      }

      // Save the final position to the database with all necessary data
      onUpdate(id, {
        type: 'plane',
        position: [newPos.x, newPos.y, newPos.z],
        worldPosition: worldPosArray,
        planeData: {
          worldMatrix,
          position: [newPos.x, newPos.y, newPos.z],
          scale: currentScale,
          offset: [0, -5 * currentScale[1], 0],
        },
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        _finalPosition: true,
        _indicatorWorldPosition: worldPosArray,
      });
    }

    if (onTransformEnd) {
      onTransformEnd(id);
    }
  };

  // UI event handlers
  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    if (!selected) {
      closeAllUIs();
      setShowUI(true);
    } else {
      setShowUI(true);
    }
  };

  const handleTextClick = () => {
    closeAllUIs();
    setShowTextInput(true);
  };

  const handleTextSubmit = (newText) => {
    setCurrentFaceText(newText);
    closeAllUIs();
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: newText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleTextStyleChange = (newStyle) => {
    const updatedStyle = { ...currentFaceTextStyle, ...newStyle };
    setCurrentFaceTextStyle(updatedStyle);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: updatedStyle,
      });
    }
  };

  const handleTextSpriteClick = (e) => {
    e.stopPropagation();
    closeAllUIs();
    setShowTextStyleUI(true);
  };

  const handleTransformToggle = () => {
    setShowTransform((prev) => !prev);
    setShowUI(false);
  };

  const handleResizeToggle = () => {
    setIsResizing((prev) => {
      if (!prev) setShowTransform(false);
      return !prev;
    });
    setShowUI(false);
  };

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: newColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleHeaderToggle = () => {
    closeAllUIs();
    setShowHeader(true);
  };

  const handleHeaderSubmit = (text) => {
    setCurrentHeaderText(text);
    setShowHeader(false);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: text,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleHeaderTextClick = (e) => {
    e.stopPropagation();
    closeAllUIs();
    setShowHeaderStyleUI(true);
    setShowUI(false);
  };

  const handleHeaderStyleChange = (newStyle) => {
    const updatedStyle = { ...currentHeaderStyle, ...newStyle };
    setCurrentHeaderStyle(updatedStyle);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: updatedStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleBorderToggle = (option) => {
    if (!onUpdate || !id) return;

    const updates = {
      type: 'plane',
      position,
      scale: currentScale,
      color: currentColor,
      headerText: currentHeaderText,
      headerStyle: currentHeaderStyle,
      borderStyle: currentBorderStyle,
      borderColor: currentBorderColor,
      lineThickness: currentLineThickness,
      faceText: currentFaceText,
      faceTextStyle: currentFaceTextStyle,
    };

    if (option.type === 'style') {
      updates.borderStyle = option.value;
      setCurrentBorderStyle(option.value);
    } else if (option.type === 'color') {
      updates.borderColor = option.value;
      setCurrentBorderColor(option.value);
    } else if (option.type === 'thickness') {
      const newThickness =
        currentLineThickness >= 6 ? 1 : currentLineThickness + 2;
      updates.lineThickness = newThickness;
      setCurrentLineThickness(newThickness);
    }

    onUpdate(id, updates);
  };

  // Position calculation helpers
  const getUIPositions = () => {
    const planeHeight = 10 * currentScale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 5;

    return {
      faceUI: [0, verticalOffset + 2, zOffset],
      headerInput: [position[0], position[1] + verticalOffset + 4, position[2]],
      headerText: [position[0], position[1] + verticalOffset + 4, position[2]],
    };
  };

  const getIndicatorPositions = () => ({
    bottom: [0, -5 - 1, 0], // 5 is half the plane height, -1 is offset
  });

  // Connection indicator handling
  const handleIndicatorClick = (e) => {
    e.stopPropagation();

    try {
      const planeRef = contentRef.current || groupRef.current;
      if (!planeRef) return;

      planeRef.updateWorldMatrix(true, false);
      const worldMatrix = planeRef.matrixWorld.clone();

      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
      const worldPos = new THREE.Vector3();

      planeRef.getWorldPosition(worldPos);
      offset.applyQuaternion(planeRef.quaternion);
      worldPos.add(offset);

      const positionArray = [worldPos.x, worldPos.y, worldPos.z];

      const stringId = String(id);
      const indicator = {
        type: 'plane',
        position: positionArray,
        worldPosition: positionArray,
        facePosition: positionArray, // Add explicit facePosition
        faceCenter: positionArray, // Add explicit faceCenter
        face: 'bottom',
        plane: planeRef, // Store direct reference to the plane object
        scale: [...currentScale],
        planeData: {
          position: [...position],
          scale: [...currentScale],
          worldMatrix: Array.from(worldMatrix.elements),
          offset: [0, -5 * currentScale[1], 0],
        },
        // Include standardized data for compatibility
        cube: {
          id: stringId,
          position,
          scale: currentScale,
          userData: {
            objectId: stringId,
            planeRef: planeRef, // Store reference in userData as well
            indicatorPosition: positionArray,
          },
        },
        id: stringId,
        objectId: stringId,
      };

      setIndicatorSelected(true);
      onIndicatorSelected?.();
      onFaceIndicatorClick?.(indicator);
    } catch (error) {
      console.error('Error in handleIndicatorClick:', error);
    }
  };

  const isIndicatorConnected = () => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  };

  const shouldShowIndicator = () => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected()) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  };

  return (
    <>
      <group ref={groupRef} position={position}>
        <group ref={contentRef} scale={currentScale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={currentColor || (selected ? '#99ccff' : 'white')}
              transparent
              opacity={currentColor ? 1 : selected ? 0.1 : 0}
              depthWrite={!!currentColor}
            />
          </mesh>
          <Line
            points={points}
            color={selected ? 'blue' : currentBorderColor}
            lineWidth={currentLineThickness}
            dashed={currentBorderStyle !== 'solid'}
            dashScale={currentBorderStyle === 'dotted' ? 1 : 2}
            dashSize={currentBorderStyle === 'dotted' ? 0.1 : 1}
            gapSize={currentBorderStyle === 'dotted' ? 0.1 : 0.5}
          />
          {shouldShowIndicator() && (
            <FaceIndicator
              position={getIndicatorPositions().bottom}
              rotation={[0, 0, 0]}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected()}
            />
          )}
        </group>

        {selected && showUI && (
          <FaceUI
            position={getUIPositions().faceUI}
            onColorChange={handleColorChange}
            face="front"
            onTextClick={handleTextClick}
            isPlane={true}
            onTransformToggle={handleTransformToggle}
            onResizeToggle={handleResizeToggle}
            onHeaderToggle={handleHeaderToggle}
            onBorderToggle={handleBorderToggle}
            followTarget={groupRef}
            onDelete={() => onDelete?.(id)} // Add this line to handle deletion
          />
        )}

        {showTextInput && (
          <FaceTextInput position={[0, 6, 0]} onTextSubmit={handleTextSubmit} />
        )}

        {currentFaceText && (
          <TextSprite
            text={currentFaceText}
            position={[0, 0, 0.1]}
            style={{
              ...currentFaceTextStyle,
              fixedSize: true,
            }}
            onClick={handleTextSpriteClick}
            billboard={false}
          />
        )}

        {showTextStyleUI && (
          <TextStyleUI
            position={[0, 10, 0]}
            onStyleChange={handleTextStyleChange}
            onClose={() => closeAllUIs()}
          />
        )}
      </group>

      {selected && isResizing && contentRef.current && (
        <DreiTransformControls
          key={`scale-controls-${id}`} // Add a stable key
          object={contentRef.current}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = false;
            }
            if (onTransformStart) {
              onTransformStart(id);
            }
          }}
          onDragEnd={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = true;
            }
            // Force final update on drag end
            if (pendingScaleRef.current) {
              setCurrentScale(pendingScaleRef.current);
              pendingScaleRef.current = null;
            }
          }}
          mode="scale"
          space="local"
          size={1}
          matrixAutoUpdate={false}
          showX={true}
          showY={true}
          showZ={false}
        />
      )}

      {showHeader && (
        <HeaderInput
          position={getUIPositions().headerInput}
          onTextSubmit={handleHeaderSubmit}
          followTarget={groupRef}
        />
      )}

      {currentHeaderText && (
        <TextSprite
          text={currentHeaderText}
          position={getUIPositions().headerText}
          followTarget={groupRef}
          onClick={handleHeaderTextClick}
          style={{
            ...currentHeaderStyle,
            isHeaderText: true,
            isPlaneHeader: true,
            fixedSize: true,
            fixedPosition: true,
          }}
          billboard={true}
        />
      )}

      {showHeaderStyleUI && (
        <TextStyleUI
          position={[0, 12, 0]}
          onStyleChange={handleHeaderStyleChange}
          onClose={() => {
            setShowHeaderStyleUI(false);
            setShowUI(true);
          }}
          followTarget={groupRef}
          uiType="header"
        />
      )}

      {selected && showTransform && groupRef.current && (
        <DreiTransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
          onDragStart={handleTransformStart}
          onDragEnd={handleTransformEnd}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
    </>
  );
};

export default Plane;
