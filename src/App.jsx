import * as THREE from 'three';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import Cube from './components/Cube';
import Sphere from './components/Sphere';
import Plane from './components/Plane';
import LineUI from './components/LineUI';
import HeaderInput from './components/HeaderInput';
import TextSprite from './components/TextSprite';
import TextStyleUI from './components/TextStyleUI';
import { EffectComposer, SMAA } from '@react-three/postprocessing'; // <-- Use SMAA instead of FXAA
import TextObject from './components/TextObject';
import { auth } from './firebase';
import { signInUser, observeAuthState } from './services/authService';
import { saveObjects, subscribeToObjects } from './services/objectsService';
import isEqual from 'lodash/isEqual'; // Add this import

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
}) => {
  useFrame((state, delta) => {
    if (connections.length > 0) {
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
            if (conn.dashDirection === 'left') {
              return {
                ...conn,
                dashOffset: (conn.dashOffset || 0) - delta * 2,
              };
            }
            if (conn.dashDirection === 'right') {
              return {
                ...conn,
                dashOffset: (conn.dashOffset || 0) + delta * 2,
              };
            }
          }
          return {
            ...conn,
            start: {
              ...conn.start,
              position: calculateFacePosition(conn.start),
            },
            end: {
              ...conn.end,
              position: calculateFacePosition(conn.end),
            },
          };
        })
      );
    }
  });
  return null;
};

