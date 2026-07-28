/**
 * Streamlined Spatial Index optimized for 100+ objects
 * Single system approach to maximize processing power efficiency
 */

// =============================================================================
// PERFORMANCE OPTIMIZATION: Module-level reusable objects
// Avoids GC pressure by reusing these instead of creating new objects each call
// =============================================================================
const _tempPoint = { x: 0, y: 0, z: 0 };
const _tempBounds = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };

/**
 * 3D Point class with minimal overhead
 * OPTIMIZATION: Uses inline math instead of method calls where possible
 */
class Point3D {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  distanceToSquared(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return dx * dx + dy * dy + dz * dz;
  }

  distanceTo(other) {
    return Math.sqrt(this.distanceToSquared(other));
  }
  
  // Fast in-place set to avoid creating new objects
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

/**
 * 3D Bounding Box with fast operations
 * OPTIMIZATION: Added in-place methods to avoid allocations
 */
class BoundingBox {
  constructor(minX = 0, minY = 0, minZ = 0, maxX = 0, maxY = 0, maxZ = 0) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
  }

  static fromCenterAndSize(center, size) {
    const halfSize = size * 0.5;
    return new BoundingBox(
      center.x - halfSize,
      center.y - halfSize,
      center.z - halfSize,
      center.x + halfSize,
      center.y + halfSize,
      center.z + halfSize
    );
  }
  
  // Fast in-place set to avoid creating new objects
  set(minX, minY, minZ, maxX, maxY, maxZ) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
    return this;
  }
  
  // Set from center and radius (for radius queries)
  setFromCenterRadius(cx, cy, cz, radius) {
    this.minX = cx - radius;
    this.minY = cy - radius;
    this.minZ = cz - radius;
    this.maxX = cx + radius;
    this.maxY = cy + radius;
    this.maxZ = cz + radius;
    return this;
  }

  intersects(other) {
    return !(
      this.maxX < other.minX ||
      this.minX > other.maxX ||
      this.maxY < other.minY ||
      this.minY > other.maxY ||
      this.maxZ < other.minZ ||
      this.minZ > other.maxZ
    );
  }

  contains(point) {
    return (
      point.x >= this.minX &&
      point.x <= this.maxX &&
      point.y >= this.minY &&
      point.y <= this.maxY &&
      point.z >= this.minZ &&
      point.z <= this.maxZ
    );
  }
}

/**
 * Optimized Spatial Hash Grid - Best for 100+ objects
 * PERFORMANCE OPTIMIZATIONS:
 * - Numeric cell keys instead of string concatenation
 * - Reusable BoundingBox for queries
 * - Inline distance calculations
 * - Reduced array allocations
 */
class OptimizedSpatialGrid {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.invCellSize = 1.0 / cellSize; // Precompute for faster division

    // Use native Map for optimal performance
    this.grid = new Map(); // cellKey -> array of object data
    this.objects = new Map(); // objectId -> object data

    // Pre-allocate arrays to reduce GC pressure
    this.tempResults = [];
    this.tempCells = [];
    
