import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

// Mobile-aware sizing
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Threshold for enabling frustum culling (only cull when count exceeds this)
const FRUSTUM_CULLING_THRESHOLD = 50;

// Reusable objects for frustum culling (avoid GC pressure)
const tempFrustum = new THREE.Frustum();
const tempProjectionMatrix = new THREE.Matrix4();
const tempSphere = new THREE.Sphere();

// Tetrahedron geometry constants
const TETRAHEDRON_SIZE = 5;

// Vertices of a regular tetrahedron (same as in Tetrahedron.jsx)
const TETRA_VERTICES = [
  [0, TETRAHEDRON_SIZE, 0],                              // top vertex
  [-TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE],   // bottom-left-front
  [TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE],    // bottom-right-front
  [0, -TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE * 1.5],            // bottom-back
];

// Define edges (6 edges for a tetrahedron)
// Base triangle edges (3) + edges from top vertex to base (3)
const TETRA_EDGES = [
  // Base triangle
  [1, 2], // bottom-left-front to bottom-right-front
  [2, 3], // bottom-right-front to bottom-back
  [3, 1], // bottom-back to bottom-left-front
  // Edges from top vertex
  [0, 1], // top to bottom-left-front
  [0, 2], // top to bottom-right-front
  [0, 3], // top to bottom-back
];

// Convert edges to start/end point pairs
const BASE_TETRA_EDGES = TETRA_EDGES.map(([a, b]) => [
  TETRA_VERTICES[a],
  TETRA_VERTICES[b],
]);

const EDGES_PER_TETRAHEDRON = 6;
const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable objects to avoid GC pressure during frame updates
const tempVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

// Global map for real-time tetrahedron transforms during drag
export const tetrahedronTransformMap = new Map(); // Map<id, { position: [x,y,z], scale: [x,y,z] }>

/**
 * GlobalTetrahedronEdgesRenderer - Renders ALL tetrahedron edges in a single draw call
 * 
 * Instead of each Tetrahedron component rendering its own InstancedLine (N draw calls),
 * this component batches all tetrahedron edges into a single instanced mesh (1 draw call).
 * 
 * Performance improvement: O(N) draw calls → O(1) draw call
 * 
 * @param {Array} tetrahedrons - Array of tetrahedron objects with { id, position, scale, color }
 * @param {number} defaultLineWidth - Default line width for all edges
 * @param {number} cullingThreshold - Override threshold for enabling frustum culling (default: 50)
 */
