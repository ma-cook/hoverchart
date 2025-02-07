import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import ColorPicker from './ColorPicker';

// Add export to the TextStyleUIContent component
export const TextStyleUIContent = ({ onStyleChange, distance = 50 }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSizeChange = (size) => {
    onStyleChange({ fontSize: size * 20 }); // Multiply by 3 so that default 1 becomes 3
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

  return (
    <div
      className="object-ui-content"
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent?.preventDefault?.();
      }}
      style={{
        transform: `scale(${distance / 50})`,
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
    </div>
  );
};

// R3F wrapper component
const TextStyleUI = ({ onStyleChange, position, followTarget }) => {
  const groupRef = useRef();
  const [distance, setDistance] = useState(50);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      if (followTarget && followTarget.current) {
        const targetScale = followTarget.current.scale;
        const cubeHeight = 10 * targetScale.y;
        const topEdgeOffset = cubeHeight / 2;
        const targetPos = followTarget.current.position;
        groupRef.current.position.set(
          targetPos.x,
          targetPos.y + topEdgeOffset + 10,
          targetPos.z
        );
      }
      // Always face the camera
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
