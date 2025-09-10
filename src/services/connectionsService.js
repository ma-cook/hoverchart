import { db } from '../firebase';
import {
  enableNetwork,
  disableNetwork,
  doc,
  onSnapshot,
  collection,
  getDocs,
} from 'firebase/firestore';
import { isSharedSpace } from './sharedSpacesService';
import {
  addConnectionToCells,
  removeConnectionFromCells,
  removeConnectionFromAllCells,
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
  // Helper function to clean undefined values from objects
  const cleanObject = (obj) => {
    if (!obj) return null;

    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          // Recursively clean nested objects
          const cleanedNested = cleanObject(obj[key]);
          if (cleanedNested && Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = obj[key];
        }
      }
    });

    return Object.keys(cleaned).length > 0 ? cleaned : null;
  };

  return {
    id: connection.id,
    start: cleanObject(connection.start),
    end: cleanObject(connection.end),
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
    return false;
  }

  try {
    // First, check if this connection is in the deletion blacklist
    // Use direct imports instead of dynamic imports to avoid getState issues
    const connectionStore = useConnectionStore.getState();

    // Get objects from the connection store itself to verify references
    // We'll use a more lenient approach for new connections

    // Check if connection is being deleted
    if (connectionStore.deletingConnections.has(connection.id)) {
      return false;
    }

    // For now, skip the object existence check for new connections to avoid timing issues
    // The deletion blacklist will handle the main case of preventing re-saves of deleted connections

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return false;
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
  } catch (error) {
    // Error saving connection
    // Simple fallback
    try {
      const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(connection));
    } catch {
      // Failed to save to localStorage as well
      // Failed to save connection to localStorage
    }
    throw new Error(`Failed to save connection: ${error.message}`);
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

      // If no cells are loaded, try to load connections from all cells in the space
      // This handles the case where the app just started and spatial manager hasn't loaded cells yet
      if (effectiveCells.length === 0) {
        // No cells loaded yet, attempting to load connections from all cells in space

        try {
          // Get all cells that contain connections for this space
          const spaceRef = doc(db, 'users', ownerUserId, 'spaces', spaceId);
          const cellsCollectionRef = collection(spaceRef, 'cells');

          // Query for all cells that have connections
          const cellsSnapshot = await getDocs(cellsCollectionRef);

          if (!cellsSnapshot.empty) {
            // Found cells in space, checking for connections

            cellsSnapshot.forEach((cellDoc) => {
              if (cellDoc.exists()) {
                const cellData = cellDoc.data();
                const cellConnections = cellData.connections || {};

                if (Object.keys(cellConnections).length > 0) {
                  // Process each connection in the cell
                  Object.entries(cellConnections).forEach(
                    ([connectionId, connectionData]) => {
                      // Check deletion blacklist before processing
                      if (window._deletingConnections?.has(connectionId)) {
                        return;
                      }

                      try {
                        const { useConnectionStore } = window;
                        if (useConnectionStore) {
                          const connectionStore = useConnectionStore.getState();
                          if (
                            connectionStore.deletingConnections.has(
                              connectionId
                            )
                          ) {
                            return;
                          }
                        }
                      } catch {
                        // Continue processing if store access fails
                      }

                      // Add the connection
                      if (connectionData && typeof callback === 'function') {
                        callback({
                          type: 'added',
                          id: connectionId,
                          data: connectionData,
                          cell: cellDoc.id,
                        });
                      }
                    }
                  );
                }
              }
            });
          }
        } catch {
          // Error loading connections from all cells
        }

        return; // Don't set up individual cell subscriptions if we loaded from all cells
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
                    // CRITICAL FIX: Check deletion blacklist before processing any connection
                    // This prevents stale Firebase data from re-adding deleted connections
                    if (window._deletingConnections?.has(connectionId)) {
                      return;
                    }

                    // Also check connection store deletion blacklist
                    try {
                      const { useConnectionStore } = window;
                      if (useConnectionStore) {
                        const connectionStore = useConnectionStore.getState();
                        if (
                          connectionStore.deletingConnections.has(connectionId)
                        ) {
                          return;
                        }
                      }
                    } catch {
                      // Ignore errors accessing store
                    }

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
              () => {
                // Firebase snapshot error - permission denied is expected for unauthorized cells
              }
            );
          }
        );

        // Store the cleanup function
        unsubscribeFunctions.set(cellKey, globalUnsubscribe);
      }
    } catch {
      // Error starting connection subscriptions - handle silently
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

// Function to delete a connection
export const deleteConnection = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

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
      }
    } else {
      // Using provided connection data
    }

    // Remove connection from cells

    const success = await removeConnectionFromCells(
      ownerUserId,
      spaceId,
      connectionId,
      connectionData
    );

    return success;
  } catch {
    return false;
  }
};

// Enhanced connection deletion that ensures connections are removed from database
export const deleteConnectionEnhanced = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

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

    // If we don't have connection data, try to find it
    if (!connectionData) {
      // Try to find the connection in the connection store first
      const connections = useConnectionStore.getState().connections;
      const foundConnection = connections.find(
        (conn) => conn.id === connectionId
      );

      if (foundConnection) {
        connectionData = foundConnection;
      } else {
        // Connection not found in store, proceeding with fallback deletion
      }
    }

    let success = false;

    // Try the standard deletion method first
    if (
      connectionData &&
      connectionData.start?.position &&
      connectionData.end?.position
    ) {
      success = await removeConnectionFromCells(
        ownerUserId,
        spaceId,
        connectionId,
        connectionData
      );
    }

    // If standard deletion failed or we don't have position data, use fallback
    if (!success) {
      success = await removeConnectionFromAllCells(
        ownerUserId,
        spaceId,
        connectionId
      );
    }

    // **CRITICAL FIX**: If both methods failed, try aggressive deletion with updateDoc
    if (!success) {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs, doc, updateDoc, deleteField } =
          await import('firebase/firestore');

        const cellsRef = collection(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells'
        );
        const cellsSnapshot = await getDocs(cellsRef);

        let removedCount = 0;

        for (const cellDoc of cellsSnapshot.docs) {
          const cellData = cellDoc.data();
          if (cellData.connections && cellData.connections[connectionId]) {
            try {
              const cellRef = doc(
                db,
                'users',
                ownerUserId,
                'spaces',
                spaceId,
                'cells',
                cellDoc.id
              );
              await updateDoc(cellRef, {
                [`connections.${connectionId}`]: deleteField(),
              });

              removedCount++;
            } catch {
              // Failed to remove from cell
            }
          }
        }

        success = removedCount > 0;
      } catch {
        // Aggressive delete error - handle silently
      }
    }

    // Final verification - check if connection still exists
    if (success) {
      setTimeout(async () => {
        try {
          // Try to find the connection in any cell
          const { findConnectionInCells } = await import(
            './spatialPartitioning'
          );
          const found = await findConnectionInCells(
            ownerUserId,
            spaceId,
            connectionId
          );

          if (found) {
            // Connection still exists - try one more aggressive deletion
            await removeConnectionFromAllCells(
              ownerUserId,
              spaceId,
              connectionId
            );
          } else {
            // Connection successfully deleted
          }
        } catch {
          // Could not verify deletion
        }
      }, 1000);
    }

    return success;
  } catch {
    return false;
  }
};
