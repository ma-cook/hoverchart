import React from 'react';

const UIOverlay = ({ onCreateObject, onClick }) => {
  const shapes = [
    { name: 'cube', icon: '⬛' },
    { name: 'sphere', icon: '⚪' },
    { name: 'plane', icon: '▭' },
    { name: 'arrows', icon: '↔' },
  ];

  return (
    <div
      className="ui-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {shapes.map((shape) => (
        <button
          key={shape.name}
          className="shape-button"
          onClick={() => onCreateObject(shape.name)}
        >
          {shape.icon}
        </button>
      ))}
    </div>
  );
};

export default UIOverlay;
