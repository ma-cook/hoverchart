import * as THREE from 'three';

// Module-level reusable THREE objects to reduce GC pressure
const _tempVec = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();
const _sphereCenter = new THREE.Vector3();
const _tempSphere = new THREE.Sphere();

/**
 * Frustum culling for objects to only render what's visible
 * Modified to be less aggressive about culling to prevent object disappearing bug
 *
 * PERF FIX: updateVisibility() reuses pre-allocated buffers instead of
 * creating 4 temporary arrays (.map→.sort→.slice→.map) per call.
 * At 3000 objects this eliminated ~96KB of short-lived allocations per
 * call (called ~5×/sec during camera panning), reducing GC pauses.
 */
export class ObjectVirtualizer {
  constructor() {
    this.frustum = new THREE.Frustum();
    this.cameraMatrix = new THREE.Matrix4();
    this.visibleObjects = new Set();
    this.recentlyVisibleObjects = new Map(); // Object ID -> timestamp when last seen
    this.lastCameraPosition = new THREE.Vector3();
    this.lastCameraTarget = new THREE.Vector3();
    this.updateThreshold = 5; // Update when camera moves 5 units
    this.retentionTime = 10000; // Keep objects visible for 10 seconds after they leave frustum

    // Pre-allocated buffers for updateVisibility — avoids O(n) allocations
    // per call.  Grows as needed but never shrinks, so after the first
    // large call subsequent calls reuse the same memory.
    this._distBuf = [];   // [{id, distance}] reused across calls
    this._idsBuf = [];    // output id array reused across calls
    this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    // Cache localStorage quality read — updated externally via setCanvasQuality()
    this._canvasQuality = localStorage.getItem('canvasQuality') || 'medium';
  }

  /** Update cached quality setting (call when user changes quality) */
  setCanvasQuality(quality) {
    this._canvasQuality = quality;
  }

  // ── Shared helpers ──────────────────────────────────────────────────

  /** Compute squared distance from camera to object (avoids sqrt) */
  _distanceSq(obj, cx, cy, cz) {
    const p = obj.position;
    const ox = (Array.isArray(p) ? p[0] : p?.x) || 0;
    const oy = (Array.isArray(p) ? p[1] : p?.y) || 0;
    const oz = (Array.isArray(p) ? p[2] : p?.z) || 0;
    const dx = ox - cx;
    const dy = oy - cy;
    const dz = oz - cz;
    return dx * dx + dy * dy + dz * dz;
  }

  /** Fill _distBuf with {id, distSq} for each object, return count written. */
  _fillDistanceBuffer(objects, cx, cy, cz, maxDistSq) {
    const buf = this._distBuf;
    let count = 0;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const dsq = this._distanceSq(obj, cx, cy, cz);
      // Skip objects beyond max distance (Infinity = no distance cap)
      if (dsq > maxDistSq) continue;
      // Grow buffer entry on demand (first large call allocates, next reuses)
      if (count >= buf.length) {
        buf.push({ id: obj.id, distSq: dsq });
      } else {
        buf[count].id = obj.id;
        buf[count].distSq = dsq;
      }
      count++;
    }
    return count;
  }

  /** Sort the first `count` entries of _distBuf by distSq, extract ids up to
   *  `limit` into _idsBuf and return _idsBuf (length set to result count). */
  _sortAndExtract(count, limit) {
    const buf = this._distBuf;
    // Sort only the live portion in-place.
    // When `count` < `buf.length`, stale entries beyond `count` are
    // harmless: the compare function is still valid, and we only read
    // the first `resultCount` entries.  Sorting the full buffer is
    // marginally wasteful, but avoids a `.slice()` allocation.  In
    // practice the buffer length converges to `count` after one large call.
    // Truncate buffer to count so sort only touches live entries.
    if (buf.length > count) buf.length = count;
    buf.sort((a, b) => a.distSq - b.distSq);

    const resultCount = Math.min(count, limit);
    const ids = this._idsBuf;
    for (let i = 0; i < resultCount; i++) {
      ids[i] = buf[i].id;
    }
    ids.length = resultCount;
    return ids;
  }

  // ── Main entry point ────────────────────────────────────────────────

  updateVisibility(camera, objects, loadedCells = null) {
    const isMobile = this._isMobile;

    // PERFORMANCE: Use cached quality value instead of reading localStorage every frame
    const canvasQuality = this._canvasQuality;

    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    // If spatial partitioning is active (loadedCells provided), respect it
    if (loadedCells && loadedCells.size > 0) {
      // Spatial mode: show ALL objects in loaded cells — the spatial system
      // already limits the visible area to cells near the camera
      // (CELL_NEIGHBOR_RADIUS=1 → 3×3 grid = 9 cells).  No additional
      // distance or count cap needed.
      const ids = objects.map(o => o.id);
      this.visibleObjects = new Set(ids);
      return ids;
    }

    // Fallback mode: traditional distance-based culling for when spatial system isn't active
    // Mobile-aware object limits and distance culling
    // Coordinate with spatial partitioning system: CELL_SIZE = 10000, UNLOAD_DISTANCE = 4
    // So objects should be visible up to ~50000 units to match spatial system
    const maxObjectDistance = isMobile ? 45000 : 60000; // Increased to match spatial partitioning
    const maxDistSq = maxObjectDistance * maxObjectDistance;
    const maxObjects = isMobile
      ? (canvasQuality === 'low' ? 100 : canvasQuality === 'medium' ? 200 : 400)
      : (canvasQuality === 'low' ? 200 : canvasQuality === 'medium' ? 400 : 800);

    const count = this._fillDistanceBuffer(objects, cx, cy, cz, maxDistSq);
    const visibleIds = this._sortAndExtract(count, maxObjects);
    this.visibleObjects = new Set(visibleIds);
    return visibleIds;
  }

  isObjectVisible(obj) {
    if (!obj.position || !Array.isArray(obj.position)) return true;

    // Use reusable sphere instead of creating new objects
    _sphereCenter.set(obj.position[0], obj.position[1], obj.position[2]);
    _tempSphere.center.copy(_sphereCenter);
    _tempSphere.radius = this.getObjectRadius(obj);

    return this.frustum.intersectsSphere(_tempSphere);
  }
  getObjectRadius(obj) {
    // Estimate object radius based on type and scale
    const baseRadius = {
      cube: 5,
      sphere: 8,
      plane: 10,
      text: 3,
      model: 10, // 3D models can vary greatly, use a reasonable default
    };

    const radius = baseRadius[obj.type] || 5;
    const scale = obj.scale ? Math.max(...obj.scale) : 1;
    return radius * scale;
  }
}

// Singleton instance
export const objectVirtualizer = new ObjectVirtualizer();
