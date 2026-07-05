/**
 * Global Optimization Coordinator
 * Manages all optimization systems and identifies duplicate utilities/services
 * Provides centralized performance monitoring and resource management
 */

// Import unified systems
import { MathUtils } from '../utils/unifiedMathUtils';
import { DebugUtils } from '../utils/unifiedDebugUtils';
import { ValidationUtils } from '../utils/unifiedValidationUtils';

/**
 * Global Optimization Coordinator Class
 */
class GlobalOptimizationCoordinator {
  constructor() {
    this.initialized = false;
    this.systems = new Map();
    this.metrics = new Map();
    this.duplicateRegistry = new Map();

    // Performance tracking
    this.performanceStats = {
      memoryUsage: 0,
      activeSubscriptions: 0,
      cacheHitRates: new Map(),
      systemLoadTimes: new Map(),
    };

    // Duplicate detection and management with comprehensive analysis
    this.duplicateCategories = {
      throttleFunctions: [
        'src/utils/throttle.js (REMOVED)',
        'src/utils/performance.js (REMOVED)',
        'src/utils/perfUtils.js (REMOVED)',
        'src/App.jsx (inline throttle) → unified',
      ],
      broadcastManagers: [
        'src/services/broadcastManager.js (REMOVED)',
        'src/services/centralizedBroadcastManager.js → active',
      ],
      cacheImplementations: [
        'src/services/spatialPartitioning.js (cellExistenceCache) → unified',
        'src/services/connectionsService.js (connectionCache) → unified',
        'src/services/connectionsService_clean.js (REMOVED)',
        'src/utils/perfUtils.js (memoization cache) (REMOVED)',
        'src/services/spatialObjectsService.js (objectsCache) → unified',
      ],
      performanceUtils: [
        'src/utils/performance.js (REMOVED)',
        'src/utils/perfUtils.js (REMOVED)',
        'src/utils/debugUtils.js (perfMetrics) → unified',
      ],
      spatialSystems: [
        'src/utils/streamlinedSpatialIndex.js → unified',
        'src/services/streamlinedSpatialPartitioning.js → active',
        'src/services/spatialPartitioning.js → enhanced',
      ],
      mathUtils: [
        'src/utils/positionUtils.js (calculateMidpoint, lerp) → unified',
        'src/utils/pathfindingUtils.js (havePositionsChanged) → unified',
        'src/utils/facePositionUtils.js (position calculations) → unified',
        'src/services/markdownDiagramService.js (geometry) → unified',
        'src/services/spatialPartitioning.js (normalizePosition) → unified',
        'src/utils/streamlinedSpatialIndex.js (distance) → unified',
        'src/utils/snappingUtils.js (distanceToAxis) → unified',
        'src/components/cubeHelpers.js (Vector3 operations) → unified',
      ],
      debugUtils: [
        'src/utils/debugUtils.js → unified',
        'Various console.log throughout codebase → unified',
        'Performance measurement duplicated → unified',
        'Animation debugging → unified',
      ],
      validationUtils: [
        'src/utils/connectionUtils.js (validateConnection) → unified',
        'src/services/connectionsService.js (cleanObject) → unified',
        'src/services/spatialObjectsService.js (validation) → unified',
        'src/services/markdownDiagramService.js (file validation) → unified',
        'src/services/authService.js (validateAuthToken) → unified',
        'Various validation in stores → unified',
      ],
      subscriptionManagement: [
        'src/services/globalSubscriptionManager.js → active',
        'Duplicate Firebase listeners in spatialPartitioning.js → coordinated',
        'Multiple broadcast subscriptions → coordinated',
        'Connection subscription overlaps → coordinated',
        'Presence service multiple listeners → coordinated',
      ],
      webrtcSessions: [
        'src/services/webRservice.js (BroadcastSession) → coordinated',
        'Peer connection management scattered → coordinated',
        'Signaling listener duplication → coordinated',
        'Stream cleanup inconsistencies → coordinated',
      ],
      animationRendering: [
        'src/components/AnimatedConnectionLine.jsx → optimized',
        'PooledLine component instances → optimized',
        'Connection rendering optimizations → coordinated',
        'Frame rate calculations scattered → coordinated',
      ],
      storageOptimization: [
        'objectsCache in spatialObjectsService.js → coordinated',
        'connectionCache in connectionsService.js → coordinated',
        'saveTimeouts scattered across services → coordinated',
        'updateThrottles in multiple services → coordinated',
        'deletingObjects tracking → coordinated',
      ],
      objectPooling: [
        'LinePool in linePoolManager.js → optimized',
        'Geometry pooling scattered across components → coordinated',
        'Material pooling in PooledLine components → coordinated',
        'Three.js resource management duplicated → coordinated',
      ],
      stateCoordination: [
        'Multiple Zustand stores with similar patterns → coordinated',
        'Cross-store dependencies and subscriptions → coordinated',
        'Unloaded objects/connections tracking scattered → coordinated',
        'State update patterns duplicated across stores → coordinated',
      ],
    };

    console.log('🎯 Global Optimization Coordinator initialized');
  }

  /**
   * Initialize the coordinator and register all systems
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing Global Optimization Coordinator...');

    // Register core optimization systems
    this.registerSystem('spatial', await this.loadSpatialSystem());
    this.registerSystem('cache', await this.loadCacheSystem());
    this.registerSystem('broadcast', await this.loadBroadcastSystem());
    this.registerSystem('performance', await this.loadPerformanceSystem());
    this.registerSystem('subscription', await this.loadSubscriptionSystem());
    this.registerSystem('webrtc', await this.loadWebRTCSystem());
    this.registerSystem('animation', await this.loadAnimationSystem());
    this.registerSystem('storage', await this.loadStorageSystem());
    this.registerSystem(
      'stateManagement',
      await this.loadStateManagementSystem()
    );

    // Register newly consolidated unified systems
    this.registerSystem('math', this.loadMathSystem());
    this.registerSystem('debug', this.loadDebugSystem());
    this.registerSystem('validation', this.loadValidationSystem());
    this.registerSystem('configuration', this.loadConfigurationSystem());
    this.registerSystem('errorHandling', this.loadErrorHandlingSystem());
    this.registerSystem(
      'resourceLifecycle',
      this.loadResourceLifecycleSystem()
    );
    this.registerSystem('webglContext', this.loadWebGLContextSystem());
    this.registerSystem('debouncing', this.loadDebouncingSystem());
    this.registerSystem('eventListeners', this.loadEventListenerSystem());

    // Analyze duplicates
    this.analyzeDuplicates();

    // Start monitoring
    this.startPerformanceMonitoring();

    this.initialized = true;
    console.log(
      '✅ Global Optimization Coordinator ready with 10 unified systems'
    );
  }

  /**
   * Register an optimization system
   */
  registerSystem(name, system) {
    this.systems.set(name, {
      instance: system,
      registered: Date.now(),
      active: true,
      metrics: new Map(),
    });

    console.log(`📝 Registered optimization system: ${name}`);
  }

  /**
   * Load and consolidate spatial systems
   */
  async loadSpatialSystem() {
    try {
      const { StreamlinedSpatialManager } = await import(
        '../services/streamlinedSpatialPartitioning.js'
      );
      const spatialManager = new StreamlinedSpatialManager({
        cellSize: 50,
        enableStats: true,
      });

      // Register as primary spatial system
      if (typeof window !== 'undefined') {
        window._globalSpatialManager = spatialManager;
      }

      return {
        type: 'spatial',
        manager: spatialManager,
        duplicates: ['spatialPartitioning.js', 'streamlinedSpatialIndex.js'],
        consolidationStatus: 'primary_active',
      };
    } catch (error) {
      console.warn('Failed to load spatial system:', error);
      return null;
    }
  }

