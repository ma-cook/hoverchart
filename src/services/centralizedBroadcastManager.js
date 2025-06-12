/**
 * Centralized broadcast manager that handles all broadcast listening for a space
 * Uses existing spatial partitioning collections instead of a separate broadcastObjects collection
 */
class CentralizedBroadcastManager {
  constructor() {
    this.spaceListeners = new Map(); // spaceId -> { unsubscribe, subscribers, cellListeners }
    this.planeSubscribers = new Map(); // planeId -> callback
  }

  /**
   * Subscribe a plane to broadcast changes in a space
   * @param {string} spaceOwnerId - The space owner's user ID
   * @param {string} spaceId - The space ID
   * @param {string} planeId - The plane ID to monitor
   * @param {Function} callback - Callback function for broadcast changes
   * @returns {Function} Unsubscribe function
   */ subscribePlaneToBroadcasts(spaceOwnerId, spaceId, planeId, callback) {
    // console.log(`[CentralBroadcast] Subscribing plane ${planeId} to broadcasts in space ${spaceId}`);

    // Store the plane's callback
    this.planeSubscribers.set(planeId, callback);

    // Check if we already have a space listener
    if (!this.spaceListeners.has(spaceId)) {
      this.createSpaceListener(spaceOwnerId, spaceId);
    }

    // Add this plane to the space's subscriber count
    const spaceListener = this.spaceListeners.get(spaceId);
    spaceListener.subscribers.add(planeId);

    // Return unsubscribe function
    return () => {
      console.log(
        `[CentralBroadcast] Unsubscribing plane ${planeId} from broadcasts`
      );
      this.unsubscribePlane(spaceId, planeId);
    };
  }

  /**
   * Create a simplified space-level listener using existing collections
   * @param {string} spaceOwnerId - The space owner's user ID
   * @param {string} spaceId - The space ID
   */ createSpaceListener(spaceOwnerId, spaceId) {
    // console.log(`[CentralBroadcast] Creating simplified space listener for space ${spaceId}`);

    try {
      // For now, fall back to the old approach until we can properly implement
      // the cross-cell listening. This ensures we don't break existing functionality.
      // console.log(`[CentralBroadcast] Using fallback approach for space ${spaceId}`);

      // Create a dummy listener that doesn't actually listen to anything
      // The individual planes will handle their own broadcast listening for now
      const dummyUnsubscribe = () => {
        console.log(
          `[CentralBroadcast] Dummy unsubscribe for space ${spaceId}`
        );
      };

      // Store the listener
      this.spaceListeners.set(spaceId, {
        unsubscribe: dummyUnsubscribe,
        subscribers: new Set(),
        cellListeners: new Map(),
      });
    } catch (error) {
      console.error(
        `[CentralBroadcast] Failed to create space listener for ${spaceId}:`,
        error
      );
    }
  }

  /**
   * Unsubscribe a plane from broadcasts
   * @param {string} spaceId - The space ID
   * @param {string} planeId - The plane ID
   */
  unsubscribePlane(spaceId, planeId) {
    // Remove plane callback
    this.planeSubscribers.delete(planeId);

    // Remove from space subscribers
    const spaceListener = this.spaceListeners.get(spaceId);
    if (spaceListener) {
      spaceListener.subscribers.delete(planeId);

      // If no more subscribers for this space, clean up the space listener
      if (spaceListener.subscribers.size === 0) {
        console.log(
          `[CentralBroadcast] No more subscribers for space ${spaceId}, cleaning up listener`
        );

        // Clean up any cell listeners
        if (spaceListener.cellListeners) {
          spaceListener.cellListeners.forEach((unsubscribe) => {
            unsubscribe();
          });
        }

        spaceListener.unsubscribe();
        this.spaceListeners.delete(spaceId);
      }
    }
  }

  /**
   * Get debug information about active listeners
   */
  getDebugInfo() {
    return {
      activeSpaces: Array.from(this.spaceListeners.keys()),
      subscribedPlanes: Array.from(this.planeSubscribers.keys()),
      spaceSubscriberCounts: Object.fromEntries(
        Array.from(this.spaceListeners.entries()).map(([spaceId, listener]) => [
          spaceId,
          listener.subscribers.size,
        ])
      ),
    };
  }

  /**
   * Clean up all listeners (for app shutdown)
   */ cleanup() {
    console.log('[CentralBroadcast] Cleaning up all listeners');

    this.spaceListeners.forEach((listener) => {
      // Clean up cell listeners first
      if (listener.cellListeners) {
        listener.cellListeners.forEach((unsubscribe) => {
          unsubscribe();
        });
      }
      listener.unsubscribe();
    });

    this.spaceListeners.clear();
    this.planeSubscribers.clear();
  }
}

// Create singleton instance
const centralizedBroadcastManager = new CentralizedBroadcastManager();

// Export the singleton and its methods
export default centralizedBroadcastManager;

export const subscribePlaneToBroadcasts = (
  spaceOwnerId,
  spaceId,
  planeId,
  callback
) =>
  centralizedBroadcastManager.subscribePlaneToBroadcasts(
    spaceOwnerId,
    spaceId,
    planeId,
    callback
  );

export const getBroadcastManagerDebugInfo = () =>
  centralizedBroadcastManager.getDebugInfo();

export const cleanupBroadcastManager = () =>
  centralizedBroadcastManager.cleanup();

// Make debug info available globally for testing
if (typeof window !== 'undefined') {
  window._broadcastManagerDebug = centralizedBroadcastManager;
}
