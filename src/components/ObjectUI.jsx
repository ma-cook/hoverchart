import React from 'react';
import { Html } from '@react-three/drei';

const ObjectUI = ({
  position,
  onTransformToggle,
  onHeaderToggle,
  showTransform = false,
  showHeader = false,
}) => {
  const tools = [
    {
      name: 'header',
      icon: 'H',
      active: showHeader,
      onClick: () => {
        console.log('Header button clicked');
        onHeaderToggle?.();
      },
    },
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
      position={position}
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
