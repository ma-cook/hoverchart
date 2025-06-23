import * as THREE from 'three';

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
  }  updateVisibility(camera, objects) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Get current quality from local storage or default to medium
    const canvasQuality = localStorage.getItem('canvasQuality') || 'medium';
    
    // Mobile-aware object limits and distance culling
    const maxObjectDistance = isMobile ? 500 : 1000;
    const getMaxObjects = () => {
      if (isMobile) {
        return canvasQuality === 'low' ? 25 : canvasQuality === 'medium' ? 40 : 60;
      }
      return canvasQuality === 'low' ? 50 : canvasQuality === 'medium' ? 100 : 200;
    };
    
    const maxObjects = getMaxObjects();
    const cameraPosition = camera.position.clone();
    
    // Filter objects by distance and sort by distance
    const objectsWithDistance = objects
      .map(obj => ({
        id: obj.id,
        distance: cameraPosition.distanceTo(
          new THREE.Vector3(
            obj.position?.x || obj.position?.[0] || 0,
            obj.position?.y || obj.position?.[1] || 0,
            obj.position?.z || obj.position?.[2] || 0
          )
        )
      }))
      .filter(obj => obj.distance <= maxObjectDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxObjects);
    
    const visibleIds = objectsWithDistance.map(obj => obj.id);
    this.visibleObjects = new Set(visibleIds);
    return visibleIds;
  }

  isObjectVisible(obj) {
    if (!obj.position || !Array.isArray(obj.position)) return true;

    const sphere = new THREE.Sphere(
      new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]),
      this.getObjectRadius(obj)
    );

    return this.frustum.intersectsSphere(sphere);
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
