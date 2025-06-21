// Performance monitoring utilities for debugging INP issues

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

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Schedule work to avoid blocking the main thread
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
 * Performance observer for LCP tracking
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
      console.warn('LCP tracking not supported');
    }
  }
};

/**
 * Performance observer for INP tracking
 */
export const trackINP = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.processingStart && entry.processingEnd) {
          const inp = entry.processingEnd - entry.processingStart;
          console.log('INP:', inp);
          // Send to analytics if needed
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['event'] });
    } catch (e) {
      console.warn('INP tracking not supported');
    }
  }
};

/**
 * Initialize performance tracking
 */
export const initPerformanceTracking = () => {
  trackLCP();
  trackINP();

  // Track initial render time
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded at:', performance.now());
    });
  }

  window.addEventListener('load', () => {
    console.log('Window loaded at:', performance.now());
  });
};
