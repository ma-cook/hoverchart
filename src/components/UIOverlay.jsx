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
      <button
        key="cube"
        className="shape-button"
        onClick={() => onCreateObject('cube')} // Ensure 'cube' is passed as the type
      >
        ⬛
      </button>
      {shapes
        .filter((shape) => shape.name !== 'cube')
        .map((shape) => (
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

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
