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

  // UI state for connection text and styling
  lineTexts: {}, // Object mapping connection IDs to their text
  lineTextStyles: {}, // Object mapping connection IDs to their text styles
  showLineTextInput: null, // Connection ID that has text input open
  showLineTextStyleUI: null, // Connection ID that has style UI open

  // Actions
  addConnection: (connection) => {
    set((state) => ({
      connections: [...state.connections, connection],
    }));
  },

  removeConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== connectionId),
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
    }));
  },
  updateConnection: (connectionId, updates) => {
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      ),
    }));
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
  deleteConnectionsByObject: (objectId) => {
    set((state) => {
      const connectionsToDelete = state.connections.filter(
        (conn) =>
          conn.start?.objectId === objectId || conn.end?.objectId === objectId
      );

      const connectionIdsToDelete = connectionsToDelete.map((conn) => conn.id);

      return {
        connections: state.connections.filter(
          (conn) =>
            conn.start?.objectId !== objectId && conn.end?.objectId !== objectId
        ),
        // Clean up related state for deleted connections
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
      };
    });
  },
}));

export default useConnectionStore;
