import { useUIOverlayStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';
import { useRef, useCallback } from 'react';
import { uploadModelToStorage } from '../services/storageService';
import { screenRecorder } from '../services/screenRecordingService';
import { markdownDiagramService } from '../services/markdownDiagramService';
import * as THREE from 'three';

const UIOverlay = ({
  onCreateObject,

  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
  currentCell, // Add currentCell prop
  currentSpaceId, // Add currentSpaceId prop for model uploads
}) => {
  // Use UI overlay store
  const toggleMenu = useUIOverlayStore((state) => state.toggleMenu);
  const toggleTemplate = useUIOverlayStore((state) => state.toggleTemplate);
  const updateTemplateConfig = useUIOverlayStore(
    (state) => state.updateTemplateConfig
  );

  // Operation states from store
  const isUploadingModel = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isUploadingModel
  );
  const isProcessingMarkdown = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isProcessingMarkdown
  );
  const isRecording = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isRecording
  );
  const setIsUploadingModel = useUIOverlayStore(
    (state) => state.setIsUploadingModel
  );
  const setIsProcessingMarkdown = useUIOverlayStore(
    (state) => state.setIsProcessingMarkdown
  );
  const setIsRecording = useUIOverlayStore((state) => state.setIsRecording);

  // Connection store for toggling connection visibility
  const connectionsVisible = useConnectionStore(
    (state) => state.connectionsVisible
  );
  const toggleConnectionsVisible = useConnectionStore(
    (state) => state.toggleConnectionsVisible
  );

  // Model upload functionality
  const modelFileInputRef = useRef(null);

  // Markdown upload functionality
  const markdownFileInputRef = useRef(null);

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await screenRecorder.stopRecording();
        if (blob) {
          screenRecorder.downloadRecording(blob);
        }
        setIsRecording(false);
      } catch {
        alert('Failed to stop recording');
      }
    } else {
      // Ask for confirmation before starting
      const confirmed = window.confirm(
        'Do you want to start recording your screen? You will be asked to select which screen or window to share.'
      );

      if (confirmed) {
        const success = await screenRecorder.startRecording();
        if (success) {
          setIsRecording(true);
        }
      }
    }
  }, [isRecording]);

  const handleModelUpload = useCallback(() => {
    if (modelFileInputRef.current) {
      modelFileInputRef.current.click();
    }
  }, []);

  const handleModelFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid || !currentSpaceId) {
        if (!user?.uid) {
          alert('You must be logged in to upload 3D models');
        }
        return;
      }

      // Validate file type
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        alert('Please select a GLB or GLTF file');
        return;
      }
      setIsUploadingModel(true);

      try {
        const modelUrl = await uploadModelToStorage(
          file,
          user.uid,
          currentSpaceId
        );

        // Get camera position and direction to position model 50 units in front
        let modelPosition = [0, 0, -50]; // Default fallback position

        try {
          // Try to get camera from various sources
          const camera =
            window.cameraRef?.current?.camera ||
            window.camera ||
            window.orbitControls?.object;

          if (camera) {
            // Get camera position and direction
            const cameraPosition = camera.position;
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Position model 50 units in front of camera
            modelPosition = [
              cameraPosition.x + cameraDirection.x * 50,
              cameraPosition.y + cameraDirection.y * 50,
              cameraPosition.z + cameraDirection.z * 50,
            ];
          }
        } catch {
          // Using default position
        }

        // Create model object
        onCreateObject('model', modelPosition, { modelUrl });

        alert('3D model uploaded successfully!');
      } catch {
        alert('Failed to upload model. Please try again.');
      } finally {
        setIsUploadingModel(false);
        // Reset file input
        if (modelFileInputRef.current) {
          modelFileInputRef.current.value = '';
        }
      }
    },
    [user, currentSpaceId, onCreateObject]
  );

  const handleMarkdownUpload = useCallback(() => {
    if (markdownFileInputRef.current) {
      markdownFileInputRef.current.click();
    }
  }, []);

  const handleMarkdownFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      setIsProcessingMarkdown(true);

      try {
        const result = await markdownDiagramService.processMarkdownFile(
          file,
          onCreateObject,
          currentSpaceId,
          user
        );

        if (result.success) {
          // Objects and connections are rendered immediately
          // But wait for database save to complete before showing completion message
          if (result.savePromise) {
            console.log('⏳ Waiting for database save to complete...');
            await result.savePromise;
          }

          alert(
            `Successfully processed ${result.diagramCount} diagram(s) and created ${result.objectsCreated} 3D objects with ${result.connectionsCreated} connections!`
          );
        } else {
          alert(
            'No 3D objects were created. Please check that your Merfolk syntax is correct.'
          );
        }
      } catch (error) {
        alert(
          `Failed to process markdown file: ${error.message}. Please check the file format and try again.`
        );
      } finally {
        setIsProcessingMarkdown(false);
        // Reset file input
        if (markdownFileInputRef.current) {
          markdownFileInputRef.current.value = '';
        }
      }
    },
    [onCreateObject, currentSpaceId, user]
  );

  // Get store state for main overlay - use direct selectors for better reactivity
  const menuOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.menuOpen : state.defaultOverlay.menuOpen;
  });
  const templateOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.templateOpen : state.defaultOverlay.templateOpen;
  });
  const templateConfig = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay
      ? overlay.templateConfig
      : state.defaultOverlay.templateConfig;
  });
  const handleMenuToggle = () => {
    toggleMenu('main');
  };

  const handleArrowClick = () => {
    toggleConnectionsVisible();
  };

  const handleTemplateConfigChange = (field, value) => {
    updateTemplateConfig('main', field, value);
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
    } catch {
      // Using default position if camera access fails
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
    } // Close template menu after creation
    toggleTemplate('main');
  };

  if (!isAuthReady) {
    return <div className="ui-overlay">Initializing...</div>;
  }

  return (
    <>
      {' '}
      <div className="menu-button-container">
        <button
          className="menu-button"
          onClick={handleMenuToggle}
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
          {/* Template Section */}{' '}
          <div className="template-section">
            <button
              className="template-toggle-button"
              onClick={() => toggleTemplate('main')}
            >
              Templates {templateOpen ? '▼' : '▶'}
            </button>

            {templateOpen && (
              <div className="template-dropdown">
                <div className="template-config">
                  <div className="config-group">
                    <label>Object Type:</label>{' '}
                    <select
                      value={templateConfig.objectType}
                      onChange={(e) =>
                        handleTemplateConfigChange('objectType', e.target.value)
                      }
                    >
                      <option value="cube">Cube</option>
                      <option value="tetrahedron">Tetrahedron</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="plane">Plane</option>
                      <option value="text">Text</option>
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
          {/* Markdown Upload Section */}
          <div className="markdown-section">
            <button
              className="markdown-upload-button"
              onClick={handleMarkdownUpload}
              disabled={isProcessingMarkdown}
              title="Upload Markdown with Merfolk diagrams"
            >
              {isProcessingMarkdown ? 'Processing...' : '📄 Upload Markdown'}
            </button>
            {/* Hidden file input for markdown upload */}
            <input
              ref={markdownFileInputRef}
              type="file"
              accept=".md,.markdown"
              style={{ display: 'none' }}
              onChange={handleMarkdownFileSelect}
            />
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
              onClick={() => onCreateObject('tetrahedron')}
              title="Add Tetrahedron"
            >
              ▲
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('dodecahedron')}
              title="Add Dodecahedron"
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
              title="Toggle Connection Lines"
              style={{
                borderColor: connectionsVisible ? '' : 'orange',
                borderWidth: connectionsVisible ? '' : '2px',
              }}
            >
              ↗
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('text')}
              title="Add Text"
            >
              T
            </button>{' '}
            <button
              className="shape-button"
              onClick={handleModelUpload}
              title="Add 3D Model"
              disabled={isUploadingModel}
            >
              {isUploadingModel ? '...' : '3D'}
            </button>
            {/* Hidden file input for model upload */}
            <input
              ref={modelFileInputRef}
              type="file"
              accept=".glb,.gltf"
              style={{ display: 'none' }}
              onChange={handleModelFileSelect}
            />
          </div>
        ) : null}
      </div>
      {/* Record button positioned at bottom center */}
      <div className="record-button-container">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordClick}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <>
              <span className="record-icon recording">⏹️</span>
              <span className="record-text">Stop Recording</span>
            </>
          ) : (
            <>
              <span className="record-icon">🎥</span>
              <span className="record-text">Record</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
