import * as THREE from 'three';
import { db } from './firebase';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
import { findSpaceOwner } from './services/sharedSpacesService';

import {
  signInUser,
  observeAuthState,
  handleUrlAuth,
} from './services/authService';
import {
  saveObject,
  subscribeToObjects,
  deleteObject,
} from './services/objectsService';
import isEqual from 'lodash/isEqual'; // Add this import
import {
  saveConnection,
  subscribeToConnections,
  deleteConnection, // Import delete connection function
  addConnectionStateListener, // Add this import
  forceReconnect, // Add this import
  toggleNetwork, // Add this import
} from './services/connectionsService';

import {
  initializeConnectionMappings,
  objectConnectionMap,
} from './services/connectionManager';
import { memoize } from './utils/perfUtils'; // Add this import

import { doc, getDoc, collection } from 'firebase/firestore';
import {
  checkLineIntersection,
  generateCurvedPath,
} from './utils/pathfindingUtils';

// Helper function to compare arrays - this is fine at the top level as it's not a hook
const arraysEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    // Use small epsilon for floating point comparison
    if (Math.abs(a[i] - b[i]) > 0.001) return false;
  }
  return true;
};

// Enable/disable debug logs

// This component can be defined separately since it uses hooks internally
const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
  transformingObjects, // Add this prop
}) => {
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 3;
  const lastPositions = useRef({});
  // Remove the transformingObjects ref from here since it's now a prop

  useFrame((state, delta) => {
    frameCount.current += 1;
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    if (connections.length > 0) {
      let hasChanges = false;

      // Calculate new positions without updating state immediately
      const updatedConnections = connections.map((conn) => {
        // Skip connection updates for objects that are actively being scaled
        if (
          transformingObjects.current.has(conn.start?.objectId) ||
          transformingObjects.current.has(conn.end?.objectId)
        ) {
          return conn;
        }

        // Using memoized calculation to avoid redundant work
        const newStartPos = calculateFacePosition(conn.start);
        const newEndPos = calculateFacePosition(conn.end);

        // Generate position keys
        const startKey = `${conn.id}-start`;
        const endKey = `${conn.id}-end`;

        // Check if positions actually changed
        const startChanged =
          !lastPositions.current[startKey] ||
          !arraysEqual(lastPositions.current[startKey], newStartPos);
        const endChanged =
          !lastPositions.current[endKey] ||
          !arraysEqual(lastPositions.current[endKey], newEndPos);

        if (startChanged || endChanged) {
          hasChanges = true;

          // Store new positions for next comparison
          lastPositions.current[startKey] = [...newStartPos];
          lastPositions.current[endKey] = [...newEndPos];

          // Update dash offset if line is animated
          let newDashOffset = conn.dashOffset;
          if (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') {
            if (conn.dashDirection === 'left') {
              newDashOffset = (conn.dashOffset || 0) - delta * 2;
            } else if (conn.dashDirection === 'right') {
              newDashOffset = (conn.dashOffset || 0) + delta * 2;
            }
          }

          // Return updated connection
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
        }

        // No change - return original connection
        return conn;
      });

      // Only update state if there are actual changes and no active transforms
      if (hasChanges && transformingObjects.current.size === 0) {
        setConnections(updatedConnections);
      }
    }
  });

  return null;
};

