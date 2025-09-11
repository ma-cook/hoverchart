import { useMemo, useEffect, useRef, useCallback } from 'react';
import useConnectionStore from '../stores/connectionStore';
import {
  subscribeToConnections,
  saveConnection,
} from '../services/connectionsService';
import { getIsInitialLoading } from '../utils/loadingState';

/**
 * Custom hook to manage connections using the simplified Zustand store
 * Now includes spatial partitioning support for connection unloading
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

  // Track which connections belong to which cells for spatial unloading
  const connectionsByCellRef = useRef(new Map()); // cellId -> Set of connectionIds

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

  // Create the connection callback with better performance
  const connectionCallback = useCallback(
    (event) => {
      // Handle single event objects from connection service
      if (!event) {
        console.log('⚠️ [useConnections] Empty connection event received');
        return;
      }

      if (event instanceof Error) {
        console.error('❌ [useConnections] Error event received:', event);
        return;
      }

      console.log('📨 [useConnections] Connection event received:', {
        type: event.type,
        id: event.id,
        hasConnection: !!event.connection,
        cellCoords: event.cellCoords,
      });

      // Process single event - CRITICAL: Prevent excessive re-renders during bulk operations
      try {
        // Skip if the connection is currently being deleted - check both store and window
        const connectionStore = useConnectionStore.getState();
        const isBeingDeleted =
          connectionStore.deletingConnections.has(event.id) ||
          window._deletingConnections?.has(event.id);

        if (isBeingDeleted) {
          return;
        }

        // Handle event based on type
        switch (event.type) {
          case 'added': {
            if (!event.connection) {
              return;
            }

            // Double-check deletion blocking before adding
            const connectionStore = useConnectionStore.getState();
            if (connectionStore.deletingConnections.has(event.id)) {
              return;
            }

            const existingConn = getConnection(event.id);
            if (!existingConn) {
              // DEBUG: Check for missing objectId fields in loaded connections
              if (
                !event.connection.start?.objectId ||
                !event.connection.end?.objectId
              ) {
                console.warn(
                  '⚠️ Connection loaded from database is missing objectId fields:',
                  {
                    connectionId: event.id,
                    startObjectId: event.connection.start?.objectId,
                    endObjectId: event.connection.end?.objectId,
                    isMerfolkConnection: event.id.includes('merfolk'),
                    fullConnection: event.connection,
                  }
                );
              }

              // PERFORMANCE FIX: Use requestAnimationFrame to batch connection additions
              // This prevents excessive re-renders during bulk Merfolk diagram processing
              requestAnimationFrame(() => {
                addConnection(event.connection);
              });
            }
            break;
          }
          case 'removed': {
            const existingConn = getConnection(event.id);
            if (existingConn) {
              // PERFORMANCE FIX: Use requestAnimationFrame to batch connection removals
              requestAnimationFrame(() => {
                removeConnection(event.id);
              });
            }
            break;
          }
          default:
        }
      } catch {
        // Error processing connection event
      }
    },
    [addConnection, getConnection, removeConnection]
  );

  // Enhanced connection callback that tracks spatial cell associations
  const enhancedConnectionCallback = useCallback(
    (event) => {
      // Handle fresh connections from Firebase immediately
      if (event && event.type === 'added' && event.connection) {
        // Always add the connection to the store first
        addConnection(event.connection);

        // Track cell association if we have coordinates
        if (event.cellCoords) {
          const cellId = `${event.cellCoords.x},${event.cellCoords.y},${
            event.cellCoords.z || 0
          }`;

          // Track in local map for useConnections-specific logic
          if (!connectionsByCellRef.current.has(cellId)) {
            connectionsByCellRef.current.set(cellId, new Set());
          }
          connectionsByCellRef.current.get(cellId).add(event.id);
        }

        // Clear unloaded status if it was previously unloaded
        if (
          window._unloadedConnections &&
          window._unloadedConnections.has(event.id)
        ) {
          console.log(`🔄 Connection ${event.id} restored from Firebase`);
          window._unloadedConnections.delete(event.id);
        }
      } else if (event && event.type === 'removed') {
        // Remove from connection tracking when deleted
        connectionsByCellRef.current.forEach((cellConnections) => {
          cellConnections.delete(event.id);
        });

        // Handle the remove event normally
        connectionCallback(event);
      } else {
        // Handle other events normally
        connectionCallback(event);
      }
    },
    [connectionCallback, addConnection]
  );

  // Set up and manage connection subscriptions with performance optimizations
  useEffect(() => {
    console.log('🔄 [useConnections] Effect triggered:', {
      hasUser: !!user?.uid,
      hasSpace: !!currentSpaceId,
      cellCount: stableLoadedCells.length,
      isInitialLoading: getIsInitialLoading(),
      hasExistingSubscription: !!subscriptionCleanupRef.current,
    });

    if (!user?.uid || !currentSpaceId) {
      console.log('🔄 [useConnections] Skipping - no user or space');
      return;
    }

    // Check if subscription needs to be updated
    const lastSub = lastSubscriptionRef.current;
    const cellsChanged =
      JSON.stringify(stableLoadedCells.sort()) !==
      JSON.stringify((lastSub.loadedCells || []).sort());
    const userChanged = lastSub.userId !== user.uid;
    const spaceChanged = lastSub.spaceId !== currentSpaceId;
    const initialLoadingJustFinished =
      !getIsInitialLoading() && lastSub.wasInitialLoading;

    console.log('🔄 [useConnections] Change detection:', {
      cellsChanged,
      userChanged,
      spaceChanged,
      initialLoadingJustFinished,
      currentCells: stableLoadedCells,
      lastCells: lastSub.loadedCells,
    });

    // Always create initial subscription for the first set of cells, regardless of loading state
    if (
      !lastSubscriptionRef.current.loadedCells ||
      lastSubscriptionRef.current.loadedCells.length === 0
    ) {
      console.log(
        `🔄 [useConnections] Setting up first-time connection subscription. Cells: ${stableLoadedCells.length}`
      );

      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }

      const cleanup = subscribeToConnections(
        user.uid,
        currentSpaceId,
        enhancedConnectionCallback,
        stableLoadedCells
      );

      subscriptionCleanupRef.current = cleanup;
      lastSubscriptionRef.current = {
        userId: user.uid,
        spaceId: currentSpaceId,
        loadedCells: [...stableLoadedCells],
        wasInitialLoading: getIsInitialLoading(), // Track loading state but don't depend on it
      };
      return;
    }

    // After initial loading, only restart if something actually changed
    if (
      !cellsChanged &&
      !userChanged &&
      !spaceChanged &&
      !initialLoadingJustFinished &&
      subscriptionCleanupRef.current
    ) {
      console.log(
        '🔄 [useConnections] No changes detected, keeping existing subscription'
      );
      return;
    }

    console.log(
      `🔄 [useConnections] Updating connection subscription. Cells: ${stableLoadedCells.length}, Changed: cells=${cellsChanged}, user=${userChanged}, space=${spaceChanged}`
    );

    // Clean up existing subscription before starting new one
    if (
      subscriptionCleanupRef.current &&
      typeof subscriptionCleanupRef.current === 'function'
    ) {
      console.log('🔄 [useConnections] Cleaning up existing subscription');
      subscriptionCleanupRef.current();
      subscriptionCleanupRef.current = null;
    }

    // Start a new subscription with current loaded cells
    console.log(
      '🔄 [useConnections] Creating new subscription with cells:',
      stableLoadedCells
    );
    const cleanup = subscribeToConnections(
      user.uid,
      currentSpaceId,
      enhancedConnectionCallback,
      stableLoadedCells
    );

    // Store cleanup function
    subscriptionCleanupRef.current = cleanup;

    // Update last subscription ref
    lastSubscriptionRef.current = {
      userId: user.uid,
      spaceId: currentSpaceId,
      loadedCells: [...stableLoadedCells],
      wasInitialLoading: false, // Mark this as a post-initial-loading subscription
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      if (
        subscriptionCleanupRef.current &&
        typeof subscriptionCleanupRef.current === 'function'
      ) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, [
    user?.uid,
    currentSpaceId,
    stableLoadedCells,
    enhancedConnectionCallback,
  ]);

  // Handle spatial cell changes for connection loading/unloading
  useEffect(() => {
    const previousCells = previousLoadedCellsRef.current;
    const currentCells = stableLoadedCells;

    // Skip effect if no cells are loaded yet
    if (!currentCells || currentCells.length === 0) {
      return;
    }

    // Initial load: record loaded cells and set up initial subscription
    if (!previousCells || previousCells.length === 0) {
      console.log(
        '🔍 [CONNECTION SPATIAL DEBUG] Initial cell load - recording cells:',
        currentCells
      );

      // Create initial subscription
      const initialCleanup = subscribeToConnections(
        user.uid,
        currentSpaceId,
        enhancedConnectionCallback,
        currentCells
      );

      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
      }
      subscriptionCleanupRef.current = initialCleanup;

      previousLoadedCellsRef.current = currentCells;
      return;
    }

    // Find cells that were unloaded and cells that were reloaded
    const currentCellsSet = new Set(currentCells);
    const previousCellsSet = new Set(previousCells);
    const unloadedCells = previousCells.filter(
      (cellId) => !currentCellsSet.has(cellId)
    );
    const reloadedCells = currentCells.filter(
      (cellId) => !previousCellsSet.has(cellId)
    ); // Track connections that should be removed due to unloaded cells
    if (unloadedCells.length > 0) {
      console.log(
        '🔍 [CONNECTION SPATIAL DEBUG] Cells unloaded:',
        unloadedCells
      );
      const connectionsToRemove = [];

      unloadedCells.forEach((cellId) => {
        const cellConnections = connectionsByCellRef.current.get(cellId);
        if (cellConnections) {
          // Track unloaded connections
          if (!window._unloadedConnections) {
            window._unloadedConnections = new Set();
          }

          cellConnections.forEach((connectionId) => {
            window._unloadedConnections.add(connectionId);
            console.log(
              `🚫 Marking connection as unloaded: ${connectionId} from cell: ${cellId}`
            );
          });

          connectionsToRemove.push(...Array.from(cellConnections));
          connectionsByCellRef.current.delete(cellId);
        }
      });

      // Remove connections that belong to unloaded cells
      if (connectionsToRemove.length > 0) {
        console.log(
          '🔍 [CONNECTION SPATIAL DEBUG] Removing connections from unloaded cells:',
          connectionsToRemove
        );
        connectionsToRemove.forEach((connectionId) => {
          removeConnection(connectionId);
        });
      }
    }

    // Handle reloaded cells
    if (reloadedCells.length > 0) {
      console.log(
        '🔍 [CONNECTION SPATIAL DEBUG] Cells reloaded:',
        reloadedCells
      );

      // Create a fresh subscription for all reloaded cells
      const newSubscriptionCleanup = subscribeToConnections(
        user.uid,
        currentSpaceId,
        enhancedConnectionCallback,
        reloadedCells
      );

      // Update cleanup to handle both existing and new subscriptions
      const oldCleanupFn = subscriptionCleanupRef.current;
      subscriptionCleanupRef.current = () => {
        if (oldCleanupFn) oldCleanupFn();
        if (newSubscriptionCleanup) newSubscriptionCleanup();
      };

      // Clear unloaded status for connections in reloaded cells
      reloadedCells.forEach((cellId) => {
        if (
          window._unloadedConnections &&
          window._unloadedConnections.size > 0
        ) {
          console.log(
            `🔄 Checking for connections to restore in cell: ${cellId}`
          );
          Array.from(window._unloadedConnections).forEach((connectionId) => {
            window._unloadedConnections.delete(connectionId);
            console.log(
              `🔄 Cleared unloaded status for connection: ${connectionId} in cell: ${cellId}`
            );
          });
        }
      });

      // Trigger subscription refresh for reloaded cells
      const cleanup = subscribeToConnections(
        user.uid,
        currentSpaceId,
        enhancedConnectionCallback,
        reloadedCells
      );

      const existingCleanup = subscriptionCleanupRef.current;
      subscriptionCleanupRef.current = () => {
        if (existingCleanup) existingCleanup();
        if (cleanup) cleanup();
      };
    }

    // Update previous cells reference
    previousLoadedCellsRef.current = currentCells;
  }, [
    stableLoadedCells,
    removeConnection,
    currentSpaceId,
    user?.uid,
    enhancedConnectionCallback,
    addConnection,
    getConnection,
  ]); // Use the enhanced callback in the subscription setup

  // Handler functions for connection interactions
  const handleLineStyleChange = useCallback(
    (connectionId, styleType) => {
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
    e.stopPropagation();
    const { selectConnection } = useConnectionStore.getState();
    selectConnection(connectionId);
  }, []);

  const handleLineTextClick = useCallback((e, connectionId) => {
    e.stopPropagation();
    const { setShowLineTextStyleUI } = useConnectionStore.getState();
    setShowLineTextStyleUI(connectionId);
  }, []);

  const handleLineTextSubmit = useCallback(
    (connectionId, text) => {
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