    // Reusable BoundingBox for queries (avoids allocation in hot paths)
    this._queryBounds = new BoundingBox();
  }

  // OPTIMIZATION: Use numeric key instead of string for faster Map operations
  // Uses bit packing: assumes cell coords fit in ~20 bits each (±500k cells)
  _getCellKeyNumeric(cx, cy, cz) {
    // Offset to handle negative values (shift to positive range)
    const offset = 0x100000; // 2^20
    return ((cx + offset) * 0x200000 + (cy + offset)) * 0x200000 + (cz + offset);
  }

  // Fast cell key generation - still need string version for _getCellKeysForBounds
  _getCellKey(x, y, z) {
    const cx = Math.floor(x * this.invCellSize);
    const cy = Math.floor(y * this.invCellSize);
    const cz = Math.floor(z * this.invCellSize);
    return this._getCellKeyNumeric(cx, cy, cz);
  }

  // Get all cell keys that bounds intersect - OPTIMIZED with numeric keys
  _getCellKeysForBounds(bounds) {
    this.tempCells.length = 0; // Clear reused array

    const minCx = Math.floor(bounds.minX * this.invCellSize);
    const maxCx = Math.floor(bounds.maxX * this.invCellSize);
    const minCy = Math.floor(bounds.minY * this.invCellSize);
    const maxCy = Math.floor(bounds.maxY * this.invCellSize);
    const minCz = Math.floor(bounds.minZ * this.invCellSize);
    const maxCz = Math.floor(bounds.maxZ * this.invCellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          this.tempCells.push(this._getCellKeyNumeric(cx, cy, cz));
        }
      }
    }
    return this.tempCells;
  }

  insert(id, position, bounds) {
    // Remove existing if present
    this.remove(id);

    const objData = {
      id,
      position: new Point3D(position.x, position.y, position.z),
      bounds: new BoundingBox(
        bounds.minX,
        bounds.minY,
        bounds.minZ,
        bounds.maxX,
        bounds.maxY,
        bounds.maxZ
      ),
      cellKeys: [],
    };

    const cellKeys = this._getCellKeysForBounds(bounds);
    objData.cellKeys = [...cellKeys]; // Store for removal

    // Add to grid cells
    for (const cellKey of cellKeys) {
      let cell = this.grid.get(cellKey);
      if (!cell) {
        cell = [];
        this.grid.set(cellKey, cell);
      }
      cell.push(objData);
    }

    this.objects.set(id, objData);
  }

  remove(id) {
    const objData = this.objects.get(id);
    if (!objData) return false;

    // Remove from grid cells
    for (const cellKey of objData.cellKeys) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        const index = cell.indexOf(objData);
        if (index !== -1) {
          cell.splice(index, 1);
        }
        if (cell.length === 0) {
          this.grid.delete(cellKey);
        }
      }
    }

    this.objects.delete(id);
    return true;
  }

  // Fast bounds query using pre-allocated result array
  queryBounds(bounds) {
    this.tempResults.length = 0; // Clear reused array
    const seenObjects = new Set(); // Prevent duplicates

    const cellKeys = this._getCellKeysForBounds(bounds);

    for (const cellKey of cellKeys) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        for (const objData of cell) {
          if (
            !seenObjects.has(objData.id) &&
            bounds.intersects(objData.bounds)
          ) {
            seenObjects.add(objData.id);
            this.tempResults.push(objData.id);
          }
        }
      }
    }

    return [...this.tempResults]; // Return copy to avoid mutation
  }

  // OPTIMIZED radius query - uses reusable bounds and inline distance
  queryRadius(center, radius) {
    this.tempResults.length = 0;
    const radiusSquared = radius * radius;
    const seenObjects = new Set();

    // Use reusable bounding box instead of creating new one
    this._queryBounds.setFromCenterRadius(center.x, center.y, center.z, radius);

    const cellKeys = this._getCellKeysForBounds(this._queryBounds);

    for (let i = 0; i < cellKeys.length; i++) {
      const cell = this.grid.get(cellKeys[i]);
      if (cell) {
        for (let j = 0; j < cell.length; j++) {
          const objData = cell[j];
          if (!seenObjects.has(objData.id)) {
            // Inline distance squared calculation for speed
            const dx = center.x - objData.position.x;
            const dy = center.y - objData.position.y;
            const dz = center.z - objData.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq <= radiusSquared) {
              seenObjects.add(objData.id);
              this.tempResults.push(objData.id);
            }
          }
        }
      }
    }

    return [...this.tempResults];
  }

  // OPTIMIZED nearest query - uses reusable bounds
  queryNearest(center, maxResults = 1) {
    const candidates = [];

    // Start with immediate cell, expand if needed
    let searchRadius = this.cellSize;
    const maxSearchRadius = this.cellSize * 10;

    while (candidates.length < maxResults && searchRadius <= maxSearchRadius) {
      // Use reusable bounds
      this._queryBounds.setFromCenterRadius(center.x, center.y, center.z, searchRadius);

      const cellKeys = this._getCellKeysForBounds(this._queryBounds);
      const seenObjects = new Set();

      for (let i = 0; i < cellKeys.length; i++) {
        const cell = this.grid.get(cellKeys[i]);
        if (cell) {
          for (let j = 0; j < cell.length; j++) {
            const objData = cell[j];
            if (!seenObjects.has(objData.id)) {
              seenObjects.add(objData.id);
              // Inline distance calculation
              const dx = center.x - objData.position.x;
              const dy = center.y - objData.position.y;
              const dz = center.z - objData.position.z;
              candidates.push({
                id: objData.id,
                distance: Math.sqrt(dx * dx + dy * dy + dz * dz),
              });
            }
          }
        }
      }

      if (candidates.length >= maxResults) break;
      searchRadius *= 2;
    }

    // Sort by distance and return top results
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.slice(0, maxResults).map((c) => c.id);
  }

  // Bulk operations for efficiency
  bulkInsert(objects) {
    const startTime = performance.now();

    for (const { id, position, bounds } of objects) {
      this.insert(id, position, bounds);
    }

    return performance.now() - startTime;
  }

  bulkRemove(ids) {
    const startTime = performance.now();

    for (const id of ids) {
      this.remove(id);
    }

    return performance.now() - startTime;
  }

  clear() {
    this.grid.clear();
    this.objects.clear();
    this.tempResults.length = 0;
    this.tempCells.length = 0;
  }

  size() {
    return this.objects.size;
  }

  // Minimal stats for performance monitoring
  getStats() {
    let totalCellObjects = 0;
    let maxCellObjects = 0;

    for (const cell of this.grid.values()) {
      totalCellObjects += cell.length;
      maxCellObjects = Math.max(maxCellObjects, cell.length);
    }

    return {
      objectCount: this.objects.size,
      cellCount: this.grid.size,
      avgObjectsPerCell:
        this.grid.size > 0 ? totalCellObjects / this.grid.size : 0,
      maxObjectsPerCell: maxCellObjects,
      cellSize: this.cellSize,
      memoryUsage: Math.round(
        (this.objects.size * 200 + this.grid.size * 100) / 1024
      ), // KB estimate
    };
  }

  // Get object data by ID
  getObject(id) {
    return this.objects.get(id);
  }

  // Get all object IDs
  getAllIds() {
    return Array.from(this.objects.keys());
  }

  // Update object position efficiently
  updatePosition(id, newPosition) {
    const objData = this.objects.get(id);
    if (!objData) return false;

    // Check if it stays in the same cells
    const oldCellKey = this._getCellKey(
      objData.position.x,
      objData.position.y,
      objData.position.z
    );
    const newCellKey = this._getCellKey(
      newPosition.x,
      newPosition.y,
      newPosition.z
    );

    objData.position.x = newPosition.x;
    objData.position.y = newPosition.y;
    objData.position.z = newPosition.z;

    // Update bounds center
    const centerDx =
      newPosition.x - (objData.bounds.minX + objData.bounds.maxX) * 0.5;
    const centerDy =
      newPosition.y - (objData.bounds.minY + objData.bounds.maxY) * 0.5;
    const centerDz =
      newPosition.z - (objData.bounds.minZ + objData.bounds.maxZ) * 0.5;

    objData.bounds.minX += centerDx;
    objData.bounds.maxX += centerDx;
    objData.bounds.minY += centerDy;
    objData.bounds.maxY += centerDy;
    objData.bounds.minZ += centerDz;
    objData.bounds.maxZ += centerDz;

    // If cells changed, re-insert
    if (oldCellKey !== newCellKey) {
      this.remove(id);
      this.insert(id, objData.position, objData.bounds);
    }

    return true;
  }
}

