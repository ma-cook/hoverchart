import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { tetrahedronTransformMap } from './GlobalTetrahedronEdgesRenderer';

// Custom tetrahedron geometry matching the full-detail Tetrahedron.jsx vertices exactly.
// TETRAHEDRON_SIZE = 5:
//   v0 = (0, 5, 0)            — top
//   v1 = (-5, -5, 5)          — bottom-left-front
//   v2 = (5, -5, 5)           — bottom-right-front
//   v3 = (0, -5, -7.5)        — bottom-back
const _buildTetraGeometry = () => {
  const S = 5;
  const v0 = [0, S, 0];
  const v1 = [-S, -S, S];
  const v2 = [S, -S, S];
  const v3 = [0, -S, -S * 1.5];

  // 4 faces × 3 vertices × 3 coords = 36 floats
  // Face order matches Tetrahedron.jsx: front, left, right, bottom
  const positions = new Float32Array([
    ...v0, ...v2, ...v1, // front
    ...v0, ...v1, ...v3, // left
    ...v0, ...v3, ...v2, // right
    ...v1, ...v2, ...v3, // bottom
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
};

const SHARED_TETRAHEDRON_GEOMETRY = _buildTetraGeometry();

const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.8,
});

// Reusable objects to avoid GC pressure in useFrame
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * GlobalTetrahedronMediumLODRenderer — Renders all MEDIUM-LOD tetrahedrons
 * in a single instanced draw call, replacing per-object <mesh> in Tetrahedron.jsx.
 *
 * Performance: O(N) draw calls → O(1) draw call for medium-distance tetrahedrons.
 *
 * @param {Array} tetrahedrons - Array of ALL tetrahedron objects (filtering done internally)
 */
const GlobalTetrahedronMediumLODRenderer = React.memo(({ tetrahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToTetraIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter to only MEDIUM LOD tetrahedrons (excludes grouping containers)
  const mediumTetrahedrons = useMemo(() => {
    if (!lodEnabled) return [];

    return tetrahedrons.filter(tetra => {
      const isGroupingContainer = tetra.merfolkData?.isContainer === true;
      if (isGroupingContainer) return false;

      const lodLevel = lodLevels.get(tetra.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.MEDIUM;
    });
  }, [tetrahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = mediumTetrahedrons.length;

  // Grow-only capacity (power-of-2) to avoid instancedMesh remounts
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(32768, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  // Zero unused instance slots once per mesh allocation (key={capacity}
  // remount gives a fresh buffer). Keeps stale slots invisible without an
  // O(capacity) sweep inside useFrame on every full update.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || capacity <= count) return;
    for (let i = count; i < capacity; i++) {
      mesh.setMatrixAt(i, ZERO_SCALE_MATRIX);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity]);
  // Append-aware invalidation: keep incremental state when the filtered
  // set grows by appending (progressive mounting); full rebuild otherwise.
  // New tail items are absent from the dirty-check map, so per-frame
  // changed-detection writes them, and hasPendingAppendsRef keeps the
  // frame loop alive until that pass has run.
  const prevFilteredRef = useRef(null);
  const hasPendingAppendsRef = useRef(false);
  useEffect(() => {
    const prev = prevFilteredRef.current;
    prevFilteredRef.current = mediumTetrahedrons;
    if (
      prev !== null &&
      !needsFullUpdateRef.current &&
      mediumTetrahedrons.length >= prev.length
    ) {
      let appendOnly = true;
      for (let pfx = 0; pfx < prev.length; pfx++) {
        if (mediumTetrahedrons[pfx] !== prev[pfx]) { appendOnly = false; break; }
      }
      if (appendOnly) {
        hasPendingAppendsRef.current = true;
        return;
      }
    }
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [mediumTetrahedrons]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = tetrahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (
      !hasActiveTransforms &&
      !needsInitialSetup &&
      !hasPendingAppendsRef.current
    ) return;

    hasPendingAppendsRef.current = false;
    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < mediumTetrahedrons.length; i++) {
      const tetra = mediumTetrahedrons[i];
      const tetraId = tetra.id?.toString();
      idMap[i] = tetraId;

      const realtimeTransform = tetrahedronTransformMap.get(tetraId);
      const position = realtimeTransform?.position || tetra.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || tetra.scale || [1, 1, 1];

      const isParent = parentIds.has(tetra.id);
      const color = isParent ? '#d0d0d0' : (tetra.color || '#808080');

      const lastKnown = lastDataRef.current.get(tetraId);
      const changed = !lastKnown ||
        lastKnown.px !== position[0] ||
        lastKnown.py !== position[1] ||
        lastKnown.pz !== position[2] ||
        lastKnown.sx !== scale[0] ||
        lastKnown.sy !== scale[1] ||
        lastKnown.sz !== scale[2] ||
        lastKnown.color !== color;

      if (changed || needsInitialSetup) {
        tempMatrix.makeScale(scale[0], scale[1], scale[2]);
        tempMatrix.setPosition(position[0], position[1], position[2]);
        mesh.setMatrixAt(i, tempMatrix);

        tempColor.set(color);
        mesh.setColorAt(i, tempColor);

        lastDataRef.current.set(tetraId, {
          px: position[0], py: position[1], pz: position[2],
          sx: scale[0], sy: scale[1], sz: scale[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToTetraIdRef.current = idMap;


    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      // Invalidate cached bounding sphere so Three.js recomputes it from
      // current instance data on the next raycast. Without this, a stale
      // sphere can cause all raycasts to miss.
      mesh.boundingSphere = null;
      needsFullUpdateRef.current = false;
    }
  });

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId == null) return;
      const tetraId = indexToTetraIdRef.current[instanceId];
      if (tetraId && onInstanceClick) {
        onInstanceClick(tetraId);
      }
    },
    [onInstanceClick]
  );

  if (capacity === 0) return null;

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[SHARED_TETRAHEDRON_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalTetrahedronMediumLODRenderer.displayName = 'GlobalTetrahedronMediumLODRenderer';

export default GlobalTetrahedronMediumLODRenderer;
