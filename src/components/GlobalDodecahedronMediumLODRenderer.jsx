import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { dodecahedronTransformMap } from './GlobalDodecahedronEdgesRenderer';

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
const GlobalDodecahedronMediumLODRenderer = React.memo(({ dodecahedrons = [] }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());

  const { lodLevels, childParentMap, parentIds, lodEnabled, _lodVersion } = useLODStore();

  // Filter to only MEDIUM LOD dodecahedrons (excludes grouping containers)
  const mediumDodecahedrons = useMemo(() => {
    if (!lodEnabled) return [];

    return dodecahedrons.filter(dodeca => {
      const isGroupingContainer = dodeca.merfolkData?.isContainer === true;
      if (isGroupingContainer) return false;

      const isParent = parentIds.has(dodeca.id);
      const isChild = childParentMap.has(dodeca.id);

      if (!isParent && !isChild) return false;

      const lodLevel = lodLevels.get(dodeca.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.MEDIUM;
    });
  }, [dodecahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = mediumDodecahedrons.length;

  // Grow-only capacity (power-of-2) to avoid instancedMesh remounts
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  const dodecaIds = useMemo(() => mediumDodecahedrons.map(d => d.id).join(','), [mediumDodecahedrons]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [dodecaIds]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = dodecahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;

    for (let i = 0; i < mediumDodecahedrons.length; i++) {
      const dodeca = mediumDodecahedrons[i];
      const dodecaId = dodeca.id?.toString();

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

    if (needsInitialSetup) {
      for (let i = count; i < capacity; i++) {
        mesh.setMatrixAt(i, ZERO_SCALE_MATRIX);
      }
    }

    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      needsFullUpdateRef.current = false;
    }
  });

  if (capacity === 0) return null;

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[SHARED_SPHERE_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
    />
  );
});

GlobalDodecahedronMediumLODRenderer.displayName = 'GlobalDodecahedronMediumLODRenderer';

export default GlobalDodecahedronMediumLODRenderer;
