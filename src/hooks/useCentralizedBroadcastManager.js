import { useEffect } from 'react';
import {
  cleanupBroadcastManager,
  getBroadcastManagerDebugInfo,
} from '../services/centralizedBroadcastManager';

/**
 * Hook to manage the centralized broadcast manager lifecycle
 * Should be used at the App level to ensure proper cleanup
 */
export const useCentralizedBroadcastManager = () => {
  useEffect(() => {
    console.log(
      '[CentralBroadcast] Initializing centralized broadcast manager'
    );

    // Add debug info to window for testing
    if (typeof window !== 'undefined') {
      window.getBroadcastManagerDebugInfo = getBroadcastManagerDebugInfo;
    }

    // Cleanup on unmount
    return () => {
      console.log(
        '[CentralBroadcast] Cleaning up centralized broadcast manager'
      );
      cleanupBroadcastManager();
    };
  }, []);
};

export default useCentralizedBroadcastManager;
