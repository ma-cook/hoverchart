import { useState } from 'react';

const UIOverlay = ({
  onCreateObject,
  onToggleIndicators,
  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
  currentCell, // Add currentCell prop
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleArrowClick = () => {
    onToggleIndicators('connection');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (!isAuthReady) {
    return <div className="ui-overlay">Initializing...</div>;
  }

  return (
    <>
      <div className="menu-button-container">
        <button
          className="menu-button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>{' '}
      <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <div className="current-cell-info">
            <span>Current cell: </span>
            <span className="cell-coordinates">
              {currentCell
                ? `${currentCell.x},${currentCell.y},${currentCell.z}`
                : '0,0,0'}
            </span>
          </div>
          {/* Menu content will go here */}
        </div>
      </div>
      <div className="ui-overlay" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div>Loading...</div>
        ) : !user && showLoginButton ? (
          <div className="login-container">
            <button onClick={onLogin} className="login-button">
              Login with Google
            </button>
          </div>
        ) : user ? (
          <div className="tools-container">
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
              onClick={() => onCreateObject('plane')}
              title="Add Plane"
            >
              ▭
            </button>
            <button
              className={`shape-button ${isConnectMode ? 'active' : ''}`}
              onClick={handleArrowClick}
              title="Connect Faces"
            >
              ↗
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('text')}
              title="Add Text"
            >
              T
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
