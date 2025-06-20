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
} from './spatialPartitioning';

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from './globalSubscriptionManager';

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
    textStyle: {
      fontSize: connection.textStyle?.fontSize || 1,
      color: connection.textStyle?.color || 'black',
      underline: connection.textStyle?.underline || false,
    },
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

    // Add creator ID for shared spaces
    serializedConnection.creatorId = userId;
    serializedConnection.lastUpdated = new Date().toISOString();

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

  // Ensure loadedCells is always an array
  const safeCells = Array.isArray(loadedCells) ? loadedCells : [];

  let isSubscribed = true;
  const unsubscribeFunctions = new Map();

  const startCellSubscriptions = async () => {
    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);
      if (!isSubscribed) return;

      // Use the owner's ID to get connections from the correct cells
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId; // Guard against empty cells
      if (safeCells.length === 0) {
        return;
      }

      // Subscribe to each loaded cell
      for (const cellKey of safeCells) {
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
            return onSnapshot(
              cellRef,
              { includeMetadataChanges: false },
              (snapshot) => {
                if (!snapshot.exists()) {
                  return;
                }

                const cellData = snapshot.data();
                const cellConnections = cellData.connections || {};

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
export const deleteConnection = async (userId, spaceId, connectionId) => {
  if (!userId || !spaceId || !connectionId) return;

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    // Use the owner's ID to delete from the correct cells
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Remove connection from cells using the spatial partitioning service
    const success = await removeConnectionFromCells(
      ownerUserId,
      spaceId,
      connectionId
    );
    if (!success) {
      // Failed to remove connection from cells
    }
  } catch {
    // Error deleting connection
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
