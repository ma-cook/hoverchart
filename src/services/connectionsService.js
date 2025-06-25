import { db } from '../firebase';
import {
  enableNetwork,
  disableNetwork,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { isSharedSpace } from './sharedSpacesService';
import {
  addConnectionToCells,
  removeConnectionFromCells,
  getOccupiedCells,
} from './spatialPartitioning';
import useConnectionStore from '../stores/connectionStore';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
  }
});

// Add connection state tracking - keep simple tracking but remove reconnection logic
let isNetworkEnabled = true;
const connectionListeners = new Set();

// Function to notify all listeners of connection state changes
const notifyConnectionListeners = (state) => {
  connectionListeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // Error in connection listener
    }
  });
};

// Function to add connection state listener
export const addConnectionStateListener = (listener) => {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
};

// Keep the toggle network function for potential future use
export const toggleNetwork = async (enable) => {
  try {
    if (enable && !isNetworkEnabled) {
      await enableNetwork(db);
      isNetworkEnabled = true;
      notifyConnectionListeners('connected');
    } else if (!enable && isNetworkEnabled) {
      await disableNetwork(db);
      isNetworkEnabled = false;
      notifyConnectionListeners('disconnected');
    }
  } catch {
    // Error toggling network
  }
};

// Remove the forceReconnect function or simplify it to just return true
export const forceReconnect = async () => {
  return true; // Simplified version that always succeeds but does nothing
};

const serializeConnection = (connection) => {
  // Create a serialized object that explicitly handles text fields
  return {
    id: connection.id,
    start: {
      type: connection.start?.type || 'cube',
      face: connection.start?.face || 0,
      objectId: connection.start?.objectId || null,
      position: connection.start?.position || [0, 0, 0],
      faceCenter: connection.start?.faceCenter || [0, 0, 0],
    },
    end: {
      type: connection.end?.type || 'cube',
      face: connection.end?.face || 0,
      objectId: connection.end?.objectId || null,
      position: connection.end?.position || [0, 0, 0],
      faceCenter: connection.end?.faceCenter || [0, 0, 0],
    },
    lineStyle: connection.lineStyle || connection.styleType || 'straight',
    styleType: connection.styleType || connection.lineStyle || 'straight', // Support both for compatibility
    dashDirection: connection.dashDirection || null,
    dashOffset: connection.dashOffset || 0,
    color: connection.color || 'black',
    // More explicit text handling - ensure text is always a string
    text: typeof connection.text === 'string' ? connection.text : '',
    textStyle: connection.textStyle
      ? {
          // Only apply defaults for missing properties, preserve existing ones
          fontSize:
            connection.textStyle.fontSize !== undefined
              ? connection.textStyle.fontSize
              : 1,
          color:
            connection.textStyle.color !== undefined
              ? connection.textStyle.color
              : 'black',
          underline:
            connection.textStyle.underline !== undefined
              ? connection.textStyle.underline
              : false,
          // Preserve any other textStyle properties that might exist
          ...connection.textStyle,
        }
      : {
          // If no textStyle exists at all, apply defaults
          fontSize: 1,
          color: 'black',
          underline: false,
        },
    // Preserve style update timestamps for conflict resolution
    _lastStyleUpdate: connection._lastStyleUpdate || null,
    _lastSaved: connection._lastSaved || null,
    _lastModified: connection._lastModified || null,
  };
};

// Remove old subscription tracking - now handled by global manager
const connectionCache = new Map();

// Add this function at the top level
const clearConnectionCache = (spaceId, connectionId) => {
  const cacheKey = `${spaceId}_${connectionId}`;
  connectionCache.delete(cacheKey);
};

