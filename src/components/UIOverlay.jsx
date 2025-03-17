const UIOverlay = ({
  onCreateObject,
  onToggleIndicators,
  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
  connectionState, // Add this prop
  onReconnect, // Add this prop
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
          <div
            className="connection-indicator"
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              className="status-dot"
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background:
                  connectionState === 'connected'
                    ? '#4CAF50'
                    : connectionState === 'connecting'
                    ? '#FFC107'
                    : '#F44336',
                marginRight: '5px',
              }}
            />
            {connectionState !== 'connected' && (
              <button
                onClick={onReconnect}
                style={{
                  background: 'transparent',
                  border: '1px solid #fff',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#fff',
                  marginLeft: '5px',
                }}
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
