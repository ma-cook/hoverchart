import * as THREE from 'three';
import { db } from './firebase';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';

import LineUI from './components/LineUI';
import HeaderInput from './components/HeaderInput';
import TextSprite from './components/TextSprite';
import TextStyleUI from './components/TextStyleUI';
import { EffectComposer, SMAA } from '@react-three/postprocessing'; // <-- Use SMAA instead of FXAA

import { findSpaceOwner } from './services/sharedSpacesService';
import ObjectRenderer from './components/ObjectRenderer'; // Add this import

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
} from './services/connectionsService';

import {
  initializeConnectionMappings,
  objectConnectionMap,
  objectsAreConnected, // Ensure this is properly imported
  registerObjectConnection,
  registerConnectedPair,
  handleTextObjectConnection,
} from './services/connectionManager';
import { memoize } from './utils/perfUtils'; // Add this import

import { doc, getDoc, collection } from 'firebase/firestore';
import {
  checkLineIntersection,
  generateCurvedPath,
} from './utils/pathfindingUtils';
import { calculateMidpoint } from './utils/positionUtils'; // Add this import
import { calculateFacePosition } from './utils/facePositionUtils'; // Add this import
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
  const FRAMES_TO_SKIP = 6; // Increased to reduce CPU usage
  const lastPositions = useRef({});
  const ANIMATION_SPEED = 15; // Keep moderate speed
  const animationRequestRef = useRef();
  const lastUpdateTime = useRef(Date.now());

  // Use a more efficient animation strategy that doesn't block other operations
  useFrame((state, delta) => {
    frameCount.current += 1;

    // Skip more frames to reduce CPU usage
    if (frameCount.current % FRAMES_TO_SKIP !== 0) return;

    // Throttle updates based on time to prevent excessive renders
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    if (timeSinceLastUpdate < 100) return; // Limit to ~10fps for animations

    // Only process animations if there are no active transformations
    if (transformingObjects.current.size > 0) return;

    if (connections.length > 0) {
      let hasChanges = false;
      let hasAnimationOnly = true; // Track if we're only updating animations

      const updatedConnections = connections.map((conn) => {
        // Get new positions (only if we have position data and aren't just animating)
        let newStartPos = conn.start?.position || [0, 0, 0];
        let newEndPos = conn.end?.position || [0, 0, 0];

        const startKey = `${conn.id}-start`;
        const endKey = `${conn.id}-end`;

        // Only recalculate positions occasionally to save CPU
        if (frameCount.current % 12 === 0) {
          newStartPos = calculateFacePosition(conn.start);
          newEndPos = calculateFacePosition(conn.end);

          // Check if positions actually changed
          const startChanged =
            !lastPositions.current[startKey] ||
            !arraysEqual(lastPositions.current[startKey], newStartPos);
          const endChanged =
            !lastPositions.current[endKey] ||
            !arraysEqual(lastPositions.current[endKey], newEndPos);

          if (startChanged || endChanged) {
            hasChanges = true;
            hasAnimationOnly = false;

            // Store positions for next comparison
            if (startChanged)
              lastPositions.current[startKey] = [...newStartPos];
            if (endChanged) lastPositions.current[endKey] = [...newEndPos];
          }
        }

        // Check if this connection needs animation
        const needsAnimation =
          (conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted') &&
          (conn.dashDirection === 'left' || conn.dashDirection === 'right');

        if (needsAnimation) {
          hasChanges = true;
          // Calculate new dash offset for animated lines
          let newDashOffset = conn.dashOffset || 0;
          const animationStep = delta * ANIMATION_SPEED;

          if (conn.dashDirection === 'left') {
            newDashOffset = (newDashOffset - animationStep) % 1000;
          } else if (conn.dashDirection === 'right') {
            newDashOffset = (newDashOffset + animationStep) % 1000;
          }

          return {
            ...conn,
            start: { ...conn.start, position: newStartPos },
            end: { ...conn.end, position: newEndPos },
            dashOffset: newDashOffset,
          };
        } else if (hasChanges && !hasAnimationOnly) {
          // Only update positions if they changed and we're not just animating
          return {
            ...conn,
            start: { ...conn.start, position: newStartPos },
            end: { ...conn.end, position: newEndPos },
          };
        }

        return conn;
      });

      // Only update state if something changed
      if (hasChanges) {
        // Use a safer state update approach
        setConnections((current) => {
          // If the connections changed elsewhere while we were calculating,
          // only update the dash offsets and preserve other changes
          if (hasAnimationOnly && current.length !== connections.length) {
            const connMap = new Map(updatedConnections.map((c) => [c.id, c]));
            return current.map((c) => {
              const updated = connMap.get(c.id);
              if (updated) {
                return {
                  ...c,
                  dashOffset: updated.dashOffset,
                };
              }
              return c;
            });
          }
          return updatedConnections;
        });

        lastUpdateTime.current = now;
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
  const calculateFacePositionWithObjects = useCallback(
    (indicator) => calculateFacePosition(indicator, objects),
    [objects]
  );

  // Memoized version of the calculation function - NOW INSIDE THE COMPONENT
  const memoizedCalculateFacePosition = useMemo(
    () => memoize(calculateFacePositionWithObjects),
    [calculateFacePositionWithObjects]
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

  // Modify handleFaceIndicatorClick to ensure indicator positions are properly passed
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

      // Check if connection already exists using the imported function
      // Wrap in try/catch in case there's an issue with the function
      try {
        const connectionAlreadyExists = objectsAreConnected(
          startIdStr,
          endIdStr
        );

        if (connectionAlreadyExists) {
          // Reset selection state but stay in connect mode
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          return;
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        // Fallback - check manually in connections array
        const manualConnectionCheck = connections.some(
          (conn) =>
            (conn.start?.objectId === startIdStr &&
              conn.end?.objectId === endIdStr) ||
            (conn.start?.objectId === endIdStr &&
              conn.end?.objectId === startIdStr)
        );

        if (manualConnectionCheck) {
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          return;
        }
      }

      // Find objects using normalized string comparison
      const startObj = objects.find((obj) => String(obj.id) === startIdStr);
      const endObj = objects.find((obj) => String(obj.id) === endIdStr);

      // Better error handling without logs
      if (!startObj || !endObj) {
        return;
      }

      // Special handling for text object connections
      if (startObj.type === 'text' || endObj.type === 'text') {
        let result;

        if (startObj.type === 'text') {
          // For text objects, use the INDICATOR object (not the startObj) to preserve indicator position
          const textIndicator = selectedIndicatorsRef.current[0];

          // Make sure indicator has worldPosition from original click
          if (!textIndicator.worldPosition && textIndicator.position) {
            textIndicator.worldPosition = textIndicator.position;
          }

          // Pass the indicator object that has position data
          result = handleTextObjectConnection(
            textIndicator, // Pass the indicator instead of just the object
            endObj,
            indicator.face,
            user.uid,
            currentSpaceId
          );
        } else {
          // Text object is the end - similar approach with current indicator
          result = handleTextObjectConnection(
            indicator, // Pass the current indicator with position data
            startObj,
            startIndicator.face,
            user.uid,
            currentSpaceId
          );
        }

        if (result.success && result.connection) {
          // Add to local state for immediate visualization
          setConnections((prev) => [...prev, result.connection]);
        }

        // Reset selection state regardless of outcome
        selectedIndicatorsRef.current = [];
        setSelectedIndicators([]);
        setShowAllCubesIndicators(false);
        setGlobalIndicatorSelected(false);
        setIndicatorMode('none');
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

      // Register this connection in the connection manager
      registerObjectConnection(startObjectId, connectionId);
      registerObjectConnection(endObjectId, connectionId);
      registerConnectedPair(startObjectId, endObjectId, connectionId);

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

  const handleLineStyleChange = (connectionId, styleType) => {
    const updatedConnection = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!updatedConnection || !user) return;

    console.log(`Changing line style for ${connectionId} to ${styleType}`);

    // Create a new connection object with the updated style
    let newConnection = {
      ...updatedConnection,
      _lastStyleUpdate: Date.now(),
    };

    // Set line style based on styleType
    if (styleType.includes('-')) {
      // Handle combined styles like "dotted-left" or "dashed-right"
      const [baseStyle, direction] = styleType.split('-');

      // Make sure we have valid values
      if (
        baseStyle &&
        (baseStyle === 'dotted' || baseStyle === 'dashed') &&
        direction &&
        (direction === 'left' || direction === 'right')
      ) {
        newConnection.lineStyle = baseStyle;
        newConnection.dashDirection = direction;
        newConnection.dashOffset = 0; // Reset offset when changing direction

        console.log(
          `Setting animation: style=${baseStyle}, direction=${direction}`
        );
      } else {
        console.warn(`Invalid style format: ${styleType}`);
        newConnection.lineStyle = 'straight';
        newConnection.dashDirection = null;
      }
    } else {
      // Simple style like "straight"
      newConnection.lineStyle = styleType;
      newConnection.dashDirection = null;
      newConnection.dashOffset = 0;

      console.log(`Setting non-animated style: ${styleType}`);
    }

    // Update connections state to reflect new line style
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );

    // Save to database
    saveConnection(user.uid, currentSpaceId, newConnection);

    // IMPORTANT: Force a complete refresh of the connection to ensure path points are recalculated
    setTimeout(() => {
      // This delay allows the first update to complete
      setConnections((prev) => {
        return prev.map((conn) => {
          if (conn.id === connectionId) {
            // Find the current connection to get fresh data
            const currentConn = prev.find((c) => c.id === connectionId);
            if (!currentConn) return conn;

            // Get start and end positions
            const startPos = currentConn.start?.position || [0, 0, 0];
            const endPos = currentConn.end?.position || [0, 0, 0];

            // Explicitly regenerate path points here based on updated line style
            const filteredObjects = objects.filter(
              (obj) =>
                obj.id.toString() !== currentConn.start?.objectId &&
                obj.id.toString() !== currentConn.end?.objectId
            );

            const intersections = checkLineIntersection(
              startPos,
              endPos,
              filteredObjects
            );

            // Force recalculation of path points with the new style
            const freshPathPoints = generateCurvedPath(
              startPos,
              endPos,
              intersections,
              currentConn.start?.objectId,
              currentConn.end?.objectId,
              conn.lineStyle === 'curved' // Force curved path if style is curved
            );

            console.log(
              'Regenerated path points for',
              connectionId,
              'with style',
              conn.lineStyle,
              'Points:',
              freshPathPoints
            );

            // Return updated connection with force refresh flag
            return {
              ...conn,
              _pathPoints: freshPathPoints, // Store recalculated path points
              _textRefresh: Date.now(), // Force TextSprite to remount
            };
          }
          return conn;
        });
      });
    }, 50);
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

    console.log('Submitting line text:', text, 'for connection:', connectionId);

    // Create updated connection with the new text
    const newConnection = {
      ...updatedConnection,
      text: text,
      textStyle: updatedConnection.textStyle || { fontSize: 1, color: 'white' },
    };

    // Update both connections state and lineTexts state atomically
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
    );

    setLineTexts((prev) => ({
      ...prev,
      [connectionId]: text,
    }));

    // Save to database with the space owner ID
    if (currentSpaceId) {
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveConnection(spaceOwnerId, currentSpaceId, newConnection)
        .then(() => {
          console.log('Connection text saved successfully');
        })
        .catch((err) => {
          console.error('Error saving connection text:', err);
          // Revert state on error
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === connectionId ? updatedConnection : conn
            )
          );
          setLineTexts((prev) => ({
            ...prev,
            [connectionId]: updatedConnection.text || '',
          }));
        });
    }

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

        // Create a new connection object to avoid mutating the original
        const updatedConn = { ...conn };

        // CRITICAL FIX: Handle text objects differently
        if (startObject.type === 'text') {
          // Preserve the exact indicator position - DO NOT RECALCULATE for text objects
          if (conn.start.worldPosition || conn.start.position) {
            // Keep existing indicator position if available
            return updatedConn;
          }
        }

        if (endObject.type === 'text') {
          // Same for end position - preserve existing indicator position
          if (conn.end.worldPosition || conn.end.position) {
            return updatedConn;
          }
        }

        // Only calculate new positions for non-text objects or if no position exists
        if (!startObject.type || startObject.type !== 'text') {
          updatedConn.start.position = calculateFacePosition({
            type: conn.start.type,
            face: conn.start.face,
            faceCenter: conn.start.faceCenter,
            cube: {
              ...conn.start.cube,
              position: startObject.position,
              scale: startObject.scale || [1, 1, 1],
            },
            objectId: conn.start.objectId,
          });
        }

        if (!endObject.type || endObject.type !== 'text') {
          updatedConn.end.position = calculateFacePosition({
            type: conn.end.type,
            face: conn.end.face,
            faceCenter: conn.end.faceCenter,
            cube: {
              ...conn.end.cube,
              position: endObject.position,
              scale: endObject.scale || [1, 1, 1],
            },
            objectId: conn.end.objectId,
          });
        }

        return updatedConn;
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
    if (!connections.length) return;

    // Build a new map of line texts
    const newLineTexts = {};
    connections.forEach((conn) => {
      if (typeof conn.text === 'string') {
        newLineTexts[conn.id] = conn.text;
      }
    });

    // Only update if there are changes to prevent loops
    const hasChanges =
      Object.keys(newLineTexts).length !== Object.keys(lineTexts).length ||
      Object.keys(newLineTexts).some(
        (id) => newLineTexts[id] !== lineTexts[id]
      );

    if (hasChanges) {
      console.log('Updating lineTexts state:', newLineTexts);
      setLineTexts(newLineTexts);
    }
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
  const intentionalSpaceChangeRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const fetchCurrentSpace = async () => {
      // Check URL for space ID first
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('spaceId');

      const urlOwnerUid = params.get('ownerUid');

      // Don't clear objects/connections if we already have the same space ID
      // This prevents unwanted clears during connection updates
      if (
        urlSpaceId &&
        urlSpaceId === currentSpaceId &&
        !intentionalSpaceChangeRef.current
      ) {
        // Just update owner info if needed
        if (urlOwnerUid) {
          window.currentSpaceOwner =
            urlOwnerUid === user.uid ? user.uid : urlOwnerUid;
        }
        return;
      }

      // If we're explicitly changing spaces, clear objects/connections
      if (intentionalSpaceChangeRef.current || urlSpaceId !== currentSpaceId) {
        setObjects([]);
        setConnections([]);
        intentionalSpaceChangeRef.current = false;
      }

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
  }, [user, currentSpaceId]);

  // Add a new effect to handle redirection when no spaceId is available
  useEffect(() => {
    // Only run this after auth is ready and we know there's no current space
    // AND we're not currently processing a space change
    if (
      isAuthReady &&
      user &&
      currentSpaceId === null &&
      !intentionalSpaceChangeRef.current
    ) {
      // Allow a small delay for logging and cleanup
      const redirectTimeout = setTimeout(() => {
        window.location.href = 'https://volscape.web.app/';
      }, 500); // Increase the delay to prevent quick redirects

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

  // Add debouncing mechanism for connection updates
  const connectionUpdateTimeoutRef = useRef(null);
  const lastKnownConnectionsRef = useRef({});

  // Add a timestamp for last connection update
  const lastConnectionUpdateTimeRef = useRef(Date.now());

  // Add a ref to track if a subscription is already active
  const activeConnectionSubscriptionRef = useRef(null);

  // Replace the existing connection subscription with the enhanced version
  useEffect(() => {
    if (user && currentSpaceId) {
      // Avoid unnecessary re-subscriptions by checking if user/spaceId actually changed
      const subscriptionKey = `${user.uid}-${currentSpaceId}`;

      // Only set up a new subscription if we don't have one or if key changed
      if (activeConnectionSubscriptionRef.current?.key !== subscriptionKey) {
        // Clean up any existing subscription
        if (activeConnectionSubscriptionRef.current?.unsubscribe) {
          if (
            typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
            'function'
          ) {
            activeConnectionSubscriptionRef.current.unsubscribe();
          }
        }

        // Use the space owner's ID for subscription
        const spaceOwnerId = window.currentSpaceOwner || user.uid;

        // Set up new subscription - wrap callback to deduplicate
        const processedChangesSet = new Set();

        const unsubscribe = subscribeToConnections(
          spaceOwnerId,
          currentSpaceId,
          (change) => {
            // Update last activity timestamp

            lastConnectionUpdateTimeRef.current = Date.now();

            // Create a unique key for this change to prevent duplicate processing
            const changeKey = `${change.type}-${change.id}-${
              change.connection?.lastUpdated || Date.now()
            }`;

            if (processedChangesSet.has(changeKey)) {
              return; // Skip if we've already processed this exact change
            }
            processedChangesSet.add(changeKey);

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
                  // Skip if we don't need to update
                  const existingConn = newConnections.find(
                    (conn) => conn.id === connId
                  );

                  switch (update.type) {
                    case 'added':
                      if (!existingConn) {
                        newConnections = [...newConnections, update.data];
                      }
                      break;
                    case 'modified':
                      if (existingConn && !isEqual(existingConn, update.data)) {
                        newConnections = newConnections.map((conn) =>
                          conn.id === connId ? update.data : conn
                        );
                      }
                      break;
                    case 'removed':
                      newConnections = newConnections.filter(
                        (conn) => conn.id !== connId
                      );
                      break;
                  }
                });

                // Map object references and positions
                const withRefs = mapConnectionsToObjects(
                  newConnections,
                  objects
                );
                return synchronizeConnectionPositions(withRefs, objects);
              });
            }, 100); // Short debounce time for responsiveness
          }
        );

        // Save subscription info - Make sure unsubscribe is a function
        if (typeof unsubscribe === 'function') {
          activeConnectionSubscriptionRef.current = {
            key: subscriptionKey,
            unsubscribe: unsubscribe,
          };
        } else {
          console.warn(
            'Expected unsubscribe to be a function but got:',
            unsubscribe
          );
          activeConnectionSubscriptionRef.current = {
            key: subscriptionKey,
            unsubscribe: () => {}, // Provide a no-op fallback
          };
        }

        return () => {
          // Make sure unsubscribe is a function before calling it
          if (
            typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
            'function'
          ) {
            activeConnectionSubscriptionRef.current.unsubscribe();
          }
          if (connectionUpdateTimeoutRef.current) {
            clearTimeout(connectionUpdateTimeoutRef.current);
          }
          activeConnectionSubscriptionRef.current = null;
        };
      }

      // If we already have an active subscription with the same key, return a cleanup function
      return () => {
        if (
          typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
          'function'
        ) {
          activeConnectionSubscriptionRef.current.unsubscribe();
        }
      };
    }

    // Always return a cleanup function, even if it's empty
    return () => {};
  }, [
    user?.uid,
    currentSpaceId,
    mapConnectionsToObjects,
    synchronizeConnectionPositions,
    objects, // Adding objects here to ensure we re-create references when objects change
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

                // Explicitly make sure we get the text
                const connectionText =
                  connection.text || lineTexts[connection.id] || '';

                // Determine if this is a curved path based on path points and intersections
                const isCurvedPath =
                  pathPoints.length > 2 && intersections.length > 0;

                // Explicitly set the line style based on the path and connection settings
                const effectiveLineStyle =
                  isCurvedPath || connection.lineStyle === 'curved'
                    ? 'curved'
                    : connection.lineStyle || 'straight';

                // Calculate the text position
                let textPosition;
                const defaultStraightLineOffset = 2; // Lower offset for straight lines
                const defaultCurvedLineOffset = 5; // Higher offset for curved lines

                if (pathPoints && pathPoints.length > 0) {
                  if (effectiveLineStyle === 'curved') {
                    // For curved paths, use middle point with higher elevation
                    const midIdx = Math.floor(pathPoints.length / 2);
                    textPosition = [
                      pathPoints[midIdx].x,
                      pathPoints[midIdx].y + defaultCurvedLineOffset,
                      pathPoints[midIdx].z,
                    ];
                  } else {
                    // For straight lines, use calculated midpoint with lower elevation
                    textPosition = [
                      midpoint[0],
                      midpoint[1] + defaultStraightLineOffset,
                      midpoint[2],
                    ];
                  }
                } else {
                  // Fallback to basic midpoint if path calculation failed
                  textPosition = [
                    midpoint[0],
                    midpoint[1] + defaultStraightLineOffset,
                    midpoint[2],
                  ];
                }

                return (
                  <group key={connection.id}>
                    {/* Single visible line with proper depth testing */}
                    <Line
                      points={pathPoints}
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

                    {/* Clickable area */}
                    <Line
                      points={pathPoints}
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

                    {/* Enhanced text rendering that updates when line style changes */}
                    <TextSprite
                      key={`text-${connection.id}-${
                        connection._lastStyleUpdate || 0
                      }-${effectiveLineStyle}-${connection._textRefresh || 0}`}
                      text={connectionText}
                      position={textPosition}
                      style={{
                        fontSize: connection.textStyle?.fontSize || 1.5,
                        color: connection.textStyle?.color || 'white',
                        underline: connection.textStyle?.underline || false,
                        fixedSize: true,
                        backgroundOpacity: 0.4,
                        backgroundColor: '#000000',
                        padding: 0.3,
                      }}
                      onClick={(e) => handleLineTextClick(e, connection.id)}
                      billboard={true}
                      renderOrder={20}
                      lineStyle={effectiveLineStyle} // Use the explicitly determined line style
                      pathPoints={connection._pathPoints || pathPoints}
                    />

                    {/* Text input UI */}
                    {showLineTextInput === connection.id && (
                      <HeaderInput
                        position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
                        onTextSubmit={(text) =>
                          handleLineTextSubmit(connection.id, text)
                        }
                        initialText={connectionText} // Add initial text for editing existing text
                      />
                    )}

                    {/* Text style UI */}
                    {showLineTextStyleUI === connection.id && (
                      <TextStyleUI
                        position={[midpoint[0], midpoint[1] + 8, midpoint[2]]}
                        onStyleChange={(style) =>
                          handleLineTextStyleChange(connection.id, style)
                        }
                        onClose={() => setShowLineTextStyleUI(null)}
                        currentStyle={connection.textStyle || {}} // Pass current style for context
                      />
                    )}

                    {/* Line UI */}
                    {selectedConnection === connection.id && (
                      <LineUI
                        position={midpoint}
                        onColorChange={(color) =>
                          handleLineColorChange(connection.id, color)
                        }
                        onToggleDashed={(styleType) =>
                          handleLineStyleChange(connection.id, styleType)
                        }
                        onTextClick={() => setShowLineTextInput(connection.id)}
                        currentText={connectionText} // Pass current text to UI
                        hasText={
                          !!connectionText && connectionText.trim() !== ''
                        } // Indicate if there's already text
                      />
                    )}
                  </group>
                );
              })}

              {objects.map((obj) => (
                <ObjectRenderer
                  key={obj.id}
                  obj={obj}
                  selectedId={selectedId}
                  handleObjectClick={handleObjectClick}
                  handleObjectMove={handleObjectMove}
                  handleObjectUpdate={handleObjectUpdate}
                  disableOrbitControls={disableOrbitControls}
                  enableOrbitControls={enableOrbitControls}
                  handleFaceIndicatorClick={handleFaceIndicatorClick}
                  handleFaceClick={handleFaceClick}
                  showAllCubesIndicators={showAllCubesIndicators}
                  activeIndicator={activeIndicator}
                  indicatorMode={indicatorMode}
                  connections={connections}
                  selectedIndicators={selectedIndicators}
                  activeTextStyleUI={activeTextStyleUI}
                  setActiveTextStyleUI={setActiveTextStyleUI}
                  handleIndicatorDeselected={handleIndicatorDeselected}
                  registerTransformingObject={registerTransformingObject}
                  handleObjectMatrixChanged={handleObjectMatrixChanged}
                  handleIndicatorSelected={handleIndicatorSelected}
                  globalIndicatorSelected={globalIndicatorSelected}
                  handleObjectDelete={handleObjectDelete}
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
            isConnectMode={isConnectMode} // Pass connect mode state to UIOverlay
          />
        </>
      )}
    </>
  );
};

export default App;
