import { db } from '../firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { registerObjectConnection } from './connectionManager';
import { isSharedSpace } from './sharedSpacesService';
import {
  addConnectionToCells,
  removeConnectionFromCells,
} from './spatialPartitioning';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn(
      'Multiple tabs open, persistence can only be enabled in one tab at a time.'
    );
  } else if (err.code === 'unimplemented') {
    console.warn("Browser doesn't support persistence");
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
    } catch (e) {
      console.error('Error in connection listener:', e);
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
  } catch (error) {
    console.error('Error toggling network:', error);
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
    lineStyle: connection.lineStyle || 'straight',
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

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Track changes that we've already processed to avoid duplicates
const processedChanges = new Set();

// Add connection cache tracking
const connectionCache = new Map();

// Add this function at the top level
const clearConnectionCache = (spaceId, connectionId) => {
  const cacheKey = `${spaceId}_${connectionId}`;
  connectionCache.delete(cacheKey);
  processedChanges.delete(cacheKey);

  // Also clear from lastReceivedData if it exists
  const subscription = activeSubscriptions.get(`${spaceId}_${connectionId}`);
  if (subscription?.lastReceivedData) {
    subscription.lastReceivedData.delete(connectionId);
  }
};

// Modified to use cell-based storage instead of space-level storage
export const saveConnection = async (userId, spaceId, connection) => {
  if (!userId || !spaceId || !connection?.id) return;

  try {
    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      console.warn(
        'Cannot save connection: no write permission for shared space'
      );
      return;
    }

    // Use the owner's ID to save to the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Ensure IDs are strings for consistency
    if (connection.start?.objectId) {
      const startObjectId = connection.start.objectId.toString();
      connection.start.objectId = startObjectId;
      registerObjectConnection(startObjectId, connection.id);
    }

    if (connection.end?.objectId) {
      const endObjectId = connection.end.objectId.toString();
      connection.end.objectId = endObjectId;
      registerObjectConnection(endObjectId, connection.id);
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
  } catch (error) {
    console.error('Error saving connection:', error);
    // Simple fallback
    try {
      const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(connection));
    } catch (storageErr) {
      console.warn('Failed to save connection to localStorage:', storageErr);
    }
    throw error;
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
    console.error('Anonymous connection access requires owner ID in URL');
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

// New cell-based connection subscription
const subscribeToCellConnections = (
  userId,
  spaceId,
  callback,
  loadedCells = []
) => {
  if (!userId || !spaceId) {
    return () => {};
  }

  let isSubscribed = true;
  let currentConnections = new Map();

  const updateConnections = async () => {
    if (!isSubscribed) return;

    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);
      if (!isSubscribed) return;

      // Use the owner's ID to get connections from the correct cells
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;
      // Get connections from all loaded cells
      const { getConnectionsFromCells } = await import('./spatialPartitioning');
      const cellConnections = await getConnectionsFromCells(
        ownerUserId,
        spaceId,
        loadedCells
      );

      // Process new connections
      const newConnectionMap = new Map();
      const seenConnections = new Set();

      cellConnections.forEach((connection) => {
        // Avoid duplicate connections that appear in multiple cells
        if (seenConnections.has(connection.id)) return;
        seenConnections.add(connection.id);

        newConnectionMap.set(connection.id, connection);

        // If this is a new connection, notify callback
        if (!currentConnections.has(connection.id)) {
          callback({
            type: 'added',
            id: connection.id,
            connection: connection,
          });
        } else {
          // Check if connection was modified
          const existing = currentConnections.get(connection.id);
          if (JSON.stringify(existing) !== JSON.stringify(connection)) {
            callback({
              type: 'modified',
              id: connection.id,
              connection: connection,
            });
          }
        }
      });

      // Check for removed connections
      currentConnections.forEach((connection, id) => {
        if (!newConnectionMap.has(id)) {
          callback({
            type: 'removed',
            id: id,
            connection: connection,
          });
        }
      });

      currentConnections = newConnectionMap;
    } catch (error) {
      console.error('Error updating cell connections:', error);
    }
  };
  // Initial load only
  updateConnections();

  // Return cleanup function
  return () => {
    isSubscribed = false;
    currentConnections.clear();
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
      console.warn('Failed to remove connection from cells');
    }
  } catch (error) {
    console.error('Error deleting connection:', error);
  }
};

// Add a debug mode flag to control verbose logging
window.DEBUG_CONNECTIONS = false;

// Add utilities for debugging
export const enableConnectionDebugMode = () => {
  window.DEBUG_CONNECTIONS = true;
  console.log('Connection debug mode enabled');
};

export const disableConnectionDebugMode = () => {
  window.DEBUG_CONNECTIONS = false;
  console.log('Connection debug mode disabled');
};