  /**
   * Load and consolidate cache systems
   */
  async loadCacheSystem() {
    // Unified cache manager to replace multiple cache implementations
    const unifiedCache = new Map();
    const cacheStats = new Map();

    const cacheManager = {
      get: (key, namespace = 'default') => {
        const fullKey = `${namespace}:${key}`;
        const hit = unifiedCache.has(fullKey);
        this.updateCacheStats(namespace, hit ? 'hit' : 'miss');
        return unifiedCache.get(fullKey);
      },

      set: (key, value, namespace = 'default', ttl = null) => {
        const fullKey = `${namespace}:${key}`;
        const entry = {
          value,
          timestamp: Date.now(),
          ttl,
        };
        unifiedCache.set(fullKey, entry);
        this.updateCacheStats(namespace, 'set');
      },

      clear: (namespace = null) => {
        if (namespace) {
          const prefix = `${namespace}:`;
          for (const key of unifiedCache.keys()) {
            if (key.startsWith(prefix)) {
              unifiedCache.delete(key);
            }
          }
        } else {
          unifiedCache.clear();
        }
      },

      getStats: () => Object.fromEntries(cacheStats),
      size: () => unifiedCache.size,
    };

    // Register as global cache
    if (typeof window !== 'undefined') {
      window._globalCache = cacheManager;
    }

    return {
      type: 'cache',
      manager: cacheManager,
      duplicates: [
        'spatialPartitioning cache',
        'connections cache',
        'memoization cache',
        'objects cache',
      ],
      consolidationStatus: 'unified_implementation',
    };
  }

  /**
   * Load and consolidate broadcast systems
   */
  async loadBroadcastSystem() {
    try {
      const { default: centralizedBroadcastManager } = await import(
        '../services/centralizedBroadcastManager.js'
      );

      return {
        type: 'broadcast',
        manager: centralizedBroadcastManager,
        duplicates: ['broadcastManager.js', 'centralizedBroadcastManager.js'],
        consolidationStatus: 'centralized_active',
      };
    } catch (error) {
      console.warn('Failed to load broadcast system:', error);
      return null;
    }
  }

  /**
   * Load and consolidate performance systems
   */
  async loadPerformanceSystem() {
    // Unified performance utilities to replace multiple implementations
    const performanceManager = {
      // Consolidated throttle function (most advanced implementation)
      throttle: (func, limit) => {
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
      },

      // Consolidated debounce function
      debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },

      // Performance measurement
      measure: (name, fn) => {
        if (typeof fn !== 'function') return fn;

        return (...args) => {
          const start = performance.now();
          const result = fn(...args);
          const end = performance.now();

          this.recordMetric('performance', name, end - start);

          if (end - start > 16) {
            console.warn(
              `Performance: ${name} took ${(end - start).toFixed(2)}ms`
            );
          }

          return result;
        };
      },

      // Memoization with stats
      memoize: (fn) => {
        const cache = new Map();
        let hits = 0;
        let misses = 0;

        const memoized = (arg) => {
          const key = JSON.stringify(arg);

          if (cache.has(key)) {
            hits++;
            return cache.get(key);
          }

          misses++;
          const result = fn(arg);
          cache.set(key, result);

          // Report stats to coordinator
          this.updateCacheStats('memoization', 'hit', hits);
          this.updateCacheStats('memoization', 'miss', misses);

          return result;
        };

        memoized.getStats = () => ({ hits, misses, cacheSize: cache.size });
        memoized.clearCache = () => {
          cache.clear();
          hits = 0;
          misses = 0;
        };

        return memoized;
      },
    };

    // Register as global performance manager
    if (typeof window !== 'undefined') {
      window._globalPerformance = performanceManager;
    }

