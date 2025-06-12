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
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState({
    objectType: 'cube',
    numberOfObjects: 5,
    distance: 10,
    templateShape: 'plane',
    orientation: 'horizontal', // 'horizontal' or 'vertical'
  });
  const handleArrowClick = () => {
    onToggleIndicators('connection');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleTemplate = () => {
    setTemplateOpen(!templateOpen);
  };

  const handleTemplateConfigChange = (field, value) => {
    setTemplateConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const createTemplate = () => {
    const {
      objectType,
      numberOfObjects,
      distance,
      templateShape,
      orientation,
    } = templateConfig;

    // Get camera position and direction to position template 50 units in front
    let templateCenter = [0, 0, -50]; // Default fallback position

    try {
      // Try to get camera from various sources
      const camera =
        window.cameraRef?.current?.camera ||
        window.camera ||
        window.orbitControls?.object;

      if (camera) {
        // Get camera position
        const cameraPos = camera.position;

        // Get camera's forward direction
        const direction = { x: 0, y: 0, z: -1 };
        const quaternion = camera.quaternion;

        // Apply camera rotation to direction vector
        const rotatedDirection = {
          x:
            direction.x *
              (1 -
                2 *
                  (quaternion.y * quaternion.y + quaternion.z * quaternion.z)) +
            direction.y *
              2 *
              (quaternion.x * quaternion.y - quaternion.w * quaternion.z) +
            direction.z *
              2 *
              (quaternion.x * quaternion.z + quaternion.w * quaternion.y),
          y:
            direction.x *
              2 *
              (quaternion.x * quaternion.y + quaternion.w * quaternion.z) +
            direction.y *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.z * quaternion.z)) +
            direction.z *
              2 *
              (quaternion.y * quaternion.z - quaternion.w * quaternion.x),
          z:
            direction.x *
              2 *
              (quaternion.x * quaternion.z - quaternion.w * quaternion.y) +
            direction.y *
              2 *
              (quaternion.y * quaternion.z + quaternion.w * quaternion.x) +
            direction.z *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.y * quaternion.y)),
        };

        // Calculate template center 50 units in front of camera
        templateCenter = [
          cameraPos.x + rotatedDirection.x * 50,
          cameraPos.y + rotatedDirection.y * 50,
          cameraPos.z + rotatedDirection.z * 50,
        ];
      }
    } catch (error) {
      console.warn(
        'Could not get camera position for template, using default:',
        error
      );
    }
    if (templateShape === 'plane') {
      // Create objects in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < gridSize && count < numberOfObjects; i++) {
        for (let j = 0; j < gridSize && count < numberOfObjects; j++) {
          let relativeX, relativeY, relativeZ;

          if (orientation === 'vertical') {
            // Vertical orientation - grid in Y-Z plane
            relativeY = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeX = 0;
          } else {
            // Horizontal orientation - grid in X-Z plane (default)
            relativeX = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeY = 0;
          }

          // Position relative to template center
          const absolutePosition = [
            templateCenter[0] + relativeX,
            templateCenter[1] + relativeY,
            templateCenter[2] + relativeZ,
          ];

          onCreateObject(objectType, absolutePosition);
          count++;
        }
      }
    } else if (templateShape === 'sphere') {
      // Create objects in a spherical pattern
      const radius = distance;
      const angleStep = (2 * Math.PI) / numberOfObjects;

      for (let i = 0; i < numberOfObjects; i++) {
        const angle = i * angleStep;
        let relativeX, relativeY, relativeZ;

        if (orientation === 'vertical') {
          // Vertical orientation - circle in Y-Z plane
          relativeY = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeX = 0;
        } else {
          // Horizontal orientation - circle in X-Z plane (default)
          relativeX = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeY = 0;
        }

        // Position relative to template center
        const absolutePosition = [
          templateCenter[0] + relativeX,
          templateCenter[1] + relativeY,
          templateCenter[2] + relativeZ,
        ];

        onCreateObject(objectType, absolutePosition);
      }
    } else if (templateShape === 'cube') {
      // Create objects in a cube pattern
      const cubeSize = Math.ceil(Math.cbrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < cubeSize && count < numberOfObjects; i++) {
        for (let j = 0; j < cubeSize && count < numberOfObjects; j++) {
          for (let k = 0; k < cubeSize && count < numberOfObjects; k++) {
            const relativeX = (i - (cubeSize - 1) / 2) * distance;
            const relativeY = (j - (cubeSize - 1) / 2) * distance;
            const relativeZ = (k - (cubeSize - 1) / 2) * distance;

            // Position relative to template center
            const absolutePosition = [
              templateCenter[0] + relativeX,
              templateCenter[1] + relativeY,
              templateCenter[2] + relativeZ,
            ];

            onCreateObject(objectType, absolutePosition);
            count++;
          }
        }
      }
    }

    // Close template menu after creation
    setTemplateOpen(false);
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

          {/* Template Section */}
          <div className="template-section">
            <button className="template-toggle-button" onClick={toggleTemplate}>
              Templates {templateOpen ? '▼' : '▶'}
            </button>

            {templateOpen && (
              <div className="template-dropdown">
                <div className="template-config">
                  <div className="config-group">
                    <label>Object Type:</label>
                    <select
                      value={templateConfig.objectType}
                      onChange={(e) =>
                        handleTemplateConfigChange('objectType', e.target.value)
                      }
                    >
                      <option value="cube">Cube</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="plane">Plane</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Number of Objects:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={templateConfig.numberOfObjects}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'numberOfObjects',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="config-group">
                    <label>Distance Between:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={templateConfig.distance}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'distance',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>{' '}
                  <div className="config-group">
                    <label>Template Shape:</label>
                    <select
                      value={templateConfig.templateShape}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'templateShape',
                          e.target.value
                        )
                      }
                    >
                      <option value="plane">Plane</option>
                      <option value="sphere">Sphere</option>
                      <option value="cube">Cube</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Orientation:</label>
                    <select
                      value={templateConfig.orientation}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'orientation',
                          e.target.value
                        )
                      }
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                  <button
                    className="create-template-button"
                    onClick={createTemplate}
                  >
                    Create Template
                  </button>
                </div>
              </div>
            )}
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
