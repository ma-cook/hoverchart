import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import ColorPicker from './ColorPicker';
import * as THREE from 'three';

// Add export to the TextStyleUIContent component
export const TextStyleUIContent = ({
  onStyleChange,
  distance = 50,
  uiType,
  onTransformToggle, // added new prop
  onResizeToggle, // added new prop
}) => {
  // added uiType prop
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [bulletPointMode, setBulletPointMode] = useState(false);

  const handleSizeChange = (size) => {
    const multiplier = uiType === 'textObject' ? 32 : 0.7; // if textObject, size 1 => 32px; otherwise use 0.7
    onStyleChange({ fontSize: size * multiplier });
  };

  const handleWheel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const sizes = Array.from({ length: 10 }, (_, i) => i + 1);
    const currentSize = e.currentTarget.value;
    const currentIndex = sizes.indexOf(Number(currentSize));
    const newIndex = Math.min(
      Math.max(0, currentIndex + delta),
      sizes.length - 1
    );
    handleSizeChange(sizes[newIndex]);
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
  };

  return (
    <div
      className="object-ui-content"
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent?.preventDefault?.();
      }}
      style={{
        transform: `scale(${getUIScale(distance)})`,
        transformOrigin: 'center top',
      }}
    >
      <select
        onChange={handleSelectChange}
        onWheel={handleWheel}
        className="object-tool-button"
        style={{ width: '36px', padding: '2px 2px' }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>

      {/* NEW: Transform button moved from TextObjectUI */}
      {uiType === 'textObject' && onTransformToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTransformToggle();
          }}
          className="object-tool-button"
        >
          ⇄
        </button>
      )}

      {/* Replace the old resize button with this new one */}
      {uiType === 'textObject' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.preventDefault?.();
            console.log('Resize toggle clicked'); // Add debug log
            onResizeToggle?.();
          }}
          className="object-tool-button"
        >
          ↔
        </button>
      )}

      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) =>
            handleButtonClick(e, () => setShowColorPicker(!showColorPicker))
          }
          className="object-tool-button"
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
              onColorSelect={handleColorSelect}
              onClose={() => setShowColorPicker(false)}
            />
          </div>
        )}
      </div>

      <button
        onClick={(e) =>
          handleButtonClick(e, () => onStyleChange({ underline: true }))
        }
        className="object-tool-button"
      >
        U̲
      </button>

      {/* Add new bullet point button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setBulletPointMode(!bulletPointMode);
          onStyleChange({ bulletPointMode: !bulletPointMode });
        }}
        className={`object-tool-button ${bulletPointMode ? 'active' : ''}`}
        title="Toggle bullet points"
      >
        •
      </button>
    </div>
  );
};

// R3F wrapper component
const TextStyleUI = ({ onStyleChange, position, followTarget }) => {
  const groupRef = useRef();
  const [distance, setDistance] = useState(50);

  useFrame(({ camera }) => {
    if (groupRef.current && followTarget?.current) {
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

      // Keep UI facing camera
      groupRef.current.quaternion.copy(camera.quaternion);

      // Calculate distance for UI scaling
      const newDistance = camera.position.distanceTo(groupRef.current.position);
      setDistance(newDistance);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        style={{
          pointerEvents: 'auto',
          zIndex: 999999,
        }}
        center
        className="object-ui-container"
      >
        <TextStyleUIContent onStyleChange={onStyleChange} distance={distance} />
      </Html>
    </group>
  );
};

export default TextStyleUI;
