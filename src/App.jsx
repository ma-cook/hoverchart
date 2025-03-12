import * as THREE from 'three';
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
import { auth } from './firebase';
import {
  signInUser,
  observeAuthState,
  handleUrlAuth,
} from './services/authService';
import { saveObject, subscribeToObjects } from './services/objectsService';
import isEqual from 'lodash/isEqual'; // Add this import
import {
  saveConnection,
  subscribeToConnections,
} from './services/connectionsService';

import {
  initializeConnectionMappings,
  objectConnectionMap,
} from './services/connectionManager';
import { memoize } from './utils/perfUtils'; // Add this import
import { getOrCreateDefaultSpace } from './services/spacesService';

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
}) => {
  // Add frame skipping to reduce update frequency
  const frameCount = useRef(0);
  const FRAMES_TO_SKIP = 3; // Only update every 3rd frame

  // Reference to track if positions changed
  const lastPositions = useRef({});

  useFrame((state, delta) => {
    // Skip frames to reduce calculation frequency
    frameCount.current += 1;
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    if (connections.length > 0) {
      let hasChanges = false;

      // Calculate new positions without updating state immediately
      const updatedConnections = connections.map((conn) => {
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

      // Only update state if there are actual changes
      if (hasChanges) {
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
  const [isCheckingUrlAuth, setIsCheckingUrlAuth] = useState(true);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

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

  // Replace the auth observer effect with this updated version
  useEffect(() => {
    console.log('Setting up auth state observer');
    const unsubscribe = observeAuthState((user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'null');
      setUser(user);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Replace loadObjects effect with new subscription handler
  const lastUpdateRef = useRef({});

  // Replace subscription effect with debounced version
  useEffect(() => {
    if (user && currentSpaceId) {
      const unsubscribe = subscribeToObjects(
        user.uid,
        currentSpaceId,
        (change) => {
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
        }
      );

      return () => unsubscribe();
    }
  }, [user, currentSpaceId]);

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
            saveObject(user.uid, currentSpaceId, obj);
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

    saveObject(user.uid, currentSpaceId, newObject);
  };

  const handleObjectClick = (id) => {
    setSelectedId(id);
    setShowLineTextStyleUI(null); // Add this line
    setSelectedConnection(null);
  };

  // Add this to the App component for local connection management
  const localConnectionUpdateRef = useRef({}); // Track last local update time

  // Improved face position calculation with better offsets
  const calculateFacePosition = useCallback(
    (indicator) => {
      // Handle null/undefined indicator
      if (!indicator) {
        console.warn('Null indicator in calculateFacePosition');
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

            console.warn('No valid position found for text indicator');
            return [0, 0, 0];
          } catch (error) {
            console.error('Error calculating text object position:', error);
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
              console.warn('Falling back to default plane position');
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
          } catch (error) {
            console.error('Error calculating plane position:', error);
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
              console.warn('No position data for indicator');
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
          } catch (error) {
            console.error('Error calculating cube/sphere position:', error);
            return [0, 0, 0];
          }
        }

        // Fallback for unknown indicator types
        return Array.isArray(indicator.position)
          ? indicator.position
          : [0, 0, 0];
      } catch (error) {
        console.error('Unhandled error in calculateFacePosition:', error);
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

  const handleObjectMove = useCallback(
    (id, newPosition) => {
      const objectId = id.toString();

      // Update local object state
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

      // Save updates to database
      if (user) {
        const now = Date.now();
        if (
          !localConnectionUpdateRef.current[objectId] ||
          now - localConnectionUpdateRef.current[objectId] > 100
        ) {
          localConnectionUpdateRef.current[objectId] = now;
          const object = objects.find((obj) => obj.id === id);
          if (object) {
            const updatedObject = {
              ...object,
              position: [newPosition.x, newPosition.y, newPosition.z],
            };
            saveObject(user.uid, currentSpaceId, updatedObject);
          }
        }
      }
    },
    [user, objects, currentSpaceId]
  );

  // Update handleObjectUpdate to use debouncing and prevent unnecessary updates
  const handleObjectUpdate = useCallback(
    (id, updates) => {
      if (!user || !id || !currentSpaceId) return;

      setObjects((prev) => {
        const updatedObjects = prev.map((obj) => {
          if (obj.id === id) {
            const newObj = { ...obj, ...updates };

            // Check if position has changed
            if (updates.position && !isEqual(obj.position, updates.position)) {
              // Save immediately for position changes
              saveObject(user.uid, currentSpaceId, newObj);
              lastUpdateRef.current[id] = newObj;
            } else {
              // Normal debounced save for other changes
              if (!isEqual(lastUpdateRef.current[id], newObj)) {
                lastUpdateRef.current[id] = newObj;
                saveObject(user.uid, currentSpaceId, newObj);
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

  const handleFaceIndicatorClick = (indicator) => {
    // Add more detailed debug to see exactly what's coming in
    console.log('Indicator clicked:', {
      type: indicator.type,
      id: indicator.cube?.id || indicator.id || indicator.objectId,
      objectId: indicator.cube?.userData?.objectId || indicator.objectId,
      face: indicator.face,
    });

    if (selectedIndicators.length === 0) {
      // First indicator selection - store it and set up connection mode
      console.log('Storing first indicator:', indicator);
      setSelectedIndicators([indicator]);
      setShowAllCubesIndicators(true);
      setGlobalIndicatorSelected(true);
    } else if (selectedIndicators.length === 1) {
      const startIndicator = selectedIndicators[0];

      // Debug logging for both indicators
      console.log('First indicator:', {
        type: startIndicator.type,
        id:
          startIndicator.cube?.id ||
          startIndicator.id ||
          startIndicator.objectId,
        face: startIndicator.face,
        objectType: startIndicator.type,
      });
      console.log('Second indicator:', {
        type: indicator.type,
        id: indicator.cube?.id || indicator.id || indicator.objectId,
        face: indicator.face,
        objectType: indicator.type,
      });

      // More robust ID extraction - improved to handle TextObject indicators
      const startIdStr = String(
        startIndicator.cube?.id ||
          startIndicator.id ||
          startIndicator.objectId ||
          startIndicator.cube?.userData?.objectId ||
          (startIndicator.plane && startIndicator.plane.userData?.id) // Look for ID in plane's userData
      );

      const endIdStr = String(
        indicator.cube?.id ||
          indicator.id ||
          indicator.objectId ||
          indicator.cube?.userData?.objectId ||
          (indicator.plane && indicator.plane.userData?.id) // Look for ID in plane's userData
      );

      console.log('Looking for objects with normalized IDs:', {
        startIdStr,
        endIdStr,
      });

      // Find objects using normalized string comparison
      const startObj = objects.find((obj) => String(obj.id) === startIdStr);
      const endObj = objects.find((obj) => String(obj.id) === endIdStr);

      // Better error logging
      if (!startObj || !endObj) {
        console.error('Could not find objects for connection:', {
          startIdSearch: startIdStr,
          endIdSearch: endIdStr,
          startObjFound: !!startObj,
          endObjFound: !!endObj,
          availableIds: objects.map((obj) => String(obj.id)),
        });
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

      console.log('Calculated positions for connection:', { startPos, endPos });

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

      // Add debug logging to see what IDs we're working with
      console.log('Creating connection between objects:', {
        startId: startIndicator.cube?.id,
        endId: indicator.cube?.id,
      });

      // Ensure we're using proper ID formats
      const startObjectId = startIdStr;
      const endObjectId = endIdStr;

      // Validate we have both object IDs
      if (!startObjectId || !endObjectId) {
        console.error('Missing object ID in connection creation', {
          startId: startObjectId,
          endId: endObjectId,
        });
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
          saveConnection(user.uid, currentSpaceId, newConnection).catch(
            (error) => {
              console.error('Failed to save connection:', error);
              setConnections((prev) =>
                prev.filter((conn) => conn.id !== connectionId)
              );
            }
          );
        } catch (error) {
          console.error('Error during connection save:', error);
          setConnections((prev) =>
            prev.filter((conn) => conn.id !== connectionId)
          );
        }
      }

      // Reset indicator selection states
      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setGlobalIndicatorSelected(false);
      setIndicatorMode('none');
    }
  };

  // Update handleFaceClick to set the active indicator correctly
  const handleFaceClick = (faceInfo) => {
    console.log('Face clicked:', faceInfo);

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
      const unsubscribe = subscribeToConnections(
        user.uid,
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
      console.log('Initializing connection mappings');
      initializeConnectionMappings(user.uid)
        .then(() => {
          console.log('Connection mappings initialized successfully');
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

  // Add this effect at the top of other effects
  // In App.jsx
  useEffect(() => {
    const checkUrlAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      const token = params.get('token');

      if (uid && token) {
        setIsCheckingUrlAuth(true);
        try {
          const success = await handleUrlAuth();
          if (!success) {
            console.error('Failed to authenticate with URL parameters');
          }
        } catch (error) {
          console.error('Error during URL authentication:', error);
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

  useEffect(() => {
    console.log('Auth state update:', { user: !!user, isCheckingUrlAuth });
    if (user || !isCheckingUrlAuth) {
      setIsCheckingUrlAuth(false);
    }
  }, [user, isCheckingUrlAuth]);

  // Get current space ID from session storage or URL
  useEffect(() => {
    if (!user) return;

    const fetchCurrentSpace = async () => {
      // Check URL for space ID first
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('spaceId');

      // Then check session storage
      const storedSpaceId = sessionStorage.getItem('currentSpaceId');

      // Use URL param, then session storage, then create default
      if (urlSpaceId) {
        setCurrentSpaceId(urlSpaceId);
      } else if (storedSpaceId) {
        setCurrentSpaceId(storedSpaceId);
      } else {
        // Get or create a default space
        const defaultSpace = await getOrCreateDefaultSpace(user.uid);
        if (defaultSpace) {
          setCurrentSpaceId(defaultSpace.id);
          sessionStorage.setItem('currentSpaceId', defaultSpace.id);
        }
      }
    };

    fetchCurrentSpace();
  }, [user]);

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
          </Canvas>
          <UIOverlay
            onCreateObject={handleCreateObject}
            onToggleIndicators={handleToggleIndicators}
            user={user}
            onLogin={handleLogin}
            isAuthReady={isAuthReady}
            isLoading={!isAuthReady}
            showLoginButton={!isCheckingUrlAuth && !user}
          />
        </>
      )}
    </>
  );
};

export default App;
