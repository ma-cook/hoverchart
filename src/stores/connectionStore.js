import { create } from 'zustand';
import { api } from '../api-client';
import useSpaceManagerStore from './spaceManagerStore';

// Stable empty array for components with no connections — prevents re-renders from shallow equality
const EMPTY_CONNECTIONS = [];

// Build a Map<objectId, Connection[]> index for O(1) lookups by components.
// Covers all objectId fallback chains used by Cube, Dodecahedron, Tetrahedron, Plane, TextObject.
function _buildConnectionsByObjectId(connections) {
  const index = new Map();
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    const startId = conn.start?.objectId || conn.start?.cube?.id || conn.start?.id;
    const endId = conn.end?.objectId || conn.end?.cube?.id || conn.end?.id;
    const sKey = startId != null ? String(startId) : null;
    const eKey = endId != null ? String(endId) : null;
    if (sKey) {
      let arr = index.get(sKey);
      if (!arr) { arr = []; index.set(sKey, arr); }
      arr.push(conn);
    }
    if (eKey && eKey !== sKey) {
      let arr = index.get(eKey);
      if (!arr) { arr = []; index.set(eKey, arr); }
      arr.push(conn);
    }
  }
  return index;
}

const useConnectionStore = create((set, get) => ({
  // State for all connections
  connections: [], // Array of connection objects
  connectionsByObjectId: new Map(), // O(1) index: objectId → Connection[]
  selectedConnection: null,
  highlightedFlowPathIds: new Set(), // Set of connection IDs highlighted as part of a flow path
  activeConnection: null,
  isCreatingConnection: false,
  connectionStartPoint: null,
  connectionEndPoint: null,
  connectionsLoaded: false,
  connectionsVisible: false, // Toggle to show/hide all connection lines - default OFF on startup
  focusedObjectId: null, // Object ID to show connections for when globally hidden

  // Track connections being deleted to prevent re-addition during async deletion
  deletingConnections: new Set(), // Set of connection IDs being deleted

  // Clear unloaded status for connections in reloaded cells
  clearUnloadedConnectionsForCells: (cellIds) => {
    if (!window._unloadedConnections) return;

    cellIds.forEach((cellId) => {
      // Get connections from this cell
      const cellConnections = get().connections.filter((conn) =>
        conn.cells?.includes(cellId)
      );

      // Remove unloaded status for these connections
      cellConnections.forEach((conn) => {
        if (window._unloadedConnections.has(conn.id)) {
          console.log(
            `🔄 Re-enabling connection: ${conn.id} in cell: ${cellId}`
          );
          window._unloadedConnections.delete(conn.id);
        }
      });
    });
  },

  // UI state for connection text and styling
  lineTexts: {}, // Object mapping connection IDs to their text
  lineTextStyles: {}, // Object mapping connection IDs to their text styles
  showLineTextInput: null, // Connection ID that has text input open
  showLineTextStyleUI: null, // Connection ID that has style UI open

  // LineUI menu state (per-connection)
  lineUIMenuState: {}, // { [connectionId]: { showLineStyles: bool, showArrowDropdown: bool, currentLineStyle: string } }

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

      const newConns = [...state.connections, connection];
      const newState = {
        connections: newConns,
        connectionsByObjectId: _buildConnectionsByObjectId(newConns),
      };

      // Log state after update
      setTimeout(() => get()._logState(), 0);
      return newState;
    });
  },

  // Bulk add connections in a single state update to prevent re-render loops
  bulkAddConnections: (connectionsArray) => {
    if (
      !connectionsArray ||
      !Array.isArray(connectionsArray) ||
      connectionsArray.length === 0
    ) {
      return;
    }

    set((state) => {
      // Filter out connections that already exist or are being deleted
      const existingIds = new Set(state.connections.map((conn) => conn.id));
      const newConnections = connectionsArray.filter(
        (conn) =>
          conn &&
          conn.id &&
          !existingIds.has(conn.id) &&
          !state.deletingConnections.has(conn.id)
      );

      if (newConnections.length === 0) {
        return state;
      }

      const newConns = [...state.connections, ...newConnections];
      // Incrementally merge into existing index instead of rebuilding from scratch
      const newIndex = new Map(state.connectionsByObjectId);
      for (let i = 0; i < newConnections.length; i++) {
        const conn = newConnections[i];
        const startId = conn.start?.objectId || conn.start?.cube?.id || conn.start?.id;
        const endId = conn.end?.objectId || conn.end?.cube?.id || conn.end?.id;
        const sKey = startId != null ? String(startId) : null;
        const eKey = endId != null ? String(endId) : null;
        if (sKey) {
          let arr = newIndex.get(sKey);
          if (!arr) { arr = []; newIndex.set(sKey, arr); }
          arr.push(conn);
        }
        if (eKey && eKey !== sKey) {
          let arr = newIndex.get(eKey);
          if (!arr) { arr = []; newIndex.set(eKey, arr); }
          arr.push(conn);
        }
      }

      const newState = {
        connections: newConns,
        connectionsByObjectId: newIndex,
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

      const filteredConns = state.connections.filter(
          (conn) => conn.id !== connectionId
        );
      const newState = {
        connections: filteredConns,
        connectionsByObjectId: _buildConnectionsByObjectId(filteredConns),
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
            const CELL_SIZE = 15000;
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
        connectionsByObjectId: _buildConnectionsByObjectId(filteredConnections),
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
    set((state) => {
      // Find the connection index
      const connectionIndex = state.connections.findIndex(
        (conn) => conn.id === connectionId
      );

      if (connectionIndex === -1) {
        // Connection not found, return current state unchanged
        return state;
      }

      // Check if the updates would actually change the connection
      const currentConnection = state.connections[connectionIndex];
      let hasChanges = false;

      for (const [key, value] of Object.entries(updates)) {
        const curr = currentConnection[key];
        if (curr !== value) {
          // Quick reference check failed, do shallow comparison for objects/arrays
          if (typeof curr === 'object' && typeof value === 'object' && curr !== null && value !== null) {
            const keys = Object.keys(value);
            if (Array.isArray(value)) {
              if (!Array.isArray(curr) || curr.length !== value.length || value.some((v, i) => v !== curr[i])) {
                hasChanges = true;
                break;
              }
            } else if (keys.length !== Object.keys(curr).length || keys.some(k => curr[k] !== value[k])) {
              hasChanges = true;
              break;
            }
          } else {
            hasChanges = true;
            break;
          }
        }
      }

      if (!hasChanges) {
        // No actual changes, return current state
        return state;
      }

      // Create minimal update - only update the specific connection
      const newConnections = [...state.connections];
      newConnections[connectionIndex] = { ...currentConnection, ...updates };

      // Incremental index update: replace this connection in-place
      const updatedConn = newConnections[connectionIndex];
      const newIndex = new Map(state.connectionsByObjectId);
      for (const [, arr] of newIndex) {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].id === updatedConn.id) {
            arr[i] = updatedConn;
          }
        }
      }

      return {
        connections: newConnections,
        connectionsByObjectId: newIndex,
      };
    });
    // PERFORMANCE: Disable logging during style updates to prevent any potential issues
    // get()._logState();
  },

  // Batch update multiple connections in a single operation
  updateConnections: (connectionUpdates) => {
    if (!connectionUpdates || connectionUpdates.size === 0) {
      return;
    }

    set((state) => {
      let newConnections = null; // PERFORMANCE: Defer array copy until we know there are changes
      const updatedIds = new Set(connectionUpdates.keys());

      // Apply all updates in a single pass
      connectionUpdates.forEach((updates, connectionId) => {
        const arr = newConnections || state.connections;
        const connectionIndex = arr.findIndex(
          (conn) => conn.id === connectionId
        );

        if (connectionIndex === -1) {
          return; // Connection not found
        }

        const currentConnection = arr[connectionIndex];

        // Check if the updates would actually change the connection
        let hasConnectionChanges = false;
        for (const [key, value] of Object.entries(updates)) {
          const curr = currentConnection[key];
          if (curr !== value) {
            if (typeof curr === 'object' && typeof value === 'object' && curr !== null && value !== null) {
              const keys = Object.keys(value);
              if (Array.isArray(value)) {
                if (!Array.isArray(curr) || curr.length !== value.length || value.some((v, i) => v !== curr[i])) {
                  hasConnectionChanges = true;
                  break;
                }
              } else if (keys.length !== Object.keys(curr).length || keys.some(k => curr[k] !== value[k])) {
                hasConnectionChanges = true;
                break;
              }
            } else {
              hasConnectionChanges = true;
              break;
            }
          }
        }

        if (hasConnectionChanges) {
          if (!newConnections) {
            newConnections = [...state.connections]; // Lazy copy only when needed
          }
          newConnections[connectionIndex] = {
            ...currentConnection,
            ...updates,
          };
        }
      });

      if (!newConnections) {
        return state; // No actual changes, no array copy was made
      }

      // Incremental index update: only replace changed connections in-place
      // instead of rebuilding the entire Map from scratch.
      const byId = new Map(newConnections.map(c => [c.id, c]));
      const newIndex = new Map(state.connectionsByObjectId);
      for (const [, arr] of newIndex) {
        for (let i = 0; i < arr.length; i++) {
          const updated = byId.get(arr[i].id);
          if (updated) arr[i] = updated;
        }
      }

      return {
        connections: newConnections,
        connectionsByObjectId: newIndex,
      };
    });

    // Log state after batch update
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
        set({ connections: newConnections, connectionsByObjectId: _buildConnectionsByObjectId(newConnections) });
      } else {
        set({ connections: [], connectionsByObjectId: new Map() });
      }
    } else if (Array.isArray(connections)) {
      set({ connections, connectionsByObjectId: _buildConnectionsByObjectId(connections) });
    } else {
      set({ connections: [], connectionsByObjectId: new Map() });
    }
    // Log state after setting connections
    get()._logState();
  },

  setConnectionsLoaded: (loaded) => {
    set({ connectionsLoaded: loaded });
  },

  selectConnection: (connectionId) => {
    if (connectionId === null) {
      set({ selectedConnection: null, highlightedFlowPathIds: new Set() });
    } else {
      set({ selectedConnection: connectionId });
    }
  },

  deselectConnection: () => {
    set({ selectedConnection: null, highlightedFlowPathIds: new Set() });
  },

  /**
   * Select a connection and highlight all connections that share the same flow path(s).
   * If the connection has no flow paths, falls back to normal selection.
   */
  selectConnectionWithFlowPath: (connectionId) => {
    if (!connectionId) {
      set({ selectedConnection: null, highlightedFlowPathIds: new Set() });
      return;
    }

    const state = get();
    const connection = state.connections.find(c => c.id === connectionId);

    if (!connection) {
      set({ selectedConnection: connectionId, highlightedFlowPathIds: new Set() });
      return;
    }

    const flowPaths = connection?.merfolkData?.flowPaths;

    if (flowPaths && flowPaths.length > 0) {
      // Highlight all connections that share any of the same explicit flow path tags
      const pathNames = new Set(flowPaths);
      const highlightedIds = new Set();

      state.connections.forEach(conn => {
        const connFlowPaths = conn.merfolkData?.flowPaths;
        if (connFlowPaths && connFlowPaths.some(fp => pathNames.has(fp))) {
          highlightedIds.add(conn.id);
        }
      });

      set({ selectedConnection: connectionId, highlightedFlowPathIds: highlightedIds });
    } else {
      // No explicit flow path tags — trace the directed data flow chain.
      //
      // Directed traversal avoids the "hub problem" where bidirectional BFS
      // would fan out through every connection at a shared node and highlight
      // nearly the entire scene. Instead we follow only the arrow direction:
      //   • Backward from the clicked connection's source: find connections whose
      //     END lands on the source node (upstream producers of this data).
      //   • Forward from the clicked connection's target: find connections whose
      //     START leaves the target node (downstream consumers of this data).
      //
      // This naturally traces internal-function hops (A→fn→B) because fn is both
      // the target of A→fn and the source of fn→B, so both segments are included.

      const clickedSourceId = connection.start?.objectId;
      const clickedTargetId = connection.end?.objectId;

      if (!clickedSourceId && !clickedTargetId) {
        set({ selectedConnection: connectionId, highlightedFlowPathIds: new Set() });
        return;
      }

      // Pre-build directional lookups for O(1) access.
      // outgoing: objectId → connections that start at that object
      // incoming: objectId → connections that end at that object
      const outgoing = new Map(); // objectId → conn[]
      const incoming = new Map(); // objectId → conn[]
      state.connections.forEach(conn => {
        const src = conn.start?.objectId;
        const tgt = conn.end?.objectId;
        if (src) {
          if (!outgoing.has(src)) outgoing.set(src, []);
          outgoing.get(src).push(conn);
        }
        if (tgt) {
          if (!incoming.has(tgt)) incoming.set(tgt, []);
          incoming.get(tgt).push(conn);
        }
      });

      const highlightedIds = new Set();
      // Always include the clicked connection itself
      highlightedIds.add(connectionId);

      // ── Forward pass: follow outgoing edges from the target node ──────────
      const fwdVisited = new Set();
      const fwdQueue = clickedTargetId ? [clickedTargetId] : [];
      while (fwdQueue.length > 0) {
        const nodeId = fwdQueue.shift();
        if (fwdVisited.has(nodeId)) continue;
        fwdVisited.add(nodeId);
        (outgoing.get(nodeId) || []).forEach(conn => {
          highlightedIds.add(conn.id);
          const tgt = conn.end?.objectId;
          if (tgt && !fwdVisited.has(tgt)) fwdQueue.push(tgt);
        });
      }

      // ── Backward pass: follow incoming edges from the source node ─────────
      const bwdVisited = new Set();
      const bwdQueue = clickedSourceId ? [clickedSourceId] : [];
      while (bwdQueue.length > 0) {
        const nodeId = bwdQueue.shift();
        if (bwdVisited.has(nodeId)) continue;
        bwdVisited.add(nodeId);
        (incoming.get(nodeId) || []).forEach(conn => {
          highlightedIds.add(conn.id);
          const src = conn.start?.objectId;
          if (src && !bwdVisited.has(src)) bwdQueue.push(src);
        });
      }

      set({ selectedConnection: connectionId, highlightedFlowPathIds: highlightedIds });
    }
  },

  clearFlowPathHighlight: () => {
    set({ highlightedFlowPathIds: new Set() });
  },

  setActiveConnection: (connectionId) => {
    set({ activeConnection: connectionId });
  },

  toggleConnectionsVisible: () => {
    set((state) => ({ 
      connectionsVisible: !state.connectionsVisible,
      // Clear focused object when toggling visibility back on
      focusedObjectId: !state.connectionsVisible ? null : state.focusedObjectId
    }));
  },

  // Set the focused object ID (to show its connections when globally hidden)
  setFocusedObjectId: (objectId) => {
    set({ focusedObjectId: objectId });
  },

  // Clear the focused object
  clearFocusedObject: () => {
    set({ focusedObjectId: null });
  },

  // Get all object IDs connected to the focused object
  getConnectedObjectIds: (objectId) => {
    const connections = get().connections;
    const connectedIds = new Set();
    
    connections.forEach((conn) => {
      const startId = conn.start?.objectId?.toString();
      const endId = conn.end?.objectId?.toString();
      const objIdStr = objectId?.toString();
      
      if (startId === objIdStr) {
        connectedIds.add(endId);
      } else if (endId === objIdStr) {
        connectedIds.add(startId);
      }
    });
    
    return connectedIds;
  },

  // Get connections for a specific object
  getConnectionsForObject: (objectId) => {
    const connections = get().connections;
    const objIdStr = objectId?.toString();
    
    return connections.filter((conn) => {
      const startId = conn.start?.objectId?.toString();
      const endId = conn.end?.objectId?.toString();
      return startId === objIdStr || endId === objIdStr;
    });
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

  // LineUI menu state actions
  setLineUIMenuState: (connectionId, menuState) => {
    set((state) => ({
      lineUIMenuState: {
        ...state.lineUIMenuState,
        [connectionId]: {
          ...(state.lineUIMenuState[connectionId] || {}),
          ...menuState,
        },
      },
    }));
  },

  toggleLineStylesMenu: (connectionId) => {
    set((state) => {
      const current = state.lineUIMenuState[connectionId] || {};
      return {
        lineUIMenuState: {
          ...state.lineUIMenuState,
          [connectionId]: {
            ...current,
            showLineStyles: !current.showLineStyles,
            showArrowDropdown: false, // Close arrow dropdown when opening line styles
          },
        },
      };
    });
  },

  toggleArrowDropdown: (connectionId) => {
    set((state) => {
      const current = state.lineUIMenuState[connectionId] || {};
      return {
        lineUIMenuState: {
          ...state.lineUIMenuState,
          [connectionId]: {
            ...current,
            showArrowDropdown: !current.showArrowDropdown,
            showLineStyles: false, // Close line styles when opening arrow dropdown
          },
        },
      };
    });
  },

  closeAllLineUIMenus: (connectionId) => {
    set((state) => ({
      lineUIMenuState: {
        ...state.lineUIMenuState,
        [connectionId]: {
          ...(state.lineUIMenuState[connectionId] || {}),
          showLineStyles: false,
          showArrowDropdown: false,
        },
      },
    }));
  },

  getLineUIMenuState: (connectionId) => {
    const state = get();
    return (
      state.lineUIMenuState[connectionId] || {
        showLineStyles: false,
        showArrowDropdown: false,
        currentLineStyle: 'straight',
      }
    );
  },

  // Getters
  getConnection: (connectionId) => {
    const state = get();
    return state.connections.find((conn) => conn.id === connectionId);
  },

  getConnectionsForObject: (objectId) => {
    const state = get();
    return state.connectionsByObjectId.get(String(objectId)) || EMPTY_CONNECTIONS;
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

      // Delete from database via API
      if (connectionIdsToDelete.length > 0) {
        setTimeout(async () => {
          try {
            const user = window.currentUser;

            // Use provided spaceId first, then fall back to global context
            let finalSpaceId =
              spaceId || window.currentSpaceId || window._currentSpaceId;

            // If still no space ID, try to get it from the space manager store
            if (!finalSpaceId) {
              try {
                const spaceManagerState = useSpaceManagerStore.getState();
                finalSpaceId = spaceManagerState.currentSpaceId;
              } catch {
                // Could not access space manager store
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

            // Delete each connection via API
            for (const connId of connectionIdsToDelete) {
              try {
                await api.delete(`/api/spaces/${finalSpaceId}/connections/${connId}`);
              } catch {
                // Individual deletion error
              }
            }
          } catch {
            // Database deletion error
          }
        }, 100); // Small delay to avoid race conditions
      }

      const filteredConns = state.connections.filter(
          (conn) =>
            conn.start?.objectId !== objectId && conn.end?.objectId !== objectId
        );
      const newState = {
        connections: filteredConns,
        connectionsByObjectId: _buildConnectionsByObjectId(filteredConns),
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

      const newConns = [...state.connections, connection];
      const newState = {
        connections: newConns,
        connectionsByObjectId: _buildConnectionsByObjectId(newConns),
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

  // Reset all connection state (used when bulk deleting)
  resetConnections: () => {
    set({
      connections: [],
      connectionsByObjectId: new Map(),
      selectedConnection: null,
      highlightedFlowPathIds: new Set(),
      activeConnection: null,
      isCreatingConnection: false,
      connectionStartPoint: null,
      connectionEndPoint: null,
      connectionsLoaded: false,
      deletingConnections: new Set(),
    });
  },
}));

export default useConnectionStore;
