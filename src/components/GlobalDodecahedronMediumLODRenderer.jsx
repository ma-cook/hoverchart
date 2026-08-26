import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { dodecahedronTransformMap } from './GlobalDodecahedronEdgesRenderer';
import { isPickingSuppressed } from './PickGate';

// Low-poly sphere to approximate dodecahedron silhouette at medium distance
// Radius 8 matches edge renderer bounds (PHI * 5 ≈ 8.09)
const SHARED_SPHERE_GEOMETRY = new THREE.SphereGeometry(8, 8, 6);

const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.8,
});

// Reusable objects to avoid GC pressure in useFrame
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * GlobalDodecahedronMediumLODRenderer — Renders all MEDIUM-LOD dodecahedrons
 * in a single instanced draw call, replacing per-object <mesh> in Dodecahedron.jsx.
 *
 * Performance: O(N) draw calls → O(1) draw call for medium-distance dodecahedrons.
 *
 * @param {Array} dodecahedrons - Array of ALL dodecahedron objects (filtering done internally)
 */
const GlobalDodecahedronMediumLODRenderer = React.memo(({ dodecahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToDodecaIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter to only MEDIUM LOD dodecahedrons (excludes grouping containers)
  const mediumDodecahedrons = useMemo(() => {
    if (!lodEnabled) return [];

    return dodecahedrons.filter(dodeca => {
      const isGroupingContainer = dodeca.merfolkData?.isContainer === true;
      if (isGroupingContainer) return false;

      const lodLevel = lodLevels.get(dodeca.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.MEDIUM;
    });
  }, [dodecahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = mediumDodecahedrons.length;

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
    prevFilteredRef.current = mediumDodecahedrons;
    if (
      prev !== null &&
      !needsFullUpdateRef.current &&
      mediumDodecahedrons.length >= prev.length
    ) {
      let appendOnly = true;
      for (let pfx = 0; pfx < prev.length; pfx++) {
        if (mediumDodecahedrons[pfx] !== prev[pfx]) { appendOnly = false; break; }
      }
      if (appendOnly) {
        hasPendingAppendsRef.current = true;
        return;
      }
    }
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [mediumDodecahedrons]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = dodecahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (
      !hasActiveTransforms &&
      !needsInitialSetup &&
      !hasPendingAppendsRef.current
    ) return;

    // Defer full O(N) rebuilds during camera motion.
    if (needsInitialSetup && isPickingSuppressed()) return;

    hasPendingAppendsRef.current = false;
    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < mediumDodecahedrons.length; i++) {
      const dodeca = mediumDodecahedrons[i];
      const dodecaId = dodeca.id?.toString();
      idMap[i] = dodecaId;

      const realtimeTransform = dodecahedronTransformMap.get(dodecaId);
      const position = realtimeTransform?.position || dodeca.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || dodeca.scale || [1, 1, 1];

      const isParent = parentIds.has(dodeca.id);
      const color = isParent ? '#888888' : (dodeca.color || '#888888');

      const lastKnown = lastDataRef.current.get(dodecaId);
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

        lastDataRef.current.set(dodecaId, {
          px: position[0], py: position[1], pz: position[2],
          sx: scale[0], sy: scale[1], sz: scale[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToDodecaIdRef.current = idMap;


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
      const dodecaId = indexToDodecaIdRef.current[instanceId];
      if (dodecaId && onInstanceClick) {
        onInstanceClick(dodecaId);
      }
    },
    [onInstanceClick]
  );

  if (capacity === 0) return null;

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[SHARED_SPHERE_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalDodecahedronMediumLODRenderer.displayName = 'GlobalDodecahedronMediumLODRenderer';

export default GlobalDodecahedronMediumLODRenderer;
