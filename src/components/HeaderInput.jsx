import { useState, useRef } from 'react';
import { Html } from '@react-three/drei';

import { useFrame } from '@react-three/fiber';
const HeaderInput = ({ position, onTextSubmit }) => {
  const [headerText, setHeaderText] = useState('');
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (groupRef.current) {
      // Only handle rotation, maintain original position
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onTextSubmit?.(headerText);
      setHeaderText('');
    }
  };

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        style={{
          background: 'white',
          padding: '4px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'auto',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <input
          type="text"
          value={headerText}
          onChange={(e) => setHeaderText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter header text..."
          className="header-input"
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      </Html>
    </group>
  );
};

export default HeaderInput;
