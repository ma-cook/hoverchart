import React from 'react';
import { Html } from '@react-three/drei';

const FaceUI = ({ position, normal }) => {
  const tools = [
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
  ];

  return (
    <Html
      position={position}
      style={{
        background: 'white',
        pointerEvents: 'auto',
        zIndex: 999999,
      }}
      center
      className="face-ui-container"
    >
      <div className="face-ui-content">
        {tools.map((tool) => (
          <button
            key={tool.name}
            className="face-tool-button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Face ${tool.name} clicked`);
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </Html>
  );
};

export default FaceUI;
