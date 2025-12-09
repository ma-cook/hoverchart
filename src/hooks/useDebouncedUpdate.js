import { useRef, useEffect } from 'react';
import { useObjectsStore } from '../stores';

/**
 * Unified debounced update hook
 * Replaces duplicate debouncing patterns across Cube, Plane, Dodecahedron, Tetrahedron
 *
 * @param {Function} updateFn - Function to call for database updates
 * @param {any} objectData - Object data to watch for changes
 * @param {number} delay - Debounce delay in milliseconds (default: 100)
 * @returns {Object} - Cleanup function and current timeout ref
 */
export const useDebouncedUpdate = (updateFn, objectData, delay = 100) => {
  const debouncedUpdateTimeoutRef = useRef(null);
  const isInitialRenderRef = useRef(true);
  const lastObjectDataRef = useRef(null);

  useEffect(() => {
    // Skip updates during initial render to prevent thousands of simultaneous calls
    // when camera moves between cells and loads many objects at once
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      // Store initial objectData for comparison
      if (objectData) {
        try {
          lastObjectDataRef.current = JSON.stringify(objectData);
        } catch {
          lastObjectDataRef.current = null;
        }
      }
      return;
    }

    // Skip if objectData is not yet loaded
    if (!objectData) {
      return;
    }

    // Skip if we're still in initial loading phase - no saves during app startup
    const { isInitialLoading } = useObjectsStore.getState();
    if (isInitialLoading) {
      return;
    }

    // PERFORMANCE FIX: Skip if objectData content hasn't actually changed
    // This prevents unnecessary saves when component re-renders without data changes
    // (e.g., when clicking an object to show connections)
    try {
      const currentDataStr = JSON.stringify(objectData);
      if (currentDataStr === lastObjectDataRef.current) {
        // Data hasn't changed, skip the update
        return;
      }
      lastObjectDataRef.current = currentDataStr;
    } catch {
      // If serialization fails, proceed with the update
    }

    // Clear any pending update
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
    }

    // Debounce property updates to prevent excessive calls
    debouncedUpdateTimeoutRef.current = setTimeout(() => {
      if (updateFn && typeof updateFn === 'function') {
        updateFn();
      }
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
      }
    };
  }, [updateFn, objectData, delay]);

  // Provide cleanup function for manual cleanup if needed
  const cleanup = () => {
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
      debouncedUpdateTimeoutRef.current = null;
    }
  };

  return {
    cleanup,
    timeoutRef: debouncedUpdateTimeoutRef,
  };
};
