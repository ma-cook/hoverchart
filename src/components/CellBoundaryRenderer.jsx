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
  // Debug logging
  console.log('CellBoundaryRenderer:', {
    loadedCells,
    visible,
    cellCount: loadedCells?.length,
  });
  // Test mode: if no cells are loaded, show origin cell for testing
  const testCells = useMemo(() => {
    return loadedCells.length === 0 ? ['0,0,0'] : loadedCells;
  }, [loadedCells]);

  console.log('Using cells for rendering:', testCells);
  // Create geometry for all cell boundaries
  const geometry = useMemo(() => {
    if (!testCells || testCells.length === 0) {
      return new THREE.BufferGeometry();
    }

    const positions = [];
    testCells.forEach((cellId) => {
      // Parse 3D cell coordinates
      const [cellX, cellY, cellZ] = cellId.split(',').map(Number);
      const bounds = getCellBounds(cellX, cellY, cellZ);

      console.log(`Cell ${cellId}:`, { cellX, cellY, cellZ, bounds });

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
      ];

      // Create line segments for each edge
      edges.forEach(([startIdx, endIdx]) => {
        positions.push(...corners[startIdx], ...corners[endIdx]);
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    console.log('Generated geometry with', positions.length / 3, 'vertices');

    return geo;
  }, [testCells]); // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0.5, 0.5, 0.5) }, // Grey color as requested
      },
      transparent: false,
      depthTest: true,
      depthWrite: false,
    });
  }, []);
  // Update material reference
  if (!visible || !testCells || testCells.length === 0) {
    return null;
  }
  return (
    <lineSegments geometry={geometry}>
      <primitive object={material} attach="material" />
    </lineSegments>
  );
};

export default CellBoundaryRenderer;
