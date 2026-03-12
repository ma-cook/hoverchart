/**
 * Unified Performance Utilities
 * Consolidates all throttle, debounce, and performance utilities
 * Replaces: throttle.js, performance.js throttle, perfUtils.js throttle, App.jsx inline throttle
 */

/**
 * Advanced throttle implementation with trailing edge execution
 * Most comprehensive implementation from throttle.js
 */
export function throttle(func, limit) {
  let inThrottle = false;
  let lastFunc;
  let lastRan;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Debounce implementation
 * Consolidates debounce from performance.js and perfUtils.js
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Performance measurement wrapper
 * From performance.js with enhancements
 */
export const measurePerformance = (name, fn) => {
  if (typeof fn !== 'function') {
    return fn;
  }

  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (end - start > 16) {
      // Only log if over 16ms (one frame)
      console.warn(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

/**
 * Work scheduling to avoid blocking main thread
 * From performance.js
 */
export const scheduleWork = (callback) => {
  if ('scheduler' in window && window.scheduler.postTask) {
    return window.scheduler.postTask(callback, { priority: 'user-blocking' });
  } else if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, { timeout: 100 });
  } else {
    return setTimeout(callback, 0);
  }
};

/**
 * Memoization with cache statistics
 * Enhanced version from perfUtils.js
 */
export const memoize = (fn) => {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const createCacheKey = (arg) => {
    try {
      // Handle null/undefined
      if (!arg) return 'null';

      // Build key via template literal — avoids object allocation + JSON.stringify
      const oid = arg.objectId || arg.cube?.id || arg.plane?.id || '';
      const pos = arg.position || arg.cube?.position || arg.plane?.position;
      const sc = arg.scale || arg.cube?.scale;
      let key = `${arg.type}|${arg.face || 0}|${oid}|${pos ? `${pos[0]},${pos[1]},${pos[2]}` : ''}|${sc ? `${sc[0]},${sc[1]},${sc[2]}` : '1,1,1'}|${arg.faceCenter ? `${arg.faceCenter[0]},${arg.faceCenter[1]},${arg.faceCenter[2]}` : ''}`;

      if (arg.type === 'plane') {
        const wp = arg.worldPosition;
        const pd = arg.planeData;
        key += `|${wp ? `${wp[0]},${wp[1]},${wp[2]}` : ''}|${pd ? `${pd.position},${pd.scale},${pd.offset}` : ''}`;
      }

      return key;
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

      // Keep cache size reasonable — iterator-based trim avoids temp array allocations
      if (cache.size > 1000) {
        let count = 0;
        for (const k of cache.keys()) {
          if (count++ >= 200) break;
          cache.delete(k);
        }
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

/**
 * LCP tracking for performance monitoring
 * From performance.js
 */
export const trackLCP = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      // Send to analytics if needed
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP tracking not supported:', e);
    }
  }
};

// Register as global performance utilities
if (typeof window !== 'undefined') {
  window._performanceUtils = {
    throttle,
    debounce,
    measurePerformance,
    scheduleWork,
    memoize,
    trackLCP,
  };
}

console.log(
  '📊 Unified Performance Utilities loaded - replacing throttle.js, performance.js throttle, perfUtils.js throttle'
);
