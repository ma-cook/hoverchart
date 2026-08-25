import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { initWasmKernels, fillEdgeBuffers, getScratchStartView, getScratchEndView, getScratchColorView, isWasmReady } from '../utils/wasmKernels';
import { bulkImportState } from '../utils/bulkImportState';

// Mark only [offset, offset+count) of an attribute dirty for GPU upload.
// Uses whichever update-range API the installed three.js version exposes;
// falls back to a full upload when neither exists (still correct, just slower).
function applyUpdateRange(attr, offset, count) {
  attr.needsUpdate = true;
  if (typeof attr.addUpdateRange === 'function') {
    if (typeof attr.clearUpdateRanges === 'function') attr.clearUpdateRanges();
    attr.addUpdateRange(offset, count);
  } else if (attr.updateRange) {
    attr.updateRange.offset = offset;
    attr.updateRange.count = count;
  }
}

extend({ LineShaderMaterial });

// Initialise the wasm module as early as possible (non-blocking)
initWasmKernels();

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

// ---------------------------------------------------------------------------
// Wasm edge-kernel: pre-computed flat template arrays (local-space, one time)
// BASE_TETRA_EDGES is [[startPt, endPt], ...] matching the dodecahedron pattern
// ---------------------------------------------------------------------------
const TETRA_TEMPLATE_START = new Float32Array(EDGES_PER_TETRAHEDRON * 3);
const TETRA_TEMPLATE_END = new Float32Array(EDGES_PER_TETRAHEDRON * 3);
for (let i = 0; i < EDGES_PER_TETRAHEDRON; i++) {
  const [s, e] = BASE_TETRA_EDGES[i];
  TETRA_TEMPLATE_START[i * 3] = s[0];
  TETRA_TEMPLATE_START[i * 3 + 1] = s[1];
  TETRA_TEMPLATE_START[i * 3 + 2] = s[2];
  TETRA_TEMPLATE_END[i * 3] = e[0];
  TETRA_TEMPLATE_END[i * 3 + 1] = e[1];
  TETRA_TEMPLATE_END[i * 3 + 2] = e[2];
}

// Reusable wasm-kernel input buffers — grown lazily, never shrunk.
let _tetraWasmPositions = new Float32Array(0);
let _tetraWasmScales = new Float32Array(0);
let _tetraWasmColors = new Float32Array(0);
let _tetraWasmVisible = new Uint8Array(0);
const _tetraWasmColor = new THREE.Color();

