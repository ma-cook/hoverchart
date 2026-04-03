import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { initWasmKernels, fillEdgeBuffers, getScratchStartView, getScratchEndView, getScratchColorView, isWasmReady } from '../utils/wasmKernels';

extend({ LineShaderMaterial });

// Initialise the wasm module as early as possible (non-blocking)
initWasmKernels();

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

// ---------------------------------------------------------------------------
// Wasm edge-kernel: pre-computed flat template arrays (local-space, one time)
// BASE_CUBE_EDGES is laid out as [start0, end0, start1, end1, ...] so
// even indices are starts and odd indices are ends.
// ---------------------------------------------------------------------------
const CUBE_TEMPLATE_START = new Float32Array(EDGES_PER_CUBE * 3);
const CUBE_TEMPLATE_END = new Float32Array(EDGES_PER_CUBE * 3);
for (let i = 0; i < EDGES_PER_CUBE; i++) {
  const s = BASE_CUBE_EDGES[i * 2];
  const e = BASE_CUBE_EDGES[i * 2 + 1];
  CUBE_TEMPLATE_START[i * 3] = s[0];
  CUBE_TEMPLATE_START[i * 3 + 1] = s[1];
  CUBE_TEMPLATE_START[i * 3 + 2] = s[2];
  CUBE_TEMPLATE_END[i * 3] = e[0];
  CUBE_TEMPLATE_END[i * 3 + 1] = e[1];
  CUBE_TEMPLATE_END[i * 3 + 2] = e[2];
}

// Reusable wasm-kernel input buffers — grown lazily, never shrunk.
// Module-level so they survive React re-renders without reallocation.
let _cubeWasmPositions = new Float32Array(0);
let _cubeWasmScales = new Float32Array(0);
let _cubeWasmColors = new Float32Array(0);
let _cubeWasmVisible = new Uint8Array(0);
const _cubeWasmColor = new THREE.Color(); // reusable for hex→RGB conversion

