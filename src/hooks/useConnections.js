import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import isEqual from 'lodash/isEqual';
import {
  saveConnection,
  subscribeToConnections,
} from '../services/connectionsService';
import { calculateFacePosition } from '../utils/facePositionUtils';
import {
  checkLineIntersection,
  generateCurvedPath,
} from '../utils/pathfindingUtils';
import * as THREE from 'three';

/**
 * Custom hook to manage connections
 */
export function useConnections({ user, currentSpaceId, objects }) {
  // Connection state
  const [connections, setConnections] = useState([]);
  const [lineTexts, setLineTexts] = useState({});
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showLineTextInput, setShowLineTextInput] = useState(null);
  const [lineTextStyles, setLineTextStyles] = useState({});
  const [showLineTextStyleUI, setShowLineTextStyleUI] = useState(null);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false); // Track loading state

  // Connection management refs
  const connectionUpdateTimeoutRef = useRef(null);
  const lastKnownConnectionsRef = useRef({});
  const lastConnectionUpdateTimeRef = useRef(Date.now());
  const activeConnectionSubscriptionRef = useRef(null);
  const initialLoadCompletedRef = useRef(false); // Track initial load
  const connectionBatchRef = useRef([]); // Batch of connections to process

  // Add new refs to track subscription state and prevent duplicates
  const isSubscribingRef = useRef(false);
  const lastSubscriptionKeyRef = useRef(null);
  const subscriptionDebounceTimerRef = useRef(null);

  // Memoize the subscription key to make it stable
  const subscriptionKey = useMemo(() => {
    if (!user || !currentSpaceId) return null;
    return `${user.uid}-${currentSpaceId}`;
  }, [user, currentSpaceId]);

  // Check for public access parameters
  const publicSpaceId = window.publicAccessSpace;
  const effectiveSpaceId = publicSpaceId || currentSpaceId;
  const canViewSpace = !!(user || publicSpaceId);

  // Map connections to objects
  const mapConnectionsToObjects = useCallback((connections, objects) => {
    return connections.map((conn) => {
      const startObject = objects.find(
        (obj) => obj.id.toString() === conn.start?.objectId
      );
      const endObject = objects.find(
        (obj) => obj.id.toString() === conn.end?.objectId
      );

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

  // Position synchronization for connections - improved to better handle plane objects
  const synchronizeConnectionPositions = useCallback(
    (connections, objectsData) => {
      if (!connections.length || !objectsData.length) return connections;

      return connections.map((conn) => {
        if (!conn.start?.objectId || !conn.end?.objectId) return conn;

        const startObject = objectsData.find(
          (obj) => obj.id.toString() === conn.start.objectId
        );
        const endObject = objectsData.find(
          (obj) => obj.id.toString() === conn.end.objectId
        );

        if (!startObject || !endObject) return conn;

        const updatedConn = { ...conn };

        // Handle text objects specially - preserve their positions
        if (
          startObject.type === 'text' &&
          (conn.start.worldPosition || conn.start.position)
        ) {
          return updatedConn;
        }

        if (
          endObject.type === 'text' &&
          (conn.end.worldPosition || conn.end.position)
        ) {
          return updatedConn;
        }

        // Special handling for plane objects - more reliable position tracking
        if (startObject.type === 'plane') {
          // For planes, check if we have an explicit indicator position
          if (startObject._indicatorWorldPosition) {
            updatedConn.start.position = [
              ...startObject._indicatorWorldPosition,
            ];
            updatedConn.start.worldPosition = [
              ...startObject._indicatorWorldPosition,
            ];
            updatedConn.start.facePosition = [
              ...startObject._indicatorWorldPosition,
            ];
            updatedConn.start.faceCenter = [
              ...startObject._indicatorWorldPosition,
            ];
            return updatedConn;
          }

          // Otherwise calculate the position - this is the same calculation as in the plane component
          const offset = [0, -5 * (startObject.scale?.[1] || 1), 0];
          const worldPos = new THREE.Vector3(...startObject.position);
          const offsetVec = new THREE.Vector3(...offset);

          // We can't apply quaternion here without the actual object,
          // so we just do a simple vertical offset
          worldPos.add(offsetVec);

          updatedConn.start.position = [worldPos.x, worldPos.y, worldPos.z];
          updatedConn.start.worldPosition = [
            worldPos.x,
            worldPos.y,
            worldPos.z,
          ];
          updatedConn.start.facePosition = [worldPos.x, worldPos.y, worldPos.z];
          updatedConn.start.faceCenter = [worldPos.x, worldPos.y, worldPos.z];
        }

        // Same special handling for plane objects as the end point
        if (endObject.type === 'plane') {
          if (endObject._indicatorWorldPosition) {
            updatedConn.end.position = [...endObject._indicatorWorldPosition];
            updatedConn.end.worldPosition = [
              ...endObject._indicatorWorldPosition,
            ];
            updatedConn.end.facePosition = [
              ...endObject._indicatorWorldPosition,
            ];
            updatedConn.end.faceCenter = [...endObject._indicatorWorldPosition];
            return updatedConn;
          }

          const offset = [0, -5 * (endObject.scale?.[1] || 1), 0];
          const worldPos = new THREE.Vector3(...endObject.position);
          const offsetVec = new THREE.Vector3(...offset);
          worldPos.add(offsetVec);

          updatedConn.end.position = [worldPos.x, worldPos.y, worldPos.z];
          updatedConn.end.worldPosition = [worldPos.x, worldPos.y, worldPos.z];
          updatedConn.end.facePosition = [worldPos.x, worldPos.y, worldPos.z];
          updatedConn.end.faceCenter = [worldPos.x, worldPos.y, worldPos.z];
        }

        // Update positions for regular objects
        if (
          !startObject.type ||
          (startObject.type !== 'text' && startObject.type !== 'plane')
        ) {
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

        if (
          !endObject.type ||
          (endObject.type !== 'text' && endObject.type !== 'plane')
        ) {
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
    []
  );

  // Subscribe to connection changes - improved to handle initial load better
  useEffect(() => {
    // Skip if no key or if already subscribing
    if (!subscriptionKey || isSubscribingRef.current) return () => {};

    // Set flag to prevent parallel subscription attempts
    isSubscribingRef.current = true;

    // If we have a subscription for this key, reuse it
    if (
      activeConnectionSubscriptionRef.current?.key === subscriptionKey &&
      typeof activeConnectionSubscriptionRef.current?.unsubscribe === 'function'
    ) {
      isSubscribingRef.current = false;
      return () => {};
    }

    // Debounce multiple rapid subscription attempts
    if (subscriptionDebounceTimerRef.current) {
      clearTimeout(subscriptionDebounceTimerRef.current);
    }

    subscriptionDebounceTimerRef.current = setTimeout(() => {
      setConnectionsLoaded(false);
      initialLoadCompletedRef.current = false;

      // Clean up any existing subscription
      if (
        typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
          'function' &&
        activeConnectionSubscriptionRef.current?.key !== subscriptionKey
      ) {
        activeConnectionSubscriptionRef.current.unsubscribe();
        activeConnectionSubscriptionRef.current = null;
      }

      lastSubscriptionKeyRef.current = subscriptionKey;

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      const processedChangesSet = new Set();
      connectionBatchRef.current = [];
      let initialBatchTimeout = null;

      const unsubscribe = subscribeToConnections(
        spaceOwnerId,
        currentSpaceId,
        (change) => {
          lastConnectionUpdateTimeRef.current = Date.now();

          // For the initial load, batch changes to process them all at once
          if (!initialLoadCompletedRef.current) {
            connectionBatchRef.current.push(change);

            // Clear any existing timeout
            if (initialBatchTimeout) {
              clearTimeout(initialBatchTimeout);
            }

            // Set a timeout to process all initial changes
            initialBatchTimeout = setTimeout(() => {
              // Process all batched changes at once
              const connections = connectionBatchRef.current.reduce(
                (acc, change) => {
                  if (change.type === 'added' || change.type === 'modified') {
                    // Add/replace this connection
                    const existingIndex = acc.findIndex(
                      (c) => c.id === change.id
                    );
                    if (existingIndex >= 0) {
                      acc[existingIndex] = change.connection;
                    } else {
                      acc.push(change.connection);
                    }
                  }
                  return acc;
                },
                []
              );

              // Apply all connections at once
              if (connections.length > 0) {
                const withRefs = mapConnectionsToObjects(connections, objects);
                const syncedConnections = synchronizeConnectionPositions(
                  withRefs,
                  objects
                );
                setConnections(syncedConnections);
              }

              initialLoadCompletedRef.current = true;
              setConnectionsLoaded(true);
              connectionBatchRef.current = [];
            }, 500);

            return; // Skip individual processing for initial batch
          }

          // Normal individual change processing for changes after initial load
          const changeKey = `${change.type}-${change.id}-${
            change.connection?.lastUpdated || Date.now()
          }`;
          if (processedChangesSet.has(changeKey)) return;
          processedChangesSet.add(changeKey);

          // Batch updates
          if (connectionUpdateTimeoutRef.current) {
            clearTimeout(connectionUpdateTimeoutRef.current);
          }

          if (!lastKnownConnectionsRef.current[change.id]) {
            lastKnownConnectionsRef.current[change.id] = {};
          }

          lastKnownConnectionsRef.current[change.id] = {
            type: change.type,
            data: change.connection,
            timestamp: Date.now(),
          };

          connectionUpdateTimeoutRef.current = setTimeout(() => {
            setConnections((prev) => {
              const updates = { ...lastKnownConnectionsRef.current };
              lastKnownConnectionsRef.current = {};

              let newConnections = [...prev];

              Object.entries(updates).forEach(([connId, update]) => {
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
              const withRefs = mapConnectionsToObjects(newConnections, objects);
              return synchronizeConnectionPositions(withRefs, objects);
            });
          }, 100);
        }
      );

      // Store subscription with proper cleanup function
      if (typeof unsubscribe === 'function') {
        activeConnectionSubscriptionRef.current = {
          key: subscriptionKey,
          unsubscribe,
        };
      }

      isSubscribingRef.current = false;
    }, 250); // Debounce subscription attempts

    // Return proper cleanup function
    return () => {
      if (subscriptionDebounceTimerRef.current) {
        clearTimeout(subscriptionDebounceTimerRef.current);
      }

      // Don't unsubscribe on every render, only when unmounting or changing key
      if (
        typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
          'function' &&
        !document.hidden // Don't unsubscribe when tab is just hidden
      ) {
        activeConnectionSubscriptionRef.current.unsubscribe();
      }
    };
  }, [
    subscriptionKey,
    objects,
    currentSpaceId,
    mapConnectionsToObjects,
    synchronizeConnectionPositions,
    user.uid,
  ]); // Use the stable memoized key only

  // Subscribe to connections
  useEffect(() => {
    if (!canViewSpace || (!user && !window.currentSpaceOwner)) return () => {};

    const userId = user?.uid; // May be null for anonymous access
    const spaceId = effectiveSpaceId;

    // Define the handleConnectionChange function here
    const handleConnectionChange = (change) => {
      lastConnectionUpdateTimeRef.current = Date.now();

      // Batch updates
      if (connectionUpdateTimeoutRef.current) {
        clearTimeout(connectionUpdateTimeoutRef.current);
      }

      if (!lastKnownConnectionsRef.current[change.id]) {
        lastKnownConnectionsRef.current[change.id] = {};
      }

      lastKnownConnectionsRef.current[change.id] = {
        type: change.type,
        data: change.connection,
        timestamp: Date.now(),
      };

      connectionUpdateTimeoutRef.current = setTimeout(() => {
        setConnections((prev) => {
          const updates = { ...lastKnownConnectionsRef.current };
          lastKnownConnectionsRef.current = {};

          let newConnections = [...prev];

          Object.entries(updates).forEach(([connId, update]) => {
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
          const withRefs = mapConnectionsToObjects(newConnections, objects);
          return synchronizeConnectionPositions(withRefs, objects);
        });
      }, 100);
    };

    // Use a small delay to ensure objects are loaded first
    const timer = setTimeout(() => {
      const unsubscribe = subscribeToConnections(
        userId,
        spaceId,
        handleConnectionChange
      );
      return () => unsubscribe();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    user,
    effectiveSpaceId,
    canViewSpace,
    objects,
    mapConnectionsToObjects,
    synchronizeConnectionPositions,
  ]);

  // Update connections when objects change - with better condition
  useEffect(() => {
    if (!connectionsLoaded || connections.length === 0 || objects.length === 0)
      return;

    // Prevent updates during active transformations
    if (objects.some((obj) => obj._transformActive || obj._isDragging)) return;

    const updatedConnections = synchronizeConnectionPositions(
      connections,
      objects
    );

    // Only update if there are actual changes to prevent loops
    if (!isEqual(updatedConnections, connections)) {
      setConnections(updatedConnections);
    }
  }, [
    objects,
    connectionsLoaded,
    connections,
    connections.length,
    synchronizeConnectionPositions,
  ]);

  // Sync line texts with connections
  useEffect(() => {
    if (!connections.length) return;

    const newLineTexts = {};
    connections.forEach((conn) => {
      if (typeof conn.text === 'string') {
        newLineTexts[conn.id] = conn.text;
      }
    });

    const hasChanges =
      Object.keys(newLineTexts).length !== Object.keys(lineTexts).length ||
      Object.keys(newLineTexts).some(
        (id) => newLineTexts[id] !== lineTexts[id]
      );

    if (hasChanges) {
      setLineTexts(newLineTexts);
    }
  }, [connections, lineTexts]);

  // Connection click handler
  const handleConnectionClick = useCallback((e, connectionId) => {
    e.stopPropagation();
    setSelectedConnection(connectionId);
    setShowLineTextStyleUI(null);
  }, []);

  // Line text click handler
  const handleLineTextClick = useCallback((e, connectionId) => {
    e.stopPropagation();
    setShowLineTextStyleUI(connectionId);
    setShowLineTextInput(null);
  }, []);

  // Line text submission handler
  const handleLineTextSubmit = useCallback(
    (connectionId, text) => {
      if (!user || !currentSpaceId) return;

      const updatedConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (!updatedConnection) return;

      const newConnection = {
        ...updatedConnection,
        text,
        textStyle: updatedConnection.textStyle || {
          fontSize: 1,
          color: 'black',
        },
      };

      setConnections((prev) =>
        prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
      );

      setLineTexts((prev) => ({
        ...prev,
        [connectionId]: text,
      }));

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveConnection(spaceOwnerId, currentSpaceId, newConnection);

      setShowLineTextInput(null);
    },
    [user, currentSpaceId, connections]
  );

  // Line text style change handler
  const handleLineTextStyleChange = useCallback(
    (connectionId, newStyle) => {
      if (!user || !currentSpaceId) return;

      const updatedConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (!updatedConnection) return;

      const newConnection = {
        ...updatedConnection,
        textStyle: { ...(updatedConnection.textStyle || {}), ...newStyle },
      };

      setConnections((prev) =>
        prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
      );

      setLineTextStyles((prev) => ({
        ...prev,
        [connectionId]: { ...(prev[connectionId] || {}), ...newStyle },
      }));

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveConnection(spaceOwnerId, currentSpaceId, newConnection);
    },
    [user, currentSpaceId, connections]
  );

  // Line color change handler
  const handleLineColorChange = useCallback(
    (connectionId, color) => {
      if (!user || !currentSpaceId) return;

      const updatedConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (!updatedConnection) return;

      const newConnection = { ...updatedConnection, color };

      setConnections((prev) =>
        prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
      );

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveConnection(spaceOwnerId, currentSpaceId, newConnection);
    },
    [user, currentSpaceId, connections]
  );

  // Line style change handler
  const handleLineStyleChange = useCallback(
    (connectionId, styleType) => {
      if (!user || !currentSpaceId) return;

      const updatedConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (!updatedConnection) return;

      let newConnection = {
        ...updatedConnection,
        _lastStyleUpdate: Date.now(),
      };

      // Parse style type
      if (styleType.includes('-')) {
        const [baseStyle, direction] = styleType.split('-');
        if (
          baseStyle &&
          (baseStyle === 'dotted' || baseStyle === 'dashed') &&
          direction &&
          (direction === 'left' ||
            direction === 'right' ||
            direction === 'none')
        ) {
          newConnection.lineStyle = baseStyle;
          newConnection.dashDirection = direction;
          // Always initialize dashOffset to 0 to start animation correctly
          newConnection.dashOffset = 0;
        } else {
          newConnection.lineStyle = 'straight';
          newConnection.dashDirection = null;
          newConnection.dashOffset = 0;
        }
      } else {
        newConnection.lineStyle = styleType;
        // Always set a default direction for animated lines
        newConnection.dashDirection =
          styleType === 'dashed' || styleType === 'dotted' ? 'right' : null;
        newConnection.dashOffset = 0;
      }

      // Update React state immediately
      setConnections((prev) =>
        prev.map((conn) => (conn.id === connectionId ? newConnection : conn))
      );

      // Save to database
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveConnection(spaceOwnerId, currentSpaceId, newConnection);

      // Force path recalculation after style change
      setTimeout(() => {
        setConnections((prev) => {
          return prev.map((conn) => {
            if (conn.id !== connectionId) return conn;

            const currentConn = prev.find((c) => c.id === connectionId);
            if (!currentConn) return conn;

            // Get start and end positions
            const startPos = currentConn.start?.position || [0, 0, 0];
            const endPos = currentConn.end?.position || [0, 0, 0];

            // Filter objects for intersection checking
            const filteredObjects = objects.filter(
              (obj) =>
                obj.id.toString() !== currentConn.start?.objectId &&
                obj.id.toString() !== currentConn.end?.objectId
            );

            // Calculate intersections and path
            const intersections = checkLineIntersection(
              startPos,
              endPos,
              filteredObjects
            );
            const freshPathPoints = generateCurvedPath(
              startPos,
              endPos,
              intersections,
              currentConn.start?.objectId,
              currentConn.end?.objectId,
              conn.lineStyle === 'curved'
            );

            return {
              ...conn,
              _pathPoints: freshPathPoints,
              _textRefresh: Date.now(),
            };
          });
        });
      }, 50);
    },
    [user, currentSpaceId, connections, objects]
  );

  return {
    connections,
    setConnections,
    lineTexts,
    setLineTexts,
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
    connectionsLoaded, // Export loading state
  };
}
