import React, { useState } from 'react';
import { Html } from '@react-three/drei';

const HeaderInput = ({ position, onTextSubmit }) => {
  const [headerText, setHeaderText] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onTextSubmit?.(headerText);
      setHeaderText('');
    }
  };

  return (
    <Html
      position={position}
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
  );
};

export default HeaderInput;
