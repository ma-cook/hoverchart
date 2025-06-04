import { useState, useEffect, useRef, useMemo } from 'react';
import isEqual from 'lodash/isEqual';
import { subscribeToConnections } from '../services/connectionsService';

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
  };
}
