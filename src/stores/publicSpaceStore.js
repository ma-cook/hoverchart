import { create } from 'zustand';

const usePublicSpaceStore = create((set, get) => ({
  // Public Connections State
  publicConnections: {}, // { spaceId: { connections: [], loading: boolean } }

  // Public Space View State
  publicSpaces: {}, // { spaceId: { spaceData: object, loading: boolean, error: string } }

  // Real-time Connection Updater State
  realTimeState: {
    lastObjectPositions: new Map(), // Map<objectId, position>
    databaseSaveTimeouts: new Map(), // Map<connectionId, timeoutId>
  },

  // Public Connections Actions
  setPublicConnectionsLoading: (spaceId, loading) => {
    set((state) => ({
      publicConnections: {
        ...state.publicConnections,
        [spaceId]: {
          ...state.publicConnections[spaceId],
          loading,
        },
      },
    }));
  },

  setPublicConnections: (spaceId, connections) => {
    set((state) => ({
      publicConnections: {
        ...state.publicConnections,
        [spaceId]: {
          ...state.publicConnections[spaceId],
          connections,
          loading: false,
        },
      },
    }));
  },

  getPublicConnections: (spaceId) => {
    const state = get();
    return (
      state.publicConnections[spaceId] || { connections: [], loading: true }
    );
  },

  clearPublicConnections: (spaceId) => {
    set((state) => {
      const newPublicConnections = { ...state.publicConnections };
      delete newPublicConnections[spaceId];
      return { publicConnections: newPublicConnections };
    });
  },

  // Public Space View Actions
  setPublicSpaceLoading: (spaceId, loading) => {
    set((state) => ({
      publicSpaces: {
        ...state.publicSpaces,
        [spaceId]: {
          ...state.publicSpaces[spaceId],
          loading,
          error: null,
        },
      },
    }));
  },

  setPublicSpaceData: (spaceId, spaceData) => {
    set((state) => ({
      publicSpaces: {
        ...state.publicSpaces,
        [spaceId]: {
          spaceData,
          loading: false,
          error: null,
        },
      },
    }));
  },

  setPublicSpaceError: (spaceId, error) => {
    set((state) => ({
      publicSpaces: {
        ...state.publicSpaces,
        [spaceId]: {
          ...state.publicSpaces[spaceId],
          loading: false,
          error,
        },
      },
    }));
  },

  getPublicSpace: (spaceId) => {
    const state = get();
    return (
      state.publicSpaces[spaceId] || {
        spaceData: null,
        loading: true,
        error: null,
      }
    );
  },

  clearPublicSpace: (spaceId) => {
    set((state) => {
      const newPublicSpaces = { ...state.publicSpaces };
      delete newPublicSpaces[spaceId];
      return { publicSpaces: newPublicSpaces };
    });
  },

  // Real-time Connection Updater Actions
  setLastObjectPosition: (objectId, position) => {
    const state = get();
    const newMap = new Map(state.realTimeState.lastObjectPositions);
    newMap.set(objectId, [...position]);

    set((currentState) => ({
      realTimeState: {
        ...currentState.realTimeState,
        lastObjectPositions: newMap,
      },
    }));
  },

  getLastObjectPosition: (objectId) => {
    const state = get();
    return state.realTimeState.lastObjectPositions.get(objectId);
  },

  setDatabaseSaveTimeout: (connectionId, timeoutId) => {
    const state = get();
    const newMap = new Map(state.realTimeState.databaseSaveTimeouts);

    // Clear existing timeout if it exists
    const existingTimeout = newMap.get(connectionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    newMap.set(connectionId, timeoutId);

    set((currentState) => ({
      realTimeState: {
        ...currentState.realTimeState,
        databaseSaveTimeouts: newMap,
      },
    }));
  },

  clearDatabaseSaveTimeout: (connectionId) => {
    const state = get();
    const newMap = new Map(state.realTimeState.databaseSaveTimeouts);

    const timeoutId = newMap.get(connectionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      newMap.delete(connectionId);
    }

    set((currentState) => ({
      realTimeState: {
        ...currentState.realTimeState,
        databaseSaveTimeouts: newMap,
      },
    }));
  },

  clearAllDatabaseSaveTimeouts: () => {
    const state = get();
    const timeouts = state.realTimeState.databaseSaveTimeouts;

    // Clear all timeouts
    timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    set((currentState) => ({
      realTimeState: {
        ...currentState.realTimeState,
        databaseSaveTimeouts: new Map(),
      },
    }));
  },

  // Save connections immediately (no debounce)
  saveConnectionsImmediately: async (connections, user, currentSpaceId) => {
    if (!connections.length || !user || !currentSpaceId) return;

    try {
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      const { saveConnection } = await import('../services/connectionsService');

      // Save all connections that have been updated
      const savePromises = connections
        .filter((conn) => conn._localUpdate) // Only save connections that were locally updated
        .map(async (conn) => {
          const connectionToSave = { ...conn };
          delete connectionToSave._localUpdate; // Remove local update flag

          try {
            await saveConnection(
              spaceOwnerId,
              currentSpaceId,
              connectionToSave
            );
            console.log(`💾 Immediately saved connection ${conn.id} position`);
          } catch (error) {
            console.error(`❌ Failed to save connection ${conn.id}:`, error);
          }
        });

      await Promise.all(savePromises);
    } catch (error) {
      console.error('❌ Failed to save connections immediately:', error);
    }
  },

  // Utility Actions
  clearAllPublicSpaceData: () => {
    // Clear all timeouts first
    get().clearAllDatabaseSaveTimeouts();

    set({
      publicConnections: {},
      publicSpaces: {},
      realTimeState: {
        lastObjectPositions: new Map(),
        databaseSaveTimeouts: new Map(),
      },
    });
  },
}));

export default usePublicSpaceStore;
