import { useMemo, useEffect, useRef } from 'react';
import { useConnectionStore } from '../stores';
import useObjectsStore from '../stores/objectsStore';
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
  );
  const addConnection = useConnectionStore((state) => state.addConnection);
  const updateConnection = useConnectionStore(
    (state) => state.updateConnection
  );
  const removeConnection = useConnectionStore(
    (state) => state.removeConnection
  );
  const getConnection = useConnectionStore((state) => state.getConnection); // Track subscription cleanup and debouncing
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
  const userId = useMemo(() => user?.uid || null, [user?.uid]); // Subscribe to connection changes when dependencies change
  useEffect(() => {
    console.log('🔗 useConnections effect triggered with:', {
      userId,
      currentSpaceId,
      stableLoadedCells,
      publicAccess: window.publicAccessSpace,
      spatialOperation: spatialOperationRef.current,
    });

    if (!userId && !window.publicAccessSpace) {
      console.log('🔗 No user or public access, skipping subscription');
      return;
    }

    // Skip subscription if spatial operation is in progress
    if (spatialOperationRef.current) {
      console.log('🔗 Spatial operation in progress, skipping subscription');
      return;
    }

    // Clear any existing timeout
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
      subscriptionTimeoutRef.current = null;
    }

    // Debounce subscription setup to prevent rapid churn
    subscriptionTimeoutRef.current = setTimeout(() => {
      console.log(
        '🔗 Setting up connection subscription for space:',
        spaceId,
        'user:',
        userId,
        'loadedCells:',
        stableLoadedCells
      );

      // Cleanup previous subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      } // Set up new subscription
      const cleanup = subscribeToConnections(
        userId,
        currentSpaceId,
        (connectionEvent) => {
          console.log(
            '🔗 Connection callback invoked with event:',
            connectionEvent
          );

          // Check if this is during a spatial operation or active transformation
          if (spatialOperationRef.current) {
            return;
          }

          // Check if any objects are currently being transformed/dragged
          if (
            window._currentTransformingObjects &&
            window._currentTransformingObjects.size > 0
          ) {
            return;
          }
          console.log('🔗 Received connection event:', connectionEvent);

          // Handle individual connection events (matching object pattern)
          if (connectionEvent && connectionEvent.type) {
            switch (connectionEvent.type) {
              case 'added':
              case 'modified': {
                // Skip if this connection is currently being deleted
                if (window._deletingConnections?.has(connectionEvent.id)) {
                  console.log(
                    `🔗 Skipping connection ${connectionEvent.id} - currently being deleted`
                  );
                  return;
                } // Skip if this connection belongs to a recently deleted object
                const connection = connectionEvent.connection;
                if (connection?.start?.objectId || connection?.end?.objectId) {
                  // Check for recently deleted objects using the tombstone system
                  try {
                    const isRecentlyDeleted =
                      useObjectsStore.getState().isRecentlyDeleted;

                    if (
                      (connection.start?.objectId &&
                        isRecentlyDeleted(connection.start.objectId)) ||
                      (connection.end?.objectId &&
                        isRecentlyDeleted(connection.end.objectId))
                    ) {
                      console.log(
                        `🔗 Skipping connection ${connectionEvent.id} - connected to deleted object (tombstoned)`
                      );
                      // For added/modified events, we should also remove the connection from store if it exists
                      // This ensures connections to deleted objects are cleaned up
                      const existingConn = getConnection(connectionEvent.id);
                      if (existingConn) {
                        console.log(
                          `🧹 Removing connection ${connectionEvent.id} from store because it's connected to tombstoned object`
                        );
                        removeConnection(connectionEvent.id);
                      }
                      return;
                    }
                  } catch (error) {
                    // If we can't check, continue normally
                    console.warn(
                      'Could not check for recently deleted objects:',
                      error
                    );
                  }
                }

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
                };

                // Get existing connection to check for local updates
                const existingConn = getConnection(connectionEvent.id);
                let mergedConnection = normalizedConnection;

                // If we have local visual updates or style updates, preserve them but keep other data from Firebase
                if (
                  (existingConn?._visualUpdate &&
                    (!connectionEvent.connection._lastSaved ||
                      existingConn._visualUpdate >
                        connectionEvent.connection._lastSaved)) ||
                  (existingConn?._lastStyleUpdate &&
                    (!connectionEvent.connection._lastStyleUpdate ||
                      existingConn._lastStyleUpdate >
                        connectionEvent.connection._lastStyleUpdate))
                ) {
                  console.log('🔄 Preserving local changes:', {
                    connectionId: connectionEvent.id,
                    existingConn: {
                      color: existingConn.color,
                      styleType: existingConn.styleType,
                      lineStyle: existingConn.lineStyle,
                      dashDirection: existingConn.dashDirection,
                      _lastStyleUpdate: existingConn._lastStyleUpdate,
                    },
                    dbConnection: {
                      color: connectionEvent.connection.color,
                      styleType: connectionEvent.connection.styleType,
                      lineStyle: connectionEvent.connection.lineStyle,
                      dashDirection: connectionEvent.connection.dashDirection,
                      _lastStyleUpdate:
                        connectionEvent.connection._lastStyleUpdate,
                    },
                  });

                  // Preserve local visual updates and style updates over Firebase data
                  mergedConnection = {
                    ...normalizedConnection, // Firebase data with normalized properties
                    start: existingConn.start || normalizedConnection.start, // Keep local positions
                    end: existingConn.end || normalizedConnection.end, // Keep local positions
                    // Preserve local style updates if they're newer
                    ...(existingConn._lastStyleUpdate &&
                    (!connectionEvent.connection._lastStyleUpdate ||
                      existingConn._lastStyleUpdate >
                        connectionEvent.connection._lastStyleUpdate)
                      ? {
                          styleType: existingConn.styleType,
                          lineStyle: existingConn.lineStyle,
                          dashDirection: existingConn.dashDirection,
                          color: existingConn.color, // Preserve local color changes
                          _lastStyleUpdate: existingConn._lastStyleUpdate,
                        }
                      : {}),
                    _visualUpdate: existingConn._visualUpdate,
                    _localUpdate: existingConn._localUpdate,
                  };
                }

                // Update the Zustand connection store directly
                try {
                  if (existingConn) {
                    console.log(
                      '🔄 Updating existing connection in store:',
                      connectionEvent.id
                    );
                    updateConnection(connectionEvent.id, mergedConnection);

                    // No separate text style sync needed - textStyle is part of connection data
                    // Real-time updates will sync textStyle automatically as part of the connection
                  } else {
                    // Only add if it doesn't already exist in the store to prevent duplicates
                    const allConnectionsInStore = connections;
                    const alreadyExists = allConnectionsInStore.some(
                      (conn) => conn.id === connectionEvent.id
                    );
                    if (!alreadyExists) {
                      // Ensure the connection has the correct ID before adding to store
                      const connectionWithId = {
                        ...mergedConnection,
                        id: connectionEvent.id, // Ensure the ID is set correctly
                      };
                      console.log(
                        '➕ Adding new connection from real-time to store:',
                        connectionEvent.id,
                        connectionWithId
                      );
                      addConnection(connectionWithId);

                      // No separate text style sync needed - textStyle is part of connection data
                    } else {
                      console.warn(
                        '⚠️ Connection already exists in store, skipping real-time add:',
                        connectionEvent.id
                      );
                    }
                  }
                } catch (error) {
                  console.warn('Failed to sync connection to store:', error);
                }
                break;
              }
              case 'removed': {
                console.log(
                  '🗑️ Removing connection from store:',
                  connectionEvent.id
                );
                console.log(
                  '🗑️ Current connections in store before removal:',
                  connections.map((c) => c.id)
                );
                // Remove the connection from the store
                removeConnection(connectionEvent.id);
                console.log(
                  '🗑️ removeConnection called for:',
                  connectionEvent.id
                );
                break;
              }
              default:
                break;
            }
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

    // Get the connection text - prioritize lineTexts store over connection.text
    const connectionText =
      (lineTexts && lineTexts[connectionId]) ||
      connections.find((conn) => conn.id === connectionId)?.text ||
      '';

    // If there's existing text, show the text style UI; otherwise show text input
    if (connectionText && connectionText.trim() !== '') {
      // Close the text input if it's open
      setShowLineTextInput(null);
      // Show the text style UI
      setShowLineTextStyleUI(connectionId);
    } else {
      // Close the text style UI if it's open
      setShowLineTextStyleUI(null);
      // Show text input to add text
      setShowLineTextInput(connectionId);
    }
  };
  const handleLineTextSubmit = async (connectionId, text) => {
    try {
      setLineText(connectionId, text);
      setShowLineTextInput(null);

      // Update the connection object with the new text and trigger visual update
      const connectionToUpdate = {
        text,
        _lastModified: Date.now(),
        _needsSave: true,
        _textRefresh: Date.now(), // Add this to force re-render
        _visualUpdate: Date.now(), // Add this to trigger visual update
      };
      updateConnection(connectionId, connectionToUpdate); // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const connectionToSave = getConnection(connectionId);
        if (connectionToSave) {
          // Create the updated connection object for saving
          const updatedConnectionForSave = {
            ...connectionToSave,
            ...connectionToUpdate,
          };
          await saveConnection(
            user.uid,
            currentSpaceId,
            updatedConnectionForSave
          );
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleLineTextStyleChange = async (connectionId, style) => {
    try {
      console.log('🎨 handleLineTextStyleChange called:', {
        connectionId,
        style,
        timestamp: Date.now(),
      });

      // Get the current connection
      const currentConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (!currentConnection) {
        console.error('Connection not found:', connectionId);
        return false;
      }

      // Simple merge like cube header text - merge new style with existing textStyle
      const updatedTextStyle = {
        ...(currentConnection.textStyle || {}),
        ...style,
      };

      console.log('🎨 Merged style for connection:', {
        connectionId,
        existingStyle: currentConnection.textStyle,
        newStyle: style,
        mergedStyle: updatedTextStyle,
      });

      // Update the connection in store with the merged style (like cube does)
      const connectionUpdate = {
        textStyle: updatedTextStyle,
        _lastStyleUpdate: Date.now(),
        _lastModified: Date.now(),
        _needsSave: true,
      };

      updateConnection(connectionId, connectionUpdate);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const updatedConnection = getConnection(connectionId);
        if (updatedConnection) {
          await saveConnection(user.uid, currentSpaceId, updatedConnection);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Error in handleLineTextStyleChange:', error);
      return false;
    }
  };
  const handleLineColorChange = async (connectionId, color) => {
    try {
      // Update connection color in store directly
      const connectionToUpdate = {
        color,
        _lastModified: Date.now(),
        _lastStyleUpdate: Date.now(),
        _needsSave: true,
      };

      updateConnection(connectionId, connectionToUpdate);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const updatedConnection = getConnection(connectionId);
        if (updatedConnection) {
          await saveConnection(user.uid, currentSpaceId, updatedConnection);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Error in handleLineColorChange:', error);
      return false;
    }
  };
  const handleLineStyleChange = async (connectionId, styleType) => {
    try {
      console.log('🎨 handleLineStyleChange called:', {
        connectionId,
        styleType,
        timestamp: Date.now(),
      });

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

      // Update connection style in store directly
      const connectionToUpdate = {
        styleType: parsedStyleType,
        lineStyle: parsedStyleType, // Ensure both properties are set for compatibility
        dashDirection: dashDirection,
        _lastModified: Date.now(),
        _lastStyleUpdate: Date.now(),
        _needsSave: true,
      };

      updateConnection(connectionId, connectionToUpdate);

      // Save to backend if we have a user and space
      if (user && currentSpaceId) {
        const updatedConnection = getConnection(connectionId);
        if (updatedConnection) {
          console.log('💾 Saving style change to backend:', {
            connectionId,
            styleType: parsedStyleType,
            dashDirection,
            updatedConnection: updatedConnection,
          });
          await saveConnection(user.uid, currentSpaceId, updatedConnection);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Error in handleLineStyleChange:', error);
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
