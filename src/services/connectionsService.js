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
    console.log(`🚫 [saveConnection] Missing required parameters:`, {
      userId: !!userId,
      spaceId: !!spaceId,
      connectionId: connection?.id,
    });
    return;
  }

  try {
    console.log(
      `💾 [saveConnection] Starting save for connection: ${connection.id}`
    );

    // First, check if this connection is in the deletion blacklist
    // Use direct imports instead of dynamic imports to avoid getState issues
    const connectionStore = useConnectionStore.getState();

    // Get objects from the connection store itself to verify references
    // We'll use a more lenient approach for new connections

    // Check if connection is being deleted
    if (connectionStore.deletingConnections.has(connection.id)) {
      console.log(
        `🚫 [saveConnection] Blocked saving deleted connection: ${connection.id}`
      );
      return;
    }

    // For now, skip the object existence check for new connections to avoid timing issues
    // The deletion blacklist will handle the main case of preventing re-saves of deleted connections
    console.log(
      `� [saveConnection] Connection ${connection.id} passed deletion blacklist check, proceeding with save`
    );

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.log(`🚫 [saveConnection] No write permission for shared space`);
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

    console.log(
      `💾 [saveConnection] Saving connection ${connection.id} to database`
    );

    // Save connection to appropriate cells instead of space-level collection
    const success = await addConnectionToCells(
      ownerUserId,
      spaceId,
      serializedConnection
    );

    if (success) {
      console.log(
        `✅ [saveConnection] Successfully saved connection ${connection.id}`
      );
      return true; // Indicate success
    } else {
      throw new Error('Failed to save connection to cells');
    }
  } catch (error) {
    console.error(
      `❌ [saveConnection] Error saving connection ${connection.id}:`,
      error
    );

    // Error saving connection
    // Simple fallback
    try {
      const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(connection));
      console.log(
        `💾 [saveConnection] Saved connection ${connection.id} to localStorage as fallback`
      );
    } catch (fallbackError) {
      console.error(
        `❌ [saveConnection] Failed to save connection to localStorage:`,
        fallbackError
      );
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
                    // CRITICAL FIX: Check deletion blacklist before processing any connection
                    // This prevents stale Firebase data from re-adding deleted connections
                    if (window._deletingConnections?.has(connectionId)) {
                      console.log(
                        `🚫 [Firebase Listener] Blocked stale connection data: ${connectionId}`
                      );
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
                          console.log(
                            `🚫 [Firebase Listener] Blocked connection in store deletion blacklist: ${connectionId}`
                          );
                          return;
                        }
                      }
                    } catch (error) {
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

// Function to delete a connection
export const deleteConnection = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  console.log(`🗑️ [Connection Service] deleteConnection called:`, {
    userId,
    spaceId,
    connectionId,
    hasConnectionData: !!connectionData,
  });

  if (!userId || !spaceId || !connectionId) {
    console.error(`❌ [Connection Service] Missing required parameters:`, {
      userId: !!userId,
      spaceId: !!spaceId,
      connectionId: !!connectionId,
    });
    return false;
  }

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);
    console.log(
      `🗑️ [Connection Service] Cleared cache for connection ${connectionId}`
    );

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);
    console.log(`🗑️ [Connection Service] Shared space status:`, sharedStatus);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn(
        `❌ [Connection Service] No write permission for shared space`
      );
      return false;
    }

    // Use the owner's ID to delete from the correct cells
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
    console.log(`🗑️ [Connection Service] Using owner ID: ${ownerUserId}`);

    // If we don't have connection data, we need to find it first
    if (!connectionData) {
      console.log(
        `🗑️ [Connection Service] No connection data provided, searching store...`
      );
      // Try to find the connection in the connection store first
      const connections = useConnectionStore.getState().connections;
      const foundConnection = connections.find(
        (conn) => conn.id === connectionId
      );

      if (foundConnection) {
        connectionData = foundConnection;
        console.log(`🗑️ [Connection Service] Found connection data in store:`, {
          id: connectionData.id,
          startPos: connectionData.start?.position,
          endPos: connectionData.end?.position,
        });
      } else {
        // If not found in store, we'll use a basic deletion approach
        console.warn(
          `⚠️ [Connection Service] Connection data not found for deletion: ${connectionId}`
        );
      }
    } else {
      console.log(`🗑️ [Connection Service] Using provided connection data:`, {
        id: connectionData.id,
        startPos: connectionData.start?.position,
        endPos: connectionData.end?.position,
      });
    }

    // Remove connection from cells
    console.log(`🗑️ [Connection Service] Calling removeConnectionFromCells...`);
    const success = await removeConnectionFromCells(
      ownerUserId,
      spaceId,
      connectionId,
      connectionData
    );

    console.log(
      `🗑️ [Connection Service] removeConnectionFromCells result: ${success}`
    );
    return success;
  } catch (error) {
    console.error(`❌ [Connection Service] Error deleting connection:`, error);
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
  console.log(
    `🔧 [Enhanced Connection Delete] Starting deletion for connection: ${connectionId}`
  );

  if (!userId || !spaceId || !connectionId) {
    console.error(
      `❌ [Enhanced Connection Delete] Missing required parameters:`,
      {
        userId: !!userId,
        spaceId: !!spaceId,
        connectionId: !!connectionId,
      }
    );
    return false;
  }

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);
    console.log(
      `🔧 [Enhanced Connection Delete] Cleared cache for connection ${connectionId}`
    );

    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);
    console.log(
      `🔧 [Enhanced Connection Delete] Shared space status:`,
      sharedStatus
    );

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn(
        `❌ [Enhanced Connection Delete] No write permission for shared space`
      );
      return false;
    }

    // Use the owner's ID to delete from the correct cells
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
    console.log(
      `🔧 [Enhanced Connection Delete] Using owner ID: ${ownerUserId}`
    );

    // If we don't have connection data, try to find it
    if (!connectionData) {
      console.log(
        `🔧 [Enhanced Connection Delete] No connection data provided, searching store...`
      );
      // Try to find the connection in the connection store first
      const connections = useConnectionStore.getState().connections;
      const foundConnection = connections.find(
        (conn) => conn.id === connectionId
      );

      if (foundConnection) {
        connectionData = foundConnection;
        console.log(
          `🔧 [Enhanced Connection Delete] Found connection data in store`
        );
      } else {
        console.log(
          `🔧 [Enhanced Connection Delete] Connection not found in store, proceeding with fallback deletion`
        );
      }
    }

    let success = false;

    // Try the standard deletion method first
    if (
      connectionData &&
      connectionData.start?.position &&
      connectionData.end?.position
    ) {
      console.log(
        `🔧 [Enhanced Connection Delete] Attempting standard deletion with position data...`
      );
      success = await removeConnectionFromCells(
        ownerUserId,
        spaceId,
        connectionId,
        connectionData
      );
      console.log(
        `🔧 [Enhanced Connection Delete] Standard deletion result: ${success}`
      );
    }

    // If standard deletion failed or we don't have position data, use fallback
    if (!success) {
      console.log(
        `🔧 [Enhanced Connection Delete] Standard deletion failed or no position data, trying fallback...`
      );
      success = await removeConnectionFromAllCells(
        ownerUserId,
        spaceId,
        connectionId
      );
      console.log(
        `🔧 [Enhanced Connection Delete] Fallback deletion result: ${success}`
      );
    }

    // **CRITICAL FIX**: If both methods failed, try aggressive deletion with updateDoc
    if (!success) {
      console.log(
        `🔧 [Enhanced Connection Delete] Both methods failed, trying AGGRESSIVE deletion...`
      );
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
        console.log(
          `🔧 [Aggressive Delete] Checking ${cellsSnapshot.size} cells for connection ${connectionId}`
        );

        for (const cellDoc of cellsSnapshot.docs) {
          const cellData = cellDoc.data();
          if (cellData.connections && cellData.connections[connectionId]) {
            console.log(
              `🔧 [Aggressive Delete] Found connection ${connectionId} in cell ${cellDoc.id}, removing...`
            );

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
              console.log(
                `✅ [Aggressive Delete] Removed connection ${connectionId} from cell ${cellDoc.id}`
              );
            } catch (error) {
              console.error(
                `❌ [Aggressive Delete] Failed to remove from cell ${cellDoc.id}:`,
                error
              );
            }
          }
        }

        success = removedCount > 0;
        console.log(
          `🔧 [Aggressive Delete] Removed connection from ${removedCount} cells. Success: ${success}`
        );
      } catch (aggressiveError) {
        console.error(`❌ [Aggressive Delete] Error:`, aggressiveError);
      }
    }

    // Final verification - check if connection still exists
    if (success) {
      console.log(`🔧 [Enhanced Connection Delete] Verifying deletion...`);
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
            console.error(
              `❌ [Enhanced Connection Delete] VERIFICATION FAILED: Connection ${connectionId} still exists in database!`
            );
            // Try one more aggressive deletion
            console.log(
              `🔧 [Enhanced Connection Delete] Attempting final aggressive deletion...`
            );
            await removeConnectionFromAllCells(
              ownerUserId,
              spaceId,
              connectionId
            );
          } else {
            console.log(
              `✅ [Enhanced Connection Delete] VERIFICATION PASSED: Connection ${connectionId} successfully deleted`
            );
          }
        } catch (verifyError) {
          console.warn(
            `⚠️ [Enhanced Connection Delete] Could not verify deletion:`,
            verifyError
          );
        }
      }, 1000);
    }

    console.log(
      `🔧 [Enhanced Connection Delete] Final result for connection ${connectionId}: ${success}`
    );
    return success;
  } catch (error) {
    console.error(
      `❌ [Enhanced Connection Delete] Error deleting connection:`,
      error
    );
    return false;
  }
};
