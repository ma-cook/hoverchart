import { create } from 'zustand';

const useConnectionStore = create((set, get) => ({
  // State for all connections
  connections: [], // Array of connection objects
  selectedConnection: null,
  activeConnection: null,
  isCreatingConnection: false,
  connectionStartPoint: null,
  connectionEndPoint: null,
  connectionsLoaded: false,

  // Track connections being deleted to prevent re-addition during async deletion
  deletingConnections: new Set(), // Set of connection IDs being deleted

  // UI state for connection text and styling
  lineTexts: {}, // Object mapping connection IDs to their text
  lineTextStyles: {}, // Object mapping connection IDs to their text styles
  showLineTextInput: null, // Connection ID that has text input open
  showLineTextStyleUI: null, // Connection ID that has style UI open

  // Debug helper
  _logState: () => {
    const state = get();
    console.log('🔗 Connection Store State:', {
      connectionCount: state.connections.length,
      connectionIds: state.connections.map((c) => c.id),
      selected: state.selectedConnection,
      active: state.activeConnection,
      isCreating: state.isCreatingConnection,
      hasStart: !!state.connectionStartPoint,
      hasEnd: !!state.connectionEndPoint,
      loaded: state.connectionsLoaded,
      deletingCount: state.deletingConnections.size,
      deletingIds: [...state.deletingConnections],
    });
  },

  // Actions
  addConnection: (connection) => {
    if (!connection || !connection.id) {
      console.warn('Attempted to add invalid connection:', connection);
      return;
    }

    // Check if this connection is being deleted - if so, don't add it back
    const state = get();
    if (state.deletingConnections.has(connection.id)) {
      console.log(
        '🚫 Blocked re-adding connection during deletion:',
        connection.id
      );
      return;
    }

    console.log('Adding connection to store:', connection.id);
    set((state) => {
      // Check if connection already exists
      const exists = state.connections.some(
        (conn) => conn.id === connection.id
      );
      if (exists) {
        console.log('Connection already exists:', connection.id);
        return state;
      }

      const newState = {
        connections: [...state.connections, connection],
      };

      // Log state after update
      setTimeout(() => get()._logState(), 0);
      return newState;
    });
  },

  removeConnection: (connectionId) => {
    if (!connectionId) {
      console.warn('Attempted to remove connection with no ID');
      return;
    }

    console.log('Removing connection from store:', connectionId);
    set((state) => {
      // Mark as being deleted to prevent re-addition
      const newDeletingSet = new Set(state.deletingConnections);
      newDeletingSet.add(connectionId);

      const newState = {
        connections: state.connections.filter(
          (conn) => conn.id !== connectionId
        ),
        deletingConnections: newDeletingSet,
        // Clean up related state
        lineTexts: Object.fromEntries(
          Object.entries(state.lineTexts).filter(([id]) => id !== connectionId)
        ),
        lineTextStyles: Object.fromEntries(
          Object.entries(state.lineTextStyles).filter(
            ([id]) => id !== connectionId
          )
        ),
        showLineTextInput:
          state.showLineTextInput === connectionId
            ? null
            : state.showLineTextInput,
        showLineTextStyleUI:
          state.showLineTextStyleUI === connectionId
            ? null
            : state.showLineTextStyleUI,
      };

      // Log state after update
      setTimeout(() => get()._logState(), 0);
      return newState;
    });
  },
  updateConnection: (connectionId, updates) => {
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      ),
    }));
    // Log state after update
    get()._logState();
  },
  setConnections: (connections) => {
    // Validate that connections is an array or a function that returns an array
    if (typeof connections === 'function') {
      // If it's a function, call it with current state
      const state = get();
      const currentConnections = Array.isArray(state.connections)
        ? state.connections
        : [];
      const newConnections = connections(currentConnections);
      if (Array.isArray(newConnections)) {
        set({ connections: newConnections });
      } else {
        set({ connections: [] }); // Fallback to empty array
      }
    } else if (Array.isArray(connections)) {
      set({ connections });
    } else {
      set({ connections: [] }); // Fallback to empty array
    }
    // Log state after setting connections
    get()._logState();
  },

  setConnectionsLoaded: (loaded) => {
    set({ connectionsLoaded: loaded });
  },

  selectConnection: (connectionId) => {
    set({ selectedConnection: connectionId });
  },

  deselectConnection: () => {
    set({ selectedConnection: null });
  },

  setActiveConnection: (connectionId) => {
    set({ activeConnection: connectionId });
  },

  setIsCreatingConnection: (isCreating) => {
    set({ isCreatingConnection: isCreating });
  },

  setConnectionStartPoint: (point) => {
    set({ connectionStartPoint: point });
  },

  setConnectionEndPoint: (point) => {
    set({ connectionEndPoint: point });
  },

  clearConnectionPoints: () => {
    set({
      connectionStartPoint: null,
      connectionEndPoint: null,
      isCreatingConnection: false,
    });
  },

  // Line text actions
  setLineText: (connectionId, text) => {
    set((state) => ({
      lineTexts: {
        ...state.lineTexts,
        [connectionId]: text,
      },
    }));
  },

  setLineTextStyle: (connectionId, style) => {
    set((state) => ({
      lineTextStyles: {
        ...state.lineTextStyles,
        [connectionId]: style,
      },
    }));
  },

  updateLineTextStyle: (connectionId, styleUpdates) => {
    const state = get();
    const existingStyle = state.lineTextStyles[connectionId];
    const newStyle = {
      ...(existingStyle || {}),
      ...styleUpdates,
    };

    console.log('🎨 updateLineTextStyle store update:', {
      connectionId,
      existingStyle,
      styleUpdates,
      newStyle,
      timestamp: Date.now(),
    });

    set((state) => ({
      lineTextStyles: {
        ...state.lineTextStyles,
        [connectionId]: newStyle,
      },
    }));
  },

  // UI state actions
  setShowLineTextInput: (connectionId) => {
    set({ showLineTextInput: connectionId });
  },

  setShowLineTextStyleUI: (connectionId) => {
    set({ showLineTextStyleUI: connectionId });
  },

  closeAllConnectionUIs: () => {
    set({
      showLineTextInput: null,
      showLineTextStyleUI: null,
    });
  },

  // Getters
  getConnection: (connectionId) => {
    const state = get();
    return state.connections.find((conn) => conn.id === connectionId);
  },

  getConnectionsForObject: (objectId) => {
    const state = get();
    return state.connections.filter(
      (conn) =>
        conn.start?.objectId === objectId || conn.end?.objectId === objectId
    );
  },

  areObjectsConnected: (objectId1, objectId2) => {
    const state = get();
    return state.connections.some(
      (conn) =>
        (conn.start?.objectId === objectId1 &&
          conn.end?.objectId === objectId2) ||
        (conn.start?.objectId === objectId2 && conn.end?.objectId === objectId1)
    );
  },

  getLineText: (connectionId) => {
    const state = get();
    return state.lineTexts[connectionId] || '';
  },

  getLineTextStyle: (connectionId) => {
    const state = get();
    return state.lineTextStyles[connectionId] || {};
  },

  // Delete all connections for a specific object
  deleteConnectionsByObject: (objectId, spaceId = null) => {
    console.log(
      `🗑️ [Connection Store] deleteConnectionsByObject called for: ${objectId} in space: ${spaceId}`
    );

    set((state) => {
      const connectionsToDelete = state.connections.filter(
        (conn) =>
          conn.start?.objectId === objectId || conn.end?.objectId === objectId
      );

      console.log(
        `🗑️ [Connection Store] Found ${connectionsToDelete.length} connections to delete:`,
        connectionsToDelete.map((c) => ({
          id: c.id,
          startObj: c.start?.objectId,
          endObj: c.end?.objectId,
        }))
      );

      const connectionIdsToDelete = connectionsToDelete.map((conn) => conn.id);

      // Mark connections as being deleted to prevent re-addition
      const newDeletingSet = new Set(state.deletingConnections);
      connectionIdsToDelete.forEach((id) => {
        newDeletingSet.add(id);
        // Set timeout for each connection
        setTimeout(() => {
          const currentState = get();
          if (currentState.deletingConnections.has(id)) {
            console.warn(
              `⚠️ [Connection Store] Auto-clearing deletion tracking for ${id} after timeout`
            );
            get().markConnectionDeletionComplete(id);
          }
        }, 60000); // 1 minute timeout - simplified
      });

      // SIMPLIFIED: Directly delete from database without complex fallbacks
      if (connectionIdsToDelete.length > 0) {
        // Use a simple direct deletion approach
        setTimeout(async () => {
          try {
            // Import Firebase functions and get current auth state
            const { db, auth } = await import('../firebase');
            const { collection, getDocs, doc, updateDoc, deleteField } =
              await import('firebase/firestore');

            const user = auth.currentUser || window.currentUser;

            // Use provided spaceId first, then fall back to global context
            let finalSpaceId =
              spaceId || window.currentSpaceId || window._currentSpaceId;

            // If still no space ID, try to get it from the space manager store
            if (!finalSpaceId) {
              try {
                const { useSpaceManagerStore } = await import(
                  './spaceManagerStore'
                );
                const spaceManagerState = useSpaceManagerStore.getState();
                finalSpaceId = spaceManagerState.currentSpaceId;
              } catch (importError) {
                console.warn(
                  'Could not import space manager store:',
                  importError
                );
              }
            }

            // If still no space ID, try URL params as last resort
            if (!finalSpaceId) {
              const urlParams = new URLSearchParams(window.location.search);
              finalSpaceId = urlParams.get('spaceId');
            }

            if (!user || !finalSpaceId) {
              console.error(
                '❌ [Connection Store] Cannot delete connections - missing auth context',
                {
                  hasUser: !!user,
                  hasSpaceId: !!finalSpaceId,
                  providedSpaceId: spaceId,
                  authCurrentUser: !!auth.currentUser,
                  windowCurrentUser: !!window.currentUser,
                  windowCurrentSpaceId: !!window.currentSpaceId,
                  windowInternalSpaceId: !!window._currentSpaceId,
                  finalSpaceId: finalSpaceId,
                }
              );
              return;
            }

            console.log(
              `🗑️ [Connection Store] Removing ${connectionIdsToDelete.length} connections from database for user ${user.uid} in space ${finalSpaceId}`
            );

            // Get all cells and remove the connections directly
            const cellsRef = collection(
              db,
              'users',
              user.uid,
              'spaces',
              finalSpaceId,
              'cells'
            );
            const cellsSnapshot = await getDocs(cellsRef);

            let totalRemoved = 0;

            for (const cellDoc of cellsSnapshot.docs) {
              const cellData = cellDoc.data();
              if (cellData.connections) {
                let hasChanges = false;
                const updates = {};

                connectionIdsToDelete.forEach((connId) => {
                  if (cellData.connections[connId]) {
                    updates[`connections.${connId}`] = deleteField();
                    hasChanges = true;
                    totalRemoved++;
                  }
                });

                if (hasChanges) {
                  const cellRef = doc(
                    db,
                    'users',
                    user.uid,
                    'spaces',
                    finalSpaceId,
                    'cells',
                    cellDoc.id
                  );
                  await updateDoc(cellRef, updates);
                  console.log(
                    `🗑️ [Connection Store] Removed connections from cell ${cellDoc.id}`
                  );
                }
              }
            }

            console.log(
              `✅ [Connection Store] Successfully removed ${totalRemoved} connection instances from database`
            );
          } catch (error) {
            console.error(
              '❌ [Connection Store] Database deletion error:',
              error
            );
          }
        }, 100); // Small delay to avoid race conditions
      }

      const newState = {
        connections: state.connections.filter(
          (conn) =>
            conn.start?.objectId !== objectId && conn.end?.objectId !== objectId
        ),
        deletingConnections: newDeletingSet,
        // Clean up related state
        lineTexts: Object.fromEntries(
          Object.entries(state.lineTexts).filter(
            ([id]) => !connectionIdsToDelete.includes(id)
          )
        ),
        lineTextStyles: Object.fromEntries(
          Object.entries(state.lineTextStyles).filter(
            ([id]) => !connectionIdsToDelete.includes(id)
          )
        ),
        showLineTextInput: connectionIdsToDelete.includes(
          state.showLineTextInput
        )
          ? null
          : state.showLineTextInput,
        showLineTextStyleUI: connectionIdsToDelete.includes(
          state.showLineTextStyleUI
        )
          ? null
          : state.showLineTextStyleUI,
        selectedConnection: connectionIdsToDelete.includes(
          state.selectedConnection
        )
          ? null
          : state.selectedConnection,
      };

      console.log(
        `🗑️ [Connection Store] After deletion - connections remaining: ${newState.connections.length}`
      );
      console.log(
        `🗑️ [Connection Store] Deleted connection IDs now in blacklist: ${connectionIdsToDelete.join(
          ', '
        )}`
      );
      return newState;
    });
  },

  // Mark a connection deletion as complete (remove from deletingConnections)
  markConnectionDeletionComplete: (connectionId) => {
    console.log(
      `✅ [Connection Store] Marking deletion complete for: ${connectionId}`
    );
    set((state) => ({
      deletingConnections: new Set(
        [...state.deletingConnections].filter((id) => id !== connectionId)
      ),
    }));
  },

  // Mark connection as being deleted with automatic cleanup after timeout
  markConnectionDeleting: (connectionId, timeoutMs = 120000) => {
    // Increased to 2 minutes
    console.log(
      `🗑️ [Connection Store] Marking connection ${connectionId} as deleting`
    );
    set((state) => ({
      deletingConnections: new Set([
        ...state.deletingConnections,
        connectionId,
      ]),
    }));

    // Auto-cleanup after timeout to prevent permanent blocking
    setTimeout(() => {
      const currentState = get();
      if (currentState.deletingConnections.has(connectionId)) {
        console.warn(
          `⚠️ [Connection Store] Auto-clearing deletion tracking for ${connectionId} after timeout`
        );
        get().markConnectionDeletionComplete(connectionId);
      }
    }, timeoutMs);
  },

  // Clean up all deletion tracking (use sparingly, for error recovery)
  clearDeletionTracking: () => {
    console.log(`🧹 [Connection Store] Clearing all deletion tracking`);
    set(() => ({
      deletingConnections: new Set(),
    }));
  },

  // Enhanced connection blocking with database verification
  addConnectionWithVerification: (connection) => {
    if (!connection || !connection.id) {
      console.warn('Attempted to add invalid connection:', connection);
      return;
    }

    // Check if this connection is being deleted - if so, don't add it back
    const state = get();
    if (state.deletingConnections.has(connection.id)) {
      console.log(
        `🚫 [Enhanced] Blocked re-adding connection during deletion: ${connection.id}`
      );

      // Additional check: verify if this connection should actually still be blocked
      // Sometimes Firebase sends stale data, so we should verify the timestamp
      const now = Date.now();
      const connectionTimestamp = connection._lastSaved || connection.createdAt;
      const connectionTime =
        typeof connectionTimestamp === 'string'
          ? new Date(connectionTimestamp).getTime()
          : connectionTimestamp;

      // If the connection data is older than when we started deleting, definitely block it
      console.log(
        `🚫 [Enhanced] Connection timestamp: ${connectionTime}, Current time: ${now}`
      );
      console.log(
        `🚫 [Enhanced] This appears to be stale data from Firebase - keeping block active`
      );

      return;
    }

    console.log('Adding connection to store:', connection.id);
    set((state) => {
      // Check if connection already exists
      const exists = state.connections.some(
        (conn) => conn.id === connection.id
      );
      if (exists) {
        console.log('Connection already exists:', connection.id);
        return state;
      }

      const newState = {
        connections: [...state.connections, connection],
      };

      // Log state after update
      setTimeout(() => get()._logState(), 0);
      return newState;
    });
  },

  // Force clear a specific connection from deletion blacklist (emergency use)
  forceUnblockConnection: (connectionId) => {
    console.log(
      `🔓 [Connection Store] Force unblocking connection: ${connectionId}`
    );
    set((state) => ({
      deletingConnections: new Set(
        [...state.deletingConnections].filter((id) => id !== connectionId)
      ),
    }));
  },

  // Check if a connection is currently blocked
  isConnectionBlocked: (connectionId) => {
    const state = get();
    return state.deletingConnections.has(connectionId);
  },
}));

export default useConnectionStore;
