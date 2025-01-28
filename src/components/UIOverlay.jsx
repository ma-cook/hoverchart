const UIOverlay = ({ onCreateObject, onToggleIndicators }) => {
  const handleArrowClick = () => {
    // Sets up the indicators for connection mode immediately
    onToggleIndicators('connection');
  };

  return (
    <div
      className="ui-overlay"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button
        className="shape-button"
        onClick={() => onCreateObject('cube')}
        title="Add Cube"
      >
        □
      </button>
      <button
        className="shape-button"
        onClick={() => onCreateObject('sphere')}
        title="Add Sphere"
      >
        ○
      </button>
      <button
        className="shape-button"
        onClick={handleArrowClick}
        title="Connect Faces"
      >
        ↗
      </button>
    </div>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
