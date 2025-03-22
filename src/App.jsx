import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, SMAA } from '@react-three/postprocessing';
import './App.css';

// Component imports
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import ConnectionUpdater from './components/ConnectionUpdater';
import ObjectRenderer from './components/ObjectRenderer';
import ConnectionsRenderer from './components/ConnectionsRenderer';

// Hook imports
import { useAuthState } from './hooks/useAuthState';
import { useSpaceManager } from './hooks/useSpaceManager';
import { useConnections } from './hooks/useConnections';
import { useObjects } from './hooks/useObjects';
import { useIndicators } from './hooks/useIndicators';

// Utility imports
import { memoize } from './utils/perfUtils';
import { calculateFacePosition } from './utils/facePositionUtils';
import {
  handleObjectMove,
  handleObjectUpdate,
} from './utils/objectUpdateHandlers';
import { handleFaceIndicatorClick } from './utils/faceIndicatorUtils';
import {
  initializeConnectionMappings,
  preloadConnectionsForSpace,
} from './services/connectionManager';
import { signInUser } from './services/authService';
import { subscribeToObjects } from './services/objectsService';
import isEqual from 'lodash/isEqual';

/**
 * Main application component
 */
const App = () => {
  // Base state
  const [backgroundColor] = useState('black');
  const cameraRef = useRef();
  const intentionalSpaceChangeRef = useRef(false);

  // Object state that needs to be initialized first
  const [objects, setObjects] = useState([]);

  // Auth and space hooks
  const { user, isAuthReady, isCheckingUrlAuth } = useAuthState();
  const { currentSpaceId } = useSpaceManager({
    user,
    intentionalSpaceChangeRef,
  });

  // Memoize the objects parameter to useConnections to prevent identity changes
  const objectsParam = useMemo(() => {
    // Only include necessary data to avoid excessive object references
    return objects.map((obj) => ({
      id: obj.id,
      position: obj.position,
      scale: obj.scale,
      type: obj.type,
    }));
  }, [objects]);

  // Connections hooks (now with objects already initialized)
  const {
    connections,
    setConnections,
    lineTexts,
    selectedConnection,
    setSelectedConnection,
    showLineTextInput,
    setShowLineTextInput,
    showLineTextStyleUI,
    setShowLineTextStyleUI,
    lineTextStyles,
    setLineTextStyles,
    handleLineTextSubmit,
    handleLineTextStyleChange,
    handleLineColorChange,
    handleLineStyleChange,
    handleConnectionClick,
    handleLineTextClick,
    connectionsLoaded,
  } = useConnections({
    user,
    currentSpaceId,
    objects: objectsParam, // Use the memoized objects param
  });

  // Objects hook gets the connections from above
  const {
    selectedId,
    setSelectedId,
    handleCreateObject,
    handleObjectDelete,
    lastUpdateRef,
    draggingObjectsRef,

    registerTransformingObject, // Get the transform function
    transformingObjectsRef, // Get the transform ref
    getTransformStartPosition, // Add this new property
    checkPositionJitter, // Get the jitter check function
  } = useObjects({
    user,
    currentSpaceId,
    cameraRef,
    connections,
    setConnections,
    objects,
    setObjects,
  });

  // Indicators hook
  const {
    showAllCubesIndicators,
    setShowAllCubesIndicators,
    activeIndicator,
    setActiveIndicator,
    indicatorMode,
    setIndicatorMode,
    selectedIndicators,
    setSelectedIndicators,
    isConnectMode,
    setIsConnectMode,
    globalIndicatorSelected,
    setGlobalIndicatorSelected,
    selectedIndicatorsRef,
    handleToggleIndicators,
    handleIndicatorSelected,
    handleIndicatorDeselected,
  } = useIndicators();

  // UI state
  const [activeTextStyleUI, setActiveTextStyleUI] = useState(null);

  // Initialize connections
  useEffect(() => {
    if (user) {
      // More robust initialization process
      const initConnections = async () => {
        console.log('Initializing connection mappings');
        try {
          // First initialize the connection mappings
          const initResult = await initializeConnectionMappings(user.uid);
          console.log('Connection mapping initialization result:', initResult);

          // If we're in a specific space, also preload its connections
          if (currentSpaceId) {
            const spaceOwnerId = window.currentSpaceOwner || user.uid;
            const preloadResult = await preloadConnectionsForSpace(
              spaceOwnerId,
              currentSpaceId
            );
            console.log('Connection preloading result:', preloadResult);
          }
        } catch (err) {
          console.error('Error during connection initialization:', err);
        }
      };

      // Run the initialization
      initConnections();
    }
  }, [user, currentSpaceId]);

  // Subscribe to objects changes
  useEffect(() => {
    if (!user || !currentSpaceId) return () => {};

    const spaceOwnerId = window.currentSpaceOwner || user.uid;

    const unsubscribe = subscribeToObjects(
      spaceOwnerId,
      currentSpaceId,
      (change) => {
        setObjects((prev) => {
          switch (change.type) {
            case 'added':
              if (!prev.find((obj) => obj.id === change.id)) {
                return [...prev, change.object];
              }
              return prev;
            case 'modified':
              // Prevent position updates for actively transformed/dragged objects
              if (
                transformingObjectsRef.current.has(change.id.toString()) ||
                draggingObjectsRef.current.has(change.id.toString())
              ) {
                // Find existing object
                const existingObj = prev.find(
                  (obj) => obj.id.toString() === change.id
                );
                if (existingObj) {
                  // Preserve current position but accept other changes
                  const updatedObj = {
                    ...change.object,
                    position: existingObj.position,
                    _transformActive: true,
                  };
                  lastUpdateRef.current[change.id] = updatedObj;

                  return prev.map((obj) =>
                    obj.id.toString() === change.id ? updatedObj : obj
                  );
                }
              }

              // Update other objects normally
              if (!isEqual(lastUpdateRef.current[change.id], change.object)) {
                lastUpdateRef.current[change.id] = change.object;
                return prev.map((obj) =>
                  obj.id.toString() === change.id ? change.object : obj
                );
              }
              return prev;
            case 'removed':
              delete lastUpdateRef.current[change.id];
              return prev.filter((obj) => obj.id.toString() !== change.id);
            default:
              return prev;
          }
        });
      }
    );

    return () => unsubscribe();
  }, [
    user,
    currentSpaceId,
    lastUpdateRef,
    draggingObjectsRef,
    transformingObjectsRef,
  ]);

  // Matrix updates tracking to prevent recursion
  const handleObjectMatrixChanged = useCallback((id, matrixWorld) => {
    if (!window._matrixUpdateMap) {
      window._matrixUpdateMap = new Map();
    }

    const prevMatrix = window._matrixUpdateMap.get(id.toString());
    if (prevMatrix && matrixWorld.equals(prevMatrix)) {
      return;
    }

    window._matrixUpdateMap.set(id.toString(), matrixWorld.clone());
  }, []);

  // Store camera reference in window for debugging
  useEffect(() => {
    if (cameraRef.current?.orbitControls) {
      window.orbitControls = cameraRef.current.orbitControls;
    }

    // Also ensure the camera is accessible
    if (cameraRef.current?.camera) {
      window.camera = cameraRef.current.camera;
    }
  }, [cameraRef.current]);

  // Camera controls
  const disableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = false;
    }
  }, []);

  const enableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = true;
    }
  }, []);

  // Login handler
  const handleLogin = useCallback(() => {
    signInUser();
  }, []);

  // Object click handler
  const handleObjectClick = useCallback(
    (id) => {
      setSelectedId(id);
      setShowLineTextStyleUI(null);
      setSelectedConnection(null);
    },
    [setSelectedId, setShowLineTextStyleUI, setSelectedConnection]
  );

  // Face position calculation
  const calculateFacePositionWithObjects = useCallback(
    (indicator) => calculateFacePosition(indicator, objects),
    [objects]
  );

  const memoizedCalculateFacePosition = useMemo(
    () => memoize(calculateFacePositionWithObjects),
    [calculateFacePositionWithObjects]
  );

  // Object move handler
  const handleObjectMoveCallback = useCallback(
    (id, newPosition, isDragStart = false, isDragEnd = false) => {
      handleObjectMove({
        id,
        newPosition,
        isDragStart,
        isDragEnd,
        draggingObjectsRef,
        objects,
        setObjects,
        connections,
        setConnections,
        user,
        currentSpaceId,
      });
    },
    [
      user,
      objects,
      connections,
      currentSpaceId,
      setObjects,
      setConnections,
      draggingObjectsRef,
    ]
  );

  // Object update handler
  const handleObjectUpdateCallback = useCallback(
    (id, updates) => {
      // Skip position updates for objects being transformed
      // Or for position updates that look like jitter
      if (updates.position) {
        if (transformingObjectsRef.current.has(id.toString())) {
          // Skip position updates during transform, keep other properties
          const updatesWithoutPosition = { ...updates };
          delete updatesWithoutPosition.position;

          if (Object.keys(updatesWithoutPosition).length > 0) {
            handleObjectUpdate({
              id,
              updates: updatesWithoutPosition,
              transformingObjects: transformingObjectsRef,
              lastUpdateRef,
              setObjects,
              user,
              currentSpaceId,
              checkPositionJitter,
            });
          }
          return;
        }

        // If position looks like jitter (oscillation), skip it
        if (checkPositionJitter(id, updates.position)) {
          console.log('Skipping likely position jitter for object', id);
          const updatesWithoutPosition = { ...updates };
          delete updatesWithoutPosition.position;

          if (Object.keys(updatesWithoutPosition).length > 0) {
            handleObjectUpdate({
              id,
              updates: updatesWithoutPosition,
              transformingObjects: transformingObjectsRef,
              lastUpdateRef,
              setObjects,
              user,
              currentSpaceId,
              checkPositionJitter,
            });
          }
          return;
        }
      }

      // For non-position updates or non-jittery updates
      handleObjectUpdate({
        id,
        updates,
        transformingObjects: transformingObjectsRef,
        lastUpdateRef,
        setObjects,
        user,
        currentSpaceId,
        checkPositionJitter,
      });
    },
    [
      user,
      currentSpaceId,
      setObjects,
      lastUpdateRef,
      transformingObjectsRef,
      checkPositionJitter,
    ]
  );

  // Face indicator click handler
  const handleFaceIndicatorClickCallback = useCallback(
    (indicator) => {
      handleFaceIndicatorClick({
        indicator,
        objects,
        connections,
        selectedIndicatorsRef,
        setSelectedIndicators,
        setConnections,
        setIsConnectMode,
        setIndicatorMode,
        setShowAllCubesIndicators,
        setGlobalIndicatorSelected,
        user,
        currentSpaceId,
        isConnectMode,
      });
    },
    [
      objects,
      connections,
      user,
      currentSpaceId,
      isConnectMode,
      selectedIndicatorsRef,
      setSelectedIndicators,
      setConnections,
      setIsConnectMode,
      setIndicatorMode,
      setShowAllCubesIndicators,
      setGlobalIndicatorSelected,
    ]
  );

  // Face click handler
  const handleFaceClick = useCallback(
    (faceInfo) => {
      if (faceInfo.id || faceInfo.cube?.id) {
        setActiveIndicator({
          ...faceInfo,
          cube: {
            ...faceInfo.cube,
            id: faceInfo.id || faceInfo.cube?.id,
          },
        });
        setIndicatorMode('single');
      }
    },
    [setActiveIndicator, setIndicatorMode]
  );

  // Canvas click handler
  const handleCanvasClick = useCallback(
    (event) => {
      // Close any active text styling menus
      setActiveTextStyleUI(null);
      setSelectedConnection(null);
      setShowLineTextStyleUI(null);
      setSelectedId(null);

      // If they were trying to create a connection but clicked empty space,
      // cancel the connection creation process
      if (isConnectMode && selectedIndicators.length > 0) {
        setSelectedIndicators([]);
        selectedIndicatorsRef.current = [];
      }
    },
    [
      setActiveTextStyleUI,
      setSelectedConnection,
      setShowLineTextStyleUI,
      setSelectedId,
      isConnectMode,
      selectedIndicators,
      selectedIndicatorsRef,
    ]
  );

  // Show loading screens when authenticating
  if (isCheckingUrlAuth) {
    return <div className="auth-loading">Authenticating...</div>;
  }

  if (!isAuthReady) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <Canvas
        style={{
          background: backgroundColor,
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
        onPointerMissed={handleCanvasClick}
        gl={{
          antialias: true,
          samples: 16,
          alpha: true,
          stencil: true,
          depth: true,
          logarithmicDepthBuffer: true,
        }}
        dpr={[1, 2]}
      >
        <CustomCamera ref={cameraRef} />

        <group>
          {/* Connection updater component */}
          <ConnectionUpdater
            connections={connections}
            setConnections={setConnections}
            calculateFacePosition={memoizedCalculateFacePosition}
            transformingObjects={transformingObjectsRef} // Use transforming ref here too
          />

          {/* Render all connections */}
          <ConnectionsRenderer
            connections={connections}
            objects={objects}
            selectedConnection={selectedConnection}
            lineTexts={lineTexts}
            showLineTextInput={showLineTextInput}
            showLineTextStyleUI={showLineTextStyleUI}
            handleConnectionClick={handleConnectionClick}
            handleLineTextClick={handleLineTextClick}
            handleLineTextSubmit={handleLineTextSubmit}
            handleLineTextStyleChange={handleLineTextStyleChange}
            handleLineColorChange={handleLineColorChange}
            handleLineStyleChange={handleLineStyleChange}
            setShowLineTextStyleUI={setShowLineTextStyleUI}
            setShowLineTextInput={setShowLineTextInput}
          />

          {/* Render all objects */}
          {objects.map((obj) => (
            <ObjectRenderer
              key={obj.id}
              obj={obj}
              selectedId={selectedId}
              handleObjectClick={handleObjectClick}
              handleObjectMove={handleObjectMoveCallback}
              handleObjectUpdate={handleObjectUpdateCallback}
              disableOrbitControls={disableOrbitControls}
              enableOrbitControls={enableOrbitControls}
              handleFaceIndicatorClick={handleFaceIndicatorClickCallback}
              handleFaceClick={handleFaceClick}
              showAllCubesIndicators={showAllCubesIndicators}
              activeIndicator={activeIndicator}
              indicatorMode={indicatorMode}
              connections={connections}
              selectedIndicators={selectedIndicators}
              activeTextStyleUI={activeTextStyleUI}
              setActiveTextStyleUI={setActiveTextStyleUI}
              handleIndicatorDeselected={handleIndicatorDeselected}
              registerTransformingObject={registerTransformingObject} // Pass the register function
              getTransformStartPosition={getTransformStartPosition} // Add this prop
              handleObjectMatrixChanged={handleObjectMatrixChanged}
              handleIndicatorSelected={handleIndicatorSelected}
              globalIndicatorSelected={globalIndicatorSelected}
              handleObjectDelete={handleObjectDelete}
              checkPositionJitter={checkPositionJitter} // Pass this prop
            />
          ))}
        </group>

        <EffectComposer>
          <SMAA />
        </EffectComposer>
      </Canvas>

      <UIOverlay
        onCreateObject={handleCreateObject}
        onToggleIndicators={handleToggleIndicators}
        user={user}
        onLogin={handleLogin}
        isAuthReady={isAuthReady}
        isLoading={!isAuthReady}
        showLoginButton={!isCheckingUrlAuth && !user}
        isConnectMode={isConnectMode}
      />
    </>
  );
};

export default App;
