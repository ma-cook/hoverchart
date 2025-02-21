import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI'; // Add this import
import { TransformControls } from '@react-three/drei'; // Add this import
import ResizeArrows from './ResizeArrows'; // Fix import statement to use default import
import HeaderInput from './HeaderInput';
import FaceIndicator from './FaceIndicator'; // Keep this import
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
  selectedIndicators, // Add this prop
  indicatorMode,
  id, // Add id prop
  onUpdate, // Add onUpdate prop
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
}) => {
  const groupRef = useRef();
  const meshRef = useRef(); // Add meshRef
  const { camera } = useThree();
  const size = 5;
  const width = 10,
    height = 10; // dimensions used in planeGeometry

  const [showUI, setShowUI] = useState(false);

  const [showTextInput, setShowTextInput] = useState(false);

  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [scale, setScale] = useState([1, 1, 1]);

  const [showHeader, setShowHeader] = useState(false);

  const [showHeaderStyleUI, setShowHeaderStyleUI] = useState(false);

  const [indicatorSelected, setIndicatorSelected] = useState(false);

  // Replace direct state with "current" prefixed state
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

  // Add useEffect hooks to sync with props
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

  // Wrap closeAllUIs in useCallback and declare it before it’s used
  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
    setShowHeader(false);
    setShowHeaderStyleUI(false);
  }, []); // No dependencies as setters are stable

  const points = [
    new Vector3(-size, -size, 0),
    new Vector3(size, -size, 0),
    new Vector3(size, size, 0),
    new Vector3(-size, size, 0),
    new Vector3(-size, -size, 0),
  ];

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  // Update deselection effect to include TextStyleUI
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();
    } else {
      // When selected, show UI unless an indicator is selected
      if (!indicatorSelected) {
        setShowUI(true);
      }
    }
  }, [selected, closeAllUIs, onIndicatorDeselected, indicatorSelected]); // Added closeAllUIs as dependency

  // Close TextStyleUI when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Check if click is outside the TextStyleUI and the text
      const isTextStyleUIClick = e.target.closest('.text-style-ui');
      const isTextClick = e.target.closest('.text-sprite');

      if (!isTextStyleUIClick && !isTextClick) {
        setShowTextStyleUI(false);
      }
    };

    if (showTextStyleUI) {
      window.addEventListener('click', handleGlobalClick);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showTextStyleUI]);

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    if (onUpdate && id) {
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

  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    // Only reset UI state if not already selected
    if (!selected) {
      closeAllUIs();
      setShowUI(true);
    } else {
      // If already selected, just toggle UI visibility
      setShowUI(true);
    }
  };

  const handleTextClick = () => {
    closeAllUIs(); // Close all UIs first
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
    closeAllUIs(); // Close all UIs first
    setShowTextStyleUI(true);
  };

  const handleTransformToggle = () => {
    setShowTransform((prev) => !prev);
    setShowUI(false); // Hide UI when transform is active
  };

  const handleResizeToggle = () => {
    setIsResizing((prev) => {
      if (!prev) {
        setShowTransform(false); // Disable transform when enabling resize
      }
      return !prev;
    });
    setShowUI(false);
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1 }[axis]; // Only allow x and y resize for plane
    if (axisIndex !== undefined) {
      const newScale = [...currentScale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      setCurrentScale(newScale);
      if (onUpdate) {
        onUpdate(id, {
          scale: newScale,
          position,
          headerText: currentHeaderText,
          borderStyle: currentBorderStyle,
          borderColor: currentBorderColor,
          lineThickness: currentLineThickness,
          type: 'plane',
          faceText: currentFaceText,
          faceTextStyle: currentFaceTextStyle,
        });
      }
    }
  };

  // Compute margin offset so arrows appear outside the plane edges
  const arrowMargin = 1; // extra unit margin
  const computedArrowOffset = {
    x: (width / 2) * scale[0] + arrowMargin,
    y: (height / 2) * scale[1] + arrowMargin,
    z: 0,
  };

  const handleDrag = (e) => {
    // Update position from transform controls
    if (groupRef.current) {
      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);
      if (onUpdate) {
        onUpdate(id, {
          position: [newPos.x, newPos.y, newPos.z],
        });
      }
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
    setShowUI(false); // Add this to hide the main UI when showing header style UI
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

  // Update border toggle handler
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

  // Add function to calculate absolute positions
  const getUIPositions = () => {
    const planeHeight = 10 * scale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 5; // Offset for UI elements in front of plane

    return {
      faceUI: [0, verticalOffset + 2, zOffset], // Position for FaceUI above plane
      headerInput: [position[0], position[1] + verticalOffset + 4, position[2]],
      headerText: [position[0], position[1] + verticalOffset + 4, position[2]],
    };
  };

  // Add function to get indicator positions
  const getIndicatorPositions = () => {
    const planeHeight = 10;

    return {
      bottom: [0, -planeHeight / 2 - 1, 0],
    };
  };

  // New function to get world position for plane indicator
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

  // Update indicator click handler to use the new function
  const handleIndicatorClick = (e) => {
    e.stopPropagation();
    const indicator = {
      plane: groupRef.current,
      type: 'plane',
      position: calculateIndicatorPosition(),
    };

    // Call parent handlers first to show all indicators
    onIndicatorSelected?.();
    onFaceIndicatorClick?.(indicator);

    // Then update local state
    setIndicatorSelected(true);
  };

  // Add helper to check if indicator is connected
  const isIndicatorConnected = () => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  };

  // Update shouldShowIndicator to check global selectedIndicators state
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

  // Add an effect to update database when any relevant state changes
  useEffect(() => {
    if (onUpdate && id) {
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

      // Only update if the state has changed
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

  // Add lastUpdateRef to track changes
  const lastUpdateRef = useRef(null);

  // Update database whenever relevant state changes
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

  return (
    <>
      <group ref={groupRef} position={position}>
        <group scale={currentScale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={currentColor || (selected ? '#99ccff' : 'white')}
              transparent
              opacity={currentColor ? 1 : selected ? 0.1 : 0}
              depthWrite={!!currentColor}
            />
          </mesh>
          {/* Only render border Line when showBorder is true */}
          <Line
            points={points}
            color={selected ? 'blue' : currentBorderColor}
            lineWidth={currentLineThickness}
            dashed={currentBorderStyle !== 'solid'}
            dashScale={currentBorderStyle === 'dotted' ? 1 : 2}
            dashSize={currentBorderStyle === 'dotted' ? 0.1 : 1}
            gapSize={currentBorderStyle === 'dotted' ? 0.1 : 0.5}
          />
          edr {/* Replace the old indicator cube with FaceIndicator */}
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
            isPlane={true} // Add this prop
            onTransformToggle={handleTransformToggle} // Add this prop
            onResizeToggle={handleResizeToggle} // Add this prop
            onHeaderToggle={handleHeaderToggle} // Add this line
            onBorderToggle={handleBorderToggle} // Add this prop
            followTarget={groupRef} // Add this prop
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
            onClose={() => closeAllUIs()} // Use closeAllUIs here
          />
        )}

        {/* Add ResizeArrows when resizing */}
        {selected && isResizing && meshRef.current && (
          <ResizeArrows
            onResize={handleResize}
            object={meshRef.current}
            planeMode={true} // Optional: add this prop to ResizeArrows to only show x/y arrows
            arrowOffset={computedArrowOffset} // Pass computed offset
          />
        )}
      </group>

      {/* Move header elements outside main group to prevent inheritance */}
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
            isPlaneHeader: true, // Add this to identify plane headers
            fixedSize: true,
            fixedPosition: true, // Add this to maintain position
          }}
          billboard={true}
        />
      )}

      {/* Add header style UI */}
      {showHeaderStyleUI && (
        <TextStyleUI
          position={[0, 12, 0]}
          onStyleChange={handleHeaderStyleChange}
          onClose={() => {
            setShowHeaderStyleUI(false);
            setShowUI(true); // Show main UI when closing header style UI
          }}
          followTarget={groupRef}
          uiType="header" // Add this to specify UI type
        />
      )}

      {/* Add TransformControls outside the group */}
      {selected && showTransform && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
        />
      )}
    </>
  );
};

export default Plane;