function _ensureCubeWasmBuffers(n) {
  if (_cubeWasmPositions.length < n * 3) {
    const cap = Math.max(n, 64) * 2; // grow with headroom
    _cubeWasmPositions = new Float32Array(cap * 3);
    _cubeWasmScales = new Float32Array(cap * 3);
    _cubeWasmColors = new Float32Array(cap * 3);
    _cubeWasmVisible = new Uint8Array(cap);
  }
}

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

  // FLICKER FIX: Use a grow-only capacity (power-of-2) so the instancedMesh
  // is NOT destroyed/recreated on every progressive-mount batch.  Instead the
  // mesh is allocated with headroom and mesh.count is set each frame.
  const capacityRef = useRef(0);
  if (totalEdges > capacityRef.current) {
    // Round up to next power-of-2 (min 128) — limits remounts to ~log₂(N)
    capacityRef.current = Math.max(128, 2 ** Math.ceil(Math.log2(Math.max(1, totalEdges))));
  }
  const capacity = capacityRef.current;

  // Create geometry with capacity-sized buffers (only recreated when capacity grows)
  const { geometry, material } = useMemo(() => {
    if (capacity === 0) return { geometry: null, material: null };

    const geo = new THREE.InstancedBufferGeometry();

    // Create a simple quad for the line (same as InstancedLine)
    const positions = new Float32Array([
      0, -1, 0, 1, -1, 0, 0, 1, 0,
      1, -1, 0, 1, 1, 0, 0, 1, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Pre-allocate instance attributes with CAPACITY (not totalEdges)
    const instanceStart = new Float32Array(capacity * 3);
    const instanceEnd = new Float32Array(capacity * 3);
    const instanceColor = new Float32Array(capacity * 3);

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
  }, [capacity, defaultLineWidth]);

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

  // Frame counter for throttling frustum culling (runs every N frames when idle)
  const cullingFrameCounterRef = useRef(0);
  const CULLING_FRAME_INTERVAL = 3; // Check frustum every 3 frames when no transforms active

  // Use useFrame for real-time position sync during transforms
  // PERFORMANCE: Skip frame processing when nothing is being transformed
  useFrame(() => {
    if (!geometry || !meshRef.current) return;

    // FLICKER FIX: Always keep rendered instance count in sync with actual
    // edge count.  The mesh is allocated with power-of-2 capacity headroom;
    // mesh.count controls how many instances the GPU actually draws.
    meshRef.current.count = totalEdges;

    if (filteredCubes.length === 0) return;

    const hasActiveTransforms = cubeTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    // Only perform frustum culling when cube count exceeds threshold
    const enableCulling = filteredCubes.length > cullingThreshold;

    // PERFORMANCE: Early exit when no transforms are active, initial setup is
    // done, AND frustum culling is disabled. When culling IS enabled we must
    // periodically re-evaluate because the camera may have rotated — edges
    // zeroed-out for off-screen cubes need to be restored when back in view.
    if (!hasActiveTransforms && !needsInitialSetup && !enableCulling) {
      return;
    }

    // Throttle frustum-culling-only frames (no transforms, no initial setup)
    // to every N frames to reduce CPU cost.
    if (enableCulling && !hasActiveTransforms && !needsInitialSetup) {
      cullingFrameCounterRef.current++;
      if (cullingFrameCounterRef.current % CULLING_FRAME_INTERVAL !== 0) {
        return;
      }
    }

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let needsUpdate = needsFullUpdateRef.current;

    // Update frustum from camera (only if culling is enabled)
    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }

    // -------------------------------------------------------------------------
    // Tier-2: Wasm batch path
    // Build flat input arrays for ALL cubes, delegate transform math to wasm,
    // then bulk-copy the outputs into the Three.js buffer attributes.
    // This replaces N×EDGES_PER_CUBE individual `applyMatrix4` calls.
    // -------------------------------------------------------------------------
    const count = filteredCubes.length;

    if (isWasmReady()) {
      _ensureCubeWasmBuffers(count);

      let anyChanged = needsInitialSetup;
      for (let i = 0; i < count; i++) {
        const cube = filteredCubes[i];
        const cubeId = cube.id?.toString();
        const realtimeTransform = cubeTransformMap.get(cubeId);
        const position = realtimeTransform?.position || cube.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];
        const color = cube.color || '#000000';

        // Frustum visibility
        let isVisible = true;
        if (enableCulling) {
          isVisible = isCubeVisible(position, scale);
          const wasVisible = visibilityRef.current.get(cubeId);
          if (wasVisible === undefined || wasVisible !== isVisible) {
            visibilityRef.current.set(cubeId, isVisible);
            anyChanged = true;
          }
        }

        // Dirty check — only flag if something actually changed
        const lastKnown = lastPositionsRef.current.get(cubeId);
        if (!lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color) {
          lastPositionsRef.current.set(cubeId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          anyChanged = true;
        }

        // Fill flat input buffers
        const pi = i * 3;
        _cubeWasmPositions[pi] = position[0]; _cubeWasmPositions[pi + 1] = position[1]; _cubeWasmPositions[pi + 2] = position[2];
        _cubeWasmScales[pi] = scale[0]; _cubeWasmScales[pi + 1] = scale[1]; _cubeWasmScales[pi + 2] = scale[2];
        _cubeWasmColor.set(color);
        _cubeWasmColors[pi] = _cubeWasmColor.r; _cubeWasmColors[pi + 1] = _cubeWasmColor.g; _cubeWasmColors[pi + 2] = _cubeWasmColor.b;
        _cubeWasmVisible[i] = (enableCulling && !isVisible) ? 0 : 1;
      }

      if (anyChanged) {
        fillEdgeBuffers(
          _cubeWasmPositions.subarray(0, count * 3),
          _cubeWasmScales.subarray(0, count * 3),
          _cubeWasmColors.subarray(0, count * 3),
          _cubeWasmVisible.subarray(0, count),
          CUBE_TEMPLATE_START,
          CUBE_TEMPLATE_END,
          EDGES_PER_CUBE,
        );

        const totalF = count * EDGES_PER_CUBE * 3;
        instanceStart.array.set(getScratchStartView(totalF));
        instanceEnd.array.set(getScratchEndView(totalF));
        instanceColor.array.set(getScratchColorView(totalF));
        needsUpdate = true;
      }
    } else {
      // -----------------------------------------------------------------------
      // JS fallback: per-cube matrix math (existing implementation)
      // -----------------------------------------------------------------------
      filteredCubes.forEach((cube, cubeIndex) => {
        const cubeId = cube.id?.toString();

        const realtimeTransform = cubeTransformMap.get(cubeId);
        const position = realtimeTransform?.position || cube.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];
        const color = cube.color || '#000000';

        let isVisible = true;
        let visibilityChanged = false;
        if (enableCulling) {
          isVisible = isCubeVisible(position, scale);
          const wasVisible = visibilityRef.current.get(cubeId);
          if (wasVisible === undefined || wasVisible !== isVisible) {
            visibilityRef.current.set(cubeId, isVisible);
            visibilityChanged = true;
          }
        }

        const lastKnown = lastPositionsRef.current.get(cubeId);
        const positionChanged = !lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color;

        if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
          if (enableCulling && !isVisible) {
            const edgeStartIndex = cubeIndex * EDGES_PER_CUBE;
            for (let i = 0; i < EDGES_PER_CUBE; i++) {
              const edgeIndex = edgeStartIndex + i;
              instanceStart.setXYZ(edgeIndex, 0, 0, 0);
              instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
              instanceColor.setXYZ(edgeIndex, 0, 0, 0);
            }
          } else {
            updateCubeEdges(cubeIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          }
          lastPositionsRef.current.set(cubeId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          needsUpdate = true;
        }
      });
    }

    if (needsUpdate) {
      instanceStart.needsUpdate = true;
      instanceEnd.needsUpdate = true;
      instanceColor.needsUpdate = true;

      // Set identity matrices for all instances (only on full update)
      if (needsFullUpdateRef.current) {
        for (let i = 0; i < capacity; i++) {
          meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        needsFullUpdateRef.current = false;
      }
    }
  });

  if (!geometry || capacity === 0) {
    return null;
  }

  return (
    <instancedMesh
      key={capacity} // Only remount when capacity grows (power-of-2, ~log₂(N) times)
      ref={meshRef}
      args={[geometry, material, capacity]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

GlobalCubeEdgesRenderer.displayName = 'GlobalCubeEdgesRenderer';

export default GlobalCubeEdgesRenderer;
