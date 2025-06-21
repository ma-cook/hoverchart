import React from 'react';
import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import ColorPicker from './ColorPicker';
import * as THREE from 'three';
import { useColorPickerStore } from '../stores';

// Add export to the TextStyleUIContent component
export const TextStyleUIContent = ({
  onStyleChange,
  distance = 50,
  uiType = 'header', // Add uiType prop with default value
  onTransformToggle, // added new prop
  onResizeToggle, // added new prop
  onDelete, // Add onDelete prop
  textStyle = {}, // Add textStyle prop to show current state
  onClose, // Add onClose prop
}) => {
  // Use color picker store
  const openColorPicker = useColorPickerStore((state) => state.openColorPicker);
  const closeColorPicker = useColorPickerStore(
    (state) => state.closeColorPicker
  );

  const pickerId = `text-style-ui-${uiType}`;
  // Make color picker visibility reactive to store changes
  const showColorPicker = useColorPickerStore((state) =>
    state.isColorPickerOpen(pickerId)
  );
  const [bulletPointMode, setBulletPointMode] = useState(
    textStyle.bulletPointMode || false
  );

  // Get current values for UI state
  const currentFontSize = textStyle.fontSize || 32;
  const currentColor = textStyle.color || 'black';
  const isUnderlined = textStyle.textDecoration === 'underline';
  const isBold = textStyle.fontWeight === 'bold';
  const isItalic = textStyle.fontStyle === 'italic';

  const handleSizeChange = (size) => {
    const multiplier = uiType === 'textObject' ? 32 : 0.7; // if textObject, size 1 => 32px; otherwise use 0.7
    onStyleChange({ fontSize: size * multiplier });
  };

  const handleFontSizeInputChange = (e) => {
    const newSize = parseInt(e.target.value) || 32;
    onStyleChange({ fontSize: newSize });
  };

  const handleWheel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const currentSize = Math.round(
      currentFontSize / (uiType === 'textObject' ? 32 : 0.7)
    );
    const newSize = Math.max(1, Math.min(10, currentSize - delta));
    handleSizeChange(newSize);
  };

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    e.nativeEvent?.preventDefault?.();
    action();
  };

  const handleColorSelect = (color) => {
    onStyleChange({ color });
  };

  const handleSelectChange = (e) => {
    e.stopPropagation();
    handleSizeChange(Number(e.target.value));
  };

  // Calculate a more balanced scale that doesn't get too big or too small
  const getUIScale = (distance) => {
    const minScale = 1; // Won't get smaller than half size
    const maxScale = 1; // Won't get bigger than double size
    const baseScale = distance / 100; // Changed from /50 to /100 for less dramatic scaling
    return Math.min(Math.max(baseScale, minScale), maxScale);
  }; // Only show relevant tools based on uiType
  const showTools = {
    header: [
      'size',
      'color',
      'bold',
      'italic',
      'underline',
      'transform',
      'resize',
    ],
    faceText: ['size', 'color', 'bold', 'italic', 'underline'],
    textObject: [
      'size',
      'fontSizeInput',
      'color',
      'bold',
      'italic',
      'underline',
      'bullets',
      'transform',
      'resize',
      'delete',
    ],
  };

  const tools = showTools[uiType] || showTools.header;
  return (
    <div
      className="face-ui-content"
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent?.preventDefault?.();
      }}
      style={{
        transform: `scale(${getUIScale(distance)})`,
        transformOrigin: 'center top',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        padding: '4px',
        background: 'white',
        borderRadius: '4px',
      }}
    >
      {' '}
      {tools.includes('size') && (
        <select
          onChange={handleSelectChange}
          onWheel={handleWheel}
          className="face-tool-button"
          style={{
            width: '36px',
            padding: '4px 8px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          value={Math.round(
            currentFontSize / (uiType === 'textObject' ? 32 : 0.7)
          )}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      )}{' '}
      {tools.includes('fontSizeInput') && (
        <input
          type="number"
          value={currentFontSize}
          onChange={handleFontSizeInputChange}
          className="face-tool-button"
          style={{
            width: '50px',
            padding: '4px 8px',
            fontSize: '12px',
            background: 'white',
            color: 'black',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          min="8"
          max="200"
          step="1"
        />
      )}
      {tools.includes('color') && (
        <div style={{ position: 'relative' }}>
          {' '}
          <button
            onClick={(e) =>
              handleButtonClick(e, () => {
                if (showColorPicker) {
                  closeColorPicker(pickerId);
                } else {
                  openColorPicker(pickerId, `text-style-${uiType}`);
                }
              })
            }
            className="face-tool-button"
            style={{
              background: currentColor !== 'black' ? currentColor : undefined,
              color: currentColor === 'black' ? 'black' : 'white',
              border:
                currentColor !== 'black'
                  ? `1px solid ${currentColor}`
                  : undefined,
            }}
          >
            🎨
          </button>
          {showColorPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                marginTop: '5px',
                zIndex: 1000,
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.preventDefault?.();
              }}
            >
              <ColorPicker
                pickerId={pickerId}
                onColorSelect={handleColorSelect}
                onClose={() => closeColorPicker(pickerId)}
              />
            </div>
          )}
        </div>
      )}{' '}
      {tools.includes('bold') && (
        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              onStyleChange({
                fontWeight: isBold ? 'normal' : 'bold',
              })
            )
          }
          className={`face-tool-button ${isBold ? 'active-tool' : ''}`}
          style={{
            fontWeight: 'bold',
            background: isBold ? '#4CAF50' : undefined,
            color: isBold ? 'white' : undefined,
          }}
        >
          B
        </button>
      )}
      {tools.includes('italic') && (
        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              onStyleChange({
                fontStyle: isItalic ? 'normal' : 'italic',
              })
            )
          }
          className={`face-tool-button ${isItalic ? 'active-tool' : ''}`}
          style={{
            fontStyle: 'italic',
            background: isItalic ? '#4CAF50' : undefined,
            color: isItalic ? 'white' : undefined,
          }}
        >
          I
        </button>
      )}
      {tools.includes('underline') && (
        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              onStyleChange({
                textDecoration: isUnderlined ? 'none' : 'underline',
              })
            )
          }
          className={`face-tool-button ${isUnderlined ? 'active-tool' : ''}`}
          style={{
            textDecoration: 'underline',
            background: isUnderlined ? '#4CAF50' : undefined,
            color: isUnderlined ? 'white' : undefined,
          }}
        >
          U̲
        </button>
      )}{' '}
      {tools.includes('bullets') && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setBulletPointMode(!bulletPointMode);
            onStyleChange({ bulletPointMode: !bulletPointMode });
          }}
          className={`face-tool-button ${bulletPointMode ? 'active-tool' : ''}`}
          title="Toggle bullet points"
          style={{
            background: bulletPointMode ? '#4CAF50' : undefined,
            color: bulletPointMode ? 'white' : undefined,
          }}
        >
          •
        </button>
      )}
      {tools.includes('transform') &&
        uiType === 'textObject' &&
        onTransformToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransformToggle();
            }}
            className="face-tool-button"
            title="Move text object"
          >
            ⇄
          </button>
        )}{' '}
      {tools.includes('resize') && uiType === 'textObject' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.preventDefault?.();
            onResizeToggle?.();
          }}
          className="face-tool-button"
          title="Resize text object"
        >
          ↔
        </button>
      )}
      {tools.includes('delete') && uiType === 'textObject' && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.preventDefault?.();
            if (
              window.confirm(
                'Are you sure you want to delete this text object?'
              )
            ) {
              onDelete();
            }
          }}
          className="face-tool-button delete-button"
          title="Delete text object"
          style={{
            background: '#dc3545',
            borderColor: '#dc3545',
            color: 'white',
          }}
        >
          🗑️
        </button>
      )}
    </div>
  );
};

