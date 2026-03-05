import { useUIOverlayStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';
import useObjectsStore from '../stores/objectsStore';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  uploadModelToStorage,
  uploadMarkdownToStorage,
} from '../services/storageService';
import { screenRecorder } from '../services/screenRecordingService';
import { markdownDiagramService } from '../services/markdownDiagramService';
import { setCellBoundariesVisible } from '../stores/uiOverlayStore';
import { clearAllObjectCaches } from '../services/spatialObjectsService';
import { getAuth } from 'firebase/auth';
import * as THREE from 'three';
import {
  handleGithubCallback,
  fetchRepositories as fetchGithubRepositories,
  isGithubAuthenticated as checkGithubAuth,
  getGithubOAuthUrl,
  scanRepositoryAndGenerateDiagram,
} from '../services/githubRepoService';
import SpacePresenceAvatars from './SpacePresenceAvatars';
import SpaceChat from './SpaceChat';

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
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [showRepos, setShowRepos] = useState(false);
  const [isGithubAuthenticated, setIsGithubAuthenticated] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scanProgress, setScanProgress] = useState({ isScanning: false, progress: 0, stage: '' });
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [currentDiagramRepo, setCurrentDiagramRepo] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
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
  const setIsRecording = useCallback(
    (val) => useUIOverlayStore.getState().setIsRecording('main', val),
    []
  );

  // Connection store for toggling connection visibility
  const connectionsVisible = useConnectionStore(
    (state) => state.connectionsVisible
  );
  const toggleConnectionsVisible = useConnectionStore(
    (state) => state.toggleConnectionsVisible
  );
  const resetConnections = useConnectionStore(
    (state) => state.resetConnections
  );
  const connectionCount = useConnectionStore(
    (state) => state.connections.length
  );
  const CONNECTION_RENDER_THRESHOLD = 100;
  const showConnectionsHint =
    connectionCount > CONNECTION_RENDER_THRESHOLD && !connectionsVisible;

  // Model upload functionality
  const modelFileInputRef = useRef(null);

  // Markdown upload functionality
  const markdownFileInputRef = useRef(null);

  const cellBoundariesVisible = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.cellBoundariesVisible : false;
  });

  // Add this handler function
  const handleCellBoundariesToggle = useCallback(() => {
    setCellBoundariesVisible('main', !cellBoundariesVisible);
  }, [cellBoundariesVisible]);

  // Function to fetch repositories using the GitHub service
  const fetchRepositories = async () => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      alert('Please log in to GitHub first.');
      return;
    }

    try {
      const repos = await fetchGithubRepositories(token);
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // Function to scan repository and generate Merfolk diagram
  const fetchAppJsxFromRepo = async (repo) => {
    try {
      setScanProgress({ isScanning: true, progress: 0, stage: 'Starting...' });
      
      const result = await scanRepositoryAndGenerateDiagram(
        repo,
        onCreateObject,
        user,
        currentSpaceId,
        uploadMarkdownToStorage,
        markdownDiagramService,
        (progress, stage) => {
          setScanProgress({ isScanning: true, progress, stage });
        }
      );
      
      setScanProgress({ isScanning: false, progress: 100, stage: 'Complete' });
      
      // Show notification instead of alert
      if (result.success) {
        setCurrentDiagramRepo(repo);
        setNotification({
          show: true,
          message: `Diagram created! Generated: ${result.objectsCreated} objects, ${result.connectionsCreated} connections`
        });
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating diagram from repository:', error);
      setScanProgress({ isScanning: false, progress: 0, stage: '' });
      throw error;
    }
  };
  
  // Click handler to dismiss notification
  const handleScreenClick = useCallback(() => {
    if (notification.show) {
      setNotification({ show: false, message: '' });
    }
  }, [notification.show]);

  // Handle GitHub OAuth callback
  useEffect(() => {
    handleGithubCallback().then((token) => {
      if (token) {
        setIsGithubAuthenticated(true);
        fetchRepositories();
        alert('GitHub login successful!');
      }
    });
  }, []);

  // Check for existing GitHub token on mount
  useEffect(() => {
    setIsGithubAuthenticated(checkGithubAuth());
  }, []);

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await screenRecorder.stopRecording();
        if (blob) {
          screenRecorder.downloadRecording(blob);
        }
      } catch {
        alert('Failed to stop recording');
      } finally {
        setIsRecording(false);
      }
    } else {
      // Ask for confirmation before starting
      const confirmed = window.confirm(
        'Do you want to start recording your screen? You will be asked to select which screen or window to record.'
      );

      if (confirmed) {
        const success = await screenRecorder.startRecording();
        if (success) {
          setIsRecording(true);
        }
      }
    }
  }, [isRecording, setIsRecording]);

  // Sync React state when recording stops via browser's "Stop sharing" button
  useEffect(() => {
    const handler = () => setIsRecording(false);
    window.addEventListener('screenRecordingStopped', handler);
    return () => window.removeEventListener('screenRecordingStopped', handler);
  }, [setIsRecording]);

  // Get the resetObjects function from the objects store
  const resetObjects = useObjectsStore((state) => state.resetObjects);

  const handleDeleteAllCells = useCallback(async () => {
    if (!user?.uid || !currentSpaceId) {
      alert('You must be logged in to delete cells');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL objects in this space? This action cannot be undone.'
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirmed = window.confirm(
      'This will permanently delete all objects. Are you absolutely sure?'
    );

    if (!doubleConfirmed) return;

    setIsDeleting(true);

    try {
      // CRITICAL: Set global flag to prevent ANY saves during deletion
      window._bulkDeleteInProgress = true;
      
      // Clear ALL local state FIRST to prevent any saves during the delete operation
      clearAllObjectCaches();
      resetObjects();
      resetConnections();
      
      // Get the current user's ID token for authentication
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('Unable to get authentication token');
      }

      // Call the cloud function for bulk delete
      const functionUrl = 'https://bulkdelete-qtk2xsi74a-uc.a.run.app';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          userId: user.uid,
          spaceId: currentSpaceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk delete failed');
      }

      if (result.success) {
        setCurrentDiagramRepo(null);
        alert(
          `Successfully deleted ${result.cellsDeleted} cells, ${result.objectsDeleted} objects, and ${result.connectionsDeleted} connections.`
        );
      } else {
        alert(`Failed to delete cells: ${result.error}`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert(`Error deleting cells: ${error.message}`);
    } finally {
      // Release the delete lock after a longer delay to ensure all pending operations complete
      // Keep the lock for 5 seconds to block any stragglers
      setTimeout(() => {
        window._bulkDeleteInProgress = false;
      }, 5000);
      setIsDeleting(false);
    }
  }, [user, currentSpaceId, resetObjects, resetConnections]);

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
    [user, currentSpaceId, onCreateObject, setIsUploadingModel]
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
    [onCreateObject, currentSpaceId, user, setIsProcessingMarkdown]
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

  // Track whether the user has explicitly toggled visibility so auto-show doesn't override them
  const userHasManuallyToggled = useRef(false);

  const handleArrowClick = () => {
    userHasManuallyToggled.current = true;
    toggleConnectionsVisible();
  };

  // Auto-show connections when there are 100 or fewer (on startup or after a GitHub scan)
  useEffect(() => {
    if (userHasManuallyToggled.current) return;
    if (connectionCount > 0 && connectionCount <= CONNECTION_RENDER_THRESHOLD && !connectionsVisible) {
      toggleConnectionsVisible();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionCount]);

  // Clear the current diagram repo when the space changes
  useEffect(() => {
    setCurrentDiagramRepo(null);
  }, [currentSpaceId]);

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
          {/* GitHub repo section */}
          {isGithubAuthenticated ? (
            <div className="github-repos-dropdown">
              <button
                className="repos-toggle-button"
                onClick={() => {
                  if (!showRepos) {
                    fetchRepositories(); // Fetch repositories only when opening the dropdown
                  }
                  setShowRepos((prev) => !prev); // Toggle visibility
                }}
              >
                {showRepos ? 'Hide Repositories' : 'Show Repositories'}
              </button>
              {showRepos && (
                <ul className="github-repos-list">
                  {repositories.map((repo) => (
                    <li key={repo.id} onClick={() => setSelectedRepo(repo)}>
                      {repo.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <button
              className="github-login-button"
              onClick={() => (window.location.href = getGithubOAuthUrl())}
            >
              Connect to GitHub
            </button>
          )}
          {/* Popup for selected repository */}
          {selectedRepo && (
            <div className="popup-overlay">
              <div className="popup-content">
                <p>Create diagram for {selectedRepo.name}</p>
                <button
                  onClick={async () => {
                    try {
                      await fetchAppJsxFromRepo(selectedRepo);
                      setSelectedRepo(null);
                    } catch (error) {
                      alert(`Failed to create diagram: ${error.message}`);
                    }
                  }}
                >
                  Yes
                </button>
                <button onClick={() => setSelectedRepo(null)}>No</button>
              </div>
            </div>
          )}
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

        {/* Comms container - sits below tools-container inside the right panel */}
        {currentSpaceId && (
          <div className="coms-container">
            <button
              className="shape-button"
              onClick={() => setChatOpen((prev) => !prev)}
              title="Toggle Space Chat"
              style={{
                background: chatOpen ? 'rgba(74,144,217,0.2)' : undefined,
                borderColor: chatOpen ? '#4a90d9' : undefined,
                color: chatOpen ? '#4a90d9' : undefined,
              }}
            >
              💬
            </button>
          </div>
        )}
      </div>

      {/* Group chat window - pops out to the left of the right panel */}
      <SpaceChat spaceId={currentSpaceId} user={user} isOpen={chatOpen} />
      {/* Visual tools container positioned at bottom center */}
      {user && (
        <div className="visual-tools-container" onClick={(e) => e.stopPropagation()}>
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordClick}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? '' : ''}
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {showConnectionsHint && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              >
                Show connections
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(0,0,0,0.75) transparent transparent transparent',
                  }}
                />
              </div>
            )}
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
          </div>
          <button
            className={`shape-button ${cellBoundariesVisible ? 'active' : ''}`}
            onClick={handleCellBoundariesToggle}
            title="Toggle Cell Boundaries"
            style={{
              borderColor: cellBoundariesVisible ? '' : 'blue',
              borderWidth: cellBoundariesVisible ? '' : '2px',
            }}
          >
            ⬜
          </button>
          <button
            className="shape-button delete-all-button"
            onClick={handleDeleteAllCells}
            disabled={isDeleting}
            title="Delete All Objects in Space"
            style={{
              backgroundColor: isDeleting ? '#ccc' : '#ffebee',
              borderColor: '#f44336',
              color: '#f44336',
            }}
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
          <button
            className="shape-button"
            onClick={() => fetchAppJsxFromRepo(currentDiagramRepo)}
            disabled={!currentDiagramRepo || scanProgress.isScanning}
            title={currentDiagramRepo?.name ? `Rescan ${currentDiagramRepo.name}` : 'No repo scanned yet'}
            style={{
              backgroundColor: currentDiagramRepo && !scanProgress.isScanning ? '#e8f5e9' : '#ccc',
              borderColor: currentDiagramRepo && !scanProgress.isScanning ? '#4caf50' : '#aaa',
              color: currentDiagramRepo && !scanProgress.isScanning ? '#4caf50' : '#aaa',
              opacity: currentDiagramRepo && !scanProgress.isScanning ? 1 : 0.5,
            }}
          >
            🔄
          </button>
        </div>
      )}


      
      {/* Loading bar for GitHub repo scanning */}
      {scanProgress.isScanning && (
        <div className="scan-progress-overlay">
          <div className="scan-progress-container">
            <div className="scan-progress-text">{scanProgress.stage}</div>
            <div className="scan-progress-bar">
              <div 
                className="scan-progress-fill" 
                style={{ width: `${scanProgress.progress}%` }}
              />
            </div>
            <div className="scan-progress-percentage">{Math.round(scanProgress.progress)}%</div>
          </div>
        </div>
      )}
      
      {/* Notification popup */}
      {notification.show && (
        <div className="notification-overlay" onClick={handleScreenClick}>
          <div className="notification-popup">
            <span className="notification-icon">✓</span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
      {/* Space presence avatars */}
      <SpacePresenceAvatars spaceId={currentSpaceId} />
    </>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;

