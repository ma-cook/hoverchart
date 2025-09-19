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

  useEffect(() => {
    // Skip updates during initial render to prevent thousands of simultaneous calls
    // when camera moves between cells and loads many objects at once
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
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
