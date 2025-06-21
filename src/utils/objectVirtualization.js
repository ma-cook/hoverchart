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
  }

  updateVisibility(camera, objects) {
    // For now, disable aggressive frustum culling to fix the object disappearing bug
    // Return all objects as visible to prevent the culling issue
    const allObjectIds = objects.map(obj => obj.id);
    this.visibleObjects = new Set(allObjectIds);
    return allObjectIds;

    // TODO: Re-enable smart culling later with proper retention logic
    /*
    // Check if camera moved significantly
    const currentPos = camera.position.clone();
    const currentTarget = new THREE.Vector3();
    camera.getWorldDirection(currentTarget);

    const positionDelta = currentPos.distanceTo(this.lastCameraPosition);
    const targetDelta = currentTarget.distanceTo(this.lastCameraTarget);

    if (positionDelta < this.updateThreshold && targetDelta < 0.1) {
      return Array.from(this.visibleObjects); // Return cached results
    }

    // Update frustum
    this.cameraMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);

    const currentTime = Date.now();
    const currentlyInFrustum = new Set();

    // Test each object against frustum
    objects.forEach((obj) => {
      if (this.isObjectVisible(obj)) {
        currentlyInFrustum.add(obj.id);
        this.recentlyVisibleObjects.set(obj.id, currentTime);
      }
    });

    // Keep objects visible for retention time after leaving frustum
    this.visibleObjects.clear();
    
    // Add currently visible objects
    currentlyInFrustum.forEach(id => this.visibleObjects.add(id));
    
    // Add recently visible objects that are still within retention time
    this.recentlyVisibleObjects.forEach((timestamp, objectId) => {
      if (currentTime - timestamp < this.retentionTime) {
        this.visibleObjects.add(objectId);
      } else {
        this.recentlyVisibleObjects.delete(objectId);
      }
    });

    // Update last camera state
    this.lastCameraPosition.copy(currentPos);
    this.lastCameraTarget.copy(currentTarget);

    return Array.from(this.visibleObjects);
    */
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
    };

    const radius = baseRadius[obj.type] || 5;
    const scale = obj.scale ? Math.max(...obj.scale) : 1;
    return radius * scale;
  }
}

// Singleton instance
export const objectVirtualizer = new ObjectVirtualizer();
