import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { getCellBounds, getCellCoordinates, CELL_NEIGHBOR_RADIUS } from '../services/spatialPartitioning';
import LineShaderMaterial from './LineShaderMaterial';

/**
 * Component that renders cell boundary outlines using the same fat-line
 * LineShaderMaterial approach as all other line renderers in the app.
 *
 * Renders a fixed-radius 3D grid of cell boundaries centered on the camera
 * position. As the camera moves (pan, zoom, orbit), the grid follows and
 * cells outside the radius are dropped.
 *
 * IMPORTANT: <lineSegments> with THREE.ShaderMaterial ignores linewidth
 * on all WebGL implementations (gl.lineWidth is always capped at 1px in WebGL).
 * This component uses InstancedBufferGeometry quads to achieve real line thickness.
 */

// Shared base quad — same layout used by all fat-line renderers
const BASE_POSITIONS = new Float32Array([
  0, -1, 0, 1, -1, 0, 0, 1, 0,
  1, -1, 0, 1,  1, 0, 0, 1, 0,
]);

const LINE_COLOR = 0.55;

// Minimum check interval (ms) to avoid excessive recomputation
const UPDATE_INTERVAL = 200;

/**
 * Compute the list of cell IDs in a 3D grid centered on the camera position.
 * Uses the same CELL_NEIGHBOR_RADIUS as the data-loading system.
 */
function computeVisibleCells(camera) {
  const center = getCellCoordinates([camera.position.x, camera.position.y, camera.position.z]);
  const r = CELL_NEIGHBOR_RADIUS;

  const cells = [];
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        cells.push(`${center.x + dx},${center.y + dy},${center.z + dz}`);
      }
    }
  }
  return cells;
}

const CellBoundaryRenderer = ({ visible = true }) => {
  const { camera, size } = useThree();
  const materialRef = useRef(null);
  const meshRef = useRef(null);
  const lastCellKeyRef = useRef('');
  const lastCheckRef = useRef(0);
  const [geometry, setGeometry] = useState(null);

  // Build instanced geometry from a list of cell IDs
  const buildGeometry = useCallback((cellIds) => {
    if (!cellIds || cellIds.length === 0) return null;

    const starts = [];
    const ends = [];

    cellIds.forEach((cellId) => {
      const [cellX, cellY, cellZ] = cellId.split(',').map(Number);
      const bounds = getCellBounds(cellX, cellY, cellZ);

      const corners = [
        [bounds.minX, bounds.minY, bounds.minZ],
        [bounds.maxX, bounds.minY, bounds.minZ],
        [bounds.maxX, bounds.minY, bounds.maxZ],
        [bounds.minX, bounds.minY, bounds.maxZ],
        [bounds.minX, bounds.maxY, bounds.minZ],
        [bounds.maxX, bounds.maxY, bounds.minZ],
        [bounds.maxX, bounds.maxY, bounds.maxZ],
        [bounds.minX, bounds.maxY, bounds.maxZ],
      ];

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      edges.forEach(([s, e]) => {
        starts.push(...corners[s]);
        ends.push(...corners[e]);
      });
    });

    const count = starts.length / 3;

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));
    geo.setAttribute('instanceStart', new THREE.InstancedBufferAttribute(new Float32Array(starts), 3));
    geo.setAttribute('instanceEnd', new THREE.InstancedBufferAttribute(new Float32Array(ends), 3));

    const colorData = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colorData[i * 3]     = LINE_COLOR;
      colorData[i * 3 + 1] = LINE_COLOR;
      colorData[i * 3 + 2] = LINE_COLOR;
    }
    geo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colorData, 3));
    geo.instanceCount = count;

    return geo;
  }, []);

  // Periodically recompute visible cells based on camera position
  useFrame(() => {
    if (!visible) return;

    const now = Date.now();
    if (now - lastCheckRef.current < UPDATE_INTERVAL) return;
    lastCheckRef.current = now;

    const cells = computeVisibleCells(camera);
    const cellKey = cells.join('|');

    if (cellKey === lastCellKeyRef.current) return;
    lastCellKeyRef.current = cellKey;

    const oldGeo = geometry;
    const newGeo = buildGeometry(cells);
    setGeometry(newGeo);

    // Dispose old geometry
    if (oldGeo) oldGeo.dispose();
  });

  // Lazy-init material
  if (!materialRef.current) {
    materialRef.current = LineShaderMaterial.clone();
    materialRef.current.uniforms.glowWidth.value = 1.0;
    materialRef.current.uniforms.glowIntensity.value = 0.0;
    materialRef.current.uniforms.linewidth.value = 1;
    materialRef.current.uniforms.resolution.value.x = window.innerWidth;
    materialRef.current.uniforms.resolution.value.y = window.innerHeight;
    materialRef.current.depthWrite = false;
  }

  // Keep resolution in sync with viewport
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.x = size.width;
      materialRef.current.uniforms.resolution.value.y = size.height;
    }
  }, [size.width, size.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  if (!visible || !geometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materialRef.current}
      frustumCulled={false}
      renderOrder={1}
    />
  );
};

export default CellBoundaryRenderer;