function _ensureTetraWasmBuffers(n) {
  if (_tetraWasmPositions.length < n * 3) {
    const cap = Math.max(n, 64) * 2;
    _tetraWasmPositions = new Float32Array(cap * 3);
    _tetraWasmScales = new Float32Array(cap * 3);
    _tetraWasmColors = new Float32Array(cap * 3);
    _tetraWasmVisible = new Uint8Array(cap);
  }
}

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
  
  const { camera, size } = useThree();
  
  // Get LOD data from store
  // _lodVersion is a counter incremented when lodLevels Map is mutated in-place (avoids O(N) Map copy)
  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);
  
  // Filter tetrahedrons based on LOD level - only render edges for FULL LOD
  // Grouping containers are excluded from LOD and always render
  const filteredTetrahedrons = useMemo(() => {
    if (!lodEnabled) return tetrahedrons;
    
    return tetrahedrons.filter(tetra => {
      // Grouping containers are excluded from LOD - always render
      const isGroupingContainer = tetra.merfolkData?.isContainer === true;
      if (isGroupingContainer) {
        return true;
      }
      
      const isParent = parentIds.has(tetra.id);
      const isChild = childParentMap.has(tetra.id);
      
      // If tetrahedron is neither parent nor child, always render (no LOD applied)
      if (!isParent && !isChild) {
        return true;
      }
      
      // Both parents and children use LOD levels with their respective thresholds
      const lodLevel = lodLevels.get(tetra.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.FULL;
    });
  // _lodVersion ensures recompute when LOD levels change (Map is mutated in-place)
  }, [tetrahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const totalEdges = filteredTetrahedrons.length * EDGES_PER_TETRAHEDRON;
  
  // FLICKER FIX: Use a grow-only capacity (power-of-2) so the instancedMesh
  // is NOT destroyed/recreated on every progressive-mount batch.
  const capacityRef = useRef(0);
  if (totalEdges > capacityRef.current) {
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
  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.x = size.width;
      material.uniforms.resolution.value.y = size.height;
    }
  }, [material, size.width, size.height]);

  // Mark for full update when the filtered set changes - but only when the
  // change is NOT append-only. PERF FIX: during progressive mounting every
  // batch appends items and previously this effect wiped the dirty-check
  // maps and forced a full O(N) rebuild + full GPU re-upload EVERY frame.
  const prevFilteredRef = useRef(null);
  // True while appended items have not yet been written to the GPU
  // attributes; keeps the frame loop alive even when culling is off.
  const hasPendingAppendsRef = useRef(false);
  useEffect(() => {
    const prev = prevFilteredRef.current;
    prevFilteredRef.current = filteredTetrahedrons;
    if (
      prev !== null &&
      !needsFullUpdateRef.current &&
      filteredTetrahedrons.length >= prev.length
    ) {
      let appendOnly = true;
      for (let i = 0; i < prev.length; i++) {
        if (filteredTetrahedrons[i] !== prev[i]) { appendOnly = false; break; }
      }
      if (appendOnly) {
        // New tail items are absent from lastPositionsRef, so frame-loop
        // dirty checks pick them up automatically.
        hasPendingAppendsRef.current = true;
        return;
      }
    }
    needsFullUpdateRef.current = true;
    lastPositionsRef.current.clear();
    visibilityRef.current.clear();
  }, [filteredTetrahedrons]);

  // Capacity growth swaps the geometry (fresh zero-filled buffers).
  useEffect(() => {
    needsFullUpdateRef.current = true;
  }, [geometry]);

  // Identity instance matrices ONCE per mesh allocation (O(capacity)).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;
    for (let i = 0; i < capacity; i++) {
      mesh.setMatrixAt(i, IDENTITY_MATRIX);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [geometry, capacity]);

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

  // Frame counter for throttling frustum culling (runs every N frames when idle)
  const cullingFrameCounterRef = useRef(0);
  const CULLING_FRAME_INTERVAL = 3;

  // Use useFrame for real-time position sync during transforms
  // PERFORMANCE: Skip frame processing when nothing is being transformed
  useFrame(() => {
    if (!geometry || !meshRef.current) return;

    // FLICKER FIX: Always keep rendered instance count in sync
    meshRef.current.count = totalEdges;

    if (filteredTetrahedrons.length === 0) return;

    const hasActiveTransforms = tetrahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    const enableCulling =
      filteredTetrahedrons.length > cullingThreshold && !bulkImportState.active;

    // PERFORMANCE: Early exit when no transforms are active, initial setup is
    // done, AND frustum culling is disabled. When culling IS enabled we must
    // periodically re-evaluate because the camera may have rotated — edges
    // zeroed-out for off-screen shapes need to be restored when back in view.
    if (
      !hasActiveTransforms &&
      !needsInitialSetup &&
      !enableCulling &&
      !hasPendingAppendsRef.current
    ) {
      return;
    }

    // Throttle frustum-culling-only frames to every N frames to reduce CPU cost.
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

    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }

    const count = filteredTetrahedrons.length;

    // -------------------------------------------------------------------------
    // Tier-2: Wasm batch path
    // -------------------------------------------------------------------------
    if (isWasmReady()) {
      _ensureTetraWasmBuffers(count);

      let minDirty = needsInitialSetup ? 0 : Infinity;
      for (let i = 0; i < count; i++) {
        const tetra = filteredTetrahedrons[i];
        const tetraId = tetra.id?.toString();
        const realtimeTransform = tetrahedronTransformMap.get(tetraId);
        const position = realtimeTransform?.position || tetra.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || tetra.scale || [1, 1, 1];
        const color = tetra.color || '#000000';

        let isVisible = true;
        if (enableCulling) {
          isVisible = isTetrahedronVisible(position, scale);
          const wasVisible = visibilityRef.current.get(tetraId);
          if (wasVisible === undefined || wasVisible !== isVisible) {
            visibilityRef.current.set(tetraId, isVisible);
            if (i < minDirty) minDirty = i;
          }
        }

        const lastKnown = lastPositionsRef.current.get(tetraId);
        if (!lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color) {
          lastPositionsRef.current.set(tetraId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          if (i < minDirty) minDirty = i;
        }

        const pi = i * 3;
        _tetraWasmPositions[pi] = position[0]; _tetraWasmPositions[pi + 1] = position[1]; _tetraWasmPositions[pi + 2] = position[2];
        _tetraWasmScales[pi] = scale[0]; _tetraWasmScales[pi + 1] = scale[1]; _tetraWasmScales[pi + 2] = scale[2];
        _tetraWasmColor.set(color);
        _tetraWasmColors[pi] = _tetraWasmColor.r; _tetraWasmColors[pi + 1] = _tetraWasmColor.g; _tetraWasmColors[pi + 2] = _tetraWasmColor.b;
        _tetraWasmVisible[i] = (enableCulling && !isVisible) ? 0 : 1;
      }

      if (minDirty !== Infinity) {
        fillEdgeBuffers(
          _tetraWasmPositions.subarray(0, count * 3),
          _tetraWasmScales.subarray(0, count * 3),
          _tetraWasmColors.subarray(0, count * 3),
          _tetraWasmVisible.subarray(0, count),
          TETRA_TEMPLATE_START,
          TETRA_TEMPLATE_END,
          EDGES_PER_TETRAHEDRON,
        );

        const startF = minDirty * EDGES_PER_TETRAHEDRON * 3;
        const endF = count * EDGES_PER_TETRAHEDRON * 3;
        const lenF = endF - startF;
        instanceStart.array.set(getScratchStartView(endF).subarray(startF), startF);
        instanceEnd.array.set(getScratchEndView(endF).subarray(startF), startF);
        instanceColor.array.set(getScratchColorView(endF).subarray(startF), startF);
        applyUpdateRange(instanceStart, startF, lenF);
        applyUpdateRange(instanceEnd, startF, lenF);
        applyUpdateRange(instanceColor, startF, lenF);
        needsUpdate = true;
      }
    } else {
      // -----------------------------------------------------------------------
      // JS fallback: per-object matrix math (existing implementation)
      // -----------------------------------------------------------------------
      filteredTetrahedrons.forEach((tetra, tetraIndex) => {
        const tetraId = tetra.id?.toString();

        const realtimeTransform = tetrahedronTransformMap.get(tetraId);
        const position = realtimeTransform?.position || tetra.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || tetra.scale || [1, 1, 1];
        const color = tetra.color || '#000000';

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

        const lastKnown = lastPositionsRef.current.get(tetraId);
        const positionChanged = !lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color;

        if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
          if (enableCulling && !isVisible) {
            const edgeStartIndex = tetraIndex * EDGES_PER_TETRAHEDRON;
            for (let i = 0; i < EDGES_PER_TETRAHEDRON; i++) {
              const edgeIndex = edgeStartIndex + i;
              instanceStart.setXYZ(edgeIndex, 0, 0, 0);
              instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
              instanceColor.setXYZ(edgeIndex, 0, 0, 0);
            }
          } else {
            updateTetrahedronEdges(tetraIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          }
          lastPositionsRef.current.set(tetraId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          needsUpdate = true;
        }
      });
    }

    if (needsUpdate) {
      // Identity instance matrices were set once per mesh allocation
      // (see effect above) - nothing per-frame here anymore.
      needsFullUpdateRef.current = false;
    }
    hasPendingAppendsRef.current = false;
  });

  if (!geometry || capacity === 0) {
    return null;
  }

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[geometry, material, capacity]}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

GlobalTetrahedronEdgesRenderer.displayName = 'GlobalTetrahedronEdgesRenderer';

export default GlobalTetrahedronEdgesRenderer;
