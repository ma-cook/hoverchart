import { useMemo, useEffect, useRef } from 'react';
import { useConnectionStore } from '../stores';
import {
  subscribeToConnections,
  saveConnection,
} from '../services/connectionsService';

/**
 * Custom hook to manage connections using the simplified Zustand store
 * Consolidated to use useConnectionStore for all connection state
 */
export function useConnections({ user, currentSpaceId, loadedCells = [] }) {
  // Create a unique space identifier for multi-space support
  const spaceId = useMemo(() => {
    const publicSpaceId = window.publicAccessSpace;
    const effectiveSpaceId = publicSpaceId || currentSpaceId;
    return effectiveSpaceId || 'default';
  }, [currentSpaceId]);

  // Get connection store state and actions
  const connections = useConnectionStore((state) => state.connections);
  const setConnections = useConnectionStore((state) => state.setConnections);
  const lineTexts = useConnectionStore((state) => state.lineTexts);
  const setLineText = useConnectionStore((state) => state.setLineText);
  const selectedConnection = useConnectionStore(
    (state) => state.selectedConnection
  );
  const selectConnection = useConnectionStore(
    (state) => state.selectConnection
  );
  const deselectConnection = useConnectionStore(
    (state) => state.deselectConnection
  );
  const showLineTextInput = useConnectionStore(
    (state) => state.showLineTextInput
  );
  const setShowLineTextInput = useConnectionStore(
    (state) => state.setShowLineTextInput
  );
  const lineTextStyles = useConnectionStore((state) => state.lineTextStyles);
  const updateLineTextStyle = useConnectionStore(
    (state) => state.updateLineTextStyle
  );
  const showLineTextStyleUI = useConnectionStore(
    (state) => state.showLineTextStyleUI
  );
  const setShowLineTextStyleUI = useConnectionStore(
    (state) => state.setShowLineTextStyleUI
  );
  const connectionsLoaded = useConnectionStore(
    (state) => state.connectionsLoaded
  );
  const setConnectionsLoaded = useConnectionStore(
    (state) => state.setConnectionsLoaded
  ); // Track subscription cleanup and debouncing
  const subscriptionCleanupRef = useRef(null);
  const subscriptionTimeoutRef = useRef(null);

  // Memoize loadedCells to prevent constant changes
  const stableLoadedCells = useMemo(() => {
    if (
      !loadedCells ||
      !Array.isArray(loadedCells) ||
      loadedCells.length === 0
    ) {
      return [];
    }
    return [...loadedCells].sort();
  }, [loadedCells]);
  // Ref to track spatial operations to prevent interference
  const spatialOperationRef = useRef(false);

  // Memoize user ID to prevent object reference changes
  const userId = useMemo(() => user?.uid || null, [user?.uid]);
  // Subscribe to connection changes when dependencies change
  useEffect(() => {
    if (!userId && !window.publicAccessSpace) {
      return;
    } // Skip subscription if spatial operation is in progress
    if (spatialOperationRef.current) {
      return;
    }

    // Clear any existing timeout
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
      subscriptionTimeoutRef.current = null;
    }

    // Debounce subscription setup to prevent rapid churn
    subscriptionTimeoutRef.current = setTimeout(() => {
      // console.log('🔗 Setting up connection subscription for space:', spaceId);

      // Cleanup previous subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }

      // Set up new subscription
      const cleanup = subscribeToConnections(
        userId,
        currentSpaceId,
        (connectionEvent) => {
          // Check if this is during a spatial operation or active transformation
          if (spatialOperationRef.current) {
            return;
          } // Check if any objects are currently being transformed/dragged
          if (
            window._currentTransformingObjects &&
            window._currentTransformingObjects.size > 0
          ) {
            return;
          }

          // console.log('🔗 Received connection event:', connectionEvent);

          // Handle individual connection events (matching object pattern)
          if (connectionEvent && connectionEvent.type) {
            setConnections((prevConnections) => {
              const currentConnections = Array.isArray(prevConnections)
                ? prevConnections
                : [];
              switch (connectionEvent.type) {
                case 'added':
                case 'modified': {
                  // Remove existing connection if it exists, then add the new/updated one
                  const filteredConnections = currentConnections.filter(
                    (conn) => conn.id !== connectionEvent.id
                  );

                  // Preserve local visual updates when merging Firebase data
                  const existingConn = currentConnections.find(
                    (conn) => conn.id === connectionEvent.id
                  );
                  let mergedConnection = connectionEvent.connection;
                  // Normalize style properties for compatibility
                  const normalizedConnection = {
                    ...connectionEvent.connection,
                    // Ensure both styleType and lineStyle exist for compatibility
                    styleType:
                      connectionEvent.connection.styleType ||
                      connectionEvent.connection.lineStyle ||
                      'straight',
                    lineStyle:
                      connectionEvent.connection.lineStyle ||
                      connectionEvent.connection.styleType ||
                      'straight',
                    // Preserve dashDirection and dashOffset for animated lines
                    dashDirection:
                      connectionEvent.connection.dashDirection || null,
                    dashOffset: connectionEvent.connection.dashOffset || 0,
                  }; // If we have local visual updates, preserve the positions but keep other data from Firebase
                  if (
                    existingConn?._visualUpdate &&
                    (!connectionEvent.connection._lastSaved ||
                      existingConn._visualUpdate >
                        connectionEvent.connection._lastSaved)
                  ) {
                    // Preserve local visual updates over Firebase data
                    mergedConnection = {
                      ...normalizedConnection, // Firebase data (style, text, etc.) with normalized properties
                      start: existingConn.start || normalizedConnection.start, // Keep local positions
                      end: existingConn.end || normalizedConnection.end, // Keep local positions
                      _visualUpdate: existingConn._visualUpdate,
                      _localUpdate: existingConn._localUpdate,
                    };
                  } else {
                    // Use normalized connection even if no local updates
                    mergedConnection = normalizedConnection;
                  }

                  return [...filteredConnections, mergedConnection];
                }

                case 'removed': {
                  // Remove the connection
                  return currentConnections.filter(
                    (conn) => conn.id !== connectionEvent.id
                  );
                }
                default:
                  return currentConnections;
              }
            });
          } else {
            // Invalid connection event
          }
          setConnectionsLoaded(true);
        },
        stableLoadedCells
      );

      subscriptionCleanupRef.current = cleanup;
    }, 100); // 100ms debounce

    return () => {
      // Clear timeout if effect is cleaned up before timeout fires
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
        subscriptionTimeoutRef.current = null;
      }
      // Clean up existing subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    spaceId,
    userId,
    currentSpaceId,
    stableLoadedCells,
    // Note: Removed setConnections and setConnectionsLoaded from dependencies
    // as Zustand store actions have stable references and don't need to trigger re-subscriptions
  ]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
        subscriptionTimeoutRef.current = null;
      }
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, []);
  // Monitor for rapid object removal/addition which indicates spatial moves
  useEffect(() => {
    const recentObjectChanges = new Map();

    // Function to track object changes
    const trackObjectChange = (objectId, changeType) => {
      const now = Date.now();
      const key = objectId;

      if (!recentObjectChanges.has(key)) {
        recentObjectChanges.set(key, []);
      }

      const changes = recentObjectChanges.get(key);
      changes.push({ type: changeType, timestamp: now });

      // Keep only recent changes (last 5 seconds)
      const filtered = changes.filter(
        (change) => now - change.timestamp < 5000
      );
      recentObjectChanges.set(key, filtered);

      // Check if we have remove + add within short time = spatial move
      const hasRemove = filtered.some((c) => c.type === 'remove');
      const hasAdd = filtered.some((c) => c.type === 'add');

      if (hasRemove && hasAdd) {
        // Spatial move detected
        spatialOperationRef.current = true;
        setTimeout(() => {
          spatialOperationRef.current = false;
        }, 1000);
      }
    };

    // Store the function globally so App.jsx can call it
    window.trackObjectChange = trackObjectChange;

    return () => {
      delete window.trackObjectChange;
    };
  }, []);

  // Handler functions
  const handleConnectionClick = (e, connectionId) => {
    e.stopPropagation();
    if (selectedConnection === connectionId) {
      deselectConnection();
    } else {
      selectConnection(connectionId);
    }
  };

  const handleLineTextClick = (e, connectionId) => {
    e.stopPropagation();
    setShowLineTextInput(connectionId);
  };
  const handleLineTextSubmit = async (connectionId, text) => {
    try {
      setLineText(connectionId, text);
      setShowLineTextInput(null);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const connectionToSave = connections.find(
          (conn) => conn.id === connectionId
        );
        if (connectionToSave) {
          const updatedConnection = {
            ...connectionToSave,
            text,
            _lastModified: Date.now(),
            _needsSave: true,
          };
          await saveConnection(user.uid, currentSpaceId, updatedConnection);
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleLineTextStyleChange = async (connectionId, style) => {
    try {
      updateLineTextStyle(connectionId, style);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const connectionToSave = connections.find(
          (conn) => conn.id === connectionId
        );
        if (connectionToSave) {
          const updatedConnection = {
            ...connectionToSave,
            textStyle: style,
            _lastModified: Date.now(),
            _needsSave: true,
          };
          await saveConnection(user.uid, currentSpaceId, updatedConnection);
        }
      }
      return true;
    } catch {
      return false;
    }
  };
  const handleLineColorChange = async (connectionId, color) => {
    try {
      // Update connection color in store first
      const updatedConnections = connections.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              color,
              _lastModified: Date.now(),
              _lastStyleUpdate: Date.now(),
              _needsSave: true,
            }
          : conn
      );
      setConnections(updatedConnections);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const connectionToSave = updatedConnections.find(
          (conn) => conn.id === connectionId
        );
        if (connectionToSave) {
          await saveConnection(user.uid, currentSpaceId, connectionToSave);
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleLineStyleChange = async (connectionId, styleType) => {
    try {
      // Parse compound style strings like "dashed-left" or "dotted-right"
      let parsedStyleType = styleType;
      let dashDirection = null;

      if (typeof styleType === 'string' && styleType.includes('-')) {
        const parts = styleType.split('-');
        if (parts.length === 2) {
          parsedStyleType = parts[0]; // e.g., "dashed" or "dotted"
          dashDirection = parts[1]; // e.g., "left" or "right"
        }
      }

      // Update connection style in store first
      const updatedConnections = connections.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              styleType: parsedStyleType,
              lineStyle: parsedStyleType, // Ensure both properties are set for compatibility
              dashDirection: dashDirection,
              _lastModified: Date.now(),
              _lastStyleUpdate: Date.now(),
              _needsSave: true,
            }
          : conn
      );
      setConnections(updatedConnections);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const connectionToSave = updatedConnections.find(
          (conn) => conn.id === connectionId
        );
        if (connectionToSave) {
          await saveConnection(user.uid, currentSpaceId, connectionToSave);
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  // Return the same API as before for backward compatibility
  return {
    connections,
    lineTexts,
    selectedConnection,
    showLineTextInput,
    lineTextStyles,
    showLineTextStyleUI,
    connectionsLoaded,
    setConnections,
    setLineTexts: (texts) => {
      // Handle bulk line text updates
      Object.entries(texts).forEach(([id, text]) => {
        setLineText(id, text);
      });
    },
    setSelectedConnection: selectConnection,
    setShowLineTextInput,
    setLineTextStyles: (styles) => {
      // Handle bulk line style updates
      Object.entries(styles).forEach(([id, style]) => {
        updateLineTextStyle(id, style);
      });
    },
    setShowLineTextStyleUI,
    handleConnectionClick,
    handleLineTextClick,
    handleLineTextSubmit,
    handleLineTextStyleChange,
    handleLineColorChange,
    handleLineStyleChange,
  };
}
