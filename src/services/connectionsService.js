import { db } from '../firebase';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  deleteDoc,
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

    await setDoc(connectionRef, serializedConnection);
  } catch (error) {
    console.error('Error saving connection:', error);
    // Simple fallback
    const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
    localStorage.setItem(fallbackKey, JSON.stringify(connection));
    throw error;
  }
};

// Add retry logic for subscriptions with spaceId and handle shared spaces
const createSubscriptionWithRetry = (
  userId,
  spaceId,
  callback,
  maxRetries = 3,
  delay = 1000
) => {
  let retryCount = 0;
  let unsubscribe = null;
  let isSubscribed = true;

  const subscribe = async () => {
    if (!userId || !spaceId) return () => {};

    try {
      // Check if this is a shared space
      const sharedStatus = await isSharedSpace(userId, spaceId);

      // If we unsubscribed while waiting for the async operation, return early
      if (!isSubscribed) return () => {};

      // Use the owner's ID to subscribe to the correct collection
      const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

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
          (snapshot) => {
            // Reset retry count on successful connection
            retryCount = 0;

            snapshot.docChanges().forEach((change) => {
              // Send the raw connection data without processing
              callback({
                type: change.type,
                id: change.doc.id,
                connection: change.doc.data(),
              });
            });
          },
          (error) => {
            console.error('Firestore subscription error:', error);

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying connection... Attempt ${retryCount}`);

              // Exponential backoff
              setTimeout(() => {
                subscribe();
              }, delay * Math.pow(2, retryCount - 1));
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
