import { db } from '../firebase';
import {
  enableNetwork,
  disableNetwork,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { isSharedSpace } from './sharedSpacesService';
import {
  addConnectionToCells,
  removeConnectionFromCells,
} from './spatialPartitioning';
import useConnectionStore from '../stores/connectionStore';

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from './globalSubscriptionManager';

// Note: Firestore persistence is now configured in firebase.js

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

// Connection caching system
const connectionCache = new Map();

const clearConnectionCache = (spaceId, connectionId) => {
  const cacheKey = connectionId ? `${spaceId}_${connectionId}` : null;

  if (cacheKey) {
    connectionCache.delete(cacheKey);
  } else {
    // Clear all cached connections for this space
    for (const key of connectionCache.keys()) {
      if (key.startsWith(`${spaceId}_`)) {
        connectionCache.delete(key);
      }
    }
  }
};

// Serialize connection for storage
const serializeConnection = (connection) => {
  return {
    id: connection.id,
    start: connection.start,
    end: connection.end,
    lineStyle: connection.lineStyle || connection.styleType || 'straight',
    styleType: connection.styleType || connection.lineStyle || 'straight',
    color: connection.color || 'black',
    text: connection.text || '',
    textStyle: connection.textStyle || {},
    dashDirection: connection.dashDirection || null,
    dashOffset: connection.dashOffset || 0,
    createdAt: connection.createdAt || new Date().toISOString(),
    lastUpdated: connection.lastUpdated || new Date().toISOString(),
    _lastSaved: connection._lastSaved || Date.now(),
  };
};

// Function to enable network
export const enableConnectionNetwork = async () => {
  if (!isNetworkEnabled) {
    try {
      await enableNetwork(db);
      isNetworkEnabled = true;
      notifyConnectionListeners({ isOnline: true });
    } catch {
      // Error enabling network
    }
  }
};

// Function to disable network
export const disableConnectionNetwork = async () => {
  if (isNetworkEnabled) {
    try {
      await disableNetwork(db);
      isNetworkEnabled = false;
      notifyConnectionListeners({ isOnline: false });
    } catch {
      // Error disabling network
    }
  }
};

// Function to get network state
export const getConnectionNetworkState = () => isNetworkEnabled;

// Modified to use cell-based storage instead of space-level storage
export const saveConnection = async (userId, spaceId, connection) => {
  if (!userId || !spaceId || !connection?.id) {
    return;
  }

  try {
    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    // Use the owner's ID to save to the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Ensure IDs are strings for consistency
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

// Update the export to use cell-based connection loading
export const subscribeToConnections = (
  userId,
  spaceId,
  callback,
  loadedCells = []
) => {
  if (!spaceId) return () => {};

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
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

      // If no cells are loaded, skip subscription since there's no area to monitor
      if (effectiveCells.length === 0) {
        console.log('🔗 No cells loaded, skipping connection subscription');
        return;
      }

      // Subscribe to each loaded cell
      for (const cellKey of effectiveCells) {
        if (!cellKey || typeof cellKey !== 'string') {
          continue;
        }

        const [x, y, z] = cellKey.split(',').map(Number);
        const subscriptionKey = generateSubscriptionKey.connections(
          spaceId,
          cellKey
        );

        // Create cell reference
        const cellRef = doc(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells',
          cellKey
        );

        // Use global subscription manager
        const { unsubscribe: globalUnsubscribe } = getOrCreateSubscription(
          subscriptionKey,
          SUBSCRIPTION_TYPES.CONNECTIONS,
          () => {
            // Create the actual Firebase subscription
            console.log(
              '🔗 Setting up Firebase subscription for cell:',
              cellKey
            );
            return onSnapshot(
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

                console.log('📄 Cell data:', {
                  cellKey,
                  hasConnections: !!cellData.connections,
                  connectionCount: Object.keys(cellConnections).length,
                  connectionIds: Object.keys(cellConnections),
                });

                // Process each connection in the cell
                Object.entries(cellConnections).forEach(
                  ([connectionId, connectionData]) => {
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

                    if (hasChanged) {
                      connectionCache.set(
                        cacheKey,
                        JSON.parse(JSON.stringify(connectionData))
                      );
                      console.log('📤 Sending connection event to callback:', {
                        type: 'added',
                        id: connectionId,
                      });
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
                const currentConnectionIds = new Set(
                  Object.keys(cellConnections)
                );
                const cachedConnectionIds = new Set();

                for (const cacheKey of connectionCache.keys()) {
                  if (cacheKey.startsWith(`${spaceId}_`)) {
                    const connectionId = cacheKey.substring(
                      `${spaceId}_`.length
                    );
                    const connectionData = connectionCache.get(cacheKey);

                    // Check if this connection belongs to this cell
                    if (connectionData && connectionData.cellId === cellKey) {
                      cachedConnectionIds.add(connectionId);
                    }
                  }
                }

                // Find removed connections
                for (const connectionId of cachedConnectionIds) {
                  if (!currentConnectionIds.has(connectionId)) {
                    const cacheKey = `${spaceId}_${connectionId}`;
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
                console.warn(
                  'Firebase snapshot error for cell:',
                  cellKey,
                  error
                );
                if (error.code === 'permission-denied') {
                  return;
                }
              }
            );
          }
        );

        // Store the cleanup function
        unsubscribeFunctions.set(cellKey, globalUnsubscribe);
      }
    } catch (error) {
      console.error('Error starting connection subscriptions:', error);
    }
  };

  startCellSubscriptions();

  // Return cleanup function
  return () => {
    isSubscribed = false;
    unsubscribeFunctions.forEach((cleanup) => cleanup());
    unsubscribeFunctions.clear();
  };
};

// Connection removal function
export const removeConnection = async (
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
      const foundConnection = connections.find(
        (conn) => conn.id === connectionId
      );

      if (foundConnection) {
        connectionData = foundConnection;
      } else {
        // If not found in store, we'll use a basic deletion approach
        console.warn('Connection data not found for deletion:', connectionId);
      }
    }

    // Remove connection from cells
    const success = await removeConnectionFromCells(
      ownerUserId,
      spaceId,
      connectionId,
      connectionData
    );

    return success;
  } catch (error) {
    console.error('Error removing connection:', error);
    return false;
  }
};
