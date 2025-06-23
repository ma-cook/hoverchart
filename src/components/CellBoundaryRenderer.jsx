import { useMemo } from 'react';
import * as THREE from 'three';
import { getCellBounds } from '../services/spatialPartitioning';

// GLSL Vertex Shader for cell boundary lines
const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// GLSL Fragment Shader for cell boundary lines
const fragmentShader = `
  uniform vec3 uColor;
  
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

/**
 * Component that renders cell boundary outlines using GLSL shaders
 */
const CellBoundaryRenderer = ({ loadedCells = [], visible = true }) => {
  // Use loadedCells directly, or fallback to origin cell only for testing when completely empty
  const cellsToRender = useMemo(() => {
    return loadedCells.length === 0 ? ['0,0,0'] : loadedCells;
  }, [loadedCells]); // Create geometry for all cell boundaries
  const geometry = useMemo(() => {
    if (!cellsToRender || cellsToRender.length === 0) {
      return new THREE.BufferGeometry();
    }

    const positions = [];
    cellsToRender.forEach((cellId) => {
      // Parse 3D cell coordinates
      const [cellX, cellY, cellZ] = cellId.split(',').map(Number);
      const bounds = getCellBounds(cellX, cellY, cellZ);

      // Create a 3D wireframe cube for the cell boundaries
      // Define the 8 corners of the cell cube
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

      // Define the 12 edges of the cube
      const edges = [
        // Bottom face edges
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        // Top face edges
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        // Vertical edges
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ]; // Create line segments for each edge
      edges.forEach(([startIdx, endIdx]) => {
        positions.push(...corners[startIdx], ...corners[endIdx]);
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geo;
  }, [cellsToRender]); // Create shader material
  const material = useMemo(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: {
          value: new THREE.Color(
            isMobile ? 0.8 : 0.5,
            isMobile ? 0.8 : 0.5,
            isMobile ? 0.8 : 0.5
          ),
        }, // Brighter on mobile
      },
      transparent: false,
      depthTest: true,
      depthWrite: false,
      linewidth: isMobile ? 3 : 1, // Thicker lines on mobile
    });
  }, []);
  // Update material reference
  if (!visible || !cellsToRender || cellsToRender.length === 0) {
    return null;
  }
  return (
    <lineSegments geometry={geometry}>
      <primitive object={material} attach="material" />
    </lineSegments>
  );
};

export default CellBoundaryRenderer;
