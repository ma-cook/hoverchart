// Simple memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();

  return (...args) => {
    // Create a cache key from the arguments
    const key = JSON.stringify(args);

    // Check if we have a cached result
    if (cache.has(key)) {
      return cache.get(key);
    }

    // Calculate the result and store in cache
    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      // Remove oldest entry
      cache.delete([...cache.keys()][0]);
    }

    return result;
  };
};

// Debounce to limit calculation frequency
export const debounce = (fn, delay = 100) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
};
