import { useRef, useCallback, useEffect } from 'react';

/**
 * Unified timeout manager hook for handling multiple named timeouts
 * Replaces duplicate timeout ref patterns across components
 *
 * @returns {Object} Methods for managing timeouts
 */
export const useTimeoutManager = () => {
  const timeoutsRef = useRef(new Map());

  /**
   * Set a named timeout, automatically clearing any existing timeout with the same name
   * @param {string} name - Unique name for the timeout
   * @param {Function} callback - Function to execute when timeout fires
   * @param {number} delay - Delay in milliseconds
   */
  const setNamedTimeout = useCallback((name, callback, delay) => {
    // Clear existing timeout if it exists
    if (timeoutsRef.current.has(name)) {
      clearTimeout(timeoutsRef.current.get(name));
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(name); // Auto-cleanup
    }, delay);

    timeoutsRef.current.set(name, timeoutId);
    return timeoutId;
  }, []);

  /**
   * Clear a named timeout
   * @param {string} name - Name of the timeout to clear
   */
  const clearNamedTimeout = useCallback((name) => {
    if (timeoutsRef.current.has(name)) {
      clearTimeout(timeoutsRef.current.get(name));
      timeoutsRef.current.delete(name);
    }
  }, []);

  /**
   * Clear all timeouts
   */
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  /**
   * Check if a named timeout is active
   * @param {string} name - Name of the timeout to check
   * @returns {boolean} Whether the timeout is active
   */
  const hasActiveTimeout = useCallback((name) => {
    return timeoutsRef.current.has(name);
  }, []);

  /**
   * Get the timeout ID for a named timeout
   * @param {string} name - Name of the timeout
   * @returns {number|null} Timeout ID or null if not found
   */
  const getTimeoutId = useCallback((name) => {
    return timeoutsRef.current.get(name) || null;
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    setNamedTimeout,
    clearNamedTimeout,
    clearAllTimeouts,
    hasActiveTimeout,
    getTimeoutId,
    // Convenience methods for common patterns
    setRedirectTimeout: (callback, delay = 0) =>
      setNamedTimeout('redirect', callback, delay),
    clearRedirectTimeout: () => clearNamedTimeout('redirect'),
    setLoadingTimeout: (callback, delay) =>
      setNamedTimeout('loading', callback, delay),
    clearLoadingTimeout: () => clearNamedTimeout('loading'),
    setObjectLoadingTimeout: (callback, delay) =>
      setNamedTimeout('objectLoading', callback, delay),
    clearObjectLoadingTimeout: () => clearNamedTimeout('objectLoading'),
  };
};

export default useTimeoutManager;
