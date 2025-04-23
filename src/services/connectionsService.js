import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  deleteDoc,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import {
  registerObjectConnection,
  unregisterObjectConnection,
} from './connectionManager';
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
    color: connection.color || 'white',
    // More explicit text handling - ensure text is always a string
    text: typeof connection.text === 'string' ? connection.text : '',
    textStyle: {
      fontSize: connection.textStyle?.fontSize || 1,
      color: connection.textStyle?.color || 'white',
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
    return true; // Indicate success
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

// Update the export to use subscribe function directly
export const subscribeToConnections = (userId, spaceId, callback) => {
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

  // Remove the unused startSubscription function
  // Just call subscribe directly
  return subscribe(effectiveOwnerId, spaceId, callback);
};

// Keep the subscribe function as is, it's being used
const subscribe = (userId, spaceId, callback) => {
  // Create a unique key for this subscription
  const subscriptionKey = `${userId}-${spaceId}`;

  // Clear caches when creating new subscription
  if (!activeSubscriptions.has(subscriptionKey)) {
    processedChanges.clear();
    connectionCache.clear();
  }

  // Clear any previously processed changes when creating a new subscription
  processedChanges.clear();

  let unsubscribe = null;
  let isSubscribed = true;

  // Store the last received data to handle reconnection
  const lastReceivedData = new Map();

  const subscribe = async () => {
    if (!userId || !spaceId) {
      return () => {};
    }

    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);

      // If we unsubscribed while waiting for the async operation, return early
      if (!isSubscribed) {
        return () => {};
      }

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
        unsubscribe = onSnapshot(
          q,
          { includeMetadataChanges: false }, // Only interested in actual data changes
          (snapshot) => {
            // Count unique changes to actually process to reduce noise
            const newChangesToProcess = snapshot
              .docChanges()
              .filter((change) => {
                // Create a unique key that includes document data hash
                const data = change.doc.data();
                const dataHash = JSON.stringify(data);
                const changeKey = `${change.type}-${change.doc.id}-${dataHash}`;

                if (processedChanges.has(changeKey)) {
                  return false; // We've seen this exact change before
                }

                // Only keep the most recent 300 processed changes to prevent memory leaks
                if (processedChanges.size > 300) {
                  const oldestChange = Array.from(processedChanges)[0];
                  processedChanges.delete(oldestChange);
                }

                processedChanges.add(changeKey);
                return true;
              });

            // Only process changes we haven't seen before
            newChangesToProcess.forEach((change) => {
              // Store the latest data
              if (change.type !== 'removed') {
                lastReceivedData.set(change.doc.id, change.doc.data());
              } else {
                lastReceivedData.delete(change.doc.id);

                // If we're removing a connection, unregister it from any objects
                const connectionData = change.doc.data();
                if (connectionData.start?.objectId) {
                  unregisterObjectConnection(
                    connectionData.start.objectId,
                    change.doc.id
                  );
                }
                if (connectionData.end?.objectId) {
                  unregisterObjectConnection(
                    connectionData.end.objectId,
                    change.doc.id
                  );
                }
              }

              // Send the raw connection data without processing
              try {
                callback({
                  type: change.type,
                  id: change.doc.id,
                  connection: change.doc.data(),
                });
              } catch (callbackErr) {
                console.error('Error in connection callback:', callbackErr);
              }
            });
          },
          async (error) => {
            console.error('Error in connections subscription:', error);

            // Special handling for permission errors with anonymous access
            if (error.code === 'permission-denied' && !userId) {
              console.error(
                'Anonymous access denied for connections. Space may not be public.'
              );
              return;
            }
          }
        );

        const cleanupFn = () => {
          isSubscribed = false;
          if (unsubscribe) {
            try {
              unsubscribe();
            } catch (err) {
              console.warn('Error during unsubscribe:', err);
            }
          }
          activeSubscriptions.delete(subscriptionKey);
        };

        activeSubscriptions.set(subscriptionKey, cleanupFn);
        return cleanupFn;
      } catch (error) {
        console.error('Subscription setup error:', error);
        activeSubscriptions.delete(subscriptionKey);
        return () => {};
      }
    } catch (error) {
      console.error('Error checking shared space status:', error);
      activeSubscriptions.delete(subscriptionKey);
      return () => {};
    }
  };

  // Return a function that will properly clean up the subscription
  const unsubscribeFn = () => {
    isSubscribed = false;
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (err) {
        console.warn('Error during unsubscribe:', err);
      }
    }
    activeSubscriptions.delete(subscriptionKey);
  };

  // Start the subscription process
  subscribe().catch((error) => {
    console.error('Error in subscription process:', error);
  });

  return unsubscribeFn;
};

// Add function to delete connections
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

    // Get the connection data to find object IDs
    const connDoc = await getDoc(connectionRef);
    if (connDoc.exists()) {
      const connData = connDoc.data();
      if (connData.start?.objectId) {
        unregisterObjectConnection(connData.start.objectId, connectionId);
      }
      if (connData.end?.objectId) {
        unregisterObjectConnection(connData.end.objectId, connectionId);
      }
    }

    await deleteDoc(connectionRef);
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

// Add debug utility for connection text
export const logConnectionData = (connectionId) => {
  return async (userId, spaceId) => {
    if (!userId || !spaceId || !connectionId) return null;

    try {
      // Determine owner ID
      const sharedStatus = await isSharedSpace(userId, spaceId);
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

      const snapshot = await getDoc(connectionRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('Connection data:', data);
        return data;
      }
      return null;
    } catch (e) {
      console.error('Error fetching connection:', e);
      return null;
    }
  };
};

// Add this function to help users debug connection text issues
export const debugConnectionText = async (userId, spaceId) => {
  if (!userId || !spaceId) return;

  try {
    // Determine owner ID
    const sharedStatus = await isSharedSpace(userId, spaceId);
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    // Get all connections
    const connectionsRef = collection(
      db,
      'users',
      ownerUserId,
      'spaces',
      spaceId,
      'connections'
    );

    const snapshot = await getDocs(connectionsRef);

    console.log(`Found ${snapshot.size} connections`);

    // Log all connections with text
    let hasText = false;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.text && data.text.trim() !== '') {
        hasText = true;
        console.log(`Connection ${doc.id} has text: "${data.text}"`);
        console.log('Full connection data:', data);
      }
    });

    if (!hasText) {
      console.log('No connections with text found.');
    }

    return snapshot.size;
  } catch (e) {
    console.error('Error debugging connections:', e);
    return 0;
  }
};
