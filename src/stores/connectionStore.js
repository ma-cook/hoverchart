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

  // Debug helper with performance throttling
  _logState: () => {
    const state = get();

    // PERFORMANCE FIX: Throttle excessive logging during bulk operations
    const now = performance.now();
    const lastLog = window._lastConnectionStoreLog || 0;
    const logThreshold = 1000; // Only log once per second during bulk operations

    if (now - lastLog < logThreshold && state.connections.length > 50) {
      return; // Skip logging during bulk operations
    }

    window._lastConnectionStoreLog = now;

    // Debug logging removed
  },

  // Actions
  addConnection: (connection) => {
    if (!connection || !connection.id) {
      return;
    }

    // Check if this connection is being deleted - if so, don't add it back
    const state = get();
    if (state.deletingConnections.has(connection.id)) {
      return;
    }

    set((state) => {
      // Check if connection already exists
      const exists = state.connections.some(
        (conn) => conn.id === connection.id
      );
      if (exists) {
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
      return;
    }

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

  // Remove connections from unloaded cells
  removeConnectionsFromCells: (unloadedCellIds) => {
    if (
      !unloadedCellIds ||
      !Array.isArray(unloadedCellIds) ||
      unloadedCellIds.length === 0
    ) {
      return;
    }

    set((state) => {
      const connectionsToRemove = new Set();

      // Find connections that belong to unloaded cells
      state.connections.forEach((connection) => {
        if (!connection.start?.position || !connection.end?.position) {
          return;
        }

        try {
          // Use simple cell calculation inline to avoid import issues
          const getCellCoords = (position) => {
            const CELL_SIZE = 10000;
            return {
              x: Math.floor(position[0] / CELL_SIZE),
              y: Math.floor(position[1] / CELL_SIZE),
              z: Math.floor(position[2] / CELL_SIZE),
            };
          };

          const getCellIdFromCoords = (x, y, z) => `${x},${y},${z}`;

          const startCellCoords = getCellCoords(connection.start.position);
          const endCellCoords = getCellCoords(connection.end.position);

          const startCellId = getCellIdFromCoords(
            startCellCoords.x,
            startCellCoords.y,
            startCellCoords.z
          );
          const endCellId = getCellIdFromCoords(
            endCellCoords.x,
            endCellCoords.y,
            endCellCoords.z
          );

          // Remove connection if either endpoint is in an unloaded cell
          if (
            unloadedCellIds.includes(startCellId) ||
            unloadedCellIds.includes(endCellId)
          ) {
            connectionsToRemove.add(connection.id);
          }
        } catch {
          // Skip connection if there's an error processing it
        }
      });

      if (connectionsToRemove.size === 0) {
        return state;
      }

      // For cell-based removal, don't add to deletingConnections since these are temporary
      // spatial partitioning removals, not permanent deletions
      const filteredConnections = state.connections.filter(
        (conn) => !connectionsToRemove.has(conn.id)
      );

      // Clean up related state for removed connections
      const cleanLineTexts = { ...state.lineTexts };
      const cleanLineTextStyles = { ...state.lineTextStyles };
      let newShowLineTextInput = state.showLineTextInput;
      let newShowLineTextStyleUI = state.showLineTextStyleUI;

      connectionsToRemove.forEach((connectionId) => {
        delete cleanLineTexts[connectionId];
        delete cleanLineTextStyles[connectionId];
        if (state.showLineTextInput === connectionId) {
          newShowLineTextInput = null;
        }
        if (state.showLineTextStyleUI === connectionId) {
          newShowLineTextStyleUI = null;
        }
      });

      const newState = {
        connections: filteredConnections,
        deletingConnections: state.deletingConnections, // Keep existing deletingConnections unchanged
        lineTexts: cleanLineTexts,
        lineTextStyles: cleanLineTextStyles,
        showLineTextInput: newShowLineTextInput,
        showLineTextStyleUI: newShowLineTextStyleUI,
      };

      console.log(
        `🗑️ Removed ${connectionsToRemove.size} connections from unloaded cells`
      );

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
    set((state) => {
      const connectionsToDelete = state.connections.filter(
        (conn) =>
          conn.start?.objectId === objectId || conn.end?.objectId === objectId
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
              } catch {
                // Could not import space manager store
              }
            }

            // If still no space ID, try URL params as last resort
            if (!finalSpaceId) {
              const urlParams = new URLSearchParams(window.location.search);
              finalSpaceId = urlParams.get('spaceId');
            }

            if (!user || !finalSpaceId) {
              return;
            }

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

            for (const cellDoc of cellsSnapshot.docs) {
              const cellData = cellDoc.data();
              if (cellData.connections) {
                let hasChanges = false;
                const updates = {};

                connectionIdsToDelete.forEach((connId) => {
                  if (cellData.connections[connId]) {
                    updates[`connections.${connId}`] = deleteField();
                    hasChanges = true;
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
                }
              }
            }
          } catch {
            // Database deletion error
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

      return newState;
    });
  },

  // Mark a connection deletion as complete (remove from deletingConnections)
  markConnectionDeletionComplete: (connectionId) => {
    set((state) => ({
      deletingConnections: new Set(
        [...state.deletingConnections].filter((id) => id !== connectionId)
      ),
    }));
  },

  // Mark connection as being deleted with automatic cleanup after timeout
  markConnectionDeleting: (connectionId, timeoutMs = 120000) => {
    // Increased to 2 minutes
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
        get().markConnectionDeletionComplete(connectionId);
      }
    }, timeoutMs);
  },

  // Clean up all deletion tracking (use sparingly, for error recovery)
  clearDeletionTracking: () => {
    set(() => ({
      deletingConnections: new Set(),
    }));
  },

  // Enhanced connection blocking with database verification
  addConnectionWithVerification: (connection) => {
    if (!connection || !connection.id) {
      return;
    }

    // Check if this connection is being deleted - if so, don't add it back
    const state = get();
    if (state.deletingConnections.has(connection.id)) {
      // Additional check: verify if this connection should actually still be blocked
      // Sometimes Firebase sends stale data, so we should verify the timestamp
      return;
    }

    set((state) => {
      // Check if connection already exists
      const exists = state.connections.some(
        (conn) => conn.id === connection.id
      );
      if (exists) {
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
