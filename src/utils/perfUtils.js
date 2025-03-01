// Simple memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const memoized = (arg) => {
    // Ensure arg is valid and has required properties
    if (!arg || !arg.type || !arg.face) {
      console.warn('Invalid argument passed to memoized function:', arg);
      return [0, 0, 0]; // Return safe default
    }

    const key = JSON.stringify({
      type: arg.type,
      face: arg.face,
      objectId: arg?.cube?.id || arg?.plane?.id,
      position: arg?.cube?.position || arg?.plane?.position || arg.position,
    });

    if (cache.has(key)) {
      hits++;
      return cache.get(key);
    }

    misses++;
    const result = fn(arg);
    cache.set(key, result);

    // Occasionally log cache performance (every 100 calls)
    if ((hits + misses) % 100 === 0) {
      const hitRate = (hits / (hits + misses)) * 100;
      console.debug(
        `Memoize stats: ${hits} hits, ${misses} misses (${hitRate.toFixed(
          1
        )}% hit rate), cache size: ${cache.size}`
      );
    }

    // Keep cache size reasonable
    if (cache.size > 1000) {
      // Clear oldest entries
      const entriesToDelete = Array.from(cache.keys()).slice(0, 200);
      entriesToDelete.forEach((key) => cache.delete(key));
    }

    return result;
  };

  // Expose cache stats for debugging
  memoized.getStats = () => ({ hits, misses, cacheSize: cache.size });

  return memoized;
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

// Throttle function to limit execution frequency
export const throttle = (fn, limit = 100) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }
  };
};