const GlobalTetrahedronEdgesRenderer = React.memo(({ 
  tetrahedrons = [], 
  defaultLineWidth = 1,
  cullingThreshold = FRUSTUM_CULLING_THRESHOLD 
}) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastPositionsRef = useRef(new Map());
  const visibilityRef = useRef(new Map());
  
  const { camera } = useThree();

  const totalEdges = tetrahedrons.length * EDGES_PER_TETRAHEDRON;

  // Create geometry with all tetrahedron edges
  const { geometry, material } = useMemo(() => {
    if (tetrahedrons.length === 0) return { geometry: null, material: null };

    const geo = new THREE.InstancedBufferGeometry();

    // Create a simple quad for the line (same as InstancedLine)
    const positions = new Float32Array([
      0, -1, 0, 1, -1, 0, 0, 1, 0,
      1, -1, 0, 1, 1, 0, 0, 1, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Pre-allocate instance attributes for all edges
    const instanceStart = new Float32Array(totalEdges * 3);
    const instanceEnd = new Float32Array(totalEdges * 3);
    const instanceColor = new Float32Array(totalEdges * 3);

    geo.setAttribute(
      'instanceStart',
      new THREE.InstancedBufferAttribute(instanceStart, 3)
    );
    geo.setAttribute(
      'instanceEnd',
      new THREE.InstancedBufferAttribute(instanceEnd, 3)
    );
    geo.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(instanceColor, 3)
    );

    const mat = LineShaderMaterial.clone();
    mat.uniforms.linewidth.value = isMobile ? 3 : defaultLineWidth;

    return { geometry: geo, material: mat };
  }, [totalEdges, defaultLineWidth]);

  // Mark for full update when tetrahedrons array changes
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastPositionsRef.current.clear();
    visibilityRef.current.clear();
  }, [tetrahedrons.length]);

  // Function to check if a tetrahedron is visible in the camera frustum
  const isTetrahedronVisible = useCallback((position, scale) => {
    // Calculate bounding sphere radius (tetrahedron circumradius)
    const maxScale = Math.max(scale[0], scale[1], scale[2]);
    const radius = maxScale * TETRAHEDRON_SIZE * 2; // Conservative radius for tetrahedron
    
    tempSphere.center.set(position[0], position[1], position[2]);
    tempSphere.radius = radius;
    
    return tempFrustum.intersectsSphere(tempSphere);
  }, []);

  // Function to update edges for a single tetrahedron by index
  const updateTetrahedronEdges = useCallback((tetraIndex, position, scale, color, instanceStart, instanceEnd, instanceColor) => {
    const edgeStartIndex = tetraIndex * EDGES_PER_TETRAHEDRON;

    // Create transformation matrix for this tetrahedron
    tempMatrix.makeScale(scale[0], scale[1], scale[2]);
    tempMatrix.setPosition(position[0], position[1], position[2]);

    tempColor.set(color);

    // Transform each edge point and add to instance attributes
    for (let i = 0; i < EDGES_PER_TETRAHEDRON; i++) {
      const edgeIndex = edgeStartIndex + i;
      const [startPoint, endPoint] = BASE_TETRA_EDGES[i];

      // Transform start point
      tempVec.set(startPoint[0], startPoint[1], startPoint[2]);
      tempVec.applyMatrix4(tempMatrix);
      instanceStart.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);

      // Transform end point
      tempVec.set(endPoint[0], endPoint[1], endPoint[2]);
      tempVec.applyMatrix4(tempMatrix);
      instanceEnd.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);

      // Set color
      instanceColor.setXYZ(edgeIndex, tempColor.r, tempColor.g, tempColor.b);
    }
  }, []);

  // Use useFrame for real-time position sync during transforms
  useFrame(() => {
    if (!geometry || !meshRef.current || tetrahedrons.length === 0) return;

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let needsUpdate = needsFullUpdateRef.current;
    
    const enableCulling = tetrahedrons.length > cullingThreshold;
    
    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }
    
    let visibleCount = 0;

    tetrahedrons.forEach((tetra, tetraIndex) => {
      const tetraId = tetra.id?.toString();
      
      // Check if there's a real-time transform position
      const realtimeTransform = tetrahedronTransformMap.get(tetraId);
      
      const position = realtimeTransform?.position || tetra.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || tetra.scale || [1, 1, 1];
      const color = tetra.color || '#000000';

      // Check visibility (only if culling is enabled)
      let isVisible = true;
      let visibilityChanged = false;
      if (enableCulling) {
        isVisible = isTetrahedronVisible(position, scale);
        const wasVisible = visibilityRef.current.get(tetraId);
        
        if (wasVisible === undefined || wasVisible !== isVisible) {
          visibilityRef.current.set(tetraId, isVisible);
          visibilityChanged = true;
        }
      }

      // Check if this tetrahedron's position/scale/color changed
      const lastKnown = lastPositionsRef.current.get(tetraId);
      const positionChanged = !lastKnown || 
        lastKnown.position[0] !== position[0] ||
        lastKnown.position[1] !== position[1] ||
        lastKnown.position[2] !== position[2] ||
        lastKnown.scale[0] !== scale[0] ||
        lastKnown.scale[1] !== scale[1] ||
        lastKnown.scale[2] !== scale[2] ||
        lastKnown.color !== color;

      if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
        if (enableCulling && !isVisible) {
          // Set edges to zero length (invisible)
          const edgeStartIndex = tetraIndex * EDGES_PER_TETRAHEDRON;
          for (let i = 0; i < EDGES_PER_TETRAHEDRON; i++) {
            const edgeIndex = edgeStartIndex + i;
            instanceStart.setXYZ(edgeIndex, 0, 0, 0);
            instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
            instanceColor.setXYZ(edgeIndex, 0, 0, 0);
          }
        } else {
          updateTetrahedronEdges(tetraIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          if (enableCulling) visibleCount++;
        }
        
        lastPositionsRef.current.set(tetraId, { 
          position: [...position], 
          scale: [...scale],
          color 
        });
        needsUpdate = true;
      } else if (enableCulling && isVisible) {
        visibleCount++;
      }
    });
    
    // Debug log (remove after testing)
    if (enableCulling && needsFullUpdateRef.current) {
      console.log(`[Tetrahedron Frustum Culling] Visible: ${visibleCount}/${tetrahedrons.length}`);
    }

    if (needsUpdate) {
      instanceStart.needsUpdate = true;
      instanceEnd.needsUpdate = true;
      instanceColor.needsUpdate = true;

      if (needsFullUpdateRef.current) {
        for (let i = 0; i < totalEdges; i++) {
          meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        needsFullUpdateRef.current = false;
      }
    }
  });

  if (!geometry || totalEdges === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalEdges]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

GlobalTetrahedronEdgesRenderer.displayName = 'GlobalTetrahedronEdgesRenderer';

export default GlobalTetrahedronEdgesRenderer;
