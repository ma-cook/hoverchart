import { db } from '../firebase';
import { doc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';

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
  return {
    id: connection.id,
    start: {
      type: connection.start?.type || 'cube',
      face: connection.start?.face || 0,
      position: connection.start?.position || [0, 0, 0],
      faceCenter: connection.start?.faceCenter || [0, 0, 0],
    },
    end: {
      type: connection.end?.type || 'cube',
      face: connection.end?.face || 0,
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

// Add error handling to save operations
export const saveConnection = async (userId, connection) => {
  if (!userId || !connection?.id) return;

  try {
    const connectionRef = doc(
      db,
      'users',
      userId,
      'connections',
      connection.id.toString()
    );
    const serializedConnection = serializeConnection(connection);
    await setDoc(connectionRef, serializedConnection);
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
