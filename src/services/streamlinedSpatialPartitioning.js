/**
 * Streamlined Spatial Manager for 100+ objects
 * Single-system approach optimized for maximum performance efficiency
 */

import {
  createStreamlinedSpatialIndex,
  Point3D,
  BoundingBox,
} from '../utils/streamlinedSpatialIndex.js';

// Import existing spatial partitioning constants
import {
  CELL_SIZE,
  CELL_NEIGHBOR_RADIUS,
  getCellCoordinates,
  getCellId,
} from './spatialPartitioning.js';

/**
 * Streamlined spatial manager - no overhead, maximum performance
 */
class StreamlinedSpatialManager {
  constructor(options = {}) {
    this.options = {
      // Optimized cell size for 100+ objects
      spatialCellSize: options.spatialCellSize || 50,
      enableFirebaseIntegration: options.enableFirebaseIntegration !== false,
      ...options,
    };

    // Single spatial index - no hybrid complexity
    this.spatialIndex = createStreamlinedSpatialIndex(
      this.options.spatialCellSize
    );

    // Minimal tracking for Firebase compatibility
    this.cellObjects = new Map(); // cellId -> Set of object IDs (for Firebase compatibility)
    this.loadedCells = new Set();

    // Lean performance tracking
    this.stats = {
      queries: 0,
      queryTime: 0,
      updates: 0,
      updateTime: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Add or update an object - optimized for speed
   */
  updateObject(objectId, position, bounds = null, metadata = {}) {
    const startTime = performance.now();

    // Convert position to Point3D if needed
    const point3D = Array.isArray(position)
      ? new Point3D(position[0], position[1], position[2])
      : position;

    // Create minimal bounding box if not provided
    const bbox =
      bounds || BoundingBox.fromCenterAndSize(point3D, metadata.size || 5);

    // Update spatial index
    this.spatialIndex.insert(objectId, point3D, bbox);

    // Update Firebase-compatible cell tracking if enabled
    if (this.options.enableFirebaseIntegration) {
      const cellCoords = getCellCoordinates([point3D.x, point3D.y, point3D.z]);
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

      if (!this.cellObjects.has(cellId)) {
        this.cellObjects.set(cellId, new Set());
      }
      this.cellObjects.get(cellId).add(objectId);
    }

    // Update performance stats
    const duration = performance.now() - startTime;
    this.stats.updates++;
    this.stats.updateTime += duration;

    return true;
  }

  /**
   * Remove an object
   */
  removeObject(objectId) {
    const result = this.spatialIndex.remove(objectId);

    // Remove from Firebase-compatible tracking
    if (this.options.enableFirebaseIntegration) {
      for (const [cellId, objects] of this.cellObjects.entries()) {
        if (objects.has(objectId)) {
          objects.delete(objectId);
          if (objects.size === 0) {
            this.cellObjects.delete(cellId);
          }
          break;
        }
      }
    }

    return result;
  }

  /**
   * Fast bounds query
   */
  queryObjectsInBounds(minPosition, maxPosition) {
    const startTime = performance.now();

    const bounds = new BoundingBox(
      minPosition[0],
      minPosition[1],
      minPosition[2],
      maxPosition[0],
      maxPosition[1],
      maxPosition[2]
    );

    const objectIds = this.spatialIndex.queryBounds(bounds);
    const results = objectIds.map((id) => {
      const objData = this.spatialIndex.getObject(id);
      return {
        id,
        position: objData.position,
        bounds: objData.bounds,
        metadata: objData.metadata || {},
      };
    });

    const duration = performance.now() - startTime;
    this.stats.queries++;
    this.stats.queryTime += duration;

    return results;
  }

  /**
   * Fast radius query
   */
  queryObjectsInRadius(centerPosition, radius) {
    const startTime = performance.now();

    const center = Array.isArray(centerPosition)
      ? new Point3D(centerPosition[0], centerPosition[1], centerPosition[2])
      : centerPosition;

    const objectIds = this.spatialIndex.queryRadius(center, radius);
    const results = objectIds.map((id) => {
      const objData = this.spatialIndex.getObject(id);
      return {
        id,
        position: objData.position,
        bounds: objData.bounds,
        distance: center.distanceTo(objData.position),
        metadata: objData.metadata || {},
      };
    });

    const duration = performance.now() - startTime;
    this.stats.queries++;
    this.stats.queryTime += duration;

    return results;
  }

  /**
   * Find nearest objects
   */
  queryNearestObjects(centerPosition, maxResults = 5) {
    const center = Array.isArray(centerPosition)
      ? new Point3D(centerPosition[0], centerPosition[1], centerPosition[2])
      : centerPosition;

    const objectIds = this.spatialIndex.queryNearest(center, maxResults);
    return objectIds.map((id) => {
      const objData = this.spatialIndex.getObject(id);
      return {
        id,
        position: objData.position,
        bounds: objData.bounds,
        distance: center.distanceTo(objData.position),
        metadata: objData.metadata || {},
      };
    });
  }

  /**
   * Get objects around a position (Firebase compatible)
   */
  getObjectsAroundPosition(position, radius = CELL_NEIGHBOR_RADIUS) {
    // Use radius query for better performance than cell-based approach
    const searchRadius = radius * CELL_SIZE * 0.5; // Convert cell radius to world units
    return this.queryObjectsInRadius(position, searchRadius);
  }

  /**
   * Efficient bulk operations
   */
  bulkUpdateObjects(objects) {
    const spatialObjects = objects.map(({ id, position, bounds, metadata }) => {
      const point3D = Array.isArray(position)
        ? new Point3D(position[0], position[1], position[2])
        : position;
      const bbox =
        bounds || BoundingBox.fromCenterAndSize(point3D, metadata?.size || 5);

      return { id, position: point3D, bounds: bbox, metadata };
    });

    return this.spatialIndex.bulkInsert(spatialObjects);
  }

  bulkRemoveObjects(objectIds) {
    // Remove from Firebase tracking
    if (this.options.enableFirebaseIntegration) {
      for (const id of objectIds) {
        this.removeObject(id);
      }
    } else {
      this.spatialIndex.bulkRemove(objectIds);
    }
  }

  /**
   * Fast position update for moving objects
   */
  updateObjectPosition(objectId, newPosition) {
    const point3D = Array.isArray(newPosition)
      ? new Point3D(newPosition[0], newPosition[1], newPosition[2])
      : newPosition;

    return this.spatialIndex.updatePosition(objectId, point3D);
  }

  /**
   * Get all object IDs
   */
  getAllObjectIds() {
    return this.spatialIndex.getAllIds();
  }

  /**
   * Clear all data
   */
  clear() {
    this.spatialIndex.clear();
    this.cellObjects.clear();
    this.loadedCells.clear();

    // Reset stats
    this.stats = {
      queries: 0,
      queryTime: 0,
      updates: 0,
      updateTime: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Get object count
   */
  size() {
    return this.spatialIndex.size();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const spatialStats = this.spatialIndex.getStats();
    const uptime = Date.now() - this.stats.startTime;

    return {
      ...spatialStats,
      totalQueries: this.stats.queries,
      totalUpdates: this.stats.updates,
      averageQueryTime:
        this.stats.queries > 0 ? this.stats.queryTime / this.stats.queries : 0,
      averageUpdateTime:
        this.stats.updates > 0 ? this.stats.updateTime / this.stats.updates : 0,
      queriesPerSecond:
        this.stats.queries > 0 ? this.stats.queries / (uptime / 1000) : 0,
      updatesPerSecond:
        this.stats.updates > 0 ? this.stats.updates / (uptime / 1000) : 0,
      uptime,
      systemType: 'streamlined_spatial_grid',
    };
  }

  /**
   * Get spatial index stats
   */
  getSpatialStats() {
    return this.spatialIndex.getStats();
  }
}

// Global instance
let globalStreamlinedManager = null;

/**
 * Get or create the global streamlined spatial manager
 */
export function getStreamlinedSpatialManager(options = {}) {
  if (!globalStreamlinedManager) {
    globalStreamlinedManager = new StreamlinedSpatialManager(options);
  }
  return globalStreamlinedManager;
}

/**
 * Initialize streamlined spatial partitioning
 */
export function initializeStreamlinedSpatialPartitioning(options = {}) {
  globalStreamlinedManager = new StreamlinedSpatialManager(options);
  console.log(
    '🚀 Streamlined spatial partitioning initialized for 100+ objects'
  );
  return globalStreamlinedManager;
}

/**
 * Quick benchmark for streamlined system
 */
export async function benchmarkStreamlinedSystem(objectCount = 150) {
  console.log(`🏃 Benchmarking streamlined system with ${objectCount} objects`);

  const manager = new StreamlinedSpatialManager({
    spatialCellSize: 50,
    enableFirebaseIntegration: false, // Disable for pure performance test
  });

  // Generate test objects
  const objects = [];
  for (let i = 0; i < objectCount; i++) {
    const position = [
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
    ];
    objects.push({
      id: `benchmark_${i}`,
      position,
      metadata: { size: Math.random() * 10 + 1 },
    });
  }

  // Bulk insert test
  const startBulk = performance.now();
  manager.bulkUpdateObjects(objects);
  const bulkTime = performance.now() - startBulk;

  // Query performance test
  const queryCount = 50;
  const startQuery = performance.now();

  for (let i = 0; i < queryCount; i++) {
    const center = [
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
    ];
    manager.queryObjectsInRadius(center, 100);
  }

  const queryTime = performance.now() - startQuery;
  const stats = manager.getPerformanceStats();

  console.log(`✅ Streamlined system benchmark completed:
    - Objects: ${objectCount}
    - Bulk insert time: ${bulkTime.toFixed(2)}ms
    - Query time: ${queryTime.toFixed(2)}ms (${queryCount} queries)
    - Avg query time: ${(queryTime / queryCount).toFixed(3)}ms
    - Memory usage: ${stats.memoryUsage}KB
    - System: ${stats.systemType}`);

  return {
    objectCount,
    bulkTime,
    queryTime,
    avgQueryTime: queryTime / queryCount,
    stats,
  };
}

export {
  StreamlinedSpatialManager,
  CELL_SIZE,
  CELL_NEIGHBOR_RADIUS,
  getCellCoordinates,
  getCellId,
};
