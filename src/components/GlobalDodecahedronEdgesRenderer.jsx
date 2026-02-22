import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';

extend({ LineShaderMaterial });

// Threshold for enabling frustum culling (only cull when count exceeds this)
const FRUSTUM_CULLING_THRESHOLD = 50;

// Reusable objects for frustum culling (avoid GC pressure)
const tempFrustum = new THREE.Frustum();
const tempProjectionMatrix = new THREE.Matrix4();
const tempSphere = new THREE.Sphere();

// Dodecahedron geometry constants
const PHI = (1 + Math.sqrt(5)) / 2;
const DODECA_SCALE = 5;

// Vertices of a dodecahedron (scaled)
const DODECA_VERTICES = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
  [0, -PHI, -1 / PHI],
  [0, PHI, -1 / PHI],
  [0, PHI, 1 / PHI],
  [0, -PHI, 1 / PHI],
  [-1 / PHI, 0, -PHI],
  [1 / PHI, 0, -PHI],
  [1 / PHI, 0, PHI],
  [-1 / PHI, 0, PHI],
  [-PHI, -1 / PHI, 0],
  [-PHI, 1 / PHI, 0],
  [PHI, 1 / PHI, 0],
  [PHI, -1 / PHI, 0],
].map((v) => v.map((coord) => coord * DODECA_SCALE));

// Define edges (30 edges for a dodecahedron)
const DODECA_EDGES = [
  [0, 8], [0, 12], [0, 16],
  [1, 8], [1, 13], [1, 19],
  [2, 9], [2, 13], [2, 18],
  [3, 9], [3, 12], [3, 17],
  [4, 11], [4, 15], [4, 16],
  [5, 11], [5, 14], [5, 19],
  [6, 10], [6, 14], [6, 18],
  [7, 10], [7, 15], [7, 17],
  [8, 11], [9, 10],
  [12, 13], [14, 15], [16, 17], [18, 19],
];

// Convert edges to start/end point pairs
const BASE_DODECA_EDGES = DODECA_EDGES.map(([a, b]) => [
  DODECA_VERTICES[a],
  DODECA_VERTICES[b],
]);

const EDGES_PER_DODECAHEDRON = 30;
const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable objects to avoid GC pressure during frame updates
const tempVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

// Global map for real-time dodecahedron transforms during drag
export const dodecahedronTransformMap = new Map(); // Map<id, { position: [x,y,z], scale: [x,y,z] }>

/**
 * GlobalDodecahedronEdgesRenderer - Renders ALL dodecahedron edges in a single draw call
 * 
 * Instead of each Dodecahedron component rendering its own InstancedLine (N draw calls),
 * this component batches all dodecahedron edges into a single instanced mesh (1 draw call).
 * 
 * Performance improvement: O(N) draw calls → O(1) draw call
 * 
 * @param {Array} dodecahedrons - Array of dodecahedron objects with { id, position, scale, lineColor }
 * @param {number} defaultLineWidth - Default line width for all edges
 * @param {number} cullingThreshold - Override threshold for enabling frustum culling (default: 50)
 */
