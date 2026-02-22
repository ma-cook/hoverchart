/**
 * GPU Resource Tracker
 *
 * Tracks GPU resource allocations (geometries, materials, textures) and
 * provides warnings when usage exceeds safe thresholds.  This helps
 * identify leaks that would otherwise silently exhaust VRAM and crash the
 * graphics driver (TDR).
 *
 * Usage:
 *   import { gpuTracker } from '../utils/gpuResourceTracker';
 *   gpuTracker.trackGeometry(geo, 'MyComponent');
 *   // later
 *   gpuTracker.untrackGeometry(geo);
 */

// Thresholds — when exceeded a console.warn is emitted once.
const WARN_GEOMETRIES = 500;
const WARN_MATERIALS = 300;
const WARN_TEXTURES = 200;

class GPUResourceTracker {
  constructor() {
    this.geometries = new Map(); // geo -> label
    this.materials = new Map();
    this.textures = new Map();
    this._warned = { geo: false, mat: false, tex: false };
  }

  trackGeometry(geo, label = '') {
    if (!geo) return;
    this.geometries.set(geo, label);
    this._checkThreshold('geo', this.geometries.size, WARN_GEOMETRIES, 'geometries');
  }

  untrackGeometry(geo) {
    if (!geo) return;
    this.geometries.delete(geo);
  }

  trackMaterial(mat, label = '') {
    if (!mat) return;
    this.materials.set(mat, label);
    this._checkThreshold('mat', this.materials.size, WARN_MATERIALS, 'materials');
  }

  untrackMaterial(mat) {
    if (!mat) return;
    this.materials.delete(mat);
  }

  trackTexture(tex, label = '') {
    if (!tex) return;
    this.textures.set(tex, label);
    this._checkThreshold('tex', this.textures.size, WARN_TEXTURES, 'textures');
  }

  untrackTexture(tex) {
    if (!tex) return;
    this.textures.delete(tex);
  }

  _checkThreshold(key, current, threshold, label) {
    if (current > threshold && !this._warned[key]) {
      this._warned[key] = true;
      console.warn(
        `⚠️ GPU Resource Warning: ${current} ${label} allocated (threshold: ${threshold}). ` +
        `Possible leak — check components creating GPU resources without disposal.`
      );
    } else if (current <= threshold / 2) {
      // Reset warning once usage drops back down
      this._warned[key] = false;
    }
  }

  /** Get a summary for debugging. */
  getSummary() {
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size,
      details: {
        geometries: [...this.geometries.values()],
        materials: [...this.materials.values()],
        textures: [...this.textures.values()],
      },
    };
  }
}

export const gpuTracker = new GPUResourceTracker();

// Expose for debugging
if (typeof window !== 'undefined') {
  window._gpuTracker = gpuTracker;
}