const App = () => {
  const [backgroundColor] = useState('black');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const cameraRef = useRef();

  const [showAllCubesIndicators, setShowAllCubesIndicators] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [indicatorMode, setIndicatorMode] = useState('none');
  const [connections, setConnections] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const [activeTextStyleUI, setActiveTextStyleUI] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [lineTexts, setLineTexts] = useState({}); // Add state for line texts
  const [showLineTextInput, setShowLineTextInput] = useState(null); // Add state for text input
  const [lineTextStyles, setLineTextStyles] = useState({});
  const [showLineTextStyleUI, setShowLineTextStyleUI] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Add global indicator state
  const [globalIndicatorSelected, setGlobalIndicatorSelected] = useState(false);

  // Add handlers for indicator state
  const handleIndicatorSelected = () => {
    setShowAllCubesIndicators(true);
    setGlobalIndicatorSelected(true);
  };

  const handleIndicatorDeselected = () => {
    setShowAllCubesIndicators(false);
    setGlobalIndicatorSelected(false);
  };

  useEffect(() => {
    if (cameraRef.current?.orbitControls) {
      window.orbitControls = cameraRef.current.orbitControls;
    }
  }, [cameraRef.current?.orbitControls]); // Updated dependencies

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

  const handleLogin = () => {
    signInUser();
  };

  // Replace the redirect result effect with auth state observer
  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      console.log('Auth state changed:', user, auth.currentUser); // Debug log
      setUser(user);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Replace the existing loadObjects effect with a subscription
  useEffect(() => {
    if (user) {
      console.log('Setting up real-time subscription for user:', user.uid);
      const unsubscribe = subscribeToObjects(user.uid, (loadedObjects) => {
        console.log('Received real-time update:', loadedObjects);
        setObjects(loadedObjects);
      });

      return () => {
        console.log('Cleaning up subscription');
        unsubscribe();
      };
    }
  }, [user]);

  // Add debounced save effect
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (user && objects.length > 0) {
      const saveTimeout = setTimeout(() => {
        // Only save if objects have actually changed
        if (!isEqual(lastSavedRef.current, objects)) {
          lastSavedRef.current = JSON.parse(JSON.stringify(objects));
          saveObjects(user.uid, objects);
        }
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [objects, user]);

  const handleCreateObject = (type) => {
    if (!cameraRef.current || !cameraRef.current.camera) {
      console.warn('Camera ref or camera object not ready; aborting.');
      return;
    }

    const cameraPos = cameraRef.current.camera.position.clone();
    const euler = new THREE.Euler().setFromQuaternion(
      cameraRef.current.camera.quaternion
    );
    const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);

    // Place objects at different distances based on type
    const distance = type === 'text' ? 50 : 75;
    const position = cameraPos.add(direction.multiplyScalar(distance));

    setObjects((prevObjects) => [
      ...prevObjects,
      {
        type,
        position: [position.x, position.y, position.z],
        id: Date.now(),
        scale: [1, 1, 1],
        color: '#ffffff',
        headerText: '', // Add explicit headerText initialization
        faceColors: {},
        faceTexts: {
          front: '',
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        textStyle: {
          fontSize: 1.5,
          color: 'white',
          underline: false,
        },
        faceTextStyles: {
          front: { fontSize: 0.5, color: 'white', underline: false },
          back: { fontSize: 0.5, color: 'white', underline: false },
          top: { fontSize: 0.5, color: 'white', underline: false },
          bottom: { fontSize: 0.5, color: 'white', underline: false },
          right: { fontSize: 0.5, color: 'white', underline: false },
          left: { fontSize: 0.5, color: 'white', underline: false },
        },
        headerPosition: { x: 0, y: 0, z: 0 },
      },
    ]);
  };

  const handleObjectClick = (id) => {
    setSelectedId(id);
    setShowLineTextStyleUI(null); // Add this line
    setSelectedConnection(null);
  };

  const calculateFacePosition = (indicator) => {
    const cube = indicator.cube;
    if (!cube) return [0, 0, 0];

    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    const worldScale = new THREE.Vector3();
    cube.getWorldScale(worldScale);

    if (indicator.type === 'sphere') {
      // For dodecahedron, use the face's center position
      const localFacePos = new THREE.Vector3(...indicator.faceCenter);
      localFacePos.multiply(worldScale);
      return [
        worldPos.x + localFacePos.x,
        worldPos.y + localFacePos.y,
        worldPos.z + localFacePos.z,
      ];
    }

    // Original cube face position calculation
    const getScaledOffset = (faceName) => {
      const baseScale = 5;
      switch (faceName) {
        case 'front':
          return [0, 0, baseScale * worldScale.z];
        case 'back':
          return [0, 0, -baseScale * worldScale.z];
        case 'top':
          return [0, baseScale * worldScale.y, 0];
        case 'bottom':
          return [0, -baseScale * worldScale.y, 0];
        case 'right':
          return [baseScale * worldScale.x, 0, 0];
        case 'left':
          return [-baseScale * worldScale.x, 0, 0];
        default:
          return [0, 0, 0];
      }
    };

    const offset = getScaledOffset(indicator.face);
    return [
      worldPos.x + offset[0],
      worldPos.y + offset[1],
      worldPos.z + offset[2],
    ];
  };

  const handleObjectMove = useCallback((id, newPosition) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, position: [newPosition.x, newPosition.y, newPosition.z] }
          : obj
      )
    );
  }, []);

  const handleObjectUpdate = useCallback((id, updates) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  }, []);

  const handleFaceIndicatorClick = (indicator) => {
    if (selectedIndicators.length === 0) {
      setSelectedIndicators([indicator]);
      setShowAllCubesIndicators(true);
      setIndicatorMode('all');
    } else if (selectedIndicators.length === 1) {
      const startIndicator = selectedIndicators[0];

      const startPos = calculateFacePosition(startIndicator);
      const endPos = calculateFacePosition(indicator);

      setConnections((prev) => [
        ...prev,
        {
          start: { ...startIndicator, position: startPos },
          end: { ...indicator, position: endPos },
          id: Date.now(),
        },
      ]);

      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setIndicatorMode('connections');
    }
  };

  const handleFaceClick = (faceInfo) => {
    setIndicatorMode('single');
    setActiveIndicator(faceInfo);
  };

  const handleCanvasClick = (event) => {
    if (!event.object) {
      setActiveTextStyleUI(null);
      setSelectedConnection(null);
      setShowLineTextStyleUI(null); // Add this line
    }
    setSelectedId(null);
  };

  const handleToggleIndicators = (mode = 'all') => {
    if (mode === 'connection') {
      // Force all indicators to show for connection mode
      setShowAllCubesIndicators(true);
      setGlobalIndicatorSelected(true);
      handleIndicatorSelected(); // Add this call
      setIndicatorMode('indicators');
      setSelectedId(null);
      setSelectedIndicators([]);
    } else {
      setShowAllCubesIndicators((prev) => {
        const newValue = !prev;
        setGlobalIndicatorSelected(newValue); // Sync both states
        return newValue;
      });
      setIndicatorMode((prev) => (prev === 'all' ? 'none' : 'all'));
    }
  };

  const handleConnectionClick = (e, connectionId) => {
    e.stopPropagation();
    setSelectedConnection(connectionId);
    setShowLineTextStyleUI(null); // Add this line
    setSelectedId(null);
  };

  const calculateMidpoint = (start, end) => {
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ];
  };

  const handleLineStyleChange = (connectionId, styleType) => {
    if (styleType === 'dotted-left' || styleType === 'dotted-right') {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? {
                ...conn,
                lineStyle: 'dotted',
                dashDirection: styleType.split('-')[1],
                dashOffset: 0,
              }
            : conn
        )
      );
    } else if (styleType === 'dashed-left' || styleType === 'dashed-right') {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? {
                ...conn,
                lineStyle: 'dashed',
                dashDirection: styleType.split('-')[1],
                dashOffset: 0,
              }
            : conn
        )
      );
    } else {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? { ...conn, lineStyle: styleType, dashDirection: null }
            : conn
        )
      );
    }
  };

  const handleLineColorChange = (connectionId, color) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? { ...conn, color } : conn))
    );
  };

  const handleLineTextSubmit = (connectionId, text) => {
    setLineTexts((prev) => ({
      ...prev,
      [connectionId]: text,
    }));
    setShowLineTextInput(null);
  };

  const handleLineTextStyleChange = (connectionId, newStyle) => {
    setLineTextStyles((prev) => ({
      ...prev,
      [connectionId]: { ...(prev[connectionId] || {}), ...newStyle },
    }));
  };

  // Add click handler for text sprite
  const handleLineTextClick = (e, connectionId) => {
    e.stopPropagation();
    setShowLineTextStyleUI(connectionId);
    setShowLineTextInput(null);
  };

  // Return loading state while auth is initializing
  if (!isAuthReady) {
    return <div>Loading...</div>;
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
          samples: 16, // Updated MSAA sample count from 8 to 16
          alpha: true,
          stencil: true,
          depth: true,
          logarithmicDepthBuffer: true,
        }}
        dpr={[1, 2]} // Set minimum and maximum pixel ratio
      >
        <CustomCamera ref={cameraRef} />
        <group>
          <ConnectionUpdater
            connections={connections}
            setConnections={setConnections}
            calculateFacePosition={calculateFacePosition}
          />
          {connections.map((connection) => {
            const midpoint = calculateMidpoint(
              connection.start.position,
              connection.end.position
            );

            return (
              <group key={connection.id}>
                <Line
                  points={[connection.start.position, connection.end.position]}
                  color={
                    connection.color ||
                    (selectedConnection === connection.id ? '#ffff00' : 'white')
                  }
                  lineWidth={selectedConnection === connection.id ? 4 : 2}
                  dashed={
                    connection.lineStyle === 'dashed' ||
                    connection.lineStyle === 'dotted'
                  }
                  // Increased dash spacing for dashed lines
                  dashScale={connection.lineStyle === 'dotted' ? 1 : 0.5}
                  dashSize={connection.lineStyle === 'dotted' ? 0.5 : 4}
                  gapSize={connection.lineStyle === 'dotted' ? 1 : 10}
                  dashOffset={connection.dashOffset || 0} // <-- New: animate dash offset
                />
                <Line
                  points={[connection.start.position, connection.end.position]}
                  color="white"
                  lineWidth={20}
                  onClick={(e) => handleConnectionClick(e, connection.id)}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'auto';
                  }}
                  transparent
                  opacity={0}
                />
                {lineTexts[connection.id] && (
                  <TextSprite
                    text={lineTexts[connection.id]}
                    position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
                    style={
                      lineTextStyles[connection.id] || {
                        fontSize: 1,
                        color: 'white',
                      }
                    }
                    onClick={(e) => handleLineTextClick(e, connection.id)}
                  />
                )}

                {showLineTextInput === connection.id && (
                  <HeaderInput
                    position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
                    onTextSubmit={(text) =>
                      handleLineTextSubmit(connection.id, text)
                    }
                  />
                )}

                {showLineTextStyleUI === connection.id && (
                  <TextStyleUI
                    position={[midpoint[0], midpoint[1] + 8, midpoint[2]]}
                    onStyleChange={(style) =>
                      handleLineTextStyleChange(connection.id, style)
                    }
                    onClose={() => setShowLineTextStyleUI(null)}
                  />
                )}

                {selectedConnection === connection.id && (
                  <LineUI
                    position={midpoint}
                    onColorChange={(color) =>
                      handleLineColorChange(connection.id, color)
                    }
                    onToggleDashed={(styleType) => {
                      handleLineStyleChange(connection.id, styleType);
                    }}
                    onTextClick={() => {
                      setShowLineTextInput(connection.id);
                    }}
                  />
                )}
              </group>
            );
          })}

          {objects.map((obj) => {
            if (obj.type === 'cube') {
              return (
                <Cube
                  key={obj.id}
                  id={obj.id}
                  position={obj.position}
                  color={obj.color}
                  headerText={obj.headerText || ''} // Ensure headerText is passed with fallback
                  scale={obj.scale}
                  faceColors={obj.faceColors}
                  faceTexts={
                    obj.faceTexts || {
                      front: '',
                      back: '',
                      top: '',
                      bottom: '',
                      right: '',
                      left: '',
                    }
                  }
                  textStyle={
                    obj.textStyle || {
                      fontSize: 1.5,
                      color: 'white',
                      underline: false,
                    }
                  }
                  faceTextStyles={
                    obj.faceTextStyles || {
                      front: {
                        fontSize: 0.5,
                        color: 'white',
                        underline: false,
                      },
                      back: { fontSize: 0.5, color: 'white', underline: false },
                      top: { fontSize: 0.5, color: 'white', underline: false },
                      bottom: {
                        fontSize: 0.5,
                        color: 'white',
                        underline: false,
                      },
                      right: {
                        fontSize: 0.5,
                        color: 'white',
                        underline: false,
                      },
                      left: { fontSize: 0.5, color: 'white', underline: false },
                    }
                  }
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                  onMove={(newPosition) =>
                    handleObjectMove(obj.id, newPosition)
                  }
                  onUpdate={handleObjectUpdate}
                  disableOrbitControls={disableOrbitControls}
                  enableOrbitControls={enableOrbitControls}
                  onFaceIndicatorClick={handleFaceIndicatorClick}
                  onFaceClick={handleFaceClick}
                  showAllIndicators={showAllCubesIndicators}
                  activeIndicator={activeIndicator}
                  indicatorMode={indicatorMode}
                  connections={connections}
                  selectedIndicators={selectedIndicators}
                  activeTextStyleUI={activeTextStyleUI}
                  setActiveTextStyleUI={setActiveTextStyleUI}
                />
              );
            }
            if (obj.type === 'sphere') {
              return (
                <Sphere
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                  showAllIndicators={showAllCubesIndicators}
                  onIndicatorSelected={handleIndicatorSelected}
                  onIndicatorDeselected={handleIndicatorDeselected}
                  globalIndicatorSelected={globalIndicatorSelected}
                  onFaceIndicatorClick={handleFaceIndicatorClick}
                  onMove={(newPosition) =>
                    handleObjectMove(obj.id, newPosition)
                  }
                />
              );
            }
            if (obj.type === 'plane') {
              return (
                <Plane
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                />
              );
            }
            if (obj.type === 'text') {
              return (
                <TextObject
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                />
              );
            }
            return null;
          })}
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
      />
    </>
  );
};

export default App;
