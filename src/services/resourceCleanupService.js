/**
 * Centralized Resource Cleanup Service
 * Handles texture, material, and geometry disposal with tracking and error handling
 * Replaces scattered disposal logic across Plane, WebcamStream, ScreenShareStream
 */

// WeakSet for disposed resources - allows garbage collection of disposed items
// while still tracking them efficiently
const _disposedWeakSet = new WeakSet();

class ResourceCleanupService {
  constructor() {
    // Use WeakMap for active resources to allow GC of unreferenced resources
    this.activeResources = new Map();
    this.stats = {
      texturesDisposed: 0,
      materialsDisposed: 0,
      geometriesDisposed: 0,
      errors: 0,
    };
    
    // Batch disposal queue for performance
    this._disposalQueue = [];
    this._batchDisposalScheduled = false;
  }

  /**
   * Check if a resource has been disposed
   * @private
   */
  _isDisposed(resource) {
    return _disposedWeakSet.has(resource);
  }

  /**
   * Mark a resource as disposed
   * @private
   */
  _markDisposed(resource) {
    _disposedWeakSet.add(resource);
  }

  /**
   * Safely dispose of a texture
   * @param {THREE.Texture} texture - Three.js texture to dispose
   * @param {string} id - Optional identifier for tracking
   */
  disposeTexture(texture, id = null) {
    if (!texture || this._isDisposed(texture)) return false;

    try {
      texture.dispose();
      this._markDisposed(texture);
      this.stats.texturesDisposed++;

      if (id) {
        this.activeResources.delete(id);
      }

      return true;
    } catch (error) {
      console.warn('Error disposing texture:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Safely dispose of a material
   * @param {THREE.Material} material - Three.js material to dispose
   * @param {string} id - Optional identifier for tracking
   */
  disposeMaterial(material, id = null) {
    if (!material || this._isDisposed(material)) return false;

    try {
      // Dispose any textures in the material first
      if (material.map) this.disposeTexture(material.map);
      if (material.normalMap) this.disposeTexture(material.normalMap);
      if (material.envMap) this.disposeTexture(material.envMap);
      if (material.emissiveMap) this.disposeTexture(material.emissiveMap);

      material.dispose();
      this._markDisposed(material);
      this.stats.materialsDisposed++;

      if (id) {
        this.activeResources.delete(id);
      }

      return true;
    } catch (error) {
      console.warn('Error disposing material:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Safely dispose of a geometry
   * @param {THREE.Geometry|THREE.BufferGeometry} geometry - Three.js geometry to dispose
   * @param {string} id - Optional identifier for tracking
   */
  disposeGeometry(geometry, id = null) {
    if (!geometry || this._isDisposed(geometry)) return false;

    try {
      geometry.dispose();
      this._markDisposed(geometry);
      this.stats.geometriesDisposed++;

      if (id) {
        this.activeResources.delete(id);
      }

      return true;
    } catch (error) {
      console.warn('Error disposing geometry:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Dispose of a mesh and all its resources
   * @param {THREE.Mesh} mesh - Three.js mesh to dispose
   * @param {string} id - Optional identifier for tracking
   */
  disposeMesh(mesh, id = null) {
    if (!mesh) return false;

    let success = true;

    // Dispose material (handles arrays of materials too)
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          success = this.disposeMaterial(mat) && success;
        });
      } else {
        success = this.disposeMaterial(mesh.material, id) && success;
      }
    }

    // Dispose geometry
    if (mesh.geometry) {
      success = this.disposeGeometry(mesh.geometry, id) && success;
    }

    return success;
  }

  /**
   * Queue a resource for batch disposal (more efficient for multiple resources)
   * @param {Object} resource - Resource to dispose
   * @param {string} type - Resource type
   * @param {string} id - Optional identifier
   */
  queueDisposal(resource, type, id = null) {
    this._disposalQueue.push({ resource, type, id });
    
    if (!this._batchDisposalScheduled) {
      this._batchDisposalScheduled = true;
      // Use requestIdleCallback for non-urgent disposal, fallback to setTimeout
      const scheduleDisposal = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
      scheduleDisposal(() => this._processBatchDisposal());
    }
  }

  /**
   * Process queued disposals in batch
   * @private
   */
  _processBatchDisposal() {
    const queue = this._disposalQueue;
    this._disposalQueue = [];
    this._batchDisposalScheduled = false;

    for (const { resource, type, id } of queue) {
      switch (type) {
        case 'texture':
          this.disposeTexture(resource, id);
          break;
        case 'material':
          this.disposeMaterial(resource, id);
          break;
        case 'geometry':
          this.disposeGeometry(resource, id);
          break;
        case 'mesh':
          this.disposeMesh(resource, id);
          break;
      }
    }
  }

  /**
   * Register a resource for tracking
   * @param {string} id - Resource identifier
   * @param {Object} resource - Resource to track
   * @param {string} type - Resource type ('texture', 'material', 'geometry', 'mesh')
   */
  registerResource(id, resource, type) {
    this.activeResources.set(id, { resource, type, createdAt: Date.now() });
  }

  /**
   * Dispose all resources for a specific component/id
   * @param {string} id - Component or resource identifier
   */
  disposeResourcesById(id) {
    const resourceInfo = this.activeResources.get(id);
    if (!resourceInfo) return false;

    const { resource, type } = resourceInfo;

    switch (type) {
      case 'texture':
        return this.disposeTexture(resource, id);
      case 'material':
        return this.disposeMaterial(resource, id);
      case 'geometry':
        return this.disposeGeometry(resource, id);
      case 'mesh':
        return this.disposeMesh(resource, id);
      default:
        console.warn('Unknown resource type:', type);
        return false;
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeResources: this.activeResources.size,
      pendingDisposals: this._disposalQueue.length,
    };
  }
}

// Export singleton instance
export const resourceCleanupService = new ResourceCleanupService();

// Also export the class for testing
export { ResourceCleanupService };