// R3F wrapper component
const TextStyleUI = React.memo(
  ({ onStyleChange, position, followTarget, onClose }) => {
    const groupRef = useRef();
    const [distance, setDistance] = useState(50);
    const [isPositioned, setIsPositioned] = useState(false);
    useFrame(({ camera }) => {
      if (groupRef.current) {
        // Throttle updates for performance
        if (
          !groupRef.current._lastUpdate ||
          Date.now() - groupRef.current._lastUpdate > 16
        ) {
          if (followTarget?.current) {
            // Following target logic (for objects that need dynamic positioning)
            const targetScale = followTarget.current.scale;
            const cubeHeight = 10 * targetScale.y;
            const topEdgeOffset = cubeHeight / 2;
            const targetPos = followTarget.current.position;

            // Get the header text's world position and size
            const headerText = followTarget.current.children?.find(
              (child) => child.type === 'Text'
            );

            let yOffset = 3; // Default offset
            if (headerText) {
              const box = new THREE.Box3().setFromObject(headerText);
              const height = box.max.y - box.min.y;
              yOffset = height + 3; // Add 3 units above the text's height
            }

            groupRef.current.position.set(
              targetPos.x,
              targetPos.y + topEdgeOffset + yOffset,
              targetPos.z
            );
          }
          // If no followTarget, keep static position (already set by position prop)

          // Keep UI facing camera
          groupRef.current.quaternion.copy(camera.quaternion);

          // Calculate distance for UI scaling
          const newDistance = camera.position.distanceTo(
            groupRef.current.position
          );
          setDistance(newDistance);

          // Mark as positioned after first frame
          if (!isPositioned) {
            setIsPositioned(true);
          }

          groupRef.current._lastUpdate = Date.now();
        }
      }
    });

    return (
      <group ref={groupRef} position={position}>
        {' '}
        <Html
          style={{
            pointerEvents: 'auto',
            transform: 'translate3d(-50%, -150%, 0)',
            background: 'transparent',
            zIndex: 999999,
            visibility: isPositioned ? 'visible' : 'hidden',
          }}
          center
          className="face-ui-container"
        >
          <TextStyleUIContent
            onStyleChange={onStyleChange}
            distance={distance}
            onClose={onClose}
          />
        </Html>{' '}
      </group>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if critical props change
    return (
      prevProps.position === nextProps.position &&
      prevProps.followTarget === nextProps.followTarget
    );
  }
);

TextStyleUI.displayName = 'TextStyleUI';

export default TextStyleUI;
