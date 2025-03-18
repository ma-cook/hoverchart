const UIOverlay = ({
  onCreateObject,
  onToggleIndicators,
  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
}) => {
  const handleArrowClick = () => {
    onToggleIndicators('connection');
  };

  if (!isAuthReady) {
    return <div className="ui-overlay">Initializing...</div>;
  }

  return (
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
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