    return {
      type: 'performance',
      manager: performanceManager,
      duplicates: [
        'throttle.js',
        'performance.js',
        'perfUtils.js',
        'debugUtils.js performance',
      ],
      consolidationStatus: 'unified_implementation',
    };
  }

  /**
   * Load unified mathematical utilities system
   */
  loadMathSystem() {
    return {
      type: 'math',
      manager: MathUtils,
      duplicates: [
        'src/utils/positionUtils.js (calculateMidpoint, lerp)',
        'src/utils/pathfindingUtils.js (havePositionsChanged)',
        'src/utils/facePositionUtils.js (position calculations)',
        'src/services/markdownDiagramService.js (geometry calculations)',
        'src/services/spatialPartitioning.js (normalizePosition, getCellDistance)',
        'src/utils/streamlinedSpatialIndex.js (distance calculations)',
        'src/utils/snappingUtils.js (distanceToAxis)',
        'src/components/cubeHelpers.js (Vector3 operations)',
      ],
      consolidationStatus: 'unified_implementation',
    };
  }

  /**
   * Load unified debug utilities system
   */
  loadDebugSystem() {
    return {
      type: 'debug',
      manager: DebugUtils,
      duplicates: [
        'src/utils/debugUtils.js (performance monitoring)',
        'Various console.log scattered throughout codebase',
        'Performance measurement duplicated in multiple files',
        'Animation debugging in multiple components',
      ],
      consolidationStatus: 'unified_implementation',
    };
  }

  /**
   * Load unified validation utilities system
   */
  loadValidationSystem() {
    return {
      type: 'validation',
      manager: ValidationUtils,
      duplicates: [
        'src/utils/connectionUtils.js (validateConnection)',
        'src/services/connectionsService.js (cleanObject)',
        'src/services/spatialObjectsService.js (position validation)',
        'src/services/markdownDiagramService.js (file validation)',
        'src/services/authService.js (validateAuthToken)',
        'Various validation scattered throughout stores',
      ],
      consolidationStatus: 'unified_implementation',
    };
  }

  /**
   * Load global subscription management system
   */
  async loadSubscriptionSystem() {
    try {
      const { default: globalSubscriptionManager, getSubscriptionMetrics } =
        await import('../services/globalSubscriptionManager.js');

      return {
        type: 'subscription',
        manager: globalSubscriptionManager,
        getMetrics: getSubscriptionMetrics,
        duplicates: [
          'Multiple Firebase listeners in spatialPartitioning.js',
          'Duplicate subscriptions in broadcastManager.js',
          'Connection subscriptions duplication',
          'Cell subscription overlaps',
          'Presence service multiple listeners',
        ],
        consolidationStatus: 'centralized_active',
      };
    } catch (error) {
      console.warn('Failed to load subscription system:', error);
      return null;
    }
  }

  /**
   * Load WebRTC coordination system
   */
  async loadWebRTCSystem() {
    try {
      const webRTCManager = {
        activeSessions: new Map(),
        peerConnections: new Map(),

        // Session management
        createSession: async (broadcastId, stream, userId, spaceId) => {
          const { BroadcastSession } = await import(
            '../services/webRservice.js'
          );
          const session = new BroadcastSession(
            broadcastId,
            stream,
            userId,
            spaceId
          );
          webRTCManager.activeSessions.set(broadcastId, session);
          return session;
        },

        // Connection tracking
        trackConnection: (sessionId, viewerId, connection) => {
          const sessionConnections =
            webRTCManager.peerConnections.get(sessionId) || new Map();
          sessionConnections.set(viewerId, connection);
          webRTCManager.peerConnections.set(sessionId, sessionConnections);
        },

        // Cleanup utilities
        cleanupSession: (broadcastId) => {
          const session = webRTCManager.activeSessions.get(broadcastId);
          if (session) {
            session.cleanup();
            webRTCManager.activeSessions.delete(broadcastId);
            webRTCManager.peerConnections.delete(broadcastId);
          }
        },

        // Statistics
        getStats: () => ({
          activeSessions: webRTCManager.activeSessions.size,
          totalConnections: Array.from(
            webRTCManager.peerConnections.values()
          ).reduce((total, connections) => total + connections.size, 0),
          sessionDetails: Object.fromEntries(
            Array.from(webRTCManager.activeSessions.entries()).map(
              ([id, session]) => [
                id,
                {
                  userId: session.userId,
                  spaceId: session.spaceId,
                  connectionCount: session.peerConnections?.size || 0,
                },
              ]
            )
          ),
        }),
      };

      // Register as global WebRTC manager
      if (typeof window !== 'undefined') {
        window._globalWebRTC = webRTCManager;
      }

      return {
        type: 'webrtc',
        manager: webRTCManager,
        duplicates: [
          'BroadcastSession class instances',
          'Peer connection management scattered across webRservice.js',
          'Signaling listener duplication',
          'Stream cleanup inconsistencies',
        ],
        consolidationStatus: 'coordinated_management',
      };
    } catch (error) {
      console.warn('Failed to load WebRTC system:', error);
      return null;
    }
  }

  /**
   * Load animation and rendering optimization system
   */
  async loadAnimationSystem() {
    try {
      const animationManager = {
        activeAnimations: new Map(),
        animationPools: new Map(),

        // Connection animation management
        registerConnectionAnimation: (connectionId, animationData) => {
          animationManager.activeAnimations.set(connectionId, {
            ...animationData,
            startTime: Date.now(),
          });
        },

        unregisterConnectionAnimation: (connectionId) => {
          animationManager.activeAnimations.delete(connectionId);
        },

        // Pooled line management
        getLinePool: (poolKey) => {
          if (!animationManager.animationPools.has(poolKey)) {
            animationManager.animationPools.set(poolKey, new Set());
          }
          return animationManager.animationPools.get(poolKey);
        },

        // Performance monitoring
        getAnimationStats: () => ({
          activeAnimations: animationManager.activeAnimations.size,
          pooledLines: Array.from(
            animationManager.animationPools.values()
          ).reduce((total, pool) => total + pool.size, 0),
          animationDetails: Object.fromEntries(
            animationManager.activeAnimations
          ),
        }),

        // Frame rate optimization
        optimizeAnimations: () => {
          const now = Date.now();
          let optimized = 0;

          for (const [id, animation] of animationManager.activeAnimations) {
            if (now - animation.startTime > 60000) {
              // Remove animations older than 1 minute
              animationManager.activeAnimations.delete(id);
              optimized++;
            }
          }

          return optimized;
        },
      };

      // Register as global animation manager
      if (typeof window !== 'undefined') {
        window._globalAnimation = animationManager;
      }

      return {
        type: 'animation',
        manager: animationManager,
        duplicates: [
          'AnimatedConnectionLine component instances',
          'PooledLine component management',
          'Connection rendering optimizations',
          'Frame rate calculations scattered across components',
        ],
        consolidationStatus: 'optimization_active',
      };
    } catch (error) {
      console.warn('Failed to load animation system:', error);
      return null;
    }
  }

  /**
   * Load storage and persistence optimization system
   */
  async loadStorageSystem() {
    try {
      const storageManager = {
        objectsCache: new Map(),
        connectionCache: new Map(),
        saveTimeouts: new Map(),
        updateThrottles: new Map(),
        deletingObjects: new Set(),

        // Cache management
        clearCache: (namespace) => {
          if (namespace === 'objects') {
            storageManager.objectsCache.clear();
          } else if (namespace === 'connections') {
            storageManager.connectionCache.clear();
          } else {
            storageManager.objectsCache.clear();
            storageManager.connectionCache.clear();
          }
        },

        // Save optimization
        optimizeSaveOperations: () => {
          const now = Date.now();
          let optimized = 0;

          // Clear old throttle entries
          for (const [key, timestamp] of storageManager.updateThrottles) {
            if (now - timestamp > 300000) {
              // 5 minutes old
              storageManager.updateThrottles.delete(key);
              optimized++;
            }
          }

          return optimized;
        },

        // Statistics
        getStats: () => ({
          objectsCacheSize: storageManager.objectsCache.size,
          connectionsCacheSize: storageManager.connectionCache.size,
          pendingTimeouts: storageManager.saveTimeouts.size,
          throttledUpdates: storageManager.updateThrottles.size,
          deletingObjects: storageManager.deletingObjects.size,
        }),

        // Cleanup utilities
        cleanup: () => {
          storageManager.saveTimeouts.forEach((timeout) =>
            clearTimeout(timeout)
          );
          storageManager.saveTimeouts.clear();
          storageManager.updateThrottles.clear();
          storageManager.deletingObjects.clear();
        },
      };

      // Register as global storage manager
      if (typeof window !== 'undefined') {
        window._globalStorage = storageManager;
      }

      return {
        type: 'storage',
        manager: storageManager,
        duplicates: [
          'objectsCache in spatialObjectsService.js',
          'connectionCache in connectionsService.js',
          'saveTimeouts scattered across services',
          'updateThrottles in multiple services',
          'deletingObjects tracking',
        ],
        consolidationStatus: 'optimization_active',
      };
    } catch (error) {
      console.warn('Failed to load storage system:', error);
      return null;
    }
  }

  /**
   * Load state management coordination system
   */
  async loadStateManagementSystem() {
    try {
      const stateManager = {
        storeRegistry: new Map(),
        crossStoreSubscriptions: new Map(),
        stateUpdateMetrics: new Map(),

        // Store coordination
        registerStore: (name, store) => {
          stateManager.storeRegistry.set(name, {
            store,
            registeredAt: Date.now(),
            updateCount: 0,
          });
        },

        // Cross-store communication optimization
        optimizeStateUpdates: () => {
          const now = Date.now();
          let optimized = 0;

          // Clean old metrics
          for (const [storeName, metrics] of stateManager.stateUpdateMetrics) {
            if (now - metrics.lastUpdate > 600000) {
              // 10 minutes old
              stateManager.stateUpdateMetrics.delete(storeName);
              optimized++;
            }
          }

          return optimized;
        },

        // Memory optimization for unloaded objects/connections tracking
        optimizeUnloadedTracking: () => {
          let cleaned = 0;

          if (typeof window !== 'undefined') {
            // Clean unloaded objects tracking
            if (
              window._unloadedObjects &&
              window._unloadedObjects.size > 1000
            ) {
              const excess = window._unloadedObjects.size - 500;
              const toDelete = Array.from(window._unloadedObjects).slice(
                0,
                excess
              );
              toDelete.forEach((id) => {
                window._unloadedObjects.delete(id);
                if (window._unloadedObjectsByCell) {
                  for (const [, objSet] of window._unloadedObjectsByCell) {
                    objSet.delete(id);
                  }
                }
              });
              // Clean up empty cell entries
              if (window._unloadedObjectsByCell) {
                for (const [cellId, objSet] of window._unloadedObjectsByCell) {
                  if (objSet.size === 0) {
                    window._unloadedObjectsByCell.delete(cellId);
                  }
                }
              }
              cleaned += excess;
            }

            // Clean unloaded connections tracking
            if (
              window._unloadedConnections &&
              window._unloadedConnections.size > 1000
            ) {
              const excess = window._unloadedConnections.size - 500;
              const toDelete = Array.from(window._unloadedConnections).slice(
                0,
                excess
              );
              toDelete.forEach((id) => window._unloadedConnections.delete(id));
              cleaned += excess;
            }

            // Clean unloaded cells tracking
            if (window._unloadedCells && window._unloadedCells.size > 100) {
              const excess = window._unloadedCells.size - 50;
              const toDelete = Array.from(window._unloadedCells).slice(
                0,
                excess
              );
              toDelete.forEach((id) => window._unloadedCells.delete(id));
              cleaned += excess;
            }
          }

          return cleaned;
        },

        // Statistics
        getStats: () => ({
          registeredStores: stateManager.storeRegistry.size,
          storeDetails: Object.fromEntries(
            Array.from(stateManager.storeRegistry.entries()).map(
              ([name, info]) => [
                name,
                {
                  registeredAt: info.registeredAt,
                  updateCount: info.updateCount,
                },
              ]
            )
          ),
          unloadedObjectsCount:
            typeof window !== 'undefined' && window._unloadedObjects
              ? window._unloadedObjects.size
              : 0,
          unloadedConnectionsCount:
            typeof window !== 'undefined' && window._unloadedConnections
              ? window._unloadedConnections.size
              : 0,
          unloadedCellsCount:
            typeof window !== 'undefined' && window._unloadedCells
              ? window._unloadedCells.size
              : 0,
        }),

        // Cleanup
        cleanup: () => {
          stateManager.crossStoreSubscriptions.forEach((unsub) => {
            if (typeof unsub === 'function') unsub();
          });
          stateManager.crossStoreSubscriptions.clear();
          stateManager.stateUpdateMetrics.clear();
        },
      };

      // Register as global state manager
      if (typeof window !== 'undefined') {
        window._globalState = stateManager;
      }

      return {
        type: 'stateManagement',
        manager: stateManager,
        duplicates: [
          'Multiple Zustand stores with similar patterns',
          'Cross-store dependencies and subscriptions',
          'Unloaded objects/connections tracking scattered',
          'State update patterns duplicated across stores',
        ],
        consolidationStatus: 'coordination_active',
      };
    } catch (error) {
      console.warn('Failed to load state management system:', error);
      return null;
    }
  }

  /**
   * Analyze duplicate systems and utilities
   */
  analyzeDuplicates() {
    console.log('🔍 Analyzing duplicate systems...');

    // Record duplicate analysis
    this.duplicateCategories = {
      throttle: [
        {
          file: 'src/utils/throttle.js',
          status: 'replace_with_unified',
          implementation: 'advanced',
        },
        {
          file: 'src/utils/performance.js',
          status: 'replace_with_unified',
          implementation: 'basic',
        },
        {
          file: 'src/utils/perfUtils.js',
          status: 'replace_with_unified',
          implementation: 'basic',
        },
        {
          file: 'src/App.jsx',
          status: 'replace_with_unified',
          implementation: 'inline',
        },
      ],

      cache: [
        {
          file: 'src/services/spatialPartitioning.js',
          cache: 'cellExistenceCache',
          status: 'migrate_to_unified',
        },
        {
          file: 'src/services/connectionsService.js',
          cache: 'connectionCache',
          status: 'migrate_to_unified',
        },
        {
          file: 'src/services/connectionsService_clean.js',
          cache: 'connectionCache',
          status: 'migrate_to_unified',
        },
        {
          file: 'src/utils/perfUtils.js',
          cache: 'memoization',
          status: 'migrate_to_unified',
        },
        {
          file: 'src/services/spatialObjectsService.js',
          cache: 'objectsCache',
          status: 'migrate_to_unified',
        },
      ],

      broadcast: [
        {
          file: 'src/services/broadcastManager.js',
          status: 'deprecated',
          replacement: 'centralizedBroadcastManager',
        },
        {
          file: 'src/services/centralizedBroadcastManager.js',
          status: 'primary',
          features: 'complete',
        },
      ],

      spatial: [
        {
          file: 'src/utils/streamlinedSpatialIndex.js',
          status: 'primary',
          optimized_for: '100+ objects',
        },
        {
          file: 'src/services/streamlinedSpatialPartitioning.js',
          status: 'primary',
          integration: 'api',
        },
        {
          file: 'src/services/spatialPartitioning.js',
          status: 'legacy',
          migration_needed: true,
        },
      ],

      validationSystems: [
        {
          file: 'Position validation scattered across components',
          status: 'needs_consolidation',
          duplicates: 'high',
        },
        {
          file: 'Object validation in multiple services',
          status: 'needs_consolidation',
          duplicates: 'medium',
        },
      ],

      configurationManagement: [
        {
          file: 'Constants scattered (CELL_SIZE, timeouts)',
          status: 'needs_centralization',
          duplicates: 'high',
        },
        {
          file: 'Environment variables accessed directly',
          status: 'needs_centralization',
          duplicates: 'medium',
        },
      ],

      errorHandling: [
        {
          file: 'Console.error calls throughout app',
          status: 'needs_unification',
          duplicates: 'very_high',
        },
        {
          file: 'Try-catch blocks with inconsistent handling',
          status: 'needs_standardization',
          duplicates: 'high',
        },
      ],

      resourceLifecycle: [
        {
          file: 'Texture disposal in WebcamStream, ScreenShareStream, Plane',
          status: 'needs_coordination',
          duplicates: 'high',
        },
        {
          file: 'Event listener cleanup scattered across components',
          status: 'needs_coordination',
          duplicates: 'high',
        },
      ],

      webglContext: [
        {
          file: 'Canvas settings scattered in App.jsx',
          status: 'needs_centralization',
          duplicates: 'medium',
        },
        {
          file: 'Device capability detection duplicated',
          status: 'needs_centralization',
          duplicates: 'medium',
        },
      ],

      debouncing: [
        {
          file: 'debouncedUpdateTimeoutRef in multiple components',
          status: 'needs_unification',
          duplicates: 'high',
        },
        {
          file: 'Different debounce delays without coordination',
          status: 'needs_standardization',
          duplicates: 'medium',
        },
      ],

      eventListeners: [
        {
          file: 'Global click handlers in multiple components',
          status: 'needs_coordination',
          duplicates: 'high',
        },
        {
          file: 'Camera event listeners setup duplicated',
          status: 'needs_coordination',
          duplicates: 'medium',
        },
      ],
    };

    console.log('📊 Duplicate analysis complete:', this.duplicateCategories);
  }

  /**
   * Update cache statistics
   */
  updateCacheStats(namespace, operation, value = 1) {
    const stats = this.performanceStats.cacheHitRates.get(namespace) || {
      hits: 0,
      misses: 0,
      sets: 0,
    };

    if (operation === 'hit') stats.hits += value;
    else if (operation === 'miss') stats.misses += value;
    else if (operation === 'set') stats.sets += value;

    this.performanceStats.cacheHitRates.set(namespace, stats);
  }

  /**
   * Record performance metric
   */
  recordMetric(category, name, value) {
    const categoryMetrics = this.metrics.get(category) || new Map();
    const metrics = categoryMetrics.get(name) || [];

    metrics.push({ value, timestamp: Date.now() });

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }

    categoryMetrics.set(name, metrics);
    this.metrics.set(category, categoryMetrics);
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.updateMemoryUsage();
      this.updateSystemStats();
    }, 30000);

    console.log('📊 Performance monitoring started');
  }

  /**
   * Update memory usage statistics
   */
  updateMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance?.memory) {
      this.performanceStats.memoryUsage = {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Update system statistics
   */
  updateSystemStats() {
    // Count active subscriptions across all systems
    let totalSubscriptions = 0;

    this.systems.forEach((system) => {
      if (system.instance?.getDebugInfo) {
        const debugInfo = system.instance.getDebugInfo();
        totalSubscriptions += debugInfo.activeSpaces?.length || 0;
        totalSubscriptions += debugInfo.subscribedPlanes?.length || 0;
      }
    });

    this.performanceStats.activeSubscriptions = totalSubscriptions;
  }

  /**
   * Get comprehensive status report
   */
  getStatusReport() {
    return {
      initialized: this.initialized,
      systems: Object.fromEntries(
        Array.from(this.systems.entries()).map(([name, system]) => [
          name,
          {
            active: system.active,
            registered: system.registered,
            duplicates: system.instance?.duplicates || [],
            status: system.instance?.consolidationStatus || 'unknown',
          },
        ])
      ),
      duplicateAnalysis: this.duplicateCategories,
      performanceStats: {
        ...this.performanceStats,
        cacheHitRates: Object.fromEntries(this.performanceStats.cacheHitRates),
      },
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Throttle consolidation
    if (this.duplicateCategories.throttle.length > 1) {
      recommendations.push({
        priority: 'high',
        category: 'deduplication',
        action:
          'Consolidate throttle functions into unified performance manager',
        files: this.duplicateCategories.throttle.map((t) => t.file),
        expectedBenefit:
          'Reduced code duplication, consistent throttling behavior',
      });
    }

    // Cache consolidation
    if (this.duplicateCategories.cache.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Migrate all caches to unified cache manager',
        files: this.duplicateCategories.cache.map((c) => c.file),
        expectedBenefit:
          'Centralized cache management, better memory efficiency',
      });
    }

    // Broadcast system cleanup
    const deprecatedBroadcast = this.duplicateCategories.broadcast.find(
      (b) => b.status === 'deprecated'
    );
    if (deprecatedBroadcast) {
      recommendations.push({
        priority: 'medium',
        category: 'cleanup',
        action: 'Remove deprecated broadcast manager',
        files: [deprecatedBroadcast.file],
        expectedBenefit: 'Cleaner codebase, reduced complexity',
      });
    }

    // Subscription management optimization
    if (this.duplicateCategories.subscriptionManagement?.length > 1) {
      recommendations.push({
        priority: 'high',
        category: 'optimization',
        action: 'Migrate all Firebase listeners to global subscription manager',
        files: [
          'spatialPartitioning.js',
          'broadcastManager.js',
          'presenceService.js',
        ],
        expectedBenefit:
          'Prevent duplicate listeners, reduce Firebase costs, better performance',
      });
    }

    // WebRTC session coordination
    if (this.duplicateCategories.webrtcSessions?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'coordination',
        action: 'Coordinate WebRTC sessions through global manager',
        files: ['webRservice.js'],
        expectedBenefit:
          'Better connection management, reduced memory leaks, improved debugging',
      });
    }

    // Animation rendering optimization
    if (this.duplicateCategories.animationRendering?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Optimize animation rendering and pooled line management',
        files: ['AnimatedConnectionLine.jsx', 'PooledLine components'],
        expectedBenefit:
          'Better frame rates, reduced GPU usage, smoother animations',
      });
    }

    // Math utilities consolidation
    if (this.duplicateCategories.mathUtils?.length > 3) {
      recommendations.push({
        priority: 'low',
        category: 'cleanup',
        action: 'Replace scattered math functions with unified utilities',
        files: [
          'positionUtils.js',
          'pathfindingUtils.js',
          'facePositionUtils.js',
        ],
        expectedBenefit:
          'Consistent math operations, reduced bundle size, better testing',
      });
    }

    // Storage optimization
    if (this.duplicateCategories.storageOptimization?.length > 2) {
      recommendations.push({
        priority: 'high',
        category: 'optimization',
        action: 'Consolidate storage caches and save operations',
        files: ['spatialObjectsService.js', 'connectionsService.js'],
        expectedBenefit:
          'Reduced memory usage, faster save operations, centralized cache management',
      });
    }

    // Object pooling optimization
    if (this.duplicateCategories.objectPooling?.length > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Coordinate object pooling for Three.js resources',
        files: ['linePoolManager.js', 'PooledLine components'],
        expectedBenefit:
          'Better GPU memory management, reduced GC pressure, improved frame rates',
      });
    }

    // State management coordination
    if (this.duplicateCategories.stateCoordination?.length > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'architecture',
        action: 'Coordinate state management across Zustand stores',
        files: ['Multiple store files'],
        expectedBenefit:
          'Reduced state inconsistencies, better cross-store communication, improved debugging',
      });
    }

    // Validation system coordination
    if (this.duplicateCategories.validationSystems?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'reliability',
        action: 'Centralize validation logic and error checking',
        files: ['Position validation, object validation across components'],
        expectedBenefit:
          'Consistent validation rules, reduced validation errors, better error reporting',
      });
    }

    // Configuration management coordination
    if (this.duplicateCategories.configurationManagement?.length > 1) {
      recommendations.push({
        priority: 'high',
        category: 'maintainability',
        action: 'Centralize configuration and constants management',
        files: ['Constants scattered, environment variables'],
        expectedBenefit:
          'Single source of truth for configs, easier environment management, better defaults',
      });
    }

    // Error handling coordination
    if (this.duplicateCategories.errorHandling?.length > 1) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        action: 'Unify error handling and logging systems',
        files: ['Console.error calls, try-catch blocks throughout app'],
        expectedBenefit:
          'Consistent error handling, centralized error monitoring, better debugging',
      });
    }

    // Resource lifecycle coordination
    if (this.duplicateCategories.resourceLifecycle?.length > 1) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        action: 'Coordinate resource lifecycle management',
        files: ['Texture disposal, cleanup patterns scattered'],
        expectedBenefit:
          'Reduced memory leaks, standardized resource cleanup, better performance',
      });
    }

    // WebGL context coordination
    if (this.duplicateCategories.webglContext?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Centralize WebGL context management',
        files: ['Canvas settings, device detection scattered'],
        expectedBenefit:
          'Consistent WebGL configuration, optimized device adaptation, better performance',
      });
    }

    // Debouncing coordination
    if (this.duplicateCategories.debouncing?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Unify debouncing systems',
        files: ['debouncedUpdateTimeoutRef patterns in multiple components'],
        expectedBenefit:
          'Reduced excessive database calls, consistent update patterns, better performance',
      });
    }

    // Event listener coordination
    if (this.duplicateCategories.eventListeners?.length > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Coordinate event listener management',
        files: ['Global click handlers, event cleanup scattered'],
        expectedBenefit:
          'Reduced memory leaks, better event performance, consistent cleanup',
      });
    }

    return recommendations;
  }

  /**
   * Execute consolidation for a specific category
   */
  async consolidateCategory(category) {
    console.log(`🔧 Starting consolidation for category: ${category}`);

    switch (category) {
      case 'throttle':
        return this.consolidateThrottleFunctions();
      case 'cache':
        return this.consolidateCaches();
      case 'broadcast':
        return this.consolidateBroadcastSystems();
      case 'spatial':
        return this.consolidateSpatialSystems();
      case 'subscription':
        return this.consolidateSubscriptionSystems();
      case 'webrtc':
        return this.consolidateWebRTCSystems();
      case 'animation':
        return this.consolidateAnimationSystems();
      case 'storage':
        return this.consolidateStorageSystems();
      case 'pooling':
        return this.consolidatePoolingSystems();
      case 'stateManagement':
        return this.consolidateStateSystems();
      case 'validation':
        return this.consolidateValidationSystems();
      case 'configuration':
        return this.consolidateConfigurationSystems();
      case 'errorHandling':
        return this.consolidateErrorHandlingSystems();
      case 'resourceLifecycle':
        return this.consolidateResourceLifecycleSystems();
      case 'webglContext':
        return this.consolidateWebGLContextSystems();
      case 'debouncing':
        return this.consolidateDebouncingSystems();
      case 'eventListeners':
        return this.consolidateEventListenerSystems();
      default:
        console.warn(`Unknown consolidation category: ${category}`);
        return false;
    }
  }

  /**
   * Consolidate throttle functions (first implementation)
   */
  async consolidateThrottleFunctions() {
    const recommendations = [
      {
        action: 'replace_throttle_imports',
        files: [
          'src/utils/throttle.js',
          'src/utils/performance.js',
          'src/utils/perfUtils.js',
        ],
        replacement: 'window._globalPerformance.throttle',
        status: 'ready',
      },
    ];

    console.log('📝 Throttle consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate subscription management systems
   */
  async consolidateSubscriptionSystems() {
    const recommendations = [
      {
        action: 'migrate_spatial_subscriptions',
        files: ['src/services/spatialPartitioning.js'],
        replacement: 'Use globalSubscriptionManager for cell subscriptions',
        status: 'ready',
      },
      {
        action: 'migrate_broadcast_subscriptions',
        files: ['src/services/broadcastManager.js'],
        replacement:
          'Use globalSubscriptionManager for broadcast subscriptions',
        status: 'ready',
      },
    ];

    console.log('📝 Subscription consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate WebRTC session management
   */
  async consolidateWebRTCSystems() {
    const recommendations = [
      {
        action: 'coordinate_webrtc_sessions',
        files: ['src/services/webRservice.js'],
        replacement: 'Use global WebRTC manager for session coordination',
        status: 'ready',
      },
      {
        action: 'centralize_peer_connections',
        files: ['src/services/webRservice.js'],
        replacement: 'Track all peer connections through global manager',
        status: 'ready',
      },
    ];

    console.log('📝 WebRTC consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate animation and rendering systems
   */
  async consolidateAnimationSystems() {
    const recommendations = [
      {
        action: 'optimize_animated_connections',
        files: ['src/components/AnimatedConnectionLine.jsx'],
        replacement: 'Use global animation manager for performance tracking',
        status: 'ready',
      },
      {
        action: 'coordinate_pooled_lines',
        files: ['PooledLine components throughout app'],
        replacement: 'Manage line pools through global animation manager',
        status: 'ready',
      },
    ];

    console.log('📝 Animation consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate math utility functions
   */
  async consolidateMathUtilities() {
    const recommendations = [
      {
        action: 'replace_position_utils',
        files: ['src/utils/positionUtils.js'],
        replacement: 'import { MathUtils } from "../utils/unifiedMathUtils"',
        status: 'ready',
      },
      {
        action: 'replace_pathfinding_utils',
        files: ['src/utils/pathfindingUtils.js'],
        replacement: 'Use MathUtils.havePositionsChanged',
        status: 'ready',
      },
      {
        action: 'replace_face_position_utils',
        files: ['src/utils/facePositionUtils.js'],
        replacement: 'Use MathUtils.getFacePosition',
        status: 'ready',
      },
    ];

    console.log('📝 Math utilities consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate storage and persistence systems
   */
  async consolidateStorageSystems() {
    const recommendations = [
      {
        action: 'unify_object_caches',
        files: ['src/services/spatialObjectsService.js'],
        replacement: 'Use global storage manager for object caching',
        status: 'ready',
      },
      {
        action: 'unify_connection_caches',
        files: ['src/services/connectionsService.js'],
        replacement: 'Use global storage manager for connection caching',
        status: 'ready',
      },
      {
        action: 'coordinate_save_timeouts',
        files: ['Multiple services with save operations'],
        replacement: 'Use global storage manager for save coordination',
        status: 'ready',
      },
    ];

    console.log('📝 Storage consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate object pooling systems
   */
  async consolidatePoolingSystems() {
    const recommendations = [
      {
        action: 'coordinate_line_pools',
        files: ['src/utils/linePoolManager.js'],
        replacement: 'Use global pooling manager for line resources',
        status: 'ready',
      },
      {
        action: 'unify_geometry_pooling',
        files: ['PooledLine components throughout app'],
        replacement: 'Use global pooling manager for geometry resources',
        status: 'ready',
      },
      {
        action: 'optimize_material_pooling',
        files: ['Three.js material creation scattered'],
        replacement: 'Use global pooling manager for material resources',
        status: 'ready',
      },
    ];

    console.log('📝 Pooling consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate state management systems
   */
  async consolidateStateSystems() {
    const recommendations = [
      {
        action: 'coordinate_zustand_stores',
        files: ['src/stores/*.js'],
        replacement: 'Register stores with global state manager',
        status: 'ready',
      },
      {
        action: 'optimize_unloaded_tracking',
        files: ['Multiple services with unloaded object tracking'],
        replacement: 'Use global state manager for unloaded resource tracking',
        status: 'ready',
      },
      {
        action: 'coordinate_cross_store_updates',
        files: ['Cross-store dependencies'],
        replacement: 'Use global state manager for cross-store communication',
        status: 'ready',
      },
    ];

    console.log('📝 State management consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate validation systems
   */
  async consolidateValidationSystems() {
    const recommendations = [
      {
        action: 'unify_position_validation',
        files: ['Position validation across components'],
        replacement: 'Use global validation manager for position checks',
        status: 'ready',
      },
      {
        action: 'standardize_object_validation',
        files: ['Object validation in services'],
        replacement: 'Use global validation manager for object validation',
        status: 'ready',
      },
      {
        action: 'centralize_validation_rules',
        files: ['Scattered validation logic'],
        replacement: 'Define validation rules in global validation manager',
        status: 'ready',
      },
    ];

    console.log('📝 Validation consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate configuration systems
   */
  async consolidateConfigurationSystems() {
    const recommendations = [
      {
        action: 'centralize_constants',
        files: ['CELL_SIZE and other constants scattered'],
        replacement: 'Use global configuration manager for all constants',
        status: 'ready',
      },
      {
        action: 'unify_environment_access',
        files: ['Direct environment variable access'],
        replacement:
          'Use global configuration manager for environment variables',
        status: 'ready',
      },
      {
        action: 'standardize_defaults',
        files: ['Default values inconsistently defined'],
        replacement: 'Use global configuration manager for default values',
        status: 'ready',
      },
    ];

    console.log('📝 Configuration consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate error handling systems
   */
  async consolidateErrorHandlingSystems() {
    const recommendations = [
      {
        action: 'unify_error_logging',
        files: ['Console.error calls throughout app'],
        replacement: 'Use global error manager for all error logging',
        status: 'ready',
      },
      {
        action: 'standardize_error_handling',
        files: ['Inconsistent try-catch blocks'],
        replacement: 'Use global error manager for standardized error handling',
        status: 'ready',
      },
      {
        action: 'implement_error_monitoring',
        files: ['No centralized error tracking'],
        replacement:
          'Use global error manager for error monitoring and statistics',
        status: 'ready',
      },
    ];

    console.log('📝 Error handling consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate resource lifecycle systems
   */
  async consolidateResourceLifecycleSystems() {
    const recommendations = [
      {
        action: 'unify_texture_disposal',
        files: ['WebcamStream, ScreenShareStream, Plane components'],
        replacement: 'Use global lifecycle manager for texture disposal',
        status: 'ready',
      },
      {
        action: 'standardize_cleanup_patterns',
        files: ['Component cleanup patterns scattered'],
        replacement: 'Use global lifecycle manager for consistent cleanup',
        status: 'ready',
      },
      {
        action: 'coordinate_resource_tracking',
        files: ['Resource tracking inconsistent'],
        replacement: 'Use global lifecycle manager for resource tracking',
        status: 'ready',
      },
    ];

    console.log('📝 Resource lifecycle consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate WebGL context systems
   */
  async consolidateWebGLContextSystems() {
    const recommendations = [
      {
        action: 'centralize_canvas_settings',
        files: ['Canvas settings scattered in App.jsx'],
        replacement: 'Use global WebGL manager for canvas configuration',
        status: 'ready',
      },
      {
        action: 'unify_device_detection',
        files: ['Device capability detection duplicated'],
        replacement: 'Use global WebGL manager for device capabilities',
        status: 'ready',
      },
      {
        action: 'standardize_webgl_config',
        files: ['WebGL context configuration inconsistent'],
        replacement: 'Use global WebGL manager for context management',
        status: 'ready',
      },
    ];

    console.log('📝 WebGL context consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate debouncing systems
   */
  async consolidateDebouncingSystems() {
    const recommendations = [
      {
        action: 'unify_debounce_patterns',
        files: ['debouncedUpdateTimeoutRef in multiple components'],
        replacement:
          'Use global debouncing manager for all debounced operations',
        status: 'ready',
      },
      {
        action: 'standardize_debounce_delays',
        files: ['Different debounce delays without coordination'],
        replacement: 'Use global debouncing manager for consistent delays',
        status: 'ready',
      },
      {
        action: 'coordinate_timeout_management',
        files: ['Timeout management scattered'],
        replacement: 'Use global debouncing manager for timeout coordination',
        status: 'ready',
      },
    ];

    console.log('📝 Debouncing consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Consolidate event listener systems
   */
  async consolidateEventListenerSystems() {
    const recommendations = [
      {
        action: 'unify_event_handlers',
        files: ['Global click handlers in multiple components'],
        replacement: 'Use global event manager for event listener coordination',
        status: 'ready',
      },
      {
        action: 'standardize_event_cleanup',
        files: ['Event cleanup patterns inconsistent'],
        replacement: 'Use global event manager for automatic cleanup',
        status: 'ready',
      },
      {
        action: 'implement_event_delegation',
        files: ['Performance optimization opportunities'],
        replacement: 'Use global event manager for event delegation',
        status: 'ready',
      },
    ];

    console.log('📝 Event listener consolidation plan:', recommendations);
    return recommendations;
  }

  /**
   * Load resource lifecycle management system
   */
  loadResourceLifecycleSystem() {
    try {
      const lifecycleManager = {
        resources: new Map(),
        cleanupHandlers: new Map(),
        disposalQueue: [],

        // Resource registration
        registerResource: (id, resource, type = 'general') => {
          lifecycleManager.resources.set(id, {
            resource,
            type,
            created: Date.now(),
            disposed: false,
          });
        },

        registerCleanupHandler: (id, handler) => {
          lifecycleManager.cleanupHandlers.set(id, handler);
        },

        // Resource disposal
        disposeResource: (id) => {
          const resourceInfo = lifecycleManager.resources.get(id);
          if (resourceInfo && !resourceInfo.disposed) {
            const handler = lifecycleManager.cleanupHandlers.get(id);
            if (handler) {
              try {
                handler(resourceInfo.resource);
              } catch (error) {
                console.warn(
                  `Cleanup handler failed for resource ${id}:`,
                  error
                );
              }
            }

            // Standard disposal for Three.js resources
            if (resourceInfo.resource?.dispose) {
              resourceInfo.resource.dispose();
            }

            resourceInfo.disposed = true;
            lifecycleManager.cleanupHandlers.delete(id);
          }
        },

        // Statistics
        getStats: () => ({
          totalResources: lifecycleManager.resources.size,
          activeResources: Array.from(
            lifecycleManager.resources.values()
          ).filter((r) => !r.disposed).length,
        }),

        // Cleanup
        cleanup: () => {
          // Dispose all active resources
          Array.from(lifecycleManager.resources.keys()).forEach((id) => {
            lifecycleManager.disposeResource(id);
          });

          lifecycleManager.resources.clear();
          lifecycleManager.cleanupHandlers.clear();
          lifecycleManager.disposalQueue = [];
        },
      };

      // Register as global lifecycle manager
      if (typeof window !== 'undefined') {
        window._globalLifecycle = lifecycleManager;
      }

      return {
        type: 'resourceLifecycle',
        manager: lifecycleManager,
        duplicates: [
          'Texture disposal in WebcamStream, ScreenShareStream, Plane',
          'Event listener cleanup scattered across components',
          'Ref cleanup patterns repeated throughout app',
        ],
        consolidationStatus: 'lifecycle_coordinated',
      };
    } catch (error) {
      console.warn('Failed to load resource lifecycle system:', error);
      return null;
    }
  }

  /**
   * Load WebGL context management system
   */
  loadWebGLContextSystem() {
    try {
      const webglManager = {
        contextInfo: null,
        capabilities: null,
        settings: new Map(),

        // Device capability detection
        detectCapabilities: () => {
          const capabilities = {
            isMobile:
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              ),
            isLowEnd:
              navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4,
            devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            hardwareConcurrency: navigator.hardwareConcurrency || 4,
            deviceMemory: navigator.deviceMemory || 4,
          };

          webglManager.capabilities = capabilities;
          return capabilities;
        },

        // Canvas settings generation
        generateCanvasSettings: (quality) => {
          const caps =
            webglManager.capabilities || webglManager.detectCapabilities();

          if (caps.isMobile) {
            return {
              gl: {
                antialias: false,
                samples: 0,
                alpha: true,
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false,
                powerPreference: 'default',
                precision: 'mediump',
              },
              dpr: caps.devicePixelRatio,
              frameloop: 'always',
            };
          } else if (quality === 'low' || caps.isLowEnd) {
            return {
              gl: {
                antialias: false,
                samples: 0,
                alpha: true,
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false,
                powerPreference: 'high-performance',
                precision: 'highp',
              },
              dpr: caps.devicePixelRatio,
              frameloop: 'always',
            };
          } else {
            return {
              gl: {
                antialias: true,
                samples: 4,
                alpha: true,
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false,
                powerPreference: 'high-performance',
                precision: 'highp',
              },
              dpr: caps.devicePixelRatio,
              frameloop: 'always',
            };
          }
        },

        // Statistics
        getStats: () => ({
          capabilities: webglManager.capabilities,
          settingsCount: webglManager.settings.size,
        }),

        // Cleanup
        cleanup: () => {
          webglManager.settings.clear();
          webglManager.capabilities = null;
        },
      };

      // Initialize capabilities
      webglManager.detectCapabilities();

      // Register as global WebGL manager
      if (typeof window !== 'undefined') {
        window._globalWebGL = webglManager;
      }

      return {
        type: 'webglContext',
        manager: webglManager,
        duplicates: [
          'Canvas settings scattered in App.jsx',
          'Device capability detection duplicated',
          'Mobile/desktop detection repeated',
        ],
        consolidationStatus: 'webgl_centralized',
      };
    } catch (error) {
      console.warn('Failed to load WebGL context system:', error);
      return null;
    }
  }

  /**
   * Load debouncing coordination system
   */
  loadDebouncingSystem() {
    try {
      const debouncingManager = {
        timeouts: new Map(),
        configs: new Map(),
        stats: new Map(),

        // Configuration
        setConfig: (type, delay) => {
          debouncingManager.configs.set(type, delay);
        },

        getConfig: (type, defaultDelay = 100) => {
          return debouncingManager.configs.get(type) || defaultDelay;
        },

        // Debounced execution
        debounce: (key, fn, delay = null, type = 'general') => {
          // Clear existing timeout
          if (debouncingManager.timeouts.has(key)) {
            clearTimeout(debouncingManager.timeouts.get(key));
          }

          // Use configured delay or provided delay
          const actualDelay = delay || debouncingManager.getConfig(type);

          // Set new timeout
          const timeoutId = setTimeout(() => {
            try {
              fn();
              debouncingManager.timeouts.delete(key);

              // Update stats
              const count = debouncingManager.stats.get(type) || 0;
              debouncingManager.stats.set(type, count + 1);
            } catch (error) {
              console.warn(`Debounced function failed for key ${key}:`, error);
            }
          }, actualDelay);

          debouncingManager.timeouts.set(key, timeoutId);
          return timeoutId;
        },

        // Cancel debounced function
        cancel: (key) => {
          if (debouncingManager.timeouts.has(key)) {
            clearTimeout(debouncingManager.timeouts.get(key));
            debouncingManager.timeouts.delete(key);
            return true;
          }
          return false;
        },

        // Statistics
        getStats: () => ({
          activeTimeouts: debouncingManager.timeouts.size,
          configuredTypes: debouncingManager.configs.size,
          executionCounts: Object.fromEntries(debouncingManager.stats),
        }),

        // Cleanup
        cleanup: () => {
          // Clear all timeouts
          debouncingManager.timeouts.forEach((timeoutId) =>
            clearTimeout(timeoutId)
          );
          debouncingManager.timeouts.clear();
          debouncingManager.configs.clear();
          debouncingManager.stats.clear();
        },
      };

      // Set common debounce configurations
      debouncingManager.setConfig('database', 100);
      debouncingManager.setConfig('camera', 25);
      debouncingManager.setConfig('resize', 200);
      debouncingManager.setConfig('text', 300);

      // Register as global debouncing manager
      if (typeof window !== 'undefined') {
        window._globalDebouncing = debouncingManager;
      }

      return {
        type: 'debouncing',
        manager: debouncingManager,
        duplicates: [
          'debouncedUpdateTimeoutRef in Cube, Plane, Dodecahedron, TextObject',
          'Different debounce delays without coordination',
          'Database update throttling scattered',
        ],
        consolidationStatus: 'debouncing_unified',
      };
    } catch (error) {
      console.warn('Failed to load debouncing system:', error);
      return null;
    }
  }

  /**
   * Load event listener coordination system
   */
  loadEventListenerSystem() {
    try {
      const eventManager = {
        listeners: new Map(),

        // Event listener registration
        addEventListener: (target, event, handler, options = {}, id = null) => {
          const listenerId = id || `${event}_${Date.now()}`;

          const listenerInfo = {
            target,
            event,
            handler,
            options,
            registered: Date.now(),
          };

          // Add the listener
          target.addEventListener(event, handler, options);
          eventManager.listeners.set(listenerId, listenerInfo);

          return listenerId;
        },

        // Remove event listener
        removeEventListener: (listenerId) => {
          const listenerInfo = eventManager.listeners.get(listenerId);
          if (listenerInfo) {
            listenerInfo.target.removeEventListener(
              listenerInfo.event,
              listenerInfo.handler,
              listenerInfo.options
            );
            eventManager.listeners.delete(listenerId);
            return true;
          }
          return false;
        },

        // Statistics
        getStats: () => ({
          activeListeners: eventManager.listeners.size,
          listenersByType: Array.from(eventManager.listeners.values()).reduce(
            (acc, listener) => {
              acc[listener.event] = (acc[listener.event] || 0) + 1;
              return acc;
            },
            {}
          ),
        }),

        // Cleanup
        cleanup: () => {
          // Remove all listeners
          eventManager.listeners.forEach((listenerInfo, id) => {
            eventManager.removeEventListener(id);
          });

          eventManager.listeners.clear();
        },
      };

      // Register as global event manager
      if (typeof window !== 'undefined') {
        window._globalEvents = eventManager;

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
          eventManager.cleanup();
        });
      }

      return {
        type: 'eventListeners',
        manager: eventManager,
        duplicates: [
          'Global click handlers in multiple components',
          'Window resize/unload listeners scattered',
          'Camera event listeners setup duplicated',
        ],
        consolidationStatus: 'events_coordinated',
      };
    } catch (error) {
      console.warn('Failed to load event listener system:', error);
      return null;
    }
  }

  /**
   * Load configuration and settings management system
   */
  loadConfigurationSystem() {
    try {
      const configManager = {
        configs: new Map(),
        defaults: new Map(),
        overrides: new Map(),

        // Configuration management
        setConfig: (key, value) => {
          configManager.configs.set(key, value);
        },

        getConfig: (key, defaultValue = null) => {
          if (configManager.overrides.has(key)) {
            return configManager.overrides.get(key);
          }
          if (configManager.configs.has(key)) {
            return configManager.configs.get(key);
          }
          if (configManager.defaults.has(key)) {
            return configManager.defaults.get(key);
          }
          return defaultValue;
        },

        setDefault: (key, value) => {
          configManager.defaults.set(key, value);
        },

        setOverride: (key, value) => {
          configManager.overrides.set(key, value);
        },

        // Environment-specific configs
        loadEnvironmentConfigs: () => {
          const envConfigs = {
            cellSize: 50, // Default from CELL_SIZE constant
            maxConcurrentLoads: 6, // Default from spatial manager
            performanceMode: false,
            debugMode: false,
          };

          Object.entries(envConfigs).forEach(([key, value]) => {
            configManager.setConfig(key, value);
          });

          return envConfigs;
        },

        // Statistics
        getStats: () => ({
          configCount: configManager.configs.size,
          defaultCount: configManager.defaults.size,
          overrideCount: configManager.overrides.size,
        }),

        // Cleanup
        cleanup: () => {
          configManager.configs.clear();
          configManager.defaults.clear();
          configManager.overrides.clear();
        },
      };

      // Load environment configurations
      configManager.loadEnvironmentConfigs();

      // Set common defaults
      configManager.setDefault('throttleDelay', 100);
      configManager.setDefault('cacheSize', 1000);
      configManager.setDefault('maxRetries', 3);

      // Register as global configuration manager
      if (typeof window !== 'undefined') {
        window._globalConfig = configManager;
      }

      return {
        type: 'configuration',
        manager: configManager,
        duplicates: [
          'Constants scattered across files (CELL_SIZE, timeouts)',
          'Environment variable access duplicated',
          'Configuration objects in multiple stores',
          'Default values inconsistently defined',
        ],
        consolidationStatus: 'config_centralized',
      };
    } catch (error) {
      console.warn('Failed to load configuration system:', error);
      return null;
    }
  }

  /**
   * Load error handling and logging system
   */
  loadErrorHandlingSystem() {
    try {
      const errorManager = {
        errorLog: [],
        errorCounts: new Map(),
        errorHandlers: new Map(),
        maxLogSize: 1000,

        // Error handling
        logError: (error, context = 'general') => {
          const errorEntry = {
            timestamp: Date.now(),
            message: error.message || error,
            stack: error.stack,
            context,
            id: Date.now() + Math.random(),
          };

          errorManager.errorLog.push(errorEntry);

          // Maintain log size
          if (errorManager.errorLog.length > errorManager.maxLogSize) {
            errorManager.errorLog.shift();
          }

          // Update error counts
          const count = errorManager.errorCounts.get(context) || 0;
          errorManager.errorCounts.set(context, count + 1);

          return errorEntry.id;
        },

        registerErrorHandler: (context, handlerFn) => {
          errorManager.errorHandlers.set(context, handlerFn);
        },

        handleError: (error, context = 'general') => {
          const errorId = errorManager.logError(error, context);

          const handler = errorManager.errorHandlers.get(context);
          if (handler) {
            try {
              handler(error, errorId);
            } catch (handlerError) {
              console.error('Error in error handler:', handlerError);
            }
          }

          return errorId;
        },

        // Statistics and monitoring
        getErrorStats: () => ({
          totalErrors: errorManager.errorLog.length,
          errorCounts: Object.fromEntries(errorManager.errorCounts),
          recentErrors: errorManager.errorLog.slice(-10),
        }),

        clearErrors: (context = null) => {
          if (context) {
            errorManager.errorLog = errorManager.errorLog.filter(
              (e) => e.context !== context
            );
            errorManager.errorCounts.delete(context);
          } else {
            errorManager.errorLog = [];
            errorManager.errorCounts.clear();
          }
        },

        // Cleanup
        cleanup: () => {
          errorManager.errorLog = [];
          errorManager.errorCounts.clear();
          errorManager.errorHandlers.clear();
        },
      };

      // Register common error handlers
      errorManager.registerErrorHandler('network', (error) => {
        console.warn('Network error occurred:', error.message);
      });

      errorManager.registerErrorHandler('validation', (error) => {
        console.warn('Validation error:', error.message);
      });

      // Register as global error manager
      if (typeof window !== 'undefined') {
        window._globalErrors = errorManager;

        // Global error handler
        window.addEventListener('error', (event) => {
          errorManager.handleError(event.error, 'global');
        });

        window.addEventListener('unhandledrejection', (event) => {
          errorManager.handleError(event.reason, 'promise');
        });
      }

      return {
        type: 'errorHandling',
        manager: errorManager,
        duplicates: [
          'Console.error calls scattered throughout app',
          'Try-catch blocks with inconsistent handling',
          'Error logging duplicated in services',
          'No centralized error monitoring',
        ],
        consolidationStatus: 'error_handling_unified',
      };
    } catch (error) {
      console.warn('Failed to load error handling system:', error);
      return null;
    }
  }

  /**
   * Global cleanup method
   */
  cleanup() {
    console.log('🧹 Cleaning up Global Optimization Coordinator...');

    this.systems.forEach((system) => {
      if (system.instance?.cleanup) {
        system.instance.cleanup();
      }
    });

    this.systems.clear();
    this.metrics.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const globalOptimizationCoordinator = new GlobalOptimizationCoordinator();

// Export the coordinator and key methods
export default globalOptimizationCoordinator;

export const initializeOptimizationCoordinator = () =>
  globalOptimizationCoordinator.initialize();

export const getOptimizationStatus = () =>
  globalOptimizationCoordinator.getStatusReport();

export const consolidateSystem = (category) =>
  globalOptimizationCoordinator.consolidateCategory(category);

export const cleanupOptimizationCoordinator = () =>
  globalOptimizationCoordinator.cleanup();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window._globalOptimizationCoordinator = globalOptimizationCoordinator;
}

console.log('🎯 Global Optimization Coordinator module loaded');
