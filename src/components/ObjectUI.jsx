import React, { useEffect } from 'react';
import { Html } from '@react-three/drei';

const ObjectUI = ({ position, onTransformToggle, showTransform = false }) => {
  useEffect(() => {
    console.log('ObjectUI mounted');
    return () => console.log('ObjectUI unmounted');
  }, []);

  const tools = [
    { name: 'header', icon: 'H' },
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
    {
      name: 'transform',
      icon: '↕',
      active: showTransform,
      onClick: () => onTransformToggle?.(),
    },
  ];

  return (
    <Html
      position={[0, 10, 0]}
      style={{
        background: 'white',
        pointerEvents: 'auto',
        zIndex: 999999,
      }}
      center
      className="object-ui-container"
    >
      <div className="object-ui-content">
        {tools.map((tool) => (
          <button
            key={tool.name}
            className={`object-tool-button ${tool.active ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (tool.onClick) {
                tool.onClick();
              } else {
                console.log(`${tool.name} button clicked`);
              }
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </Html>
  );
};

export default ObjectUI;
