import { Html } from '@react-three/drei';
import { useRef } from 'react';
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

  const fontSizes = ['small', 'medium', 'large'];
  const colors = ['white', 'red', 'blue', 'green', 'yellow'];

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
            {fontSizes.map((size) => (
              <button
                key={size}
                onClick={() => onStyleChange({ fontSize: size })}
                style={{ margin: '0 5px' }}
              >
                {size}
              </button>
            ))}
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
