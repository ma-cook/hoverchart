import { useMemo, useEffect, useRef, useCallback } from 'react';
import useConnectionStore from '../stores/connectionStore';
import {
  subscribeToConnections,
  saveConnection,
} from '../services/connectionsService';

/**
 * Custom hook to manage connections using the simplified Zustand store
 */
export function useConnections({ user, currentSpaceId, loadedCells = [] }) {
  // Get connection store state and actions
  const connections = useConnectionStore((state) => state.connections);
  const addConnection = useConnectionStore((state) => state.addConnection);
  const updateConnection = useConnectionStore(
    (state) => state.updateConnection
  );
  const removeConnection = useConnectionStore(
    (state) => state.removeConnection
  );
  const getConnection = useConnectionStore((state) => state.getConnection);

  // Track subscription cleanup and debouncing
  const subscriptionCleanupRef = useRef(null);
  const lastSubscriptionRef = useRef({
    userId: null,
    spaceId: null,
    loadedCells: [],
  });
  const spatialOperationRef = useRef(false);
  const previousLoadedCellsRef = useRef(null);

  // Create a unique space identifier for multi-space support
  const spaceId = useMemo(() => {
    const publicSpaceId = window.publicAccessSpace;
    return publicSpaceId || currentSpaceId || 'default';
  }, [currentSpaceId]);

  // Memoize user ID to prevent object reference changes
  const userId = useMemo(() => user?.uid || null, [user?.uid]);

  // Memoize loadedCells to prevent constant changes
  const stableLoadedCells = useMemo(() => {
    if (!loadedCells || !Array.isArray(loadedCells)) {
      return [];
    }

    // Don't set up subscriptions if we have no cells
    if (loadedCells.length === 0) {
      return [];
    }

    const cellKey = loadedCells.join('|');
    const prevCells = previousLoadedCellsRef.current;
    const prevKey = prevCells ? prevCells.join('|') : '';

    if (cellKey === prevKey) {
      return prevCells;
    }

    previousLoadedCellsRef.current = loadedCells;
    return loadedCells;
  }, [loadedCells]);

  // Create the connection callback
  const connectionCallback = useCallback(
    (event) => {
      // Handle single event objects from connection service
      if (!event) {
        console.warn('No event received in connection callback');
        return;
      }

      if (event instanceof Error) {
        console.error('Connection subscription error:', event);
        return;
      }

      console.log('🔗 Connection callback invoked with event:', event);

      // Process single event
      try {
        // Skip if the connection is currently being deleted - check both store and window
        const connectionStore = useConnectionStore.getState();
        const isBeingDeleted =
          connectionStore.deletingConnections.has(event.id) ||
          window._deletingConnections?.has(event.id);

        if (isBeingDeleted) {
          console.log(
            `🔗 Skipping connection ${
              event.id
            } - currently being deleted (store: ${connectionStore.deletingConnections.has(
              event.id
            )}, window: ${window._deletingConnections?.has(event.id)})`
          );
          return;
        }

        // Handle event based on type
        switch (event.type) {
          case 'added': {
            if (!event.connection) {
              console.warn('Connection data missing from added event:', event);
              return;
            }

            // Double-check deletion blocking before adding
            const connectionStore = useConnectionStore.getState();
            if (connectionStore.deletingConnections.has(event.id)) {
              console.log(
                `🚫 [useConnections] Final block: Connection ${event.id} is in deletion blacklist`
              );
              return;
            }

            console.log('Adding connection to store:', event.connection);
            const existingConn = getConnection(event.id);
            if (!existingConn) {
              addConnection(event.connection);
            } else {
              console.log(
                `Connection ${event.id} already exists in store, skipping add`
              );
            }
            break;
          }
          case 'removed': {
            console.log('Removing connection from store:', event.id);
            const existingConn = getConnection(event.id);
            if (existingConn) {
              removeConnection(event.id);
            }
            break;
          }
          default:
            console.warn('Unknown connection event type:', event.type);
        }
      } catch (error) {
        console.error('Error processing connection event:', error, event);
      }
    },
    [addConnection, getConnection, removeConnection]
  );

  // Set up and manage connection subscriptions
  useEffect(() => {
    if (!user?.uid || !currentSpaceId || !loadedCells?.length) {
      return;
    }

    console.log('🔗 Setting up connection subscription:', {
      userId: user.uid,
      spaceId: currentSpaceId,
      loadedCells: loadedCells,
    });

    // Start a new subscription
    const cleanup = subscribeToConnections(
      user.uid,
      currentSpaceId,
      connectionCallback,
      loadedCells
    );

    // Store cleanup function
    subscriptionCleanupRef.current = cleanup;

    // Update last subscription ref
    lastSubscriptionRef.current = {
      userId: user.uid,
      spaceId: currentSpaceId,
      loadedCells: [...loadedCells],
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      if (typeof cleanup === 'function') {
        console.log('🧹 Cleaning up connection subscription');
        cleanup();
      }
      subscriptionCleanupRef.current = null;
    };
  }, [user?.uid, currentSpaceId, connectionCallback, loadedCells]);

  // Handler functions for connection interactions
  const handleLineStyleChange = useCallback(
    (connectionId, styleType) => {
      console.log('🔗 handleLineStyleChange called:', {
        connectionId,
        styleType,
      });

      // Parse the styleType to separate base style and direction
      let baseStyle = styleType;
      let direction = null;

      if (styleType.includes('-')) {
        const parts = styleType.split('-');
        baseStyle = parts[0];
        direction = parts[1];
      }

      // Update connection in store
      updateConnection(connectionId, {
        styleType: baseStyle,
        dashDirection: direction,
      });

      // Save to database
      const connection = getConnection(connectionId);
      if (connection && userId && spaceId) {
        saveConnection(userId, spaceId, {
          ...connection,
          styleType: baseStyle,
          dashDirection: direction,
        });
      }
    },
    [updateConnection, getConnection, userId, spaceId]
  );

  const handleLineColorChange = useCallback(
    (connectionId, color) => {
      console.log('🔗 handleLineColorChange called:', { connectionId, color });

      // Update connection in store
      updateConnection(connectionId, { color });

      // Save to database
      const connection = getConnection(connectionId);
      if (connection && userId && spaceId) {
        saveConnection(userId, spaceId, {
          ...connection,
          color,
        });
      }
    },
    [updateConnection, getConnection, userId, spaceId]
  );

  const handleConnectionClick = useCallback((e, connectionId) => {
    console.log('🔗 handleConnectionClick called:', { connectionId });
    e.stopPropagation();
    const { selectConnection } = useConnectionStore.getState();
    selectConnection(connectionId);
  }, []);

  const handleLineTextClick = useCallback((e, connectionId) => {
    console.log('🔗 handleLineTextClick called:', { connectionId });
    e.stopPropagation();
    const { setShowLineTextStyleUI } = useConnectionStore.getState();
    setShowLineTextStyleUI(connectionId);
  }, []);

  const handleLineTextSubmit = useCallback(
    (connectionId, text) => {
      console.log('🔗 handleLineTextSubmit called:', { connectionId, text });

      const { setLineText, setShowLineTextInput } =
        useConnectionStore.getState();
      setLineText(connectionId, text);
      setShowLineTextInput(null);

      // Update connection in store
      updateConnection(connectionId, { text });

      // Save to database
      const connection = getConnection(connectionId);
      if (connection && userId && spaceId) {
        saveConnection(userId, spaceId, {
          ...connection,
          text,
        });
      }

      return true;
    },
    [updateConnection, getConnection, userId, spaceId]
  );

  const handleLineTextStyleChange = useCallback(
    (connectionId, style) => {
      console.log('🔗 handleLineTextStyleChange called:', {
        connectionId,
        style,
      });

      // Get current connection to merge with existing textStyle
      const connection = getConnection(connectionId);
      const mergedTextStyle = {
        ...(connection?.textStyle || {}),
        ...style,
      };

      // Update connection in store
      updateConnection(connectionId, { textStyle: mergedTextStyle });

      // Save to database
      if (connection && userId && spaceId) {
        saveConnection(userId, spaceId, {
          ...connection,
          textStyle: mergedTextStyle,
        });
      }
    },
    [updateConnection, getConnection, userId, spaceId]
  );

  // Return functions and state needed by components
  return {
    connections,
    spatialOperationRef,
    handleLineStyleChange,
    handleLineColorChange,
    handleConnectionClick,
    handleLineTextClick,
    handleLineTextSubmit,
    handleLineTextStyleChange,
  };
}
