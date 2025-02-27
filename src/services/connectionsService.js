import { db } from '../firebase';
import { doc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { registerObjectConnection } from './connectionManager';

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
  // Log input to help debug
  console.log('Serializing connection with positions:', {
    startPos: connection.start?.position,
    endPos: connection.end?.position,
  });

  return {
    id: connection.id,
    start: {
      type: connection.start?.type || 'cube',
      face: connection.start?.face || 0,
      objectId: connection.start?.objectId || null,
      position: connection.start?.position || [0, 0, 0], // Preserve position data
      faceCenter: connection.start?.faceCenter || [0, 0, 0],
    },
    end: {
      type: connection.end?.type || 'cube',
      face: connection.end?.face || 0,
      objectId: connection.end?.objectId || null,
      position: connection.end?.position || [0, 0, 0], // Preserve position data
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

// Create a cache to track recently saved connections
const recentSaveCache = new Map();
const SAVE_DEBOUNCE_TIME = 500; // ms

// Add error handling to save operations
export const saveConnection = async (userId, connection) => {
  if (!userId || !connection?.id) return;

  // Create cache key
  const cacheKey = `${userId}_${connection.id}`;
  const now = Date.now();
  const lastSave = recentSaveCache.get(cacheKey);

  // Debounce saves - don't save the same connection more than once every 500ms
  if (lastSave && now - lastSave < SAVE_DEBOUNCE_TIME) {
    console.log(`Debouncing save for connection ${connection.id}`);
    return;
  }

  // Update last save time
  recentSaveCache.set(cacheKey, now);

  try {
    const connectionRef = doc(
      db,
      'users',
      userId,
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
    await setDoc(connectionRef, serializedConnection);

    // Log success for debugging
    console.log(`Connection ${connection.id} saved with objects:`, {
      start: connection.start?.objectId,
      end: connection.end?.objectId,
    });
  } catch (error) {
    console.error('Error saving connection:', error);
    // Implement local storage fallback
    const fallbackKey = `connection_${userId}_${connection.id}`;
    localStorage.setItem(fallbackKey, JSON.stringify(connection));
    throw error;
  }
};

// Add retry logic for subscriptions
const createSubscriptionWithRetry = (
  userId,
  callback,
  maxRetries = 3,
  delay = 1000
) => {
  let retryCount = 0;

  const subscribe = () => {
    if (!userId) return () => {};

    const connectionsRef = collection(db, 'users', userId, 'connections');
    const q = query(connectionsRef);

    try {
      return onSnapshot(
        q,
        (snapshot) => {
          // Reset retry count on successful connection
          retryCount = 0;

          snapshot.docChanges().forEach((change) => {
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
    } catch (error) {
      console.error('Subscription setup error:', error);
      return () => {};
    }
  };

  return subscribe();
};

// Update the export to use the retry logic
export const subscribeToConnections = (userId, callback) => {
  return createSubscriptionWithRetry(userId, callback);
};
