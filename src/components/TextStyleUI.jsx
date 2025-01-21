import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

const TextStyleUI = ({ onStyleChange, position, followTarget }) => {
  const groupRef = useRef();
  const [showColorPicker, setShowColorPicker] = useState(false);

  useFrame(({ camera }) => {
    if (groupRef.current && followTarget?.current) {
      const targetScale = followTarget.current.scale;
      const cubeHeight = 10 * targetScale.y;
      const topEdgeOffset = cubeHeight / 2;
      const targetPos = followTarget.current.position;

      groupRef.current.position.set(
        targetPos.x,
        targetPos.y + topEdgeOffset + 15,
        targetPos.z
      );
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const handleSizeChange = (size) => {
    onStyleChange({ fontSize: size });
  };

  const handleColorChange = (e) => {
    onStyleChange({ color: e.target.value });
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

  return (
    <group ref={groupRef} position={position}>
      <Html
        style={{
          pointerEvents: 'auto',
          zIndex: 999999,
        }}
        center
        className="object-ui-container"
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent?.preventDefault?.();
        }}
      >
        <div
          className="object-ui-content"
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.preventDefault?.();
          }}
        >
          <select
            onChange={(e) =>
              handleButtonClick(e, () =>
                handleSizeChange(Number(e.target.value))
              )
            }
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
                <input
                  type="color"
                  onChange={(e) =>
                    handleButtonClick(e, () => handleColorChange(e))
                  }
                  onBlur={(e) =>
                    handleButtonClick(e, () => setShowColorPicker(false))
                  }
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: 0,
                    border: 'none',
                    cursor: 'pointer',
                  }}
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
      </Html>
    </group>
  );
};

export default TextStyleUI;
