import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { getCellBounds } from '../services/spatialPartitioning';
import LineShaderMaterial from './LineShaderMaterial';

/**
 * Component that renders cell boundary outlines using the same fat-line
 * LineShaderMaterial approach as all other line renderers in the app.
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

const CellBoundaryRenderer = ({ loadedCells = [], visible = true }) => {
  const { size } = useThree();
  const materialRef = useRef(null);

  // Use loadedCells directly, or fallback to origin cell only when completely empty
  const cellsToRender = useMemo(() => {
    return loadedCells.length === 0 ? ['0,0,0'] : loadedCells;
  }, [loadedCells]);

  // Build instanced fat-line geometry: one quad instance per cell edge
  const geometry = useMemo(() => {
    if (!cellsToRender || cellsToRender.length === 0) return null;

    const starts = [];
    const ends = [];

    cellsToRender.forEach((cellId) => {
      const [cellX, cellY, cellZ] = cellId.split(',').map(Number);
      const bounds = getCellBounds(cellX, cellY, cellZ);

      // 8 corners of the cell cube
      const corners = [
        [bounds.minX, bounds.minY, bounds.minZ], // 0: bottom-front-left
        [bounds.maxX, bounds.minY, bounds.minZ], // 1: bottom-front-right
        [bounds.maxX, bounds.minY, bounds.maxZ], // 2: bottom-back-right
        [bounds.minX, bounds.minY, bounds.maxZ], // 3: bottom-back-left
        [bounds.minX, bounds.maxY, bounds.minZ], // 4: top-front-left
        [bounds.maxX, bounds.maxY, bounds.minZ], // 5: top-front-right
        [bounds.maxX, bounds.maxY, bounds.maxZ], // 6: top-back-right
        [bounds.minX, bounds.maxY, bounds.maxZ], // 7: top-back-left
      ];

      // 12 edges
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Bottom face
        [4, 5], [5, 6], [6, 7], [7, 4], // Top face
        [0, 4], [1, 5], [2, 6], [3, 7], // Vertical edges
      ];

      edges.forEach(([s, e]) => {
        starts.push(...corners[s]);
        ends.push(...corners[e]);
      });
    });

    const count = starts.length / 3;

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));

    const instanceStart = new THREE.InstancedBufferAttribute(new Float32Array(starts), 3);
    const instanceEnd   = new THREE.InstancedBufferAttribute(new Float32Array(ends), 3);

    // Uniform gray color for all edges
    const colorData = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colorData[i * 3]     = LINE_COLOR;
      colorData[i * 3 + 1] = LINE_COLOR;
      colorData[i * 3 + 2] = LINE_COLOR;
    }
    const instanceColor = new THREE.InstancedBufferAttribute(colorData, 3);

    geo.setAttribute('instanceStart', instanceStart);
    geo.setAttribute('instanceEnd',   instanceEnd);
    geo.setAttribute('instanceColor', instanceColor);
    geo.instanceCount = count;

    return geo;
  }, [cellsToRender]);

  // Lazy-init material
  if (!materialRef.current) {
    materialRef.current = LineShaderMaterial.clone();
    materialRef.current.uniforms.linewidth.value = 1;
    materialRef.current.uniforms.resolution.value.x = window.innerWidth;
    materialRef.current.uniforms.resolution.value.y = window.innerHeight;
    materialRef.current.depthWrite = false;
  }

  // Keep resolution in sync with viewport (fixes orientation changes & resizes)
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.x = size.width;
      materialRef.current.uniforms.resolution.value.y = size.height;
    }
  }, [size.width, size.height]);

  if (!visible || !geometry) return null;

  return (
    <mesh
      geometry={geometry}
      material={materialRef.current}
      frustumCulled={false}
      renderOrder={1}
    />
  );
};

export default CellBoundaryRenderer;
