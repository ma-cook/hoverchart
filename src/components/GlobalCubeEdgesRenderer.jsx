import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';

extend({ LineShaderMaterial });

const CUBE_SIZE = 5;

// Threshold for enabling frustum culling (only cull when cube count exceeds this)
const FRUSTUM_CULLING_THRESHOLD = 50;

// Reusable objects for frustum culling (avoid GC pressure)
const tempFrustum = new THREE.Frustum();
const tempProjectionMatrix = new THREE.Matrix4();
const tempSphere = new THREE.Sphere();

// Base cube edges in local space (12 edges × 2 points = 24 points × 3 coords = 72 values)
const BASE_CUBE_EDGES = [
  // Bottom face edges (4 edges)
  [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  // Top face edges (4 edges)
  [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  // Vertical edges (4 edges)
  [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
];

const EDGES_PER_CUBE = 12;
const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable objects to avoid GC pressure during frame updates
const tempVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

// Global map for real-time cube transforms - Cube components update this during drag
// This allows GlobalCubeEdgesRenderer to read positions without expensive scene traversal
export const cubeTransformMap = new Map(); // Map<cubeId, { position: [x,y,z], scale: [x,y,z] }>

/**
 * GlobalCubeEdgesRenderer - Renders ALL cube edges in a single draw call
 * 
 * Instead of each Cube component rendering its own InstancedLine (N draw calls),
 * this component batches all cube edges into a single instanced mesh (1 draw call).
 * 
 * Performance improvement: O(N) draw calls → O(1) draw call
 * 
 * Uses useFrame to sync with cubeTransformMap for real-time position updates
 * during transforms.
 * 
 * Frustum culling: When cube count > FRUSTUM_CULLING_THRESHOLD, performs per-cube
 * visibility checks to skip updating off-screen cubes (renders them with zero scale).
 * 
 * @param {Array} cubes - Array of cube objects with { id, position, scale, color }
 * @param {number} defaultLineWidth - Default line width for all edges
 * @param {number} cullingThreshold - Override threshold for enabling frustum culling (default: 50)
 */
const GlobalCubeEdgesRenderer = React.memo(({ cubes = [], defaultLineWidth = 1, cullingThreshold = FRUSTUM_CULLING_THRESHOLD }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastPositionsRef = useRef(new Map()); // Track last known positions to detect changes
  const visibilityRef = useRef(new Map()); // Track visibility state per cube
  
  // Get camera for frustum culling
  const { camera, size } = useThree();
  
  // Get LOD data from store
  // _lodVersion is a counter incremented when lodLevels Map is mutated in-place (avoids O(N) Map copy)
  const { lodLevels, childParentMap, parentIds, lodEnabled, _lodVersion } = useLODStore();
  
  // Filter cubes based on LOD level - only render edges for FULL LOD cubes
  // Grouping containers are excluded from LOD and always render
  const filteredCubes = useMemo(() => {
    if (!lodEnabled) return cubes;
    
    return cubes.filter(cube => {
      // Grouping containers are excluded from LOD - always render
      const isGroupingContainer = cube.merfolkData?.isContainer === true;
      if (isGroupingContainer) {
        return true;
      }
      
      const isParent = parentIds.has(cube.id);
      const isChild = childParentMap.has(cube.id);
      
      // If cube is neither parent nor child, always render (no LOD applied)
      if (!isParent && !isChild) {
        return true;
      }
      
      // Both parents and children use LOD levels, just with different distance thresholds
      // LODManager calculates the appropriate level based on object type
      const lodLevel = lodLevels.get(cube.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.FULL;
    });
  // _lodVersion ensures recompute when LOD levels change (Map is mutated in-place)
  }, [cubes, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  // Calculate total number of line instances needed
  const totalEdges = filteredCubes.length * EDGES_PER_CUBE;
  
  // Track cube IDs to detect actual changes, not just length
  const cubeIds = useMemo(() => filteredCubes.map(c => c.id).join(','), [filteredCubes]);

  // Create geometry with all cube edges
  const { geometry, material } = useMemo(() => {
    if (cubes.length === 0) return { geometry: null, material: null };

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
  }, [totalEdges, defaultLineWidth, cubeIds]);

  // Dispose GPU resources when geometry/material change or on unmount
  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  // Keep resolution uniform in sync with the actual viewport size.
  // Material is created in useMemo so we update it via a separate effect.
  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.x = size.width;
      material.uniforms.resolution.value.y = size.height;
    }
  }, [material, size.width, size.height]);

  // Mark for full update when cubes array changes
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastPositionsRef.current.clear();
    visibilityRef.current.clear();
  }, [cubeIds]);

  // Function to check if a cube is visible in the camera frustum
  const isCubeVisible = useCallback((position, scale) => {
    // Calculate bounding sphere radius (diagonal of scaled cube)
    const maxScale = Math.max(scale[0], scale[1], scale[2]);
    const radius = maxScale * CUBE_SIZE * 1.73; // sqrt(3) ≈ 1.73 for cube diagonal
    
    tempSphere.center.set(position[0], position[1], position[2]);
    tempSphere.radius = radius;
    
    return tempFrustum.intersectsSphere(tempSphere);
  }, []);

  // Function to update edges for a single cube by index
  const updateCubeEdges = useCallback((cubeIndex, position, scale, color, instanceStart, instanceEnd, instanceColor) => {
    const edgeStartIndex = cubeIndex * EDGES_PER_CUBE;

    // Create transformation matrix for this cube
    tempMatrix.makeScale(scale[0], scale[1], scale[2]);
    tempMatrix.setPosition(position[0], position[1], position[2]);

    tempColor.set(color);

    // Transform each edge point and add to instance attributes
    for (let i = 0; i < EDGES_PER_CUBE; i++) {
      const edgeIndex = edgeStartIndex + i;
      const startPoint = BASE_CUBE_EDGES[i * 2];
      const endPoint = BASE_CUBE_EDGES[i * 2 + 1];

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
    if (!geometry || !meshRef.current || filteredCubes.length === 0) return;

    // PERFORMANCE: Early exit when no transforms are active AND we've done initial setup
    // cubeTransformMap only has entries when cubes are being actively dragged/transformed
    const hasActiveTransforms = cubeTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    
    if (!hasActiveTransforms && !needsInitialSetup) {
      return; // Nothing moving and initial setup done, skip all per-frame work
    }

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let needsUpdate = needsFullUpdateRef.current;
    
    // Only perform frustum culling when cube count exceeds threshold
    const enableCulling = filteredCubes.length > cullingThreshold;
    
    // Update frustum from camera (only if culling is enabled)
    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }
    
    // Debug: track visible count
    let visibleCount = 0;

    filteredCubes.forEach((cube, cubeIndex) => {
      const cubeId = cube.id?.toString();
      
      // Check if there's a real-time transform position from the Cube component
      const realtimeTransform = cubeTransformMap.get(cubeId);
      
      // Use real-time position if available, otherwise use prop position
      const position = realtimeTransform?.position || cube.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];
      const color = cube.color || '#000000';

      // Check visibility (only if culling is enabled)
      let isVisible = true;
      let visibilityChanged = false;
      if (enableCulling) {
        isVisible = isCubeVisible(position, scale);
        const wasVisible = visibilityRef.current.get(cubeId);
        
        // If visibility changed (or first time seeing this cube), force update
        // Note: wasVisible is undefined on first check, so we treat undefined as "needs update"
        if (wasVisible === undefined || wasVisible !== isVisible) {
          visibilityRef.current.set(cubeId, isVisible);
          visibilityChanged = true;
        }
      }

      // Check if this cube's position/scale changed
      const lastKnown = lastPositionsRef.current.get(cubeId);
      const positionChanged = !lastKnown || 
        lastKnown.position[0] !== position[0] ||
        lastKnown.position[1] !== position[1] ||
        lastKnown.position[2] !== position[2] ||
        lastKnown.scale[0] !== scale[0] ||
        lastKnown.scale[1] !== scale[1] ||
        lastKnown.scale[2] !== scale[2] ||
        lastKnown.color !== color;

      // Update if position changed, visibility changed, or doing full update
      if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
        // If not visible and culling enabled, render with zero-size edges (effectively hidden)
        if (enableCulling && !isVisible) {
          // Set edges to a single point (zero length = invisible)
          const edgeStartIndex = cubeIndex * EDGES_PER_CUBE;
          for (let i = 0; i < EDGES_PER_CUBE; i++) {
            const edgeIndex = edgeStartIndex + i;
            instanceStart.setXYZ(edgeIndex, 0, 0, 0);
            instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
            instanceColor.setXYZ(edgeIndex, 0, 0, 0);
          }
        } else {
          // Cube is visible or culling disabled - render normally
          updateCubeEdges(cubeIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          if (enableCulling) visibleCount++;
        }
        
        lastPositionsRef.current.set(cubeId, { 
          position: [...position], 
          scale: [...scale],
          color 
        });
        needsUpdate = true;
      } else if (enableCulling && isVisible) {
        // Count visible cubes that didn't need update
        visibleCount++;
      }
    });

    if (needsUpdate) {
      instanceStart.needsUpdate = true;
      instanceEnd.needsUpdate = true;
      instanceColor.needsUpdate = true;

      // Set identity matrices for all instances (only on full update)
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
      key={totalEdges} // Force remount when instance count changes
      ref={meshRef}
      args={[geometry, material, totalEdges]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

GlobalCubeEdgesRenderer.displayName = 'GlobalCubeEdgesRenderer';

export default GlobalCubeEdgesRenderer;