/**
 * Factory function for creating optimized spatial index
 */
export function createStreamlinedSpatialIndex(cellSize = 50) {
  return new OptimizedSpatialGrid(cellSize);
}

/**
 * Simple benchmark for 100+ objects
 */
export function benchmarkStreamlined(objectCount = 150) {
  console.log(
    `🏃 Benchmarking streamlined spatial index with ${objectCount} objects`
  );

  const index = createStreamlinedSpatialIndex(50); // Optimal cell size for 100+ objects

  // Generate test objects
  const objects = [];
  for (let i = 0; i < objectCount; i++) {
    const position = new Point3D(
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500
    );
    const bounds = BoundingBox.fromCenterAndSize(position, 5);
    objects.push({ id: `obj_${i}`, position, bounds });
  }

  // Bulk insert test
  const insertTime = index.bulkInsert(objects);

  // Query performance test
  const queryCount = 50;
  const startTime = performance.now();

  for (let i = 0; i < queryCount; i++) {
    const center = new Point3D(
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500,
      Math.random() * 1000 - 500
    );
    index.queryRadius(center, 100);
  }

  const queryTime = performance.now() - startTime;
  const stats = index.getStats();

  console.log(`✅ Streamlined benchmark completed:
    - Objects: ${objectCount}
    - Insert time: ${insertTime.toFixed(2)}ms
    - Query time: ${queryTime.toFixed(2)}ms (${queryCount} queries)
    - Avg query time: ${(queryTime / queryCount).toFixed(3)}ms
    - Memory usage: ${stats.memoryUsage}KB`);

  return {
    objectCount,
    insertTime,
    queryTime,
    avgQueryTime: queryTime / queryCount,
    stats,
  };
}

export { OptimizedSpatialGrid, Point3D, BoundingBox };
