/**
 * Global Subscription Manager
 *
 * Centralized subscription management to prevent duplicate Firebase listeners
 * and reduce excessive channel requests during camera movement.
 */

// Global registry for all Firebase subscriptions
const globalSubscriptions = new Map(); // subscriptionKey -> { unsubscribe, refCount, timestamp, type }
const CLEANUP_INTERVAL = 300000; // 5 minutes
const MAX_SUBSCRIPTION_AGE = 600000; // 10 minutes

// Subscription types for better tracking
export const SUBSCRIPTION_TYPES = {
  SPATIAL_OBJECTS: 'spatial_objects',
  CONNECTIONS: 'connections',
  WEBRTC_SIGNALING: 'webrtc_signaling',
  PRESENCE: 'presence',
  BROADCASTS: 'broadcasts',
  LEGACY_OBJECTS: 'legacy_objects',
  CELLS: 'cells',
};

// Performance metrics
const subscriptionMetrics = {
  created: 0,
  reused: 0,
  cleaned: 0,
  active: 0,
};

/**
 * Get or create a subscription with automatic deduplication
 * @param {string} subscriptionKey - Unique key for the subscription
 * @param {string} type - Type of subscription (from SUBSCRIPTION_TYPES)
 * @param {Function} createSubscriptionFn - Function that creates the actual Firebase subscription
 * @returns {Object} - { unsubscribe: Function, isNew: boolean }
 */
export const getOrCreateSubscription = (
  subscriptionKey,
  type,
  createSubscriptionFn
) => {
  if (!subscriptionKey || !type || !createSubscriptionFn) {
    throw new Error('Missing required parameters for subscription');
  }

  // Check if subscription already exists
  if (globalSubscriptions.has(subscriptionKey)) {
    const existing = globalSubscriptions.get(subscriptionKey);
    existing.refCount++;
    existing.timestamp = Date.now();
    subscriptionMetrics.reused++;

    // Return a cleanup function that decrements ref count
    return {
      unsubscribe: () => decrementSubscription(subscriptionKey),
      isNew: false,
    };
  }

  // Create new subscription    // console.log(`🔥 Creating NEW ${type} subscription: ${subscriptionKey}`);

  try {
    const firebaseUnsubscribe = createSubscriptionFn();

    if (typeof firebaseUnsubscribe !== 'function') {
      throw new Error(
        'createSubscriptionFn must return an unsubscribe function'
      );
    }

    // Store in global registry
    globalSubscriptions.set(subscriptionKey, {
      unsubscribe: firebaseUnsubscribe,
      refCount: 1,
      timestamp: Date.now(),
      type: type,
    });

    subscriptionMetrics.created++;
    subscriptionMetrics.active = globalSubscriptions.size;

    // Return cleanup function
    return {
      unsubscribe: () => decrementSubscription(subscriptionKey),
      isNew: true,
    };
  } catch (error) {
    console.error(
      `Failed to create ${type} subscription ${subscriptionKey}:`,
      error
    );
    throw error;
  }
};

/**
 * Decrement reference count and cleanup if needed
 * @param {string} subscriptionKey - Subscription key to decrement
 */
const decrementSubscription = (subscriptionKey) => {
  const subscription = globalSubscriptions.get(subscriptionKey);
  if (!subscription) return;

  subscription.refCount--;

  if (subscription.refCount <= 0) {
    subscription.unsubscribe();
    globalSubscriptions.delete(subscriptionKey);
    subscriptionMetrics.cleaned++;
    subscriptionMetrics.active = globalSubscriptions.size; // console.log(
    //   `🧹 Cleaned up subscription: ${subscriptionKey} (type: ${subscription.type})`
    // );
  }
};

/**
 * Force cleanup of a specific subscription
 * @param {string} subscriptionKey - Subscription key to cleanup
 */
export const forceCleanupSubscription = (subscriptionKey) => {
  const subscription = globalSubscriptions.get(subscriptionKey);
  if (subscription) {
    subscription.unsubscribe();
    globalSubscriptions.delete(subscriptionKey);
    subscriptionMetrics.cleaned++;
    subscriptionMetrics.active = globalSubscriptions.size;
    console.log(`🧹 Force cleaned subscription: ${subscriptionKey}`);
  }
};

/**
 * Get subscription metrics for monitoring
 * @returns {Object} - Current subscription metrics
 */
export const getSubscriptionMetrics = () => {
  return {
    ...subscriptionMetrics,
    active: globalSubscriptions.size,
    keys: Array.from(globalSubscriptions.keys()),
  };
};

/**
 * Cleanup all subscriptions (for app shutdown)
 */
export const cleanupAllSubscriptions = () => {
  console.log(
    `🧹 Cleaning up all ${globalSubscriptions.size} subscriptions...`
  );

  for (const [key, subscription] of globalSubscriptions.entries()) {
    try {
      subscription.unsubscribe();
    } catch (error) {
      console.warn(`Error cleaning up subscription ${key}:`, error);
    }
  }

  globalSubscriptions.clear();
  subscriptionMetrics.cleaned += subscriptionMetrics.active;
  subscriptionMetrics.active = 0;

  console.log('✅ All subscriptions cleaned up');
};

/**
 * Periodic cleanup of stale subscriptions
 */
const periodicCleanup = () => {
  const now = Date.now();
  const staleKeys = [];

  for (const [key, subscription] of globalSubscriptions.entries()) {
    if (
      now - subscription.timestamp > MAX_SUBSCRIPTION_AGE &&
      subscription.refCount <= 0
    ) {
      staleKeys.push(key);
    }
  }

  staleKeys.forEach((key) => {
    const subscription = globalSubscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      globalSubscriptions.delete(key);
      subscriptionMetrics.cleaned++;
      console.log(`🧹 Cleaned up stale subscription: ${key}`);
    }
  });

  subscriptionMetrics.active = globalSubscriptions.size;
};

// Start periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(periodicCleanup, CLEANUP_INTERVAL);

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupAllSubscriptions);

  // Make metrics available for debugging
  window.getSubscriptionMetrics = getSubscriptionMetrics;
  window.cleanupAllSubscriptions = cleanupAllSubscriptions;
}

/**
 * Generate standardized subscription keys
 */
export const generateSubscriptionKey = {
  spatialObjects: (spaceId, cellKey) => `spatial_${spaceId}_${cellKey}`,
  connections: (spaceId, cellKey) => `conn_${spaceId}_${cellKey}`,
  webrtcSignaling: (spaceId, userId) => `webrtc_${spaceId}_${userId}`,
  presence: (spaceId) => `presence_${spaceId}`,
  broadcasts: (spaceId, objectId) => `broadcast_${spaceId}_${objectId}`,
  legacyObjects: (spaceId) => `legacy_objects_${spaceId}`,
  cells: (spaceId, cellId) => `cells_${spaceId}_${cellId}`,
};

export default {
  getOrCreateSubscription,
  forceCleanupSubscription,
  getSubscriptionMetrics,
  cleanupAllSubscriptions,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
};
