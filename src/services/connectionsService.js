import { db } from '../firebase';
import {
  enableNetwork,
  disableNetwork,
  doc,
  onSnapshot,
  collection,
  query,
  getDocs,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { isSharedSpace } from './sharedSpacesService';
import {
  addConnectionToCells,
  removeConnectionFromCells,
  removeConnectionFromAllCells,
  findConnectionInCells,
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

// Flag to pause listener processing during bulk operations
let listenersArePaused = false;

// Store active listener unsubscribe functions globally
const globalActiveListeners = new Map(); // cellId -> unsubscribe function

// Function to pause listeners during bulk saves
export const pauseConnectionListeners = async () => {
  console.log(
    '⏸️ [ConnectionService] Pausing connection listeners for bulk save'
  );
  listenersArePaused = true;

  // Unsubscribe from all active listeners to prevent snapshot events
  console.log(
    `🔇 [ConnectionService] Unsubscribing from ${globalActiveListeners.size} active listeners`
  );
  for (const [cellId, unsubscribe] of globalActiveListeners.entries()) {
    try {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    } catch (error) {
      console.warn(
        `⚠️ [ConnectionService] Failed to unsubscribe from ${cellId}:`,
        error
      );
    }
  }
  globalActiveListeners.clear();

  // Don't disable network - we need it to save connections!
  // Just unsubscribing listeners is enough to prevent the event avalanche
  console.log('✅ [ConnectionService] All connection listeners unsubscribed');
};

// Function to resume listeners after bulk saves
export const resumeConnectionListeners = async () => {
  console.log('▶️ [ConnectionService] Resuming connection listeners');

  // Don't need to enable network since we never disabled it
  // Just allow listeners to re-subscribe naturally
  listenersArePaused = false;

  // Note: Listeners will automatically re-subscribe when cells are loaded/updated
  // through the normal spatial partitioning flow
  console.log(
    '✅ [ConnectionService] Connection listeners will re-subscribe on next cell load'
  );
};

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

// Connection caching and unloading system
const connectionCache = new Map();

// Initialize global unloaded connections tracking if needed
if (typeof window !== 'undefined' && !window._unloadedConnections) {
  window._unloadedConnections = new Set();
}

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

  // CRITICAL: Don't create new subscriptions during bulk saves
  if (listenersArePaused) {
    console.log(
      '🚫 [ConnectionService] Skipping subscription - listeners paused for bulk save'
    );
    return () => {}; // Return no-op cleanup function
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

  // Ensure loadedCells is always an array and make it mutable
  let effectiveCells = Array.isArray(loadedCells) ? [...loadedCells] : [];

  let isSubscribed = true;
  const unsubscribeFunctions = new Map();

  // Track which cells we're actively subscribed to
  const activeSubscriptionCells = new Set();

  const startCellSubscriptions = async () => {
    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);
      if (!isSubscribed) return;

      // Use the owner's ID to get connections from the correct cells
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

      // For each cell, set up a subscription if we don't already have one
      for (const cellId of effectiveCells) {
        if (!activeSubscriptionCells.has(cellId)) {
          const [x, y, z] = cellId.split(',').map(Number);

          // Subscribe to the connections subcollection instead of the cell document
          // Using static imports from top of file to avoid 5-minute dynamic import delay
          const connectionsRef = collection(
            db,
            'users',
            ownerUserId,
            'spaces',
            spaceId,
            'cells',
            cellId,
            'connections'
          );

          const unsubscribe = onSnapshot(connectionsRef, (snapshot) => {
            // Skip processing if listeners are paused (during bulk saves)
            if (listenersArePaused) {
              console.log(
                '⏭️ [ConnectionService] Skipping snapshot processing - listeners paused'
              );
              return;
            }

            snapshot.docChanges().forEach((change) => {
              const connectionId = change.doc.id;
              const connectionData = change.doc.data();

              try {
                // Skip if connection is in deletion blacklist
                const connectionStore = useConnectionStore.getState();
                if (connectionStore.deletingConnections.has(connectionId))
                  return;

                if (change.type === 'added' || change.type === 'modified') {
                  // Add cell coordinates to connection data
                  const enrichedConnectionData = {
                    ...connectionData,
                    cellId,
                  };

                  callback({
                    type: change.type === 'added' ? 'added' : 'modified',
                    id: connectionId,
                    connection: enrichedConnectionData,
                    cellCoords: { x, y, z: z || 0 },
                  });
                } else if (change.type === 'removed') {
                  callback({
                    type: 'removed',
                    id: connectionId,
                    cellCoords: { x, y, z: z || 0 },
                  });
                }
              } catch (error) {
                console.error('Error processing connection:', error);
              }
            });
          });

          unsubscribeFunctions.set(cellId, unsubscribe);
          activeSubscriptionCells.add(cellId);

          // Store in global registry so we can unsubscribe during bulk saves
          globalActiveListeners.set(cellId, unsubscribe);
        }
      }

      // If no cells are loaded, wait for spatial partitioning to determine which cells to load
      // This ensures connections are only loaded through the spatial partitioning system
      if (effectiveCells.length === 0) {
        // No cells loaded yet - waiting for spatial partitioning system to provide cells
        return; // Don't load any connections until spatial manager provides cells
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

        // Create connections subcollection reference
        // Using static imports from top of file to avoid 5-minute dynamic import delay
        const connectionsRef = collection(
          db,
          'users',
          ownerUserId,
          'spaces',
          spaceId,
          'cells',
          cellKey,
          'connections'
        );

        // Use global subscription manager
        const { unsubscribe: globalUnsubscribe } = getOrCreateSubscription(
          subscriptionKey,
          SUBSCRIPTION_TYPES.CONNECTIONS,
          () => {
            // Create the actual Firebase subscription to the connections subcollection

            return onSnapshot(
              connectionsRef,
              { includeMetadataChanges: false },
              (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                  const connectionId = change.doc.id;
                  const connectionData = change.doc.data();

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

                  if (change.type === 'added' || change.type === 'modified') {
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
                        type: change.type === 'added' ? 'added' : 'modified',
                        id: connectionId,
                        connection: connectionData,
                        cellCoords: { x, y, z: z || 0 },
                      });
                    }
                  } else if (change.type === 'removed') {
                    // Handle removed connection
                    connectionCache.delete(cacheKey);
                    callback({
                      type: 'removed',
                      id: connectionId,
                      cellCoords: { x, y, z: z || 0 },
                    });
                  }
                });
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
        // Using static imports from top of file to avoid 5-minute dynamic import delay
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
          // Using static imports from top of file to avoid 5-minute dynamic import delay
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
