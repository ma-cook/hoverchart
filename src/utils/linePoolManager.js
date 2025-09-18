import * as THREE from 'three';

/**
 * Simple Object Pool for Line Geometries and Materials
 */
class LinePool {
  constructor() {
    // Pool geometries by point count
    this.geometryPools = new Map();
    // Pool materials by color
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

    // Create new geometry for line segments
    const geometry = new THREE.BufferGeometry();
    const segmentCount = Math.max(1, pointCount - 1);
    const positions = new Float32Array(segmentCount * 2 * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }

  releaseGeometry(geometry, pointCount) {
    if (!this.geometryPools.has(pointCount)) return;

    const pool = this.geometryPools.get(pointCount);
    if (pool.length < this.maxPoolSize) {
      // Reset geometry
      const positions = geometry.attributes.position.array;
      positions.fill(0);
      geometry.attributes.position.needsUpdate = true;
      pool.push(geometry);
    } else {
      geometry.dispose();
    }
  }

  getMaterial(color) {
    const colorKey =
      typeof color === 'string' ? color : `#${color.toString(16)}`;

    if (!this.materialPools.has(colorKey)) {
      this.materialPools.set(colorKey, []);
    }

    const pool = this.materialPools.get(colorKey);

    if (pool.length > 0) {
      return pool.pop();
    }

    return new THREE.LineBasicMaterial({ color });
  }

  releaseMaterial(material, color) {
    const colorKey =
      typeof color === 'string' ? color : `#${color.toString(16)}`;

    if (!this.materialPools.has(colorKey)) return;

    const pool = this.materialPools.get(colorKey);
    if (pool.length < this.maxPoolSize) {
      material.color.set(color);
      material.opacity = 1;
      material.transparent = false;
      material.visible = true;
      pool.push(material);
    } else {
      material.dispose();
    }
  }

  updateLineGeometry(geometry, points) {
    const positions = geometry.attributes.position.array;
    let posIndex = 0;

    // Create line segments from consecutive points
    for (let i = 0; i < points.length - 1; i++) {
      const point1 = points[i];
      const point2 = points[i + 1];

      // First vertex of line segment
      positions[posIndex++] = point1[0] || 0;
      positions[posIndex++] = point1[1] || 0;
      positions[posIndex++] = point1[2] || 0;

      // Second vertex of line segment
      positions[posIndex++] = point2[0] || 0;
      positions[posIndex++] = point2[1] || 0;
      positions[posIndex++] = point2[2] || 0;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
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
