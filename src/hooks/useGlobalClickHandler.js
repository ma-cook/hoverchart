import { useEffect } from 'react';

/**
 * Unified global click handler hook
 * Replaces duplicate window event listener patterns for click-outside functionality
 *
 * @param {string|string[]} excludeSelectors - CSS selectors to exclude from triggering the callback
 * @param {Function} onClickOutside - Function to call when clicking outside excluded elements
 * @param {string} eventType - Event type to listen for ('click' or 'mousedown', default: 'mousedown')
 * @param {Array} dependencies - Dependencies array for useEffect
 */
export const useGlobalClickHandler = (
  excludeSelectors = [],
  onClickOutside,
  eventType = 'mousedown',
  dependencies = []
) => {
  useEffect(() => {
    // Don't add listener if no callback provided
    if (!onClickOutside || typeof onClickOutside !== 'function') {
      return;
    }

    const handleGlobalClick = (event) => {
      // Convert single selector to array
      const selectors = Array.isArray(excludeSelectors)
        ? excludeSelectors
        : [excludeSelectors];

      // Default selectors that are commonly excluded
      const defaultSelectors = [
        '.object-ui-content',
        '.color-picker-container',
        '.face-ui-content',
        '.face-ui-container',
        '.text-style-ui',
        '.header-input',
      ];

      // Combine provided selectors with defaults
      const allSelectors = [...selectors, ...defaultSelectors];

      // Check if click target or any parent matches excluded selectors
      if (event.target) {
        const matchesExcluded = allSelectors.some((selector) => {
          try {
            return event.target.closest(selector);
          } catch {
            // Invalid selector, skip
            return false;
          }
        });

        if (matchesExcluded) {
          return;
        }
      }

      // Call the callback if clicking outside excluded elements
      onClickOutside(event);
    };

    // Add the global event listener
    window.addEventListener(eventType, handleGlobalClick);

    // Cleanup on unmount
    return () => {
      window.removeEventListener(eventType, handleGlobalClick);
    };
  }, [excludeSelectors, onClickOutside, eventType, dependencies]);
};