// Modified to use cell-based storage instead of space-level storage
export const saveConnection = async (userId, spaceId, connection) => {
  if (!userId || !spaceId || !connection?.id) {
    return;
  }

  try {
    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId); // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    // Use the owner's ID to save to the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId; // Ensure IDs are strings for consistency
    if (connection.start?.objectId) {
      const startObjectId = connection.start.objectId.toString();
      connection.start.objectId = startObjectId;
    }

    if (connection.end?.objectId) {
      const endObjectId = connection.end.objectId.toString();
      connection.end.objectId = endObjectId;
    }
    const serializedConnection = serializeConnection(connection);

    // Add creator ID and timestamps for shared spaces
    serializedConnection.creatorId = userId;
    serializedConnection.lastUpdated = new Date().toISOString();
    serializedConnection._lastSaved = Date.now(); // Add save timestamp for conflict resolution

    // Save connection to appropriate cells instead of space-level collection
    const success = await addConnectionToCells(
      ownerUserId,
      spaceId,
      serializedConnection
    );

    if (success) {
      return true; // Indicate success
    } else {
      throw new Error('Failed to save connection to cells');
    }
  } catch {
    // Error saving connection
    // Simple fallback
    try {
      const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(connection));
    } catch {
      // Failed to save connection to localStorage
    }
    throw new Error('Failed to save connection');
  }
};

// Simplify the subscription logic by removing reconnection attempts
// Remove the unused createSubscription function

// Update the export to use cell-based connection loading
export const subscribeToConnections = (
  userId,
  spaceId,
  callback,
  loadedCells = []
) => {
  if (!spaceId) {
    return () => {};
  }

  // Support anonymous access for public spaces
  const isAnonymous = !userId;
  const ownerIdFromUrl = window.currentSpaceOwner;
  // For anonymous users, we must have the owner ID
  if (isAnonymous && !ownerIdFromUrl) {
    return () => {};
  }

  // Use the URL owner ID for anonymous access, or user ID for authenticated users
  const effectiveOwnerId = isAnonymous ? ownerIdFromUrl : userId;

  // Use cell-based connection loading instead of Firebase subscription
  return subscribeToCellConnections(
    effectiveOwnerId,
    spaceId,
    callback,
    loadedCells
  );
};

