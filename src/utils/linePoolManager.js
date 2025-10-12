import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * Simple Object Pool for Line Geometries and Materials
 * Supports line width through Line2/LineGeometry/LineMaterial system
 */
class LinePool {
  constructor() {
    // Pool geometries by point count
    this.geometryPools = new Map();
    // Pool materials by color AND lineWidth
    this.materialPools = new Map();
    this.maxPoolSize = 20;
  }

  getGeometry(pointCount) {
    if (!this.geometryPools.has(pointCount)) {
      this.geometryPools.set(pointCount, []);
    }

    const pool = this.geometryPools.get(pointCount);

    if (pool.length > 0) {
      return pool.pop();
    }

    // Create new LineGeometry for Line2 (supports lineWidth)
    const geometry = new LineGeometry();
    // LineGeometry expects positions in flat array format [x1,y1,z1, x2,y2,z2, ...]
    const positions = new Float32Array(pointCount * 3);
    geometry.setPositions(positions);
    return geometry;
  }

  releaseGeometry(geometry, pointCount) {
    if (!this.geometryPools.has(pointCount)) return;

    const pool = this.geometryPools.get(pointCount);
    if (pool.length < this.maxPoolSize) {
      // Reset geometry positions
      const positionCount = pointCount * 3;
      const positions = new Float32Array(positionCount).fill(0);
      geometry.setPositions(positions);
      pool.push(geometry);
    } else {
      geometry.dispose();
    }
  }

  getMaterial(color, lineWidth = 1) {
    // Create pool key from both color and lineWidth
    const colorKey =
      typeof color === 'string' ? color : `#${color.toString(16)}`;
    const poolKey = `${colorKey}_${lineWidth}`;

    if (!this.materialPools.has(poolKey)) {
      this.materialPools.set(poolKey, []);
    }

    const pool = this.materialPools.get(poolKey);

    if (pool.length > 0) {
      return pool.pop();
    }

    // Create LineMaterial (supports lineWidth)
    return new LineMaterial({
      color,
      linewidth: lineWidth, // Note: LineMaterial uses 'linewidth' (lowercase w)
      worldUnits: false, // Use screen-space pixels
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });
  }

  releaseMaterial(material, color, lineWidth = 1) {
    const colorKey =
      typeof color === 'string' ? color : `#${color.toString(16)}`;
    const poolKey = `${colorKey}_${lineWidth}`;

    if (!this.materialPools.has(poolKey)) return;

    const pool = this.materialPools.get(poolKey);
    if (pool.length < this.maxPoolSize) {
      material.color.set(color);
      material.linewidth = lineWidth;
      material.opacity = 1;
      material.transparent = false;
      material.visible = true;
      material.resolution.set(window.innerWidth, window.innerHeight);
      pool.push(material);
    } else {
      material.dispose();
    }
  }

  updateLineGeometry(geometry, points) {
    // LineGeometry expects flat array of positions [x1,y1,z1, x2,y2,z2, ...]
    const positions = new Float32Array(points.length * 3);
    let posIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      positions[posIndex++] = point[0] || 0;
      positions[posIndex++] = point[1] || 0;
      positions[posIndex++] = point[2] || 0;
    }

    geometry.setPositions(positions);
  }

  clear() {
    // Dispose all pooled items
    this.geometryPools.forEach((pool) => {
      pool.forEach((geometry) => geometry.dispose());
    });
    this.materialPools.forEach((pool) => {
      pool.forEach((material) => material.dispose());
    });

    this.geometryPools.clear();
    this.materialPools.clear();
  }
}

// Global instance
let globalLinePool = null;

export const getLinePool = () => {
  if (!globalLinePool) {
    globalLinePool = new LinePool();
  }
  return globalLinePool;
};

export const clearLinePool = () => {
  if (globalLinePool) {
    globalLinePool.clear();
    globalLinePool = null;
  }
};
