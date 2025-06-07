import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import isEqual from 'lodash/isEqual';
import {
  subscribeToConnections,
  saveConnection,
} from '../services/connectionsService';

/**
 * Custom hook to manage connections
 */
export function useConnections({ user, currentSpaceId, loadedCells = [] }) {
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
  const lastKnownConnectionsRef = useRef([]); // Should be an array, not an object
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
  const canViewSpace = !!(user || publicSpaceId); // Memoize the cell coordinates conversion to prevent constant re-subscriptions
  const cellCoords = useMemo(() => {
    if (!Array.isArray(loadedCells) || loadedCells.length === 0) {
      return [];
    }

    // Create a stable array by sorting cell IDs to prevent unnecessary re-renders
    const sortedCells = [...loadedCells].sort();

    return sortedCells
      .map((cellId) => {
        if (typeof cellId === 'string') {
          const [x, y, z] = cellId.split(',').map(Number);
          return { x, y, z: z || 0 }; // Default z to 0 for backward compatibility
        }
        return cellId; // Already an object
      })
      .filter(
        (coords) =>
          coords &&
          typeof coords.x === 'number' &&
          typeof coords.y === 'number' &&
          typeof coords.z === 'number'
      );
  }, [loadedCells]);

  // Create a stable cellCoords key for comparison
  const cellCoordsKey = useMemo(() => {
    return cellCoords
      .map((c) => `${c.x},${c.y},${c.z}`)
      .sort()
      .join('|');
  }, [cellCoords]); // Subscribe to connection changes - improved to handle initial load better
  useEffect(() => {
    // Create a stable subscription key that includes cell info
    const fullSubscriptionKey = subscriptionKey
      ? `${subscriptionKey}-${cellCoordsKey}`
      : null; // Skip if no key or if already subscribing to the same data
    if (
      !fullSubscriptionKey ||
      isSubscribingRef.current ||
      lastSubscriptionKeyRef.current === fullSubscriptionKey
    ) {
      return () => {};
    } // Check if we have viewing permissions
    if (!canViewSpace || (!user && !window.currentSpaceOwner)) {
      return () => {};
    }

    // Set flag to prevent parallel subscription attempts
    isSubscribingRef.current = true; // If we have a subscription for this key, reuse it
    if (
      activeConnectionSubscriptionRef.current?.key === fullSubscriptionKey &&
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
      initialLoadCompletedRef.current = false; // Clean up any existing subscription
      if (
        typeof activeConnectionSubscriptionRef.current?.unsubscribe ===
          'function' &&
        activeConnectionSubscriptionRef.current?.key !== fullSubscriptionKey
      ) {
        activeConnectionSubscriptionRef.current.unsubscribe();
        activeConnectionSubscriptionRef.current = null;
      }
      lastSubscriptionKeyRef.current = fullSubscriptionKey;

      const spaceOwnerId = window.currentSpaceOwner || user?.uid;
      connectionBatchRef.current = [];
      let initialBatchTimeout = null;

      const unsubscribe = subscribeToConnections(
        spaceOwnerId,
        effectiveSpaceId,
        (change) => {
          lastConnectionUpdateTimeRef.current = Date.now(); // For the initial load, batch changes to process them all at once
          if (!initialLoadCompletedRef.current) {
            connectionBatchRef.current.push(change);

            // Clear any existing timeout
            if (initialBatchTimeout) {
              clearTimeout(initialBatchTimeout);
              initialBatchTimeout = null;
            } // Set a timeout to process the initial batch
            initialBatchTimeout = setTimeout(() => {
              setConnections((prevConnections) => {
                const updatedConnections = [...prevConnections];
                connectionBatchRef.current.forEach((change) => {
                  const index = updatedConnections.findIndex(
                    (conn) => conn.id === change.id
                  );

                  if (change.type === 'added' && index === -1) {
                    // New connection, add to state
                    updatedConnections.push(change.connection);
                  } else if (change.type === 'modified' && index !== -1) {
                    // Existing connection updated, merge changes
                    updatedConnections[index] = {
                      ...updatedConnections[index],
                      ...change.connection,
                    };
                  } else if (change.type === 'removed' && index !== -1) {
                    // Connection removed, filter out
                    updatedConnections.splice(index, 1);
                  }
                });
                return updatedConnections;
              });

              setConnections((updatedConnections) => {
                lastKnownConnectionsRef.current = updatedConnections;
                return updatedConnections;
              }); // Mark initial load as completed
              initialLoadCompletedRef.current = true;
              setConnectionsLoaded(true);
            }, 50); // 50ms timeout for batch processing
          } else {
            // For subsequent updates, handle each change immediately
            setConnections((prevConnections) => {
              const updatedConnections = [...prevConnections];
              const index = updatedConnections.findIndex(
                (conn) => conn.id === change.id
              );
              if (change.type === 'added' && index === -1) {
                // New connection, add to state
                updatedConnections.push(change.connection);
              } else if (change.type === 'modified' && index !== -1) {
                // Existing connection updated, merge changes
                updatedConnections[index] = {
                  ...updatedConnections[index],
                  ...change.connection,
                };
              } else if (change.type === 'removed' && index !== -1) {
                // Connection removed, filter out
                updatedConnections.splice(index, 1);
              }

              return updatedConnections;
            });

            // Update lastKnownConnectionsRef to track the changes
            const updated = [...(lastKnownConnectionsRef.current || [])];
            const index = updated.findIndex((conn) => conn.id === change.id);

            if (change.type === 'added' && index === -1) {
              updated.push(change.connection);
            } else if (change.type === 'modified' && index !== -1) {
              updated[index] = {
                ...updated[index],
                ...change.connection,
              };
            } else if (change.type === 'removed' && index !== -1) {
              updated.splice(index, 1);
            }

            lastKnownConnectionsRef.current = updated;
          }
        },
        cellCoords // Pass converted coordinates as the fourth parameter
      );

      // Store the subscription with its key for future reference
      activeConnectionSubscriptionRef.current = {
        key: fullSubscriptionKey,
        unsubscribe,
      };
      isSubscribingRef.current = false;
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, 200); // Increased debounce to 200ms for more stability

    return () => {
      if (subscriptionDebounceTimerRef.current) {
        clearTimeout(subscriptionDebounceTimerRef.current);
      }
    };
  }, [
    subscriptionKey,
    canViewSpace,
    effectiveSpaceId,
    cellCoordsKey, // Use stable cellCoordsKey for subscription key comparison
    cellCoords, // Still needed for the actual subscription call
    user,
  ]);

  // Connection update handler - improved to batch updates and reduce re-renders
  useEffect(() => {
    // Skip if no connections or if already processing
    if (!connections.length || connectionUpdateTimeoutRef.current) return;

    connectionUpdateTimeoutRef.current = setTimeout(() => {
      setConnections((prevConnections) => {
        const updatedConnections = [...prevConnections];

        // Apply any necessary updates to the connections
        updatedConnections.forEach((conn, index) => {
          const lastKnown = lastKnownConnectionsRef.current.find(
            (c) => c.id === conn.id
          );
          if (lastKnown && !isEqual(conn, lastKnown)) {
            updatedConnections[index] = { ...lastKnown };
          }
        });

        return updatedConnections;
      });

      connectionUpdateTimeoutRef.current = null;
    }, 100); // 100ms debounce for connection updates
  }, [connections]);

  // Connection handler functions
  const handleConnectionClick = useCallback(
    (e, connectionId) => {
      e.stopPropagation();
      setSelectedConnection(
        selectedConnection === connectionId ? null : connectionId
      );
    },
    [selectedConnection]
  );

  const handleLineTextClick = useCallback((e, connectionId) => {
    e.stopPropagation();
    setShowLineTextInput(connectionId);
  }, []);
  const handleLineTextSubmit = useCallback(
    async (connectionId, text) => {
      // Update local state first for immediate feedback
      setLineTexts((prev) => ({
        ...prev,
        [connectionId]: text,
      }));
      setShowLineTextInput(null);

      // Find the connection and update it in the database
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection && user && currentSpaceId) {
        try {
          const spaceOwnerId = window.currentSpaceOwner || user.uid;
          const updatedConnection = {
            ...connection,
            text,
            lastUpdated: new Date().toISOString(),
          };

          // Update local connections state
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === connectionId ? updatedConnection : conn
            )
          );

          // Save to database
          await saveConnection(spaceOwnerId, currentSpaceId, updatedConnection);
          console.log(`💾 Saved connection text for ${connectionId}`);
        } catch (error) {
          console.error(`❌ Failed to save connection text:`, error);
          // Revert local state on error
          setLineTexts((prev) => {
            const newState = { ...prev };
            delete newState[connectionId];
            return newState;
          });
        }
      }
    },
    [connections, user, currentSpaceId, setConnections]
  );
  const handleLineTextStyleChange = useCallback(
    async (connectionId, style) => {
      // Update local state first for immediate feedback
      setLineTextStyles((prev) => ({
        ...prev,
        [connectionId]: { ...prev[connectionId], ...style },
      }));

      // Find the connection and update it in the database
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection && user && currentSpaceId) {
        try {
          const spaceOwnerId = window.currentSpaceOwner || user.uid;
          const updatedConnection = {
            ...connection,
            textStyle: {
              ...connection.textStyle,
              ...style,
            },
            lastUpdated: new Date().toISOString(),
          };

          // Update local connections state
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === connectionId ? updatedConnection : conn
            )
          );

          // Save to database
          await saveConnection(spaceOwnerId, currentSpaceId, updatedConnection);
          console.log(`💾 Saved connection text style for ${connectionId}`);
        } catch (error) {
          console.error(`❌ Failed to save connection text style:`, error);
          // Revert local state on error
          setLineTextStyles((prev) => {
            const newState = { ...prev };
            if (newState[connectionId]) {
              // Remove the failed style changes
              Object.keys(style).forEach((key) => {
                delete newState[connectionId][key];
              });
            }
            return newState;
          });
        }
      }
    },
    [connections, user, currentSpaceId, setConnections]
  );
  const handleLineColorChange = useCallback(
    async (connectionId, color) => {
      // Update local state first for immediate feedback
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId ? { ...conn, color } : conn
        )
      );

      // Find the connection and save it to the database
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection && user && currentSpaceId) {
        try {
          const spaceOwnerId = window.currentSpaceOwner || user.uid;
          const updatedConnection = {
            ...connection,
            color,
            lastUpdated: new Date().toISOString(),
          };

          // Save to database
          await saveConnection(spaceOwnerId, currentSpaceId, updatedConnection);
          console.log(`💾 Saved connection color for ${connectionId}`);
        } catch (error) {
          console.error(`❌ Failed to save connection color:`, error);
          // Revert local state on error
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === connectionId
                ? { ...conn, color: connection.color }
                : conn
            )
          );
        }
      }
    },
    [connections, user, currentSpaceId]
  );
  const handleLineStyleChange = useCallback(
    async (connectionId, styleType) => {
      // Determine style properties
      const [lineStyle, direction] = styleType.includes('-')
        ? styleType.split('-')
        : [styleType, null];

      // Update local state first for immediate feedback
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.id === connectionId) {
            return {
              ...conn,
              lineStyle,
              dashDirection: direction || null,
            };
          }
          return conn;
        })
      );

      // Find the connection and save it to the database
      const connection = connections.find((conn) => conn.id === connectionId);
      if (connection && user && currentSpaceId) {
        try {
          const spaceOwnerId = window.currentSpaceOwner || user.uid;
          const updatedConnection = {
            ...connection,
            lineStyle,
            dashDirection: direction || null,
            lastUpdated: new Date().toISOString(),
          };

          // Save to database
          await saveConnection(spaceOwnerId, currentSpaceId, updatedConnection);
          console.log(`💾 Saved connection line style for ${connectionId}`);
        } catch (error) {
          console.error(`❌ Failed to save connection line style:`, error);
          // Revert local state on error
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === connectionId
                ? {
                    ...conn,
                    lineStyle: connection.lineStyle,
                    dashDirection: connection.dashDirection,
                  }
                : conn
            )
          );
        }
      }
    },
    [connections, user, currentSpaceId]
  );

  // Public API for the hook
  return {
    connections,
    setConnections,
    lineTexts,
    setLineTexts,
    selectedConnection,
    setSelectedConnection,
    showLineTextInput,
    setShowLineTextInput,
    lineTextStyles,
    setLineTextStyles,
    showLineTextStyleUI,
    setShowLineTextStyleUI,
    connectionsLoaded,
    handleConnectionClick,
    handleLineTextClick,
    handleLineTextSubmit,
    handleLineTextStyleChange,
    handleLineColorChange,
    handleLineStyleChange,
  };
}
