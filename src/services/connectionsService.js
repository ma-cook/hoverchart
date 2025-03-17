import { db } from '../firebase';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  deleteDoc,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { registerObjectConnection } from './connectionManager';
import { isSharedSpace } from './sharedSpacesService';

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

// Add connection state tracking
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

// Function to toggle network state
export const toggleNetwork = async (enable) => {
  try {
    if (enable && !isNetworkEnabled) {
      await enableNetwork(db);
      isNetworkEnabled = true;
      notifyConnectionListeners('connected');
      console.log('Firestore network enabled');
    } else if (!enable && isNetworkEnabled) {
      await disableNetwork(db);
      isNetworkEnabled = false;
      notifyConnectionListeners('disconnected');
      console.log('Firestore network disabled');
    }
  } catch (error) {
    console.error('Error toggling network:', error);
  }
};

// Add reconnection logic
export const forceReconnect = async () => {
  try {
    await disableNetwork(db);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await enableNetwork(db);
    isNetworkEnabled = true;
    notifyConnectionListeners('connected');
    console.log('Firestore force reconnected');
    return true;
  } catch (error) {
    console.error('Error during force reconnect:', error);
    return false;
  }
};

const serializeConnection = (connection) => {
  // Create a simplified serialized object without special caching logic
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
    color: connection.color || 'white',
    text: connection.text || '',
    textStyle: {
      fontSize: connection.textStyle?.fontSize || 1,
      color: connection.textStyle?.color || 'white',
      underline: connection.textStyle?.underline || false,
    },
  };
};

// Modified to include spaceId parameter and handle shared spaces
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

    const connectionRef = doc(
      db,
      'users',
      ownerUserId,
      'spaces',
      spaceId,
      'connections',
      connection.id.toString()
    );

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

    await setDoc(connectionRef, serializedConnection);
  } catch (error) {
    console.error('Error saving connection:', error);
    // Simple fallback
    const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
    localStorage.setItem(fallbackKey, JSON.stringify(connection));
    throw error;
  }
};

// Enhanced subscription with automatic reconnection logic
const createSubscriptionWithRetry = (
  userId,
  spaceId,
  callback,
  maxRetries = 5,
  delay = 1000
) => {
  let retryCount = 0;
  let unsubscribe = null;
  let isSubscribed = true;
  let lastDocumentCount = 0;
  let reconnectTimer = null;

  // Store the last received data to handle reconnection
  const lastReceivedData = new Map();

  const subscribe = async () => {
    if (!userId || !spaceId) return () => {};

    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);

      // If we unsubscribed while waiting for the async operation, return early
      if (!isSubscribed) return () => {};

      // Use the owner's ID to subscribe to the correct collection
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

      // Store owner ID for future reference
      window.currentSpaceOwner = ownerUserId;

      const connectionsRef = collection(
        db,
        'users',
        ownerUserId,
        'spaces',
        spaceId,
        'connections'
      );
      const q = query(connectionsRef);

      try {
        console.log(
          `[Connections] Setting up subscription for space ${spaceId} owned by ${ownerUserId}`
        );

        unsubscribe = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snapshot) => {
            // Check if this is from cache or server
            const source = snapshot.metadata.fromCache ? 'cache' : 'server';
            console.log(
              `[Connections] Got ${
                snapshot.docChanges().length
              } changes from ${source}`
            );

            // Reset retry count on successful connection
            retryCount = 0;

            // Check if we got documents when expected
            const documentCount = snapshot.docs.length;
            if (documentCount === 0 && lastDocumentCount > 0) {
              console.warn(
                'Received empty snapshot when expecting documents, may need to reconnect'
              );
              // Don't immediately reconnect as this might be legitimate (all docs deleted)
            }
            lastDocumentCount = documentCount;

            // Process changes
            snapshot.docChanges().forEach((change) => {
              // Store the latest data
              if (change.type !== 'removed') {
                lastReceivedData.set(change.doc.id, change.doc.data());
              } else {
                lastReceivedData.delete(change.doc.id);
              }

              // Send the raw connection data without processing
              callback({
                type: change.type,
                id: change.doc.id,
                connection: change.doc.data(),
              });
            });
          },
          async (error) => {
            console.error('Firestore connections subscription error:', error);

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(
                `Retrying connections subscription... Attempt ${retryCount}`
              );

              // Clear any existing timer
              if (reconnectTimer) {
                clearTimeout(reconnectTimer);
              }

              // Try force reconnect if this looks like a network issue
              if (
                error.code === 'unavailable' ||
                error.code === 'failed-precondition'
              ) {
                await forceReconnect();
              }

              // Exponential backoff
              reconnectTimer = setTimeout(() => {
                if (isSubscribed) {
                  if (unsubscribe) {
                    unsubscribe();
                    unsubscribe = null;
                  }
                  subscribe();
                }
              }, delay * Math.pow(2, retryCount - 1));
            } else {
              console.error(`Failed to reconnect after ${maxRetries} attempts`);

              // Last resort: re-deliver cached data
              if (lastReceivedData.size > 0) {
                console.log(
                  `Re-delivering ${lastReceivedData.size} cached connections`
                );
                lastReceivedData.forEach((data, id) => {
                  callback({
                    type: 'added',
                    id,
                    connection: data,
                    fromCache: true,
                  });
                });
              }
            }
          }
        );
        return unsubscribe;
      } catch (error) {
        console.error('Subscription setup error:', error);
        return () => {};
      }
    } catch (error) {
      console.error('Error checking shared space status:', error);
      return () => {};
    }
  };

  // Start the subscription process
  subscribe();

  // Return function to unsubscribe
  return () => {
    isSubscribed = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (unsubscribe) unsubscribe();
  };
};

// Update the export to use the retry logic and include spaceId
export const subscribeToConnections = (userId, spaceId, callback) => {
  return createSubscriptionWithRetry(userId, spaceId, callback);
};

// Add function to delete connections
export const deleteConnection = async (userId, spaceId, connectionId) => {
  if (!userId || !spaceId || !connectionId) return;

  try {
    // Check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared but without write permission, return early
    if (sharedStatus.isShared && sharedStatus.permissions !== 'write') {
      return;
    }

    // Use the owner's ID to delete from the correct collection
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const connectionRef = doc(
      db,
      'users',
      ownerUserId,
      'spaces',
      spaceId,
      'connections',
      connectionId.toString()
    );
    await deleteDoc(connectionRef);
  } catch (error) {
    // Silent error handling
  }
};
