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
  id,
  onUpdate,
  scale: initialScale = [1, 1, 1],
  headerText: initialHeaderText = '',
  borderStyle: initialBorderStyle = 'solid',
  borderColor: initialBorderColor = 'white',
  lineThickness: initialLineThickness = 1,
}) => {
  const groupRef = useRef();
  const meshRef = useRef(); // Add meshRef
  const { camera } = useThree();
  const size = 5;
  const width = 10,
    height = 10; // dimensions used in planeGeometry
  const [color, setColor] = useState(null);
  const [showUI, setShowUI] = useState(false);
  const [text, setText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textStyle, setTextStyle] = useState({
    fontSize: 0.5,
    color: 'white',
    underline: false,
  });
  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [scale, setScale] = useState(initialScale);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [showHeader, setShowHeader] = useState(false);
  const [headerStyle, setHeaderStyle] = useState({
    fontSize: 1.5,
    color: 'white',
    underline: false,
  });
  const [showHeaderStyleUI, setShowHeaderStyleUI] = useState(false);
  const [showBorder, setShowBorder] = useState(true);
  const [borderStyle, setBorderStyle] = useState(initialBorderStyle);
  const [borderColor, setBorderColor] = useState(initialBorderColor);
  const [lineThickness, setLineThickness] = useState(initialLineThickness);
  const [indicatorSelected, setIndicatorSelected] = useState(false);

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
    }
  }, [selected, closeAllUIs, onIndicatorDeselected]); // Added closeAllUIs as dependency

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
    setColor(newColor);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    closeAllUIs(); // This will close TextStyleUI as well
    setShowUI(true); // Then show the main UI
  };

  const handleTextClick = () => {
    closeAllUIs(); // Close all UIs first
    setShowTextInput(true);
  };

  const handleTextSubmit = (newText) => {
    setText(newText);
    closeAllUIs();
  };

  const handleTextStyleChange = (newStyle) => {
    setTextStyle((prev) => ({ ...prev, ...newStyle }));
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
      const newScale = [...scale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      setScale(newScale);
      if (onUpdate) {
        onUpdate(id, {
          scale: newScale,
          position,
          headerText,
          borderStyle,
          borderColor,
          lineThickness,
          type: 'plane',
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
    }
  };

  const handleHeaderToggle = () => {
    closeAllUIs();
    setShowHeader(true);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    setShowHeader(false);
    if (onUpdate) {
      onUpdate(id, {
        headerText: text,
        position,
        scale,
        borderStyle,
        borderColor,
        lineThickness,
        type: 'plane',
      });
    }
  };

  const handleHeaderTextClick = (e) => {
    e.stopPropagation();
    closeAllUIs();
    setShowHeaderStyleUI(true);
  };

  const handleHeaderStyleChange = (newStyle) => {
    setHeaderStyle((prev) => ({ ...prev, ...newStyle }));
  };

  // Update border toggle handler
  const handleBorderToggle = (option) => {
    if (option.type === 'style') {
      setBorderStyle(option.value);
      if (onUpdate) {
        onUpdate(id, {
          borderStyle: option.value,
          position,
          scale,
          headerText,
          borderColor,
          lineThickness,
          type: 'plane',
        });
      }
    } else if (option.type === 'color') {
      console.log('Setting border color:', option.value); // Add debug log
      setBorderColor(option.value);
      setShowBorder(true); // Ensure border is visible when color is changed
      if (onUpdate) {
        onUpdate(id, {
          borderColor: option.value,
          position,
          scale,
          headerText,
          borderStyle,
          lineThickness,
          type: 'plane',
        });
      }
    } else if (option.type === 'thickness') {
      const newThickness = lineThickness >= 6 ? 1 : lineThickness + 2;
      setLineThickness(newThickness);
      if (onUpdate) {
        onUpdate(id, {
          lineThickness: newThickness,
          position,
          scale,
          headerText,
          borderStyle,
          borderColor,
          type: 'plane',
        });
      }
    }
  };

  // Add function to calculate absolute positions
  const getUIPositions = () => {
    const planeHeight = 10 * scale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 5; // Offset for UI elements in front of plane

    return {
      faceUI: [0, verticalOffset + 2, zOffset], // Position for FaceUI above plane
      headerInput: [
        position[0],
        position[1] + verticalOffset + 15,
        position[2] + 1,
      ],
      headerText: [
        position[0],
        position[1] + verticalOffset + 12,
        position[2] + 1,
      ],
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

  return (
    <>
      <group ref={groupRef} position={position}>
        <group scale={scale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={color || (selected ? '#99ccff' : 'white')}
              transparent
              opacity={color ? 1 : selected ? 0.1 : 0}
              depthWrite={!!color}
            />
          </mesh>
          {/* Only render border Line when showBorder is true */}
          {showBorder && (
            <Line
              points={points}
              color={selected ? 'blue' : borderColor}
              lineWidth={lineThickness}
              dashed={borderStyle !== 'solid'}
              dashScale={borderStyle === 'dotted' ? 1 : 2}
              dashSize={borderStyle === 'dotted' ? 0.1 : 1}
              gapSize={borderStyle === 'dotted' ? 0.1 : 0.5}
            />
          )}
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

        {text && (
          <TextSprite
            text={text}
            position={[0, 0, 0.1]}
            style={textStyle}
            fixedSize={true}
            onClick={handleTextSpriteClick}
            billboard={false}
          />
        )}

        {showTextStyleUI && (
          <TextStyleUI
            position={[0, 6, 0]}
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

      {headerText && (
        <TextSprite
          text={headerText}
          position={getUIPositions().headerText}
          followTarget={groupRef}
          onClick={handleHeaderTextClick}
          style={{
            ...headerStyle,
            isHeaderText: true,
            fixedSize: true,
          }}
          billboard={true}
        />
      )}

      {/* Add header style UI */}
      {showHeaderStyleUI && (
        <TextStyleUI
          position={[0, 12, 0]}
          onStyleChange={handleHeaderStyleChange}
          onClose={() => setShowHeaderStyleUI(false)}
          followTarget={groupRef}
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
