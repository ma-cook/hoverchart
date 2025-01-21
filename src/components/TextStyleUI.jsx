import { Html } from '@react-three/drei';
import { useRef } from 'react'; // Remove useState since we don't need it
import { useFrame } from '@react-three/fiber';

const TextStyleUI = ({ onStyleChange, position, followTarget }) => {
  const groupRef = useRef();

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

  const colors = ['white', 'red', 'blue', 'green', 'yellow'];

  const handleSizeChange = (size) => {
    onStyleChange({ fontSize: size });
  };

  // Handle wheel event for scrolling through sizes
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

  return (
    <group ref={groupRef} position={position}>
      <Html
        style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
        }}
        center
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>
            <select
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              onWheel={handleWheel}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                border: '1px solid white',
                padding: '5px',
                cursor: 'pointer',
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Size {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onStyleChange({ color })}
                style={{
                  margin: '0 5px',
                  backgroundColor: color,
                  width: '20px',
                  height: '20px',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => onStyleChange({ underline: true })}
            style={{ margin: '5px 0' }}
          >
            Underline
          </button>
        </div>
      </Html>
    </group>
  );
};

export default TextStyleUI;
