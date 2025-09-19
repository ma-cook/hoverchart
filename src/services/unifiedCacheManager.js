/**
 * Unified Cache Manager
 * Consolidates all cache implementations across the application
 * Replaces individual caches in: spatialPartitioning.js, connectionsService.js,
 * connectionsService_clean.js, spatialObjectsService.js, and memoization caches
 */

// Cache statistics tracking
const cacheStats = new Map();

// Main unified cache storage
const unifiedCache = new Map();

// Cache configuration
const CACHE_CONFIG = {
  // Cell existence cache (from spatialPartitioning.js)
  cellExistence: {
    ttl: 60000, // 1 minute
    maxSize: 1000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },

  // Connection cache (from connectionsService.js)
  connections: {
    ttl: 30000, // 30 seconds
    maxSize: 500,
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
  },

  // Objects cache (from spatialObjectsService.js)
  objects: {
    ttl: 0, // No TTL for objects cache
    maxSize: 2000,
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
  },

  // Memoization cache (from perfUtils.js)
  memoization: {
    ttl: 0, // No TTL for memoization
    maxSize: 1000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },

  // Generic cache for other uses
  generic: {
    ttl: 60000, // 1 minute
    maxSize: 500,
    cleanupInterval: 3 * 60 * 1000, // 3 minutes
  },
};

/**
 * Unified Cache Manager Class
 */
class UnifiedCacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = new Map();
    this.cleanupIntervals = new Map();

    // Initialize stats for each namespace
    Object.keys(CACHE_CONFIG).forEach((namespace) => {
      this.stats.set(namespace, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        cleanups: 0,
      });
    });

    this.startCleanupProcesses();
    console.log('🗂️ Unified Cache Manager initialized');
  }

  /**
   * Get value from cache
   */
  get(key, namespace = 'generic') {
    const fullKey = `${namespace}:${key}`;
    const stats = this.stats.get(namespace);

    if (this.cache.has(fullKey)) {
      const entry = this.cache.get(fullKey);
      const config = CACHE_CONFIG[namespace];

      // Check TTL if configured
      if (config.ttl > 0) {
        const age = Date.now() - entry.timestamp;
        if (age > config.ttl) {
          this.cache.delete(fullKey);
          stats.misses++;
          return undefined;
        }
      }

      stats.hits++;
      return entry.value;
    }

    stats.misses++;
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key, value, namespace = 'generic', customTtl = null) {
    const fullKey = `${namespace}:${key}`;
    const stats = this.stats.get(namespace);
    const config = CACHE_CONFIG[namespace];

    const entry = {
      value,
      timestamp: Date.now(),
      ttl: customTtl || config.ttl,
      namespace,
    };

    this.cache.set(fullKey, entry);
    stats.sets++;

    // Check size limits
    this.enforceSizeLimit(namespace);
  }

  /**
   * Delete value from cache
   */
  delete(key, namespace = 'generic') {
    const fullKey = `${namespace}:${key}`;
    const stats = this.stats.get(namespace);

    if (this.cache.delete(fullKey)) {
      stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * Clear cache for namespace or specific pattern
   */
  clear(namespace = null, pattern = null) {
    let cleared = 0;

    if (namespace && pattern) {
      // Clear specific pattern within namespace
      const prefix = `${namespace}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix) && key.includes(pattern)) {
          this.cache.delete(key);
          cleared++;
        }
      }
    } else if (namespace) {
      // Clear entire namespace
      const prefix = `${namespace}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
          cleared++;
        }
      }
    } else {
      // Clear everything
      cleared = this.cache.size;
      this.cache.clear();
    }

    if (namespace && this.stats.has(namespace)) {
      this.stats.get(namespace).cleanups++;
    }

    console.log(
      `🧹 Cleared ${cleared} cache entries for ${namespace || 'all'}`
    );
    return cleared;
  }

  /**
   * Check if key exists in cache
   */
  has(key, namespace = 'generic') {
    const fullKey = `${namespace}:${key}`;

    if (this.cache.has(fullKey)) {
      const entry = this.cache.get(fullKey);
      const config = CACHE_CONFIG[namespace];

      // Check TTL if configured
      if (config.ttl > 0) {
        const age = Date.now() - entry.timestamp;
        if (age > config.ttl) {
          this.cache.delete(fullKey);
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Get cache size for namespace
   */
  size(namespace = null) {
    if (namespace) {
      const prefix = `${namespace}:`;
      let count = 0;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          count++;
        }
      }
      return count;
    }

    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(namespace = null) {
    if (namespace) {
      return {
        ...this.stats.get(namespace),
        size: this.size(namespace),
        hitRate: this.calculateHitRate(namespace),
      };
    }

    const allStats = {};
    for (const [ns, stats] of this.stats.entries()) {
      allStats[ns] = {
        ...stats,
        size: this.size(ns),
        hitRate: this.calculateHitRate(ns),
      };
    }

    allStats.total = {
      size: this.cache.size,
      namespaces: Object.keys(allStats).length,
    };

    return allStats;
  }

  /**
   * Calculate hit rate for namespace
   */
  calculateHitRate(namespace) {
    const stats = this.stats.get(namespace);
    const total = stats.hits + stats.misses;
    return total > 0 ? ((stats.hits / total) * 100).toFixed(1) : '0.0';
  }

  /**
   * Enforce size limits for namespace
   */
  enforceSizeLimit(namespace) {
    const config = CACHE_CONFIG[namespace];
    const currentSize = this.size(namespace);

    if (currentSize > config.maxSize) {
      const prefix = `${namespace}:`;
      const entries = [];

      // Collect entries for this namespace
      for (const [key, entry] of this.cache.entries()) {
        if (key.startsWith(prefix)) {
          entries.push({ key, entry });
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);

      // Remove oldest entries
      const excessCount = currentSize - config.maxSize;
      for (let i = 0; i < excessCount; i++) {
        this.cache.delete(entries[i].key);
      }

      console.log(
        `🗂️ Cleaned up ${excessCount} old entries from ${namespace} cache`
      );
    }
  }

  /**
   * Start automated cleanup processes
   */
  startCleanupProcesses() {
    Object.entries(CACHE_CONFIG).forEach(([namespace, config]) => {
      const interval = setInterval(() => {
        this.cleanupExpired(namespace);
      }, config.cleanupInterval);

      this.cleanupIntervals.set(namespace, interval);
    });

    console.log('🧹 Cache cleanup processes started');
  }

  /**
   * Clean up expired entries for namespace
   */
  cleanupExpired(namespace) {
    const config = CACHE_CONFIG[namespace];

    if (config.ttl === 0) return; // No TTL configured

    const now = Date.now();
    const prefix = `${namespace}:`;
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        const age = now - entry.timestamp;
        if (age > config.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(
        `🧹 Cleaned up ${cleaned} expired entries from ${namespace} cache`
      );
      this.stats.get(namespace).cleanups++;
    }
  }

  /**
   * Stop all cleanup processes
   */
  stopCleanupProcesses() {
    this.cleanupIntervals.forEach((interval) => clearInterval(interval));
    this.cleanupIntervals.clear();
    console.log('🛑 Cache cleanup processes stopped');
  }

  /**
   * Full cache manager cleanup
   */
  cleanup() {
    this.stopCleanupProcesses();
    this.cache.clear();
    this.stats.clear();
    console.log('🧹 Unified Cache Manager cleaned up');
  }
}

// Create singleton instance
const unifiedCacheManager = new UnifiedCacheManager();

// Export the manager and convenience methods
export default unifiedCacheManager;

// Convenience methods for specific cache types
export const cellExistenceCache = {
  get: (key) => unifiedCacheManager.get(key, 'cellExistence'),
  set: (key, value) => unifiedCacheManager.set(key, value, 'cellExistence'),
  delete: (key) => unifiedCacheManager.delete(key, 'cellExistence'),
  clear: () => unifiedCacheManager.clear('cellExistence'),
  has: (key) => unifiedCacheManager.has(key, 'cellExistence'),
  size: () => unifiedCacheManager.size('cellExistence'),
};

export const connectionCache = {
  get: (key) => unifiedCacheManager.get(key, 'connections'),
  set: (key, value) => unifiedCacheManager.set(key, value, 'connections'),
  delete: (key) => unifiedCacheManager.delete(key, 'connections'),
  clear: (pattern) => unifiedCacheManager.clear('connections', pattern),
  has: (key) => unifiedCacheManager.has(key, 'connections'),
  size: () => unifiedCacheManager.size('connections'),
};

export const objectsCache = {
  get: (key) => unifiedCacheManager.get(key, 'objects'),
  set: (key, value) => unifiedCacheManager.set(key, value, 'objects'),
  delete: (key) => unifiedCacheManager.delete(key, 'objects'),
  clear: (pattern) => unifiedCacheManager.clear('objects', pattern),
  has: (key) => unifiedCacheManager.has(key, 'objects'),
  size: () => unifiedCacheManager.size('objects'),
};

export const memoizationCache = {
  get: (key) => unifiedCacheManager.get(key, 'memoization'),
  set: (key, value) => unifiedCacheManager.set(key, value, 'memoization'),
  delete: (key) => unifiedCacheManager.delete(key, 'memoization'),
  clear: () => unifiedCacheManager.clear('memoization'),
  has: (key) => unifiedCacheManager.has(key, 'memoization'),
  size: () => unifiedCacheManager.size('memoization'),
};

// Global access for debugging
if (typeof window !== 'undefined') {
  window._unifiedCache = unifiedCacheManager;
}

console.log(
  '🗂️ Unified Cache Manager loaded - consolidating all cache implementations'
);