const GlobalDodecahedronEdgesRenderer = React.memo(({ 
  dodecahedrons = [], 
  defaultLineWidth = 1,
  cullingThreshold = FRUSTUM_CULLING_THRESHOLD 
}) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastPositionsRef = useRef(new Map());
  const visibilityRef = useRef(new Map());
  
  const { camera, size } = useThree();
  
  // Get LOD data from store
  // _lodVersion is a counter incremented when lodLevels Map is mutated in-place (avoids O(N) Map copy)
  const { lodLevels, childParentMap, parentIds, lodEnabled, _lodVersion } = useLODStore();
  
  // Filter dodecahedrons based on LOD level - only render edges for FULL LOD
  // Grouping containers are excluded from LOD and always render
  const filteredDodecahedrons = useMemo(() => {
    if (!lodEnabled) return dodecahedrons;
    
    return dodecahedrons.filter(dodeca => {
      // Grouping containers are excluded from LOD - always render
      const isGroupingContainer = dodeca.merfolkData?.isContainer === true;
      if (isGroupingContainer) {
        return true;
      }
      
      const isParent = parentIds.has(dodeca.id);
      const isChild = childParentMap.has(dodeca.id);
      
      // If dodecahedron is neither parent nor child, always render (no LOD applied)
      if (!isParent && !isChild) {
        return true;
      }
      
      // Both parents and children use LOD levels with their respective thresholds
      const lodLevel = lodLevels.get(dodeca.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.FULL;
    });
  // _lodVersion ensures recompute when LOD levels change (Map is mutated in-place)
  }, [dodecahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const totalEdges = filteredDodecahedrons.length * EDGES_PER_DODECAHEDRON;
  
  // Track IDs to detect actual changes, not just length
  const dodecahedronIds = useMemo(() => filteredDodecahedrons.map(d => d.id).join(','), [filteredDodecahedrons]);

  // Create geometry with all dodecahedron edges
  const { geometry, material } = useMemo(() => {
    if (filteredDodecahedrons.length === 0) return { geometry: null, material: null };

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
    mat.uniforms.linewidth.value = defaultLineWidth;

    return { geometry: geo, material: mat };
  }, [totalEdges, defaultLineWidth]);

  // Dispose GPU resources when geometry/material change or on unmount
  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  // Keep resolution uniform in sync with the actual viewport size.
  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.x = size.width;
      material.uniforms.resolution.value.y = size.height;
    }
  }, [material, size.width, size.height]);

  // Mark for full update when filtered dodecahedrons array changes
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastPositionsRef.current.clear();
    visibilityRef.current.clear();
  }, [dodecahedronIds]);

  // Function to check if a dodecahedron is visible in the camera frustum
  const isDodecahedronVisible = useCallback((position, scale) => {
    // Calculate bounding sphere radius (dodecahedron circumradius ≈ 1.4 * scale)
    const maxScale = Math.max(scale[0], scale[1], scale[2]);
    const radius = maxScale * DODECA_SCALE * 1.9; // ~1.9 for dodecahedron circumradius
    
    tempSphere.center.set(position[0], position[1], position[2]);
    tempSphere.radius = radius;
    
    return tempFrustum.intersectsSphere(tempSphere);
  }, []);

  // Function to update edges for a single dodecahedron by index
  const updateDodecahedronEdges = useCallback((dodecaIndex, position, scale, color, instanceStart, instanceEnd, instanceColor) => {
    const edgeStartIndex = dodecaIndex * EDGES_PER_DODECAHEDRON;

    // Create transformation matrix for this dodecahedron
    tempMatrix.makeScale(scale[0], scale[1], scale[2]);
    tempMatrix.setPosition(position[0], position[1], position[2]);

    tempColor.set(color);

    // Transform each edge point and add to instance attributes
    for (let i = 0; i < EDGES_PER_DODECAHEDRON; i++) {
      const edgeIndex = edgeStartIndex + i;
      const [startPoint, endPoint] = BASE_DODECA_EDGES[i];

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
  // PERFORMANCE: Skip frame processing when nothing is being transformed
  useFrame(() => {
    if (!geometry || !meshRef.current || filteredDodecahedrons.length === 0) return;

    // PERFORMANCE: Early exit when no transforms are active AND we've done initial setup
    // dodecahedronTransformMap only has entries when dodecahedrons are being actively transformed
    const hasActiveTransforms = dodecahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    
    if (!hasActiveTransforms && !needsInitialSetup) {
      return; // Nothing moving and initial setup done, skip all per-frame work
    }

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let needsUpdate = needsFullUpdateRef.current;
    
    const enableCulling = filteredDodecahedrons.length > cullingThreshold;
    
    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }
    
    let visibleCount = 0;

    filteredDodecahedrons.forEach((dodeca, dodecaIndex) => {
      const dodecaId = dodeca.id?.toString();
      
      // Check if there's a real-time transform position
      const realtimeTransform = dodecahedronTransformMap.get(dodecaId);
      
      const position = realtimeTransform?.position || dodeca.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || dodeca.scale || [1, 1, 1];
      const color = dodeca.lineColor || dodeca.color || '#000000';

      // Check visibility (only if culling is enabled)
      let isVisible = true;
      let visibilityChanged = false;
      if (enableCulling) {
        isVisible = isDodecahedronVisible(position, scale);
        const wasVisible = visibilityRef.current.get(dodecaId);
        
        if (wasVisible === undefined || wasVisible !== isVisible) {
          visibilityRef.current.set(dodecaId, isVisible);
          visibilityChanged = true;
        }
      }

      // Check if this dodecahedron's position/scale/color changed
      const lastKnown = lastPositionsRef.current.get(dodecaId);
      const positionChanged = !lastKnown || 
        lastKnown.px !== position[0] ||
        lastKnown.py !== position[1] ||
        lastKnown.pz !== position[2] ||
        lastKnown.sx !== scale[0] ||
        lastKnown.sy !== scale[1] ||
        lastKnown.sz !== scale[2] ||
        lastKnown.color !== color;

      if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
        if (enableCulling && !isVisible) {
          // Set edges to zero length (invisible)
          const edgeStartIndex = dodecaIndex * EDGES_PER_DODECAHEDRON;
          for (let i = 0; i < EDGES_PER_DODECAHEDRON; i++) {
            const edgeIndex = edgeStartIndex + i;
            instanceStart.setXYZ(edgeIndex, 0, 0, 0);
            instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
            instanceColor.setXYZ(edgeIndex, 0, 0, 0);
          }
        } else {
          updateDodecahedronEdges(dodecaIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          if (enableCulling) visibleCount++;
        }
        
        lastPositionsRef.current.set(dodecaId, { 
          px: position[0], py: position[1], pz: position[2],
          sx: scale[0], sy: scale[1], sz: scale[2],
          color 
        });
        needsUpdate = true;
      } else if (enableCulling && isVisible) {
        visibleCount++;
      }
    });

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
      key={totalEdges}
      ref={meshRef}
      args={[geometry, material, totalEdges]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

GlobalDodecahedronEdgesRenderer.displayName = 'GlobalDodecahedronEdgesRenderer';

export default GlobalDodecahedronEdgesRenderer;
