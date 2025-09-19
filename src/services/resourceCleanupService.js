/**
 * Centralized Resource Cleanup Service
 * Handles texture, material, and geometry disposal with tracking and error handling
 * Replaces scattered disposal logic across Plane, WebcamStream, ScreenShareStream
 */

class ResourceCleanupService {
  constructor() {
    this.disposedResources = new Set();
    this.activeResources = new Map();
    this.stats = {
      texturesDisposed: 0,
      materialsDisposed: 0,
      geometriesDisposed: 0,
      errors: 0,
    };
  }

  /**
   * Safely dispose of a texture
   * @param {THREE.Texture} texture - Three.js texture to dispose
   * @param {string} id - Optional identifier for tracking
   */
  disposeTexture(texture, id = null) {
    if (!texture) return false;

    try {
      // Check if already disposed
      if (this.disposedResources.has(texture)) {
        return false;
      }

      // Dispose the texture
      texture.dispose();

      // Track disposal
      this.disposedResources.add(texture);
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
    if (!material) return false;

    try {
      // Check if already disposed
      if (this.disposedResources.has(material)) {
        return false;
      }

      // Dispose any textures in the material first
      if (material.map) this.disposeTexture(material.map);
      if (material.normalMap) this.disposeTexture(material.normalMap);
      if (material.envMap) this.disposeTexture(material.envMap);
      if (material.emissiveMap) this.disposeTexture(material.emissiveMap);

      // Dispose the material
      material.dispose();

      // Track disposal
      this.disposedResources.add(material);
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
    if (!geometry) return false;

    try {
      // Check if already disposed
      if (this.disposedResources.has(geometry)) {
        return false;
      }

      // Dispose the geometry
      geometry.dispose();

      // Track disposal
      this.disposedResources.add(geometry);
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

    // Dispose material
    if (mesh.material) {
      success = this.disposeMaterial(mesh.material, id) && success;
    }

    // Dispose geometry
    if (mesh.geometry) {
      success = this.disposeGeometry(mesh.geometry, id) && success;
    }

    return success;
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
    const resource = this.activeResources.get(id);
    if (!resource) return false;

    const { resource: res, type } = resource;

    switch (type) {
      case 'texture':
        return this.disposeTexture(res, id);
      case 'material':
        return this.disposeMaterial(res, id);
      case 'geometry':
        return this.disposeGeometry(res, id);
      case 'mesh':
        return this.disposeMesh(res, id);
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
      totalDisposed: this.disposedResources.size,
    };
  }

  /**
   * Clean up old disposed resource references (for memory management)
   */
  cleanupOldReferences() {
    if (this.disposedResources.size > 1000) {
      this.disposedResources.clear();
    }
  }
}

// Export singleton instance
export const resourceCleanupService = new ResourceCleanupService();

// Also export the class for testing
export { ResourceCleanupService };
