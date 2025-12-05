import * as THREE from 'three';

// Module-level reusable THREE objects to reduce GC pressure
const _tempVec = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();
const _sphereCenter = new THREE.Vector3();
const _tempSphere = new THREE.Sphere();

/**
 * Frustum culling for objects to only render what's visible
 * Modified to be less aggressive about culling to prevent object disappearing bug
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
  }
  updateVisibility(camera, objects, loadedCells = null) {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Get current quality from local storage or default to medium
    const canvasQuality = localStorage.getItem('canvasQuality') || 'medium';

    // If spatial partitioning is active (loadedCells provided), respect it
    if (loadedCells && loadedCells.size > 0) {
      // In spatial mode: only filter by object count, not distance
      // This ensures objects don't disappear due to distance culling when spatial system has them loaded
      const getMaxObjects = () => {
        if (isMobile) {
          return canvasQuality === 'low'
            ? 200 // Increased for large diagrams
            : canvasQuality === 'medium'
            ? 400
            : 600;
        }
        return canvasQuality === 'low'
          ? 800
          : canvasQuality === 'medium'
          ? 1600
          : 3600; // Much higher limits for large diagrams
      };

      const maxObjects = getMaxObjects();
      // Use reusable vector instead of creating new one
      _cameraPos.copy(camera.position);

      // Filter objects by distance but use much larger distances
      const objectsWithDistance = objects
        .map((obj) => {
          // Use reusable vector for position
          _tempVec.set(
            obj.position?.x || obj.position?.[0] || 0,
            obj.position?.y || obj.position?.[1] || 0,
            obj.position?.z || obj.position?.[2] || 0
          );
          return {
            id: obj.id,
            distance: _cameraPos.distanceTo(_tempVec),
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxObjects); // Only limit by count, not distance

      const visibleIds = objectsWithDistance.map((obj) => obj.id);
      this.visibleObjects = new Set(visibleIds);
      return visibleIds;
    }

    // Fallback mode: traditional distance-based culling for when spatial system isn't active
    // Mobile-aware object limits and distance culling
    // Coordinate with spatial partitioning system: CELL_SIZE = 10000, UNLOAD_DISTANCE = 4
    // So objects should be visible up to ~50000 units to match spatial system
    const maxObjectDistance = isMobile ? 45000 : 60000; // Increased to match spatial partitioning
    const getMaxObjects = () => {
      if (isMobile) {
        return canvasQuality === 'low'
          ? 100
          : canvasQuality === 'medium'
          ? 200
          : 400; // More objects visible on mobile for large diagrams
      }
      return canvasQuality === 'low'
        ? 200
        : canvasQuality === 'medium'
        ? 400
        : 800; // Doubled for large diagram support
    };

    const maxObjects = getMaxObjects();
    // Use reusable vector instead of creating new one
    _cameraPos.copy(camera.position);

    // Filter objects by distance and sort by distance
    const objectsWithDistance = objects
      .map((obj) => {
        // Use reusable vector for position
        _tempVec.set(
          obj.position?.x || obj.position?.[0] || 0,
          obj.position?.y || obj.position?.[1] || 0,
          obj.position?.z || obj.position?.[2] || 0
        );
        return {
          id: obj.id,
          distance: _cameraPos.distanceTo(_tempVec),
        };
      })
      .filter((obj) => obj.distance <= maxObjectDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxObjects);

    const visibleIds = objectsWithDistance.map((obj) => obj.id);
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
