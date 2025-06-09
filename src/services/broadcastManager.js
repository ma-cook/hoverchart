import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from './globalSubscriptionManager';

// Track callbacks for each subscription
const broadcastCallbacks = new Map(); // subscriptionKey -> Map(objectId -> callback)

/**
 * Subscribe to broadcast changes for a specific object in a cell
 * Uses global subscription manager to prevent multiple Firebase listeners for the same cell
 */
export const subscribeToBroadcastChanges = (
  spaceOwner,
  spaceId,
  objectId,
  cellId,
  callback
) => {
  if (!spaceOwner || !spaceId || !objectId || !cellId || !callback) {
    return () => {};
  }

  const subscriptionKey = generateSubscriptionKey.broadcasts(spaceId, cellId);

  // Add callback to tracking
  if (!broadcastCallbacks.has(subscriptionKey)) {
    broadcastCallbacks.set(subscriptionKey, new Map());
  }
  broadcastCallbacks.get(subscriptionKey).set(objectId, callback);

  // Use global subscription manager
  const { unsubscribe } = getOrCreateSubscription(
    subscriptionKey,
    SUBSCRIPTION_TYPES.BROADCASTS,
    () => {
      console.log(`🔥 Creating NEW broadcast subscription for cell: ${cellId}`);

      const cellRef = doc(
        db,
        'users',
        spaceOwner,
        'spaces',
        spaceId,
        'cells',
        cellId
      );

      return onSnapshot(
        cellRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const cellData = snapshot.data();
            const objects = cellData.objects || {};

            // Notify all registered callbacks for objects in this cell
            const callbacks = broadcastCallbacks.get(subscriptionKey);
            if (callbacks) {
              callbacks.forEach((callback, objId) => {
                const objectData = objects[objId];
                if (objectData) {
                  callback(objectData);
                }
              });
            }
          }
        },
        (error) => {
          console.error(
            `Broadcast subscription error for cell ${cellId}:`,
            error
          );
        }
      );
    }
  );

  // Return cleanup function
  return () => {
    const callbacks = broadcastCallbacks.get(subscriptionKey);
    if (callbacks) {
      callbacks.delete(objectId);
      if (callbacks.size === 0) {
        broadcastCallbacks.delete(subscriptionKey);
      }
    }
    unsubscribe();
  };
};

/**
 * Clean up all broadcast subscriptions (for app shutdown)
 */
export const cleanupAllBroadcastSubscriptions = () => {
  console.log('Cleaning up all broadcast callbacks...');
  broadcastCallbacks.clear();
};