// New cell-based connection subscription using real-time Firebase subscriptions
const subscribeToCellConnections = (
  userId,
  spaceId,
  callback,
  loadedCells = []
) => {
  if (!userId || !spaceId) {
    return () => {};
  }

  if (!callback || typeof callback !== 'function') {
    console.error(
      '🔗 Invalid callback provided to subscribeToCellConnections:',
      callback
    );
    return () => {};
  }

  // Ensure loadedCells is always an array and make it mutable
  let effectiveCells = Array.isArray(loadedCells) ? [...loadedCells] : [];

  let isSubscribed = true;
  const unsubscribeFunctions = new Map();

  const startCellSubscriptions = async () => {
    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);
      if (!isSubscribed) return;

      // Use the owner's ID to get connections from the correct cells
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId; // If no cells are loaded yet, try to discover cells with connections for initial load
      if (effectiveCells.length === 0) {
        console.log(
          '🔗 No loaded cells, discovering cells with connections for initial load'
        );
        try {
          // Try to get occupied cells that might have connections
          const occupiedCells = await getOccupiedCells(userId, spaceId);

          if (occupiedCells && occupiedCells.length > 0) {
            // Use first few occupied cells for initial connection loading
            effectiveCells = occupiedCells.slice(0, 3); // Limit to first 3 cells to avoid loading too much
            console.log(
              '🔗 Using occupied cells for initial connection load:',
              effectiveCells
            );
          } else {
            // Fallback to origin cell
            effectiveCells = ['0,0,0'];
            console.log(
              '🔗 No occupied cells found, using origin cell as fallback'
            );
          }
        } catch (error) {
          console.warn(
            '🔗 Failed to discover occupied cells, using origin cell fallback:',
            error
          );
          effectiveCells = ['0,0,0'];
        }
      }

      // Subscribe to each loaded cell
      for (const cellKey of effectiveCells) {
        if (!cellKey || typeof cellKey !== 'string') {
          continue;
        }
        const [x, y, z] = cellKey.split(',').map(Number);

        // Create cell reference
        const cellRef = doc(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells',
          cellKey
        ); // Create direct Firebase subscription (bypass global manager for connections due to callback requirements)
        const globalUnsubscribe = onSnapshot(
          cellRef,
          { includeMetadataChanges: false },
          (snapshot) => {
            console.log(
              '🔥 Firebase snapshot received for cell:',
              cellKey,
              'exists:',
              snapshot.exists()
            );

            if (!snapshot.exists()) {
              console.log('📭 Cell document does not exist:', cellKey);
              return;
            }

            const cellData = snapshot.data();
            const cellConnections = cellData.connections || {};

            console.log('📄 Cell data for', cellKey, ':', {
              hasConnections: !!cellData.connections,
              connectionCount: Object.keys(cellConnections).length,
              connectionIds: Object.keys(cellConnections),
            });

            // Process each connection in the cell
            Object.entries(cellConnections).forEach(
              ([connectionId, connectionData]) => {
                console.log(
                  '🔍 Processing connection:',
                  connectionId,
                  connectionData
                );
                const cacheKey = `${spaceId}_${connectionId}`;

                // Check if connection data has changed
                const cachedData = connectionCache.get(cacheKey);
                let hasChanged = false;

                if (cachedData) {
                  hasChanged =
                    JSON.stringify(cachedData) !==
                    JSON.stringify(connectionData);
                } else {
                  hasChanged = true;
                }

                console.log('🔄 Connection change check:', {
                  connectionId,
                  hasChanged,
                  hadCachedData: !!cachedData,
                });
                if (hasChanged) {
                  // Add cellId to the cached connection data for removal detection
                  const connectionDataWithCell = {
                    ...connectionData,
                    cellId: cellKey,
                  };
                  connectionCache.set(
                    cacheKey,
                    JSON.parse(JSON.stringify(connectionDataWithCell))
                  );
                  callback({
                    type: 'added',
                    id: connectionId,
                    connection: connectionData,
                    cellCoords: { x, y, z: z || 0 },
                  });
                }
              }
            );

            // Handle removed connections (compare with cache)
            const currentConnectionIds = new Set(Object.keys(cellConnections));
            const cachedConnectionIds = new Set();

            for (const cacheKey of connectionCache.keys()) {
              if (cacheKey.startsWith(`${spaceId}_`)) {
                const connectionId = cacheKey.substring(`${spaceId}_`.length);
                const connectionData = connectionCache.get(cacheKey);

                // Check if this connection belongs to this cell
                if (connectionData && connectionData.cellId === cellKey) {
                  cachedConnectionIds.add(connectionId);
                }
              }
            } // Find removed connections
            for (const connectionId of cachedConnectionIds) {
              if (!currentConnectionIds.has(connectionId)) {
                const cacheKey = `${spaceId}_${connectionId}`;
                console.log(
                  '🗑️ Removing connection from cache and sending removal event:',
                  connectionId,
                  'from cell:',
                  cellKey
                );
                connectionCache.delete(cacheKey);
                callback({
                  type: 'removed',
                  id: connectionId,
                  cellCoords: { x, y, z: z || 0 },
                });
              }
            }
          },
          (error) => {
            if (error.code === 'permission-denied') {
              return;
            }
          }
        );

        // Store the cleanup function
        unsubscribeFunctions.set(cellKey, globalUnsubscribe);
      }
    } catch {
      // Error starting connection subscriptions
    }
  };

  startCellSubscriptions();

  // Return cleanup function
  return () => {
    isSubscribed = false;
    // Clean up all subscriptions created by this instance
    for (const unsubscribe of unsubscribeFunctions.values()) {
      unsubscribe();
    }
    unsubscribeFunctions.clear();
  };
};

// Add function to delete connections using cell-based storage
export const deleteConnection = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  if (!userId || !spaceId || !connectionId) return false;

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return false;
    }

    // Use the owner's ID to delete from the correct cells
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // If we don't have connection data, we need to find it first
    if (!connectionData) {
      // Try to find the connection in the connection store first
      const connections = useConnectionStore.getState().connections;
      connectionData = connections.find((conn) => conn.id === connectionId);

      if (!connectionData) {
        console.warn(
          `Connection ${connectionId} not found in store for deletion`
        );
        return false;
      }
    }

    // Remove connection from cells using the spatial partitioning service
    const success = await removeConnectionFromCells(
      ownerUserId,
      spaceId,
      connectionId,
      connectionData
    );

    return success;
  } catch (error) {
    console.error('Error deleting connection:', error);
    return false;
  }
};

// Add a debug mode flag to control verbose logging
window.DEBUG_CONNECTIONS = false;

// Add utilities for debugging
export const enableConnectionDebugMode = () => {
  window.DEBUG_CONNECTIONS = true;
};

export const disableConnectionDebugMode = () => {
  window.DEBUG_CONNECTIONS = false;
};
