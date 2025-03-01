// Simple memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const createCacheKey = (arg) => {
    try {
      // Handle null/undefined
      if (!arg) return 'null';

      // Create a minimal object with only the properties we need for position calculation
      const keyObj = {
        type: arg.type,
        face: arg.face || 0,
        objectId: arg.objectId || arg.cube?.id || arg.plane?.id,
        position: arg.position || arg.cube?.position || arg.plane?.position,
        scale: arg.scale || arg.cube?.scale || [1, 1, 1],
        faceCenter: arg.faceCenter,
      };

      // Special handling for sphere indicators
      if (arg.type === 'sphere' && Array.isArray(arg.faceCenter)) {
        keyObj.faceCenter = [...arg.faceCenter];
      }

      // Special handling for plane indicators
      if (arg.type === 'plane') {
        keyObj.worldPosition = arg.worldPosition;
        keyObj.planeData = arg.planeData
          ? {
              position: arg.planeData.position,
              scale: arg.planeData.scale,
              offset: arg.planeData.offset,
            }
          : null;
      }

      return JSON.stringify(keyObj);
    } catch (error) {
      console.warn('Error creating cache key:', error);
      // Fallback to a simple type-based key
      return `${arg.type}-${arg.face || 0}`;
    }
  };

  const memoized = (arg) => {
    // Basic validation
    if (!arg || !arg.type) {
      console.warn('Invalid argument passed to memoized function:', arg);
      return [0, 0, 0]; // Return safe default
    }

    try {
      const key = createCacheKey(arg);

      if (cache.has(key)) {
        hits++;
        return cache.get(key);
      }

      misses++;
      const result = fn(arg);

      // Only cache valid results
      if (
        Array.isArray(result) &&
        result.length === 3 &&
        result.every((n) => typeof n === 'number' && !isNaN(n))
      ) {
        cache.set(key, result);
      }

      // Log cache stats periodically
      if ((hits + misses) % 100 === 0) {
        const hitRate = (hits / (hits + misses)) * 100;
        console.debug(
          `Memoize stats - Hits: ${hits}, Misses: ${misses}, Rate: ${hitRate.toFixed(
            1
          )}%, Size: ${cache.size}`
        );
      }

      // Keep cache size reasonable
      if (cache.size > 1000) {
        const entriesToDelete = Array.from(cache.keys()).slice(0, 200);
        entriesToDelete.forEach((key) => cache.delete(key));
      }

      return result;
    } catch (error) {
      console.error('Error in memoized function:', error);
      return fn(arg); // Fallback to non-cached result
    }
  };

  // Expose cache stats and control
  memoized.getStats = () => ({ hits, misses, cacheSize: cache.size });
  memoized.clearCache = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };

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