const App = () => {
  const [backgroundColor] = useState('black');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const cameraRef = useRef();

  // Move transformingObjects ref here to the App component level
  const transformingObjects = useRef(new Set());

  // Define registerTransformingObject as a callback inside the App component
  const registerTransformingObject = useCallback((id, isTransforming) => {
    if (isTransforming) {
      transformingObjects.current.add(id.toString());
    } else {
      transformingObjects.current.delete(id.toString());
    }
  }, []);

  // Add a specialized handler for matrix updates to break recursion loops
  const handleObjectMatrixChanged = useCallback((id, matrixWorld) => {
    // Store last applied matrix to detect recursion
    if (!window._matrixUpdateMap) {
      window._matrixUpdateMap = new Map();
    }

    const previousMatrix = window._matrixUpdateMap.get(id.toString());
    if (previousMatrix && matrixWorld.equals(previousMatrix)) {
      // Skip redundant updates that might cause recursion
      return;
    }

    // Update stored matrix
    window._matrixUpdateMap.set(id.toString(), matrixWorld.clone());
  }, []);

  const [showAllCubesIndicators, setShowAllCubesIndicators] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [indicatorMode, setIndicatorMode] = useState('none');
  const [connections, setConnections] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [isConnectMode, setIsConnectMode] = useState(false); // Add this line for connect mode state

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
  const [isCheckingUrlAuth, setIsCheckingUrlAuth] = useState(true);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  // Add global indicator state
  const [globalIndicatorSelected, setGlobalIndicatorSelected] = useState(false);

  // Add this ref to track selected indicators
  const selectedIndicatorsRef = useRef([]);

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

  // Remove all console.log statements from auth observer effects
  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setUser(user);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Replace subscription effect with version without logs
  const lastUpdateRef = useRef({});

  // Add a ref to track which objects are currently being dragged
  const draggingObjectsRef = useRef(new Set());

  // Replace subscription effect with debounced version
  useEffect(() => {
    if (user && currentSpaceId) {
      // Determine the owner ID to use for subscriptions
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      const unsubscribe = subscribeToObjects(
        spaceOwnerId, // Use the space owner's ID instead of current user
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
                // Skip position updates for objects that are currently being dragged
                if (draggingObjectsRef.current.has(change.id.toString())) {
                  // Only apply non-position changes
                  return prev.map((obj) => {
                    if (obj.id.toString() === change.id) {
                      const currentPosition = obj.position;
                      const updatedObj = {
                        ...change.object,
                        position: currentPosition, // Keep local position during dragging
                      };
                      lastUpdateRef.current[change.id] = updatedObj;
                      return updatedObj;
                    }
                    return obj;
                  });
                }

                // Regular update for non-dragged objects
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
    }
  }, [user, currentSpaceId]);

  // Add debounced save effect
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (user && objects.length > 0 && currentSpaceId) {
      const saveTimeout = setTimeout(() => {
        // Only save if objects have actually changed
        if (!isEqual(lastSavedRef.current, objects)) {
          lastSavedRef.current = JSON.parse(JSON.stringify(objects));

          // Get the correct owner ID for saving
          const spaceOwnerId = window.currentSpaceOwner || user.uid;

          // Save each object individually
          objects.forEach((obj) => {
            saveObject(spaceOwnerId, currentSpaceId, obj);
          });
        }
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [objects, user, currentSpaceId]);

  const handleCreateObject = (type) => {
    if (!cameraRef.current?.camera || !user || !currentSpaceId) return;

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

    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObject(spaceOwnerId, currentSpaceId, newObject);
  };

  const handleObjectClick = (id) => {
    setSelectedId(id);
    setShowLineTextStyleUI(null); // Add this line
    setSelectedConnection(null);
  };

  // Add this to the App component for local connection management
  // Improved face position calculation with better offsets
  const calculateFacePosition = useCallback(
    (indicator) => {
      // Handle null/undefined indicator
      if (!indicator) {
        return [0, 0, 0];
      }

      try {
        // Add specific handling for text object indicators
        if (indicator.type === 'text') {
          try {
            // First, check if we have a valid stored position that's not [0,0,0]
            if (
              Array.isArray(indicator.position) &&
              indicator.position.length === 3 &&
              indicator.position.every(
                (n) => typeof n === 'number' && !isNaN(n)
              ) &&
              !indicator.position.every((n) => n === 0)
            ) {
              return indicator.position;
            }

            // If we have objectId, try to find the corresponding object
            if (indicator.objectId) {
              const textObj = objects.find(
                (obj) => obj.id.toString() === indicator.objectId.toString()
              );

              if (textObj) {
                const pos = textObj.position;
                const scale = textObj.scale || [15, 10, 1]; // Default text object scale

                // Calculate position at the bottom of the text object
                return [
                  pos[0],
                  pos[1] - 5 * (Array.isArray(scale) ? scale[1] : 1),
                  pos[2],
                ];
              }
            }

            // Try to get position from the plane reference
            if (indicator.plane) {
              try {
                // Extract world position from the group reference
                const worldPos = new THREE.Vector3();
                indicator.plane.updateWorldMatrix(true, false);
                indicator.plane.getWorldPosition(worldPos);

                // Get scale from indicator or use defaults
                const scale = indicator.cube?.scale || [15, 10, 1];

                // Apply offset to position at the bottom of the text plane
                return [
                  worldPos.x,
                  worldPos.y - 5 * (Array.isArray(scale) ? scale[1] : 1),
                  worldPos.z,
                ];
              } catch (e) {
                console.error('Error getting position from text plane:', e);
              }
            }

            // Last resort fallback
            if (indicator.position) {
              return indicator.position;
            }

            return [0, 0, 0];
          } catch {
            return indicator.position || [0, 0, 0];
          }
        }

        // For plane indicators
        if (indicator.type === 'plane') {
          try {
            // Store the data we're working with for debugging

            // First, check if we have a valid stored world position
            if (
              Array.isArray(indicator.worldPosition) &&
              indicator.worldPosition.length === 3 &&
              indicator.worldPosition.every(
                (n) => typeof n === 'number' && !isNaN(n)
              )
            ) {
              return indicator.worldPosition;
            }

            // Second, check if we have valid stored position
            if (
              Array.isArray(indicator.position) &&
              indicator.position.length === 3 &&
              indicator.position.every(
                (n) => typeof n === 'number' && !isNaN(n)
              )
            ) {
              return indicator.position;
            }

            // Third, try to calculate from planeData
            if (indicator.planeData) {
              // Ensure we have valid planeData
              const { position, scale, worldMatrixArray } = indicator.planeData;

              if (Array.isArray(position) && Array.isArray(scale)) {
                // If we have worldMatrixArray elements, use them
                if (
                  worldMatrixArray &&
                  Array.isArray(worldMatrixArray) &&
                  worldMatrixArray.length === 16
                ) {
                  const worldPos = new THREE.Vector3(0, -5 * scale[1], 0);
                  const matrix = new THREE.Matrix4().fromArray(
                    worldMatrixArray
                  );
                  worldPos.applyMatrix4(matrix);
                  return [worldPos.x, worldPos.y, worldPos.z];
                }

                // Fallback: calculate estimated position from components
                const worldPos = new THREE.Vector3();
                worldPos.x = position[0];
                worldPos.y = position[1] - 5 * scale[1]; // Apply offset directly
                worldPos.z = position[2];
                return [worldPos.x, worldPos.y, worldPos.z];
              }
            }

            // Fourth, try to calculate from plane reference (live object)
            if (
              indicator.plane &&
              typeof indicator.plane.getWorldPosition === 'function'
            ) {
              try {
                const worldPos = new THREE.Vector3();
                indicator.plane.updateWorldMatrix(true, false);
                indicator.plane.getWorldPosition(worldPos);

                // Apply offset
                const offset = indicator.offset || [
                  0,
                  -5 * (indicator.scale?.[1] || 1),
                  0,
                ];
                worldPos.add(new THREE.Vector3(...offset));

                return [worldPos.x, worldPos.y, worldPos.z];
              } catch (e) {
                console.error(
                  'Error getting position from plane reference:',
                  e
                );
              }
            }

            // Final fallback: if we have any position at all, use it
            if (indicator.position) {
              return Array.isArray(indicator.position)
                ? indicator.position
                : [0, 0, 0];
            }

            // Absolute last resort
            if (indicator.cube?.position) {
              const pos = indicator.cube.position;
              const scale = indicator.cube.scale || [1, 1, 1];
              return Array.isArray(pos)
                ? [pos[0], pos[1] - 5 * scale[1], pos[2]]
                : [0, 0, 0];
            }

            return [0, 0, 0];
          } catch {
            return [0, 0, 0];
          }
        }

        // For cube or sphere indicators - with safer error handling
        if (indicator.type === 'cube' || indicator.type === 'sphere') {
          try {
            // Get position data safely
            let worldPos;

            // Get position from the indicator if available, or from the data if stored
            const position = indicator.cube?.position || indicator.position;

            if (!position) {
              return [0, 0, 0];
            }

            // Convert to Vector3 if it's an array
            if (Array.isArray(position)) {
              worldPos = new THREE.Vector3(
                Number(position[0]) || 0,
                Number(position[1]) || 0,
                Number(position[2]) || 0
              );
            } else {
              worldPos = new THREE.Vector3(
                Number(position.x) || 0,
                Number(position.y) || 0,
                Number(position.z) || 0
              );
            }

            // Get scale safely
            const scale = indicator.cube?.scale || [1, 1, 1];
            let worldScale;

            if (Array.isArray(scale)) {
              worldScale = new THREE.Vector3(
                Math.max(0.1, Number(scale[0]) || 1),
                Math.max(0.1, Number(scale[1]) || 1),
                Math.max(0.1, Number(scale[2]) || 1)
              );
            } else {
              worldScale = new THREE.Vector3(
                Math.max(0.1, Number(scale.x) || 1),
                Math.max(0.1, Number(scale.y) || 1),
                Math.max(0.1, Number(scale.z) || 1)
              );
            }

            // Calculate the offset based on face name and cube size
            const cubeSize = 5; // Half-size of cube
            let faceOffset;

            if (
              indicator.type === 'sphere' &&
              Array.isArray(indicator.faceCenter)
            ) {
              const localFacePos = new THREE.Vector3(...indicator.faceCenter);
              localFacePos.multiply(worldScale);
              return [
                worldPos.x + localFacePos.x,
                worldPos.y + localFacePos.y,
                worldPos.z + localFacePos.z,
              ];
            } else {
              // Standard cube face offset calculation
              switch (indicator.face) {
                case 'top':
                  faceOffset = new THREE.Vector3(0, cubeSize * worldScale.y, 0);
                  break;
                case 'bottom':
                  faceOffset = new THREE.Vector3(
                    0,
                    -cubeSize * worldScale.y,
                    0
                  );
                  break;
                case 'front':
                  faceOffset = new THREE.Vector3(0, 0, cubeSize * worldScale.z);
                  break;
                case 'back':
                  faceOffset = new THREE.Vector3(
                    0,
                    0,
                    -cubeSize * worldScale.z
                  );
                  break;
                case 'right':
                  faceOffset = new THREE.Vector3(cubeSize * worldScale.x, 0, 0);
                  break;
                case 'left':
                  faceOffset = new THREE.Vector3(
                    -cubeSize * worldScale.x,
                    0,
                    0
                  );
                  break;
                default:
                  faceOffset = new THREE.Vector3(0, 0, 0);
              }
            }

            // Add the offset to the world position
            worldPos.add(faceOffset);

            return [worldPos.x, worldPos.y, worldPos.z];
          } catch {
            return [0, 0, 0];
          }
        }

        // Fallback for unknown indicator types
        return Array.isArray(indicator.position)
          ? indicator.position
          : [0, 0, 0];
      } catch {
        return [0, 0, 0];
      }
    },
    [objects]
  );

  // Memoized version of the calculation function - NOW INSIDE THE COMPONENT
  const memoizedCalculateFacePosition = useMemo(
    () => memoize(calculateFacePosition),
    [calculateFacePosition]
  );

  // Clean up handleObjectMove callback
  const handleObjectMove = useCallback(
    (id, newPosition, isDragStart = false, isDragEnd = false) => {
      const objectId = id.toString();

      if (isDragStart) {
        // Object drag started - add to tracking set
        draggingObjectsRef.current.add(objectId);
      }

      // Update local object state immediately for smooth UI
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

      // Find connections related to this object and update them
      setConnections((prev) => {
        // Check if any connections need updating
        const needsUpdate = prev.some(
          (conn) =>
            conn.start?.objectId === objectId || conn.end?.objectId === objectId
        );

        if (!needsUpdate) return prev;

        // Update all related connections
        return prev.map((conn) => {
          // If this connection isn't related to the moved object, leave it unchanged
          if (
            conn.start?.objectId !== objectId &&
            conn.end?.objectId !== objectId
          ) {
            return conn;
          }

          // Clone the connection to modify it
          const updatedConn = { ...conn };

          // Update positions for relevant ends
          if (updatedConn.start?.objectId === objectId) {
            // Re-calculate start position based on new object position
            const faceCenter = updatedConn.start.faceCenter || [0, 0, 0];
            // Transform the face position to world coordinates
            const worldPos = new THREE.Vector3(...faceCenter);
            // Apply the object's transform
            const worldMatrix = new THREE.Matrix4()
              .makeScale(...(updatedConn.start.cube?.scale || [1, 1, 1]))
              .setPosition(newPosition.x, newPosition.y, newPosition.z);
            worldPos.applyMatrix4(worldMatrix);

            // Update the position
            updatedConn.start.position = [worldPos.x, worldPos.y, worldPos.z];
          }

          if (updatedConn.end?.objectId === objectId) {
            // Similar update for end position
            const faceCenter = updatedConn.end.faceCenter || [0, 0, 0];
            const worldPos = new THREE.Vector3(...faceCenter);
            const worldMatrix = new THREE.Matrix4()
              .makeScale(...(updatedConn.end.cube?.scale || [1, 1, 1]))
              .setPosition(newPosition.x, newPosition.y, newPosition.z);
            worldPos.applyMatrix4(worldMatrix);

            updatedConn.end.position = [worldPos.x, worldPos.y, worldPos.z];
          }

          return updatedConn;
        });
      });

      // ONLY save to database when drag ends or in special cases
      if (user) {
        // Only save position updates when drag ENDS, not during drag
        if (isDragEnd) {
          const object = objects.find((obj) => obj.id === id);
          if (object) {
            const updatedObject = {
              ...object,
              position: [newPosition.x, newPosition.y, newPosition.z],
            };

            const spaceOwnerId = window.currentSpaceOwner || user.uid;
            saveObject(spaceOwnerId, currentSpaceId, updatedObject);

            // Remove from dragging set when drag ends
            draggingObjectsRef.current.delete(objectId);
          }
        }
      }
    },
    [user, objects, currentSpaceId]
  );

  // Update handleObjectUpdate to keep changes minimal during scale operations
  const handleObjectUpdate = useCallback(
    (id, updates) => {
      if (!user || !id || !currentSpaceId) return;

      // Only track object ID during transform, don't manipulate matrices
      if (updates.scale && transformingObjects.current.has(id.toString())) {
        setObjects((prev) => {
          const updatedObjects = prev.map((obj) => {
            if (obj.id === id) {
              const newObj = { ...obj, ...updates };
              lastUpdateRef.current[id] = newObj;
              return newObj;
            }
            return obj;
          });
          return updatedObjects;
        });

        // Let Three.js handle the matrices naturally
        return;
      }

      // Regular update process for non-scaling changes
      setObjects((prev) => {
        const updatedObjects = prev.map((obj) => {
          if (obj.id === id) {
            const newObj = { ...obj, ...updates };

            // Use correct owner ID
            const spaceOwnerId = window.currentSpaceOwner || user.uid;

            // Check if position has changed
            if (updates.position && !isEqual(obj.position, updates.position)) {
              // Save immediately for position changes
              saveObject(spaceOwnerId, currentSpaceId, newObj);
              lastUpdateRef.current[id] = newObj;
            } else {
              // Normal debounced save for other changes
              if (!isEqual(lastUpdateRef.current[id], newObj)) {
                lastUpdateRef.current[id] = newObj;
                saveObject(spaceOwnerId, currentSpaceId, newObj);
              }
            }
            return newObj;
          }
          return obj;
        });
        return updatedObjects;
      });
    },
    [user, currentSpaceId]
  );

  // Modify handleFaceIndicatorClick to remove logs
  const handleFaceIndicatorClick = (indicator) => {
    // If not in connect mode, enter connect mode first
    if (!isConnectMode) {
      setIsConnectMode(true);
      setIndicatorMode('indicators');
      setShowAllCubesIndicators(true);
      setGlobalIndicatorSelected(true);
      // Store the first indicator
      selectedIndicatorsRef.current = [indicator];
      setSelectedIndicators([indicator]);
      return;
    }

    if (selectedIndicatorsRef.current.length === 0) {
      // First indicator selection - store it in both state and ref
      selectedIndicatorsRef.current.push(indicator);
      setSelectedIndicators([indicator]);
    } else {
      // We have the first indicator, now create a connection with the second
      const startIndicator = selectedIndicatorsRef.current[0];

      // More robust ID extraction - improved to handle TextObject indicators
      const startIdStr = String(
        startIndicator.cube?.id ||
          startIndicator.id ||
          startIndicator.objectId ||
          startIndicator.cube?.userData?.objectId ||
          (startIndicator.plane && startIndicator.plane.userData?.id)
      );

      const endIdStr = String(
        indicator.cube?.id ||
          indicator.id ||
          indicator.objectId ||
          indicator.cube?.userData?.objectId ||
          (indicator.plane && indicator.plane.userData?.id)
      );

      // Find objects using normalized string comparison
      const startObj = objects.find((obj) => String(obj.id) === startIdStr);
      const endObj = objects.find((obj) => String(obj.id) === endIdStr);

      // Better error handling without logs
      if (!startObj || !endObj) {
        return;
      }

      // Create enhanced indicators with full object data
      const enhancedStartIndicator = {
        ...startIndicator,
        cube: {
          ...startIndicator.cube,
          position: startObj.position,
          scale: startObj.scale,
        },
      };

      const enhancedEndIndicator = {
        ...indicator,
        cube: {
          ...indicator.cube,
          position: endObj.position,
          scale: endObj.scale,
        },
      };

      // Calculate positions using enhanced indicators
      const startPos = calculateFacePosition(enhancedStartIndicator);
      const endPos = calculateFacePosition(enhancedEndIndicator);

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
        return;
      }

      const connectionId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Ensure we're using proper ID formats
      const startObjectId = startIdStr;
      const endObjectId = endIdStr;

      // Validate we have both object IDs
      if (!startObjectId || !endObjectId) {
        return;
      }

      // Include objectId in the connection data
      const newConnection = {
        id: connectionId,
        start: {
          type: startIndicator.type,
          face: startIndicator.face,
          position: startPos, // Use calculated position
          faceCenter: startIndicator.faceCenter || [0, 0, 0],
          objectId: startObjectId,
          cube: startIndicator.cube,
          plane: startIndicator.plane,
        },
        end: {
          type: indicator.type,
          face: indicator.face,
          position: endPos, // Use calculated position
          faceCenter: indicator.faceCenter || [0, 0, 0],
          objectId: endObjectId,
          cube: indicator.cube,
          plane: indicator.plane,
        },
        lineStyle: 'straight',
        color: 'white',
        text: '',
        textStyle: { fontSize: 1, color: 'white' },
      };

      // For plane type indicators, preserve all position data that was originally calculated
      if (startIndicator.type === 'plane') {
        newConnection.start.worldPosition = startPos;
        newConnection.start.planeData = {
          position: startObj.position,
          scale: startObj.scale || [1, 1, 1],
          // Store worldMatrixArray if available
          worldMatrixArray: startIndicator.planeData?.worldMatrixArray || null,
        };
      }

      if (indicator.type === 'plane') {
        newConnection.end.worldPosition = endPos;
        newConnection.end.planeData = {
          position: endObj.position,
          scale: endObj.scale || [1, 1, 1],
          // Store worldMatrixArray if available
          worldMatrixArray: indicator.planeData?.worldMatrixArray || null,
        };
      }

      // Update local state immediately for clickability
      setConnections((prev) => [...prev, newConnection]);

      // Save to database; if error, rollback state
      if (user) {
        try {
          saveConnection(user.uid, currentSpaceId, newConnection).catch(() => {
            setConnections((prev) =>
              prev.filter((conn) => conn.id !== connectionId)
            );
          });
        } catch {
          setConnections((prev) =>
            prev.filter((conn) => conn.id !== connectionId)
          );
        }
      }

      // Reset indicator selection states
      selectedIndicatorsRef.current = [];
      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setGlobalIndicatorSelected(false);
      setIndicatorMode('none');
    }
  };

  // Update handleFaceClick to set the active indicator correctly
  const handleFaceClick = (faceInfo) => {
    // Ensure the info has an ID
    if (faceInfo.id || faceInfo.cube?.id) {
      setActiveIndicator({
        ...faceInfo,
        cube: {
          ...faceInfo.cube,
          id: faceInfo.id || faceInfo.cube?.id,
        },
      });

      // Set indicator mode to show face indicator
      setIndicatorMode('single');
    }
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
      // Toggle connect mode based on previous state
      setIsConnectMode((prev) => {
        const newConnectMode = !prev;

        if (newConnectMode) {
          // Entering connect mode - clear any existing selections
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          setIndicatorMode('indicators');
          setShowAllCubesIndicators(true);
          setGlobalIndicatorSelected(true);
          setSelectedId(null);
        } else {
          // Exiting connect mode - clean up
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          setShowAllCubesIndicators(false);
          setGlobalIndicatorSelected(false);
          setIndicatorMode('none');
        }

        return newConnectMode;
      });
    } else {
      // Original logic for other indicator modes
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
    saveConnection(user.uid, currentSpaceId, newConnection);
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
    saveConnection(user.uid, currentSpaceId, newConnection);
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
    saveConnection(user.uid, currentSpaceId, newConnection);

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
    saveConnection(user.uid, currentSpaceId, newConnection);
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

  // Add this new function to synchronize connections with objects
  const synchronizeConnectionPositions = useCallback(
    (connections, objectsData) => {
      if (!connections.length || !objectsData.length) return connections;

      return connections.map((conn) => {
        // Skip if missing required data
        if (!conn.start?.objectId || !conn.end?.objectId) return conn;

        // Find the related objects
        const startObject = objectsData.find(
          (obj) => obj.id.toString() === conn.start.objectId
        );
        const endObject = objectsData.find(
          (obj) => obj.id.toString() === conn.end.objectId
        );

        if (!startObject || !endObject) return conn;

        // Create indicators with current object data
        const startIndicator = {
          type: conn.start.type,
          face: conn.start.face,
          faceCenter: conn.start.faceCenter,
          cube: {
            ...conn.start.cube,
            position: startObject.position,
            scale: startObject.scale || [1, 1, 1],
          },
          objectId: conn.start.objectId,
        };

        const endIndicator = {
          type: conn.end.type,
          face: conn.end.face,
          faceCenter: conn.end.faceCenter,
          cube: {
            ...conn.end.cube,
            position: endObject.position,
            scale: endObject.scale || [1, 1, 1],
          },
          objectId: conn.end.objectId,
        };

        // Calculate updated positions
        const newStartPos = calculateFacePosition(startIndicator);
        const newEndPos = calculateFacePosition(endIndicator);

        return {
          ...conn,
          start: {
            ...conn.start,
            position: newStartPos,
            cube: {
              ...conn.start.cube,
              position: startObject.position,
              scale: startObject.scale,
            },
          },
          end: {
            ...conn.end,
            position: newEndPos,
            cube: {
              ...conn.end.cube,
              position: endObject.position,
              scale: endObject.scale,
            },
          },
        };
      });
    },
    [calculateFacePosition]
  );

  // Add a subscription effect for connections
  useEffect(() => {
    if (user && currentSpaceId) {
      // Use the same owner ID for connections
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      const unsubscribe = subscribeToConnections(
        spaceOwnerId, // Use space owner ID
        currentSpaceId,
        (change) => {
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

            // Map object references
            const withRefs = mapConnectionsToObjects(newConnections, objects);

            // Immediately synchronize positions with current object positions
            return synchronizeConnectionPositions(withRefs, objects);
          });
        }
      );
      return () => unsubscribe();
    }
  }, [
    user,
    currentSpaceId,
    objects,
    mapConnectionsToObjects,
    synchronizeConnectionPositions,
  ]);

  // Add effect to re-synchronize connections when objects change
  useEffect(() => {
    if (connections.length && objects.length) {
      const updatedConnections = synchronizeConnectionPositions(
        connections,
        objects
      );
      if (!isEqual(updatedConnections, connections)) {
        setConnections(updatedConnections);
      }
    }
  }, [objects, synchronizeConnectionPositions]);

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

  // Add initialization of connection mappings when user is authenticated
  useEffect(() => {
    if (user) {
      initializeConnectionMappings(user.uid)
        .then(() => {
          // Debug: Log current connection mappings
          if (typeof window !== 'undefined') {
            window.checkConnectionMap = () => {
              console.table(
                Array.from(objectConnectionMap.entries()).map(
                  ([key, value]) => ({
                    objectId: key,
                    connections: Array.from(value).join(', '),
                  })
                )
              );
            };
            // Check immediately
            window.checkConnectionMap();
          }
        })
        .catch((err) =>
          console.error('Error initializing connection mappings:', err)
        );
    }
  }, [user]); // Only run when user changes

  // Update the URL auth effect without logs
  useEffect(() => {
    const checkUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (uid && token) {
        setIsCheckingUrlAuth(true);
        try {
          await handleUrlAuth();
        } catch {
          // Handle error silently
        } finally {
          setIsCheckingUrlAuth(false);
        }
      } else {
        setIsCheckingUrlAuth(false);
      }
    };

    checkUrlAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('uid') && !params.get('token')) {
      setIsCheckingUrlAuth(false);
    }
  }, []);

  // Update auth state check without logs
  useEffect(() => {
    if (user || !isCheckingUrlAuth) {
      setIsCheckingUrlAuth(false);
    }
  }, [user, isCheckingUrlAuth]);

  // Clean up space fetching effect
  useEffect(() => {
    if (!user) return;

    const fetchCurrentSpace = async () => {
      // Check URL for space ID first
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('spaceId');

      const urlOwnerUid = params.get('ownerUid');

      // Clear any existing objects/connections when changing spaces
      setObjects([]);
      setConnections([]);

      // If we have a space ID, let's try to use it
      if (urlSpaceId) {
        try {
          // Set space ID early to prevent redirects
          setCurrentSpaceId(urlSpaceId);
          sessionStorage.setItem('currentSpaceId', urlSpaceId);

          // Case 1: URL explicitly provides owner ID - use this first
          if (urlOwnerUid) {
            // Check if user is the owner
            if (urlOwnerUid === user.uid) {
              return;
            }

            // Verify shared access with the specified owner
            const ownerSpaceRef = doc(
              db,
              'users',
              urlOwnerUid,
              'spaces',
              urlSpaceId
            );
            const ownerSpaceDoc = await getDoc(ownerSpaceRef);

            if (ownerSpaceDoc.exists()) {
              const spaceData = ownerSpaceDoc.data();

              // Check if space is shared with current user
              const isSharedWithMe = spaceData.sharedWith?.some(
                (share) => share.userId === user.uid
              );

              if (isSharedWithMe) {
                // Store info about shared space but DON'T create a duplicate
                sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                sessionStorage.setItem(
                  `sharedSpaceOwner_${urlSpaceId}`,
                  urlOwnerUid
                );

                // Update local state for the subscription logic to use
                window.currentSpaceOwner = urlOwnerUid; // Use a global for the service functions

                return;
              }
            }
          }

          // Case 2: Check if space is in user's own collection
          const userSpaceRef = doc(db, 'users', user.uid, 'spaces', urlSpaceId);
          const userSpaceDoc = await getDoc(userSpaceRef);

          if (userSpaceDoc.exists()) {
            window.currentSpaceOwner = user.uid; // User is accessing their own space
            return;
          }

          // Case 3: Check in shared spaces collection (might contain reference info)
          const sharedRef = doc(
            db,
            'users',
            user.uid,
            'sharedSpaces',
            urlSpaceId
          );
          const sharedDoc = await getDoc(sharedRef);

          if (sharedDoc.exists()) {
            const sharedData = sharedDoc.data();

            if (sharedData.ownerId) {
              // Check the actual space in owner's collection
              const actualSpaceRef = doc(
                db,
                'users',
                sharedData.ownerId,
                'spaces',
                urlSpaceId
              );
              const actualSpaceDoc = await getDoc(actualSpaceRef);

              if (actualSpaceDoc.exists()) {
                sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                sessionStorage.setItem(
                  `sharedSpaceOwner_${urlSpaceId}`,
                  sharedData.ownerId
                );
                window.currentSpaceOwner = sharedData.ownerId;
                return;
              }
            }
          }

          // Case 4: Look for space in top-level spaces collection
          const spacesRef = collection(db, 'spaces');
          const spaceDocRef = doc(spacesRef, urlSpaceId);
          const spaceDoc = await getDoc(spaceDocRef);

          if (spaceDoc.exists()) {
            const spaceData = spaceDoc.data();

            // Check if user owns this space
            if (spaceData.ownerId === user.uid) {
              window.currentSpaceOwner = user.uid;
              return;
            }

            // Check if shared with current user
            const isSharedWithCurrentUser = spaceData.sharedWith?.some(
              (share) => share.userId === user.uid
            );

            if (isSharedWithCurrentUser) {
              sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
              sessionStorage.setItem(
                `sharedSpaceOwner_${urlSpaceId}`,
                spaceData.ownerId
              );
              window.currentSpaceOwner = spaceData.ownerId;
              return;
            }
          }

          // Case 5: Last resort - try to find owner
          try {
            const ownerId = await findSpaceOwner(urlSpaceId);
            if (ownerId && ownerId !== user.uid) {
              // Verify access with found owner
              const ownerSpaceRef = doc(
                db,
                'users',
                ownerId,
                'spaces',
                urlSpaceId
              );
              const ownerSpaceDoc = await getDoc(ownerSpaceRef);

              if (ownerSpaceDoc.exists()) {
                const spaceData = ownerSpaceDoc.data();
                const hasAccess = spaceData.sharedWith?.some(
                  (share) => share.userId === user.uid
                );

                if (hasAccess) {
                  // Don't create a duplicate, just set up for direct access
                  sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                  sessionStorage.setItem(
                    `sharedSpaceOwner_${urlSpaceId}`,
                    ownerId
                  );
                  window.currentSpaceOwner = ownerId;
                  return;
                }
              }
            }
          } catch {
            // Intentionally ignored
          }

          // If we get here, we didn't find a valid space or don't have access
          window.currentSpaceOwner = urlOwnerUid || user.uid;
        } catch {
          window.currentSpaceOwner = user.uid; // Fallback to user's own spaces
        }
        return;
      }

      // Check session storage if no URL space ID
      const storedSpaceId = sessionStorage.getItem('currentSpaceId');
      if (storedSpaceId) {
        setCurrentSpaceId(storedSpaceId);

        // Check if it's a shared space from storage
        const isShared = sessionStorage.getItem(
          `isSharedSpace_${storedSpaceId}`
        );
        const storedOwner = sessionStorage.getItem(
          `sharedSpaceOwner_${storedSpaceId}`
        );

        if (isShared === 'true' && storedOwner) {
          window.currentSpaceOwner = storedOwner;
        } else {
          window.currentSpaceOwner = user.uid;
        }
        return;
      }

      // If we reach here, redirect to landing page
      setCurrentSpaceId(null);
    };

    fetchCurrentSpace();
  }, [user]);

  // Add a new effect to handle redirection when no spaceId is available
  useEffect(() => {
    // Only run this after auth is ready and we know there's no current space
    if (isAuthReady && user && currentSpaceId === null) {
      // Allow a small delay for logging and cleanup
      const redirectTimeout = setTimeout(() => {
        window.location.href = 'https://volscape.web.app/';
      }, 100);

      return () => clearTimeout(redirectTimeout);
    }
  }, [isAuthReady, user, currentSpaceId]);

  // Add another effect to redirect immediately if no user or spaceId in URL
  useEffect(() => {
    // Only run once when the component mounts
    const params = new URLSearchParams(window.location.search);
    const urlSpaceId = params.get('spaceId');
    const urlUid = params.get('uid');

    // If we have neither a user ID nor space ID in URL, and auth check is complete
    if (!isCheckingUrlAuth && !urlSpaceId && !urlUid) {
      window.location.href = 'https://volscape.web.app/';
    }
  }, [isCheckingUrlAuth]); // Only depends on auth check status

  // Add handler for object deletion
  const handleObjectDelete = useCallback(
    (id) => {
      // First, remove the object from local state immediately for responsive UI
      setObjects((prev) => prev.filter((obj) => obj.id !== id));

      // Also deselect if this was the selected object
      if (selectedId === id) {
        setSelectedId(null);
      }

      // Find and remove any connections related to this object
      const relatedConnections = connections.filter(
        (conn) =>
          conn.start?.objectId === id.toString() ||
          conn.end?.objectId === id.toString()
      );

      // Remove connections from local state
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            conn.start?.objectId !== id.toString() &&
            conn.end?.objectId !== id.toString()
        )
      );

      // Then delete from database
      if (user && currentSpaceId) {
        const spaceOwnerId = window.currentSpaceOwner || user.uid;

        // Delete the object
        deleteObject(spaceOwnerId, currentSpaceId, id);

        // Delete any related connections
        relatedConnections.forEach((conn) => {
          deleteConnection(spaceOwnerId, currentSpaceId, conn.id);
        });
      }
    },
    [user, currentSpaceId, connections, selectedId]
  );

  // Add connection state tracking
  const [connectionState, setConnectionState] = useState('connected');
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // Add connection status UI state
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const connectionStatusTimeout = useRef(null);

  // Add effect to track connection state
  useEffect(() => {
    const unsubscribe = addConnectionStateListener((state) => {
      setConnectionState(state);

      // Show connection status UI
      setShowConnectionStatus(true);

      // Clear any existing timeout
      if (connectionStatusTimeout.current) {
        clearTimeout(connectionStatusTimeout.current);
      }

      // Hide the status after a few seconds if connected
      if (state === 'connected') {
        connectionStatusTimeout.current = setTimeout(() => {
          setShowConnectionStatus(false);
        }, 3000);

        // Reset reconnect attempts
        setReconnectAttempts(0);
      }
    });

    return () => {
      if (connectionStatusTimeout.current) {
        clearTimeout(connectionStatusTimeout.current);
      }
      unsubscribe();
    };
  }, []);

  // Add effect to periodically check and force reconnect if needed
  useEffect(() => {
    // Skip if no user or space
    if (!user || !currentSpaceId) return;

    // Set up periodic connection health check
    const healthCheckInterval = setInterval(() => {
      // If it's been more than 30 seconds since last update, try to reconnect
      const timeSinceLastUpdate = Date.now() - lastUpdateTime;

      if (
        timeSinceLastUpdate > 30000 &&
        connectionState !== 'connecting' &&
        reconnectAttempts < maxReconnectAttempts
      ) {
        console.log('No updates for 30+ seconds, attempting reconnect...');
        setConnectionState('connecting');
        setShowConnectionStatus(true);

        // Increment reconnect attempts
        setReconnectAttempts((prev) => prev + 1);

        forceReconnect().then((success) => {
          if (success) {
            console.log('Reconnection successful');
            setLastUpdateTime(Date.now());
            setConnectionState('connected');

            // Hide status after a delay
            setTimeout(() => {
              setShowConnectionStatus(false);
            }, 3000);

            // Re-fetch data after reconnection
            if (user && currentSpaceId) {
              // Refresh subscriptions by temporarily nulling spaceId
              const tempSpaceId = currentSpaceId;
              setCurrentSpaceId(null);

              // Then restore it after a short delay
              setTimeout(() => {
                setCurrentSpaceId(tempSpaceId);
              }, 500);
            }
          } else {
            console.log('Reconnection failed');
            setConnectionState('disconnected');
          }
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(healthCheckInterval);
  }, [
    connectionState,
    lastUpdateTime,
    reconnectAttempts,
    user,
    currentSpaceId,
  ]);

  // Add handler for manual reconnection
  const handleManualReconnect = useCallback(() => {
    setConnectionState('connecting');
    setShowConnectionStatus(true);

    forceReconnect().then((success) => {
      if (success) {
        setLastUpdateTime(Date.now());
        setConnectionState('connected');
        setReconnectAttempts(0);

        // Refresh subscriptions by temporarily nulling spaceId
        if (user && currentSpaceId) {
          const tempSpaceId = currentSpaceId;
          setCurrentSpaceId(null);

          // Then restore it after a short delay
          setTimeout(() => {
            setCurrentSpaceId(tempSpaceId);
          }, 500);
        }

        // Hide status after a delay
        setTimeout(() => {
          setShowConnectionStatus(false);
        }, 3000);
      } else {
        setConnectionState('disconnected');
      }
    });
  }, [user, currentSpaceId]);

  // Add debouncing mechanism for connection updates
  const connectionUpdateTimeoutRef = useRef(null);
  const lastKnownConnectionsRef = useRef({});

  // Add a timestamp for last connection update
  const lastConnectionUpdateTimeRef = useRef(Date.now());

  // Replace the existing connection subscription with the enhanced version
  useEffect(() => {
    if (user && currentSpaceId) {
      console.log(
        `Setting up connection subscription for space ${currentSpaceId}`
      );

      // Use the space owner's ID for subscription
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      const unsubscribe = subscribeToConnections(
        spaceOwnerId,
        currentSpaceId,
        (change) => {
          // Update last activity timestamp
          setLastUpdateTime(Date.now());
          lastConnectionUpdateTimeRef.current = Date.now();

          // Use the debounced update approach for connections
          if (connectionUpdateTimeoutRef.current) {
            clearTimeout(connectionUpdateTimeoutRef.current);
          }

          // Store the change in the ref for batching
          if (!lastKnownConnectionsRef.current[change.id]) {
            lastKnownConnectionsRef.current[change.id] = {};
          }

          lastKnownConnectionsRef.current[change.id] = {
            type: change.type,
            data: change.connection,
            timestamp: Date.now(),
          };

          // Apply updates after a short delay to batch multiple rapid changes
          connectionUpdateTimeoutRef.current = setTimeout(() => {
            setConnections((prev) => {
              // Process all accumulated changes
              const updates = { ...lastKnownConnectionsRef.current };
              lastKnownConnectionsRef.current = {};

              // Apply all updates
              let newConnections = [...prev];
              Object.entries(updates).forEach(([connId, update]) => {
                switch (update.type) {
                  case 'added':
                    if (!newConnections.find((conn) => conn.id === connId)) {
                      newConnections = [...newConnections, update.data];
                    }
                    break;
                  case 'modified':
                    newConnections = newConnections.map((conn) =>
                      conn.id === connId ? update.data : conn
                    );
                    break;
                  case 'removed':
                    newConnections = newConnections.filter(
                      (conn) => conn.id !== connId
                    );
                    break;
                }
              });

              // Map object references and positions
              const withRefs = mapConnectionsToObjects(newConnections, objects);
              return synchronizeConnectionPositions(withRefs, objects);
            });
          }, 100); // Short debounce time for responsiveness
        }
      );

      // Function to handle reconnection if needed
      const checkConnectionHealth = setInterval(() => {
        const timeSinceLastUpdate =
          Date.now() - lastConnectionUpdateTimeRef.current;
        if (timeSinceLastUpdate > 60000) {
          // 1 minute without updates
          console.log('Connection may be stale, forcing reconnection...');
          forceReconnect();
          lastConnectionUpdateTimeRef.current = Date.now(); // Reset timer
        }
      }, 30000);

      return () => {
        unsubscribe();
        clearInterval(checkConnectionHealth);
        if (connectionUpdateTimeoutRef.current) {
          clearTimeout(connectionUpdateTimeoutRef.current);
        }
      };
    }
  }, [
    user,
    currentSpaceId,
    objects,
    mapConnectionsToObjects,
    synchronizeConnectionPositions,
  ]);

  return (
    <>
      {isCheckingUrlAuth ? (
        <div className="auth-loading">Authenticating...</div>
      ) : !isAuthReady ? (
        <div className="loading">Loading...</div>
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
                calculateFacePosition={memoizedCalculateFacePosition}
                transformingObjects={transformingObjects} // Pass the ref as a prop
              />
              {connections.map((connection) => {
                const startPosition = connection.start?.position || [0, 0, 0];
                const endPosition = connection.end?.position || [0, 0, 0];
                const midpoint = calculateMidpoint(startPosition, endPosition);

                // Check for intersections with objects
                const intersections = checkLineIntersection(
                  startPosition,
                  endPosition,
                  objects.filter(
                    (obj) =>
                      obj.id.toString() !== connection.start?.objectId &&
                      obj.id.toString() !== connection.end?.objectId
                  )
                );

                // Generate path points (either curved or straight)
                const pathPoints = generateCurvedPath(
                  startPosition,
                  endPosition,
                  intersections,
                  connection.start?.objectId,
                  connection.end?.objectId
                );

                return (
                  <group key={connection.id}>
                    {/* Single visible line with proper depth testing - hides behind objects */}
                    <Line
                      points={pathPoints} // Use the calculated path points
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
                      renderOrder={1}
                      transparent={false}
                      depthTest={true}
                      depthWrite={false}
                      toneMapped={false}
                    />

                    {/* Clickable area - needs to follow the curve */}
                    <Line
                      points={pathPoints} // Also use calculated path points
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
                      depthTest={false}
                      renderOrder={10}
                    />

                    {/* Text and UI elements - adjust position to the midpoint of the curve */}
                    {(connection.text || lineTexts[connection.id]) && (
                      <TextSprite
                        text={connection.text || lineTexts[connection.id]}
                        position={[
                          pathPoints[Math.floor(pathPoints.length / 2)].x,
                          pathPoints[Math.floor(pathPoints.length / 2)].y + 5,
                          pathPoints[Math.floor(pathPoints.length / 2)].z,
                        ]}
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
                      onTransformStart={() =>
                        registerTransformingObject(obj.id, true)
                      }
                      onTransformEnd={() =>
                        registerTransformingObject(obj.id, false)
                      }
                      onMatrixChanged={(matrixWorld) =>
                        handleObjectMatrixChanged(obj.id, matrixWorld)
                      }
                      transformControls={{
                        matrixAutoUpdate: false, // Force consistent matrix handling
                        coordinateSystem: 'local', // Use local coordinate system to prevent unwanted recursion
                        stackBehavior: 'detach_on_modify', // Add custom hint for transform controls
                      }}
                      onDelete={handleObjectDelete}
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
                      onDelete={handleObjectDelete}
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
                      onDelete={handleObjectDelete}
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
                      onDelete={handleObjectDelete}
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

          {/* Add connection status indicator */}
          {showConnectionStatus && (
            <div
              className="connection-status-indicator"
              style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background:
                  connectionState === 'connected'
                    ? '#4CAF50'
                    : connectionState === 'connecting'
                    ? '#FFC107'
                    : '#F44336',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ marginRight: '8px' }}>
                {connectionState === 'connected'
                  ? 'Connected'
                  : connectionState === 'connecting'
                  ? 'Reconnecting...'
                  : 'Disconnected'}
              </span>
              {connectionState === 'disconnected' && (
                <button
                  onClick={handleManualReconnect}
                  style={{
                    background: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    color: '#333',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <UIOverlay
            onCreateObject={handleCreateObject}
            onToggleIndicators={handleToggleIndicators}
            user={user}
            onLogin={handleLogin}
            isAuthReady={isAuthReady}
            isLoading={!isAuthReady}
            showLoginButton={!isCheckingUrlAuth && !user}
            isConnectMode={isConnectMode} // Pass connect mode state to UIOverlay
            connectionState={connectionState}
            onReconnect={handleManualReconnect}
          />
        </>
      )}
    </>
  );
};

export default App;
