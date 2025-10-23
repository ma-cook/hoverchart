import { useUIOverlayStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  uploadModelToStorage,
  uploadMarkdownToStorage,
} from '../services/storageService';
import { screenRecorder } from '../services/screenRecordingService';
import { markdownDiagramService } from '../services/markdownDiagramService';
import { setCellBoundariesVisible } from '../stores/uiOverlayStore';
import * as THREE from 'three';
import { parse } from '@babel/parser';

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

  const cellBoundariesVisible = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.cellBoundariesVisible : false;
  });

  // Add this handler function
  const handleCellBoundariesToggle = useCallback(() => {
    setCellBoundariesVisible('main', !cellBoundariesVisible);
  }, [cellBoundariesVisible]);

  const exchangeGithubCode = async (code) => {
    try {
      const response = await fetch(
        'https://fetchgithubtoken-qtk2xsi74a-uc.a.run.app',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging GitHub code:', error);
      throw error;
    }
  };

  // Function to fetch repositories
  const fetchRepositories = async () => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      alert('Please log in to GitHub first.');
      return;
    }

    try {
      const response = await fetch('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // Function to generate Merfolk markdown from JSX content
  const generateMerfolkFromJsx = async (jsxContent, repoName) => {
    try {
      // Parse the JSX using Babel parser
      const ast = parse(jsxContent, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'], // Support both JS and TS
        allowImportExportEverywhere: true,
      });

      const elements = {
        components: [],
        functions: [],
        hooks: [],
        imports: [],
      };

      // Traverse the AST to extract components, functions, hooks, and imports
      const traverse = (node) => {
        if (!node) return;

        // Check for imports
        if (node.type === 'ImportDeclaration') {
          node.specifiers.forEach((spec) => {
            if (spec.type === 'ImportSpecifier') {
              elements.imports.push(spec.imported.name);
            } else if (spec.type === 'ImportDefaultSpecifier') {
              elements.imports.push(spec.local.name);
            }
          });
        }

        // Check for function declarations
        if (node.type === 'FunctionDeclaration' && node.id) {
          elements.functions.push(node.id.name);
        }

        // Check for arrow function expressions and variable declarations
        if (node.type === 'VariableDeclaration') {
          node.declarations.forEach((decl) => {
            if (decl.id && decl.id.name) {
              // Check if it's a function
              if (
                decl.init &&
                (decl.init.type === 'ArrowFunctionExpression' ||
                  decl.init.type === 'FunctionExpression')
              ) {
                elements.functions.push(decl.id.name);
              }

              // Check if it's a React component (starts with capital letter)
              if (
                decl.init &&
                decl.init.type === 'ArrowFunctionExpression' &&
                decl.id.name[0] === decl.id.name[0].toUpperCase()
              ) {
                elements.components.push(decl.id.name);
              }

              // Check if it's a hook (starts with 'use')
              if (
                decl.init &&
                decl.init.type === 'CallExpression' &&
                decl.init.callee.name &&
                decl.init.callee.name.startsWith('use')
              ) {
                elements.hooks.push(decl.id.name);
              }
            }
          });
        }

        // Check for class declarations (React components)
        if (node.type === 'ClassDeclaration' && node.id) {
          elements.components.push(node.id.name);
        }

        // Recursively traverse child nodes
        Object.keys(node).forEach((key) => {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(traverse);
          } else if (child && typeof child === 'object' && child.type) {
            traverse(child);
          }
        });
      };

      traverse(ast);

      // Generate Merfolk markdown
      let markdown = `%% ${repoName} App.jsx Analysis\n\n`;

      // Add components
      elements.components.forEach((comp) => {
        markdown += `App{Component: ${comp}}\n`;
      });

      // Add functions
      elements.functions.forEach((func) => {
        markdown += `${func}[Function: ${func}]\n`;
      });

      // Add hooks
      elements.hooks.forEach((hook) => {
        markdown += `${hook}[Hook: ${hook}]\n`;
      });

      // Add connections
      if (elements.components.length > 0 && elements.functions.length > 0) {
        markdown += '\n%% Component-Function relationships\n';
        elements.components.forEach((comp) => {
          elements.functions.forEach((func) => {
            markdown += `${comp} --> ${func} : "uses"\n`;
          });
        });
      }

      if (elements.imports.length > 0 && elements.components.length > 0) {
        markdown += '\n%% Import-Component relationships\n';
        elements.imports.forEach((imp) => {
          elements.components.forEach((comp) => {
            markdown += `${imp} --> ${comp} : "imported by"\n`;
          });
        });
      }

      // Wrap the entire diagram in Merfolk code blocks
      const merfolkMarkdown = `\`\`\`merfolk\n${markdown}\`\`\`\n`;

      console.log('Generated Merfolk markdown:', merfolkMarkdown);
      return merfolkMarkdown;
    } catch (error) {
      console.error('Error parsing JSX:', error);
      // Return a basic markdown if parsing fails
      return `%% ${repoName} App.jsx Analysis\n\nApp{Component: App}\n\n%% Unable to parse JSX content\n`;
    }
  };

  // Function to fetch App.jsx from selected GitHub repository
  const fetchAppJsxFromRepo = async (repo) => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      throw new Error('No GitHub token found');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/src/App.jsx`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3.raw', // Get raw file content
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('App.jsx file not found in this repository');
        }
        throw new Error(`Failed to fetch App.jsx: ${response.statusText}`);
      }

      const fileContent = await response.text();

      // Parse the JSX content and generate Merfolk markdown
      const merfolkMarkdown = await generateMerfolkFromJsx(
        fileContent,
        repo.name
      );

      // Upload the generated markdown to Firebase Storage
      let storageUrl = null;
      if (user?.uid && currentSpaceId) {
        try {
          storageUrl = await uploadMarkdownToStorage(
            merfolkMarkdown,
            user.uid,
            currentSpaceId,
            `${repo.name}-diagram.md`
          );
          console.log('Markdown uploaded to Firebase Storage:', storageUrl);
        } catch (uploadError) {
          console.error('Failed to upload markdown to storage:', uploadError);
          // Continue with processing even if upload fails
        }
      }

      // Create a File from the markdown for processing
      const markdownBlob = new Blob([merfolkMarkdown], {
        type: 'text/markdown',
      });
      const markdownFile = new File([markdownBlob], `${repo.name}-diagram.md`, {
        type: 'text/markdown',
      });

      // Use the markdown processing service to handle the upload and creation
      const result = await markdownDiagramService.processMarkdownFile(
        markdownFile,
        onCreateObject,
        currentSpaceId,
        user
      );

      if (result.success) {
        const uploadMessage = storageUrl
          ? ` and saved to storage (${storageUrl})`
          : '';
        alert(
          `Successfully created diagram for ${repo.name}! Generated ${result.objectsCreated} 3D objects with ${result.connectionsCreated} connections${uploadMessage}.`
        );
      } else {
        alert(
          'Diagram generated but no 3D objects were created. Check Merfolk syntax.'
        );
      }

      return fileContent;
    } catch (error) {
      console.error('Error fetching App.jsx from repo:', error);
      throw error;
    }
  };

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Exchange the code for a token and fetch repositories
      exchangeGithubCode(code)
        .then((token) => {
          localStorage.setItem('github_token', token); // Save token for future use
          // Clean up the URL by removing the code parameter
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
          fetchRepositories();
          alert('GitHub login successful!');
        })
        .catch((error) => {
          console.error('GitHub OAuth flow failed:', error);
          // Clean up the URL even on failure
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
        });
    }
  }, []);

  // Add this useEffect to check for existing GitHub token on mount
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    setIsGithubAuthenticated(!!token);
  }, []);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Exchange the code for a token and fetch repositories
      exchangeGithubCode(code)
        .then((token) => {
          localStorage.setItem('github_token', token); // Save token for future use
          setIsGithubAuthenticated(true); // Update authentication state
          // Clean up the URL by removing the code parameter
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
          fetchRepositories();
          alert('GitHub login successful!');
        })
        .catch((error) => {
          console.error('GitHub OAuth flow failed:', error);
          // Clean up the URL even on failure
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
        });
    }
  }, []);

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
  }, [isRecording, setIsRecording]);

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
              onClick={() =>
                (window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23liLYzf9WoYPLBNat&scope=repo&redirect_uri=${encodeURIComponent(
                  'https://space.volscape.com'
                )}`)
              }
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
              className={`shape-button ${
                cellBoundariesVisible ? 'active' : ''
              }`}
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
