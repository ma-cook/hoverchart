import * as THREE from 'three';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import Cube from './components/Cube';
import Sphere from './components/Dodecahedron';
import Plane from './components/Plane';
import LineUI from './components/LineUI';
import HeaderInput from './components/HeaderInput';
import TextSprite from './components/TextSprite';
import TextStyleUI from './components/TextStyleUI';
import { EffectComposer, SMAA } from '@react-three/postprocessing'; // <-- Use SMAA instead of FXAA
import TextObject from './components/TextObject';
import { auth } from './firebase';
import { signInUser, observeAuthState } from './services/authService';
import { saveObject, subscribeToObjects } from './services/objectsService';
import isEqual from 'lodash/isEqual'; // Add this import
import {
  saveConnection,
  subscribeToConnections,
} from './services/connectionsService';
import IndicatorManager from './components/IndicatorManager';

const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
}) => {
  useFrame((state, delta) => {
    if (connections.length > 0) {
      setConnections((prev) =>
        prev.map((conn) => {
          // Calculate new positions regardless of line style
          const newStartPos = calculateFacePosition(conn.start);
          const newEndPos = calculateFacePosition(conn.end);

          // Update dash offset if line is animated
          let newDashOffset = conn.dashOffset;
          if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
            if (conn.dashDirection === 'left') {
              newDashOffset = (conn.dashOffset || 0) - delta * 2;
            }
            if (conn.dashDirection === 'right') {
              newDashOffset = (conn.dashOffset || 0) + delta * 2;
            }
          }

          // Return updated connection with new positions and dash offset
          return {
            ...conn,
            start: {
              ...conn.start,
              position: newStartPos,
            },
            end: {
              ...conn.end,
              position: newEndPos,
            },
            dashOffset: newDashOffset,
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
    setIndicatorMode('indicators'); // Change this to 'indicators' instead of 'all'
    // Don't clear selectedId to maintain selection state
  };

  const handleIndicatorDeselected = useCallback(() => {
    setShowAllCubesIndicators(false);
    setGlobalIndicatorSelected(false);
    setIndicatorMode('none');
    setSelectedIndicators([]);
  }, []);

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

  // Replace loadObjects effect with new subscription handler
  const lastUpdateRef = useRef({});

  // Replace subscription effect with debounced version
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToObjects(user.uid, (change) => {
        console.log('Received object change:', change);
        setObjects((prev) => {
          switch (change.type) {
            case 'added':
              if (!prev.find((obj) => obj.id === change.id)) {
                return [...prev, change.object];
              }
              return prev;
            case 'modified':
              // Only update if the object data has actually changed
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
      });

      return () => unsubscribe();
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
          // Save each object individually
          objects.forEach((obj) => {
            saveObject(user.uid, obj);
          });
        }
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [objects, user]);

  const handleCreateObject = (type) => {
    if (!cameraRef.current?.camera || !user) return;

    const cameraPos = cameraRef.current.camera.position.clone();
    const euler = new THREE.Euler().setFromQuaternion(
      cameraRef.current.camera.quaternion
    );
    const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);

    const distance = type === 'text' ? 50 : 75;
    const position = cameraPos.add(direction.multiplyScalar(distance));

    const newObject = {
      type,
      position: [position.x, position.y, position.z],
      id: Date.now(),
      scale: [1, 1, 1],

      ...(type === 'sphere'
        ? {
            lineColor: 'white',
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'white',
              underline: false,
            },
            faceColors: Array(12)
              .fill(null)
              .reduce((acc, _, idx) => {
                acc[idx] = null;
                return acc;
              }, {}),
            faceTexts: Array(12)
              .fill('')
              .reduce((acc, _, idx) => {
                acc[idx] = '';
                return acc;
              }, {}),
            faceTextStyles: Array(12)
              .fill(null)
              .reduce((acc, _, idx) => {
                acc[idx] = {
                  fontSize: 0.5,
                  color: 'white',
                  underline: false,
                };
                return acc;
              }, {}),
          }
        : type === 'cube'
        ? {
            color: '#ffffff',
            headerText: '',

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
          }
        : type === 'plane'
        ? {
            borderStyle: 'solid',
            borderColor: 'white',
            lineThickness: 1,
            color: null,
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'white',
              underline: false,
            },
            faceText: '', // Add this
            faceTextStyle: {
              // Add this
              fontSize: 0.5,
              color: 'white',
              underline: false,
            },
          }
        : {}), // default empty object for other types
    };

    saveObject(user.uid, newObject);
  };

  const handleObjectClick = (id) => {
    setSelectedId(id);
    setShowLineTextStyleUI(null); // Add this line
    setSelectedConnection(null);
  };

  const calculateFacePosition = useCallback((indicator) => {
    // For plane indicators, use existing logic
    if (indicator.type === 'plane') {
      const plane = indicator.plane;
      if (plane && typeof plane.getWorldPosition === 'function') {
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        plane.getWorldPosition(worldPos);
        plane.getWorldQuaternion(worldQuat);
        plane.getWorldScale(worldScale);
        const localOffset = new THREE.Vector3(0, -5 * worldScale.y - 1, 0);
        localOffset.applyQuaternion(worldQuat);
        return [
          worldPos.x + localOffset.x,
          worldPos.y + localOffset.y,
          worldPos.z + localOffset.z,
        ];
      } else {
        return indicator.position;
      }
    }

    // For cube/sphere indicators, if the cube reference is missing or invalid, return the stored position
    if (
      !indicator.cube ||
      typeof indicator.cube.getWorldPosition !== 'function'
    ) {
      return indicator.position;
    }

    // Proceed with regular cube face positioning
    const cube = indicator.cube;
    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    const worldScale = new THREE.Vector3();
    cube.getWorldScale(worldScale);
    if (indicator.type === 'sphere') {
      const localFacePos = new THREE.Vector3(...indicator.faceCenter);
      localFacePos.multiply(worldScale);
      return [
        worldPos.x + localFacePos.x,
        worldPos.y + localFacePos.y,
        worldPos.z + localFacePos.z,
      ];
    }
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
  }, []);

  const handleObjectMove = useCallback(
    (id, newPosition) => {
      // Update local state
      setObjects((prev) =>
        prev.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                position: [newPosition.x, newPosition.y, newPosition.z],
              }
            : obj
        )
      );

      // Immediate database update
      if (user && id) {
        const object = objects.find((obj) => obj.id === id);
        if (object) {
          const updatedObject = {
            ...object,
            position: [newPosition.x, newPosition.y, newPosition.z],
          };

          // Save to database immediately
          saveObject(user.uid, updatedObject);

          // Update last saved reference
          lastUpdateRef.current[id] = updatedObject;

          // Update all connections involving this object
          const connectionsToUpdate = connections.filter(
            (conn) => conn.start?.cube?.id === id || conn.end?.cube?.id === id
          );

          if (connectionsToUpdate.length > 0) {
            // For each affected connection, recalculate positions
            connectionsToUpdate.forEach((conn) => {
              const updatedConnection = { ...conn };

              // If this object is the start of the connection
              if (conn.start?.cube?.id === id) {
                const newStartPos = calculateFacePosition({
                  ...conn.start,
                  cube: updatedObject,
                });

                updatedConnection.start = {
                  ...conn.start,
                  position: newStartPos,
                };
              }

              // If this object is the end of the connection
              if (conn.end?.cube?.id === id) {
                const newEndPos = calculateFacePosition({
                  ...conn.end,
                  cube: updatedObject,
                });

                updatedConnection.end = {
                  ...conn.end,
                  position: newEndPos,
                };
              }

              // Save updated connection to database
              saveConnection(user.uid, updatedConnection);
            });
          }
        }
      }
    },
    [user, objects, connections, calculateFacePosition]
  );

  // Update handleObjectUpdate to use debouncing and prevent unnecessary updates
  const handleObjectUpdate = useCallback(
    (id, updates) => {
      if (!user || !id) return;

      setObjects((prev) => {
        const updatedObjects = prev.map((obj) => {
          if (obj.id === id) {
            const newObj = { ...obj, ...updates };

            // Check if position has changed
            if (updates.position && !isEqual(obj.position, updates.position)) {
              // Save immediately for position changes
              saveObject(user.uid, newObj);
              lastUpdateRef.current[id] = newObj;
            } else {
              // Normal debounced save for other changes
              if (!isEqual(lastUpdateRef.current[id], newObj)) {
                lastUpdateRef.current[id] = newObj;
                saveObject(user.uid, newObj);
              }
            }
            return newObj;
          }
          return obj;
        });
        return updatedObjects;
      });
    },
    [user]
  );

  const handleFaceIndicatorClick = (indicator) => {
    if (selectedIndicators.length === 0) {
      setSelectedIndicators([indicator]);
      setShowAllCubesIndicators(true);
      setGlobalIndicatorSelected(true);
    } else if (selectedIndicators.length === 1) {
      const startIndicator = selectedIndicators[0];
      const startPos = calculateFacePosition(startIndicator);
      const endPos = calculateFacePosition(indicator);

      // Check for duplicate connection regardless of direction
      const duplicate = connections.some((conn) => {
        const sameOrder =
          conn.start.objectId === startIndicator.cube?.id.toString() &&
          conn.start.face === startIndicator.face &&
          conn.end.objectId === indicator.cube?.id.toString() &&
          conn.end.face === indicator.face;
        const reverseOrder =
          conn.start.objectId === indicator.cube?.id.toString() &&
          conn.start.face === indicator.face &&
          conn.end.objectId === startIndicator.cube?.id.toString() &&
          conn.end.face === startIndicator.face;
        return sameOrder || reverseOrder;
      });

      if (duplicate) {
        console.log('Connection already exists.');
        return;
      }

      const connectionId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Include objectId in the connection data
      const newConnection = {
        id: connectionId,
        start: {
          type: startIndicator.type,
          face: startIndicator.face,
          position: startPos,
          faceCenter: startIndicator.faceCenter,
          objectId: startIndicator.cube?.id.toString(), // Store ID instead of reference
          cube: startIndicator.cube, // Keep reference for immediate use
          plane: startIndicator.plane,
        },
        end: {
          type: indicator.type,
          face: indicator.face,
          position: endPos,
          faceCenter: indicator.faceCenter,
          objectId: indicator.cube?.id.toString(), // Store ID instead of reference
          cube: indicator.cube, // Keep reference for immediate use
          plane: indicator.plane,
        },
        lineStyle: 'straight',
        color: 'white',
        text: '',
        textStyle: { fontSize: 1, color: 'white' },
      };

      // Update local state immediately for clickability
      setConnections((prev) => [...prev, newConnection]);

      // Save to database; if error, rollback state
      if (user) {
        saveConnection(user.uid, newConnection).catch((error) => {
          console.error('Failed to save connection:', error);
          setConnections((prev) =>
            prev.filter((conn) => conn.id !== connectionId)
          );
        });
      }

      // Reset indicator selection states
      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setGlobalIndicatorSelected(false);
      setIndicatorMode('none');
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
      // Reset all indicator states before showing all indicators
      setSelectedIndicators([]);
      setIndicatorMode('indicators');
      setShowAllCubesIndicators(true);
      setGlobalIndicatorSelected(true);
      setSelectedId(null);
    } else {
      setShowAllCubesIndicators((prev) => {
        const newValue = !prev;
        setGlobalIndicatorSelected(newValue);
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
    // Check if start and end are valid arrays with numeric values
    if (
      !start ||
      !end ||
      !Array.isArray(start) ||
      !Array.isArray(end) ||
      start.length < 3 ||
      end.length < 3
    ) {
      return [0, 0, 0]; // Return a default position if inputs are invalid
    }

    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ];
  };

  const handleLineStyleChange = (connectionId, styleType) => {
    const updatedConnection = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!updatedConnection || !user) return;

    let newConnection;
    if (styleType === 'dotted-left' || styleType === 'dotted-right') {
      newConnection = {
        ...updatedConnection,
        lineStyle: 'dotted',
        dashDirection: styleType.split('-')[1],
        dashOffset: 0,
      };
    } else if (styleType === 'dashed-left' || styleType === 'dashed-right') {
      newConnection = {
        ...updatedConnection,
        lineStyle: 'dashed',
        dashDirection: styleType.split('-')[1],
        dashOffset: 0,
      };
    } else {
      newConnection = {
        ...updatedConnection,
        lineStyle: styleType,
        dashDirection: null,
      };
    }

    // Update local state
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );

    // Save to database
    saveConnection(user.uid, newConnection);
  };

  const handleLineColorChange = (connectionId, color) => {
    const updatedConnection = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!updatedConnection || !user) return;

    const newConnection = { ...updatedConnection, color };

    // Update local state
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );

    // Save to database
    saveConnection(user.uid, newConnection);
  };

  const handleLineTextSubmit = (connectionId, text) => {
    const updatedConnection = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!updatedConnection || !user) return;

    const newConnection = {
      ...updatedConnection,
      text,
      textStyle: updatedConnection.textStyle || { fontSize: 1, color: 'white' },
    };

    // Update local state
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );

    // Save to database
    saveConnection(user.uid, newConnection);

    // Close text input
    setShowLineTextInput(null);
  };

  const handleLineTextStyleChange = (connectionId, newStyle) => {
    const updatedConnection = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!updatedConnection || !user) return;

    const newConnection = {
      ...updatedConnection,
      textStyle: { ...(updatedConnection.textStyle || {}), ...newStyle },
    };

    // Update local state
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );
    setLineTextStyles((prev) => ({
      ...prev,
      [connectionId]: { ...(prev[connectionId] || {}), ...newStyle },
    }));

    // Save to database
    saveConnection(user.uid, newConnection);
  };

  // Add click handler for text sprite
  const handleLineTextClick = (e, connectionId) => {
    e.stopPropagation();
    setShowLineTextStyleUI(connectionId);
    setShowLineTextInput(null);
  };

  // Add this helper function to map object IDs to references
  const mapConnectionsToObjects = useCallback((connections, objects) => {
    return connections.map((conn) => {
      // Find objects by ID
      const startObject = objects.find(
        (obj) => obj.id.toString() === conn.start?.objectId
      );
      const endObject = objects.find(
        (obj) => obj.id.toString() === conn.end?.objectId
      );

      // Create new connection with proper references
      return {
        ...conn,
        start: {
          ...conn.start,
          cube:
            startObject?.type === 'cube' || startObject?.type === 'sphere'
              ? startObject
              : undefined,
          plane: startObject?.type === 'plane' ? startObject : undefined,
        },
        end: {
          ...conn.end,
          cube:
            endObject?.type === 'cube' || endObject?.type === 'sphere'
              ? endObject
              : undefined,
          plane: endObject?.type === 'plane' ? endObject : undefined,
        },
      };
    });
  }, []);

  // Add a subscription effect for connections
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToConnections(user.uid, (change) => {
        setConnections((prev) => {
          let newConnections;
          switch (change.type) {
            case 'added':
              if (!prev.find((conn) => conn.id === change.id)) {
                newConnections = [...prev, change.connection];
              } else {
                newConnections = prev;
              }
              break;
            case 'modified':
              newConnections = prev.map((conn) =>
                conn.id === change.id ? change.connection : conn
              );
              break;
            case 'removed':
              newConnections = prev.filter((conn) => conn.id !== change.id);
              break;
            default:
              newConnections = prev;
          }
          // Map object references whenever connections change
          return mapConnectionsToObjects(newConnections, objects);
        });
      });
      return () => unsubscribe();
    }
  }, [user, objects, mapConnectionsToObjects]); // Add objects to dependencies

  // Add effect to sync lineTexts with connections
  useEffect(() => {
    const newLineTexts = {};
    connections.forEach((conn) => {
      if (conn.text) {
        newLineTexts[conn.id] = conn.text;
      }
    });
    setLineTexts(newLineTexts);
  }, [connections]);

  return (
    <>
      {!isAuthReady ? (
        <div>Loading...</div>
      ) : (
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
                const startPosition = connection.start?.position || [0, 0, 0];
                const endPosition = connection.end?.position || [0, 0, 0];

                const midpoint = calculateMidpoint(startPosition, endPosition);

                return (
                  <group key={connection.id}>
                    <Line
                      points={[
                        startPosition, // Use safe values here
                        endPosition,
                      ]}
                      color={
                        connection.color ||
                        (selectedConnection === connection.id
                          ? '#ffff00'
                          : 'white')
                      }
                      lineWidth={selectedConnection === connection.id ? 4 : 2}
                      dashed={
                        connection.lineStyle === 'dashed' ||
                        connection.lineStyle === 'dotted'
                      }
                      dashScale={connection.lineStyle === 'dotted' ? 1 : 0.5}
                      dashSize={connection.lineStyle === 'dotted' ? 0.5 : 4}
                      gapSize={connection.lineStyle === 'dotted' ? 1 : 10}
                      dashOffset={connection.dashOffset || 0}
                    />
                    <Line
                      points={[
                        startPosition, // Use safe values here too
                        endPosition,
                      ]}
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
                    {(connection.text || lineTexts[connection.id]) && (
                      <TextSprite
                        text={connection.text || lineTexts[connection.id]}
                        position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
                        style={
                          connection.textStyle || {
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
                          back: {
                            fontSize: 0.5,
                            color: 'white',
                            underline: false,
                          },
                          top: {
                            fontSize: 0.5,
                            color: 'white',
                            underline: false,
                          },
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
                          left: {
                            fontSize: 0.5,
                            color: 'white',
                            underline: false,
                          },
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
                      onIndicatorDeselected={handleIndicatorDeselected}
                    />
                  );
                }
                if (obj.type === 'sphere') {
                  return (
                    <Sphere
                      key={obj.id}
                      id={obj.id}
                      position={obj.position}
                      scale={obj.scale || [1, 1, 1]}
                      headerText={obj.headerText || ''}
                      headerStyle={
                        obj.headerStyle || {
                          fontSize: 'medium',
                          color: 'white',
                          underline: false,
                        }
                      }
                      lineColor={obj.lineColor || 'white'}
                      faceColors={obj.faceColors || {}}
                      faceTexts={obj.faceTexts || {}}
                      faceTextStyles={obj.faceTextStyles || {}}
                      selected={selectedId === obj.id}
                      onClick={() => handleObjectClick(obj.id)}
                      showAllIndicators={showAllCubesIndicators}
                      onIndicatorSelected={handleIndicatorSelected}
                      globalIndicatorSelected={globalIndicatorSelected}
                      onFaceIndicatorClick={handleFaceIndicatorClick}
                      onMove={(newPosition) =>
                        handleObjectMove(obj.id, newPosition)
                      }
                      connections={connections}
                      onUpdate={handleObjectUpdate} // Add this prop
                      onIndicatorDeselected={handleIndicatorDeselected}
                    />
                  );
                }
                if (obj.type === 'plane') {
                  return (
                    <Plane
                      key={obj.id}
                      id={obj.id}
                      position={obj.position}
                      scale={obj.scale || [1, 1, 1]}
                      selected={selectedId === obj.id}
                      onClick={() => handleObjectClick(obj.id)}
                      showAllIndicators={showAllCubesIndicators}
                      onIndicatorSelected={handleIndicatorSelected}
                      globalIndicatorSelected={globalIndicatorSelected}
                      onFaceIndicatorClick={handleFaceIndicatorClick}
                      onMove={(newPosition) =>
                        handleObjectMove(obj.id, newPosition)
                      }
                      connections={connections}
                      selectedIndicators={selectedIndicators}
                      indicatorMode={indicatorMode}
                      onUpdate={handleObjectUpdate}
                      color={obj.color}
                      headerText={obj.headerText}
                      borderStyle={obj.borderStyle}
                      borderColor={obj.borderColor}
                      lineThickness={obj.lineThickness}
                      headerStyle={obj.headerStyle}
                      faceText={obj.faceText}
                      faceTextStyle={obj.faceTextStyle}
                      activeTextStyleUI={activeTextStyleUI} // Add this
                      setActiveTextStyleUI={setActiveTextStyleUI} // Add this
                    />
                  );
                }
                if (obj.type === 'text') {
                  return (
                    <TextObject
                      key={obj.id}
                      id={obj.id}
                      position={obj.position}
                      selected={selectedId === obj.id}
                      onClick={() => handleObjectClick(obj.id)}
                      showAllIndicators={showAllCubesIndicators}
                      onIndicatorSelected={handleIndicatorSelected}
                      globalIndicatorSelected={globalIndicatorSelected}
                      onFaceIndicatorClick={handleFaceIndicatorClick}
                      connections={connections}
                      selectedIndicators={selectedIndicators}
                      indicatorMode={indicatorMode}
                      onUpdate={handleObjectUpdate}
                      initialText={obj.text || ''}
                      initialTextStyle={
                        obj.textStyle || { fontSize: 32, color: 'white' }
                      }
                      initialScale={obj.scale || [15, 10, 1]}
                    />
                  );
                }
                return null;
              })}
            </group>
            <EffectComposer>
              <SMAA />
            </EffectComposer>
            <IndicatorManager userId={user?.uid} />
          </Canvas>
          <UIOverlay
            onCreateObject={handleCreateObject}
            onToggleIndicators={handleToggleIndicators}
            user={user}
            onLogin={handleLogin}
            isAuthReady={isAuthReady}
          />
        </>
      )}
    </>
  );
};

export default App;
