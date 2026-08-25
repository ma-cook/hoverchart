import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { octahedronTransformMap } from './GlobalOctahedronEdgesRenderer';

const _buildOctahedronGeometry = () => {
  const S = 5;
  const v0 = [0, S, 0];
  const v1 = [S, 0, 0];
  const v2 = [0, 0, S];
  const v3 = [-S, 0, 0];
  const v4 = [0, 0, -S];
  const v5 = [0, -S, 0];

  const positions = new Float32Array([
    ...v0, ...v1, ...v2,
    ...v0, ...v2, ...v3,
    ...v0, ...v3, ...v4,
    ...v0, ...v4, ...v1,
    ...v5, ...v2, ...v1,
    ...v5, ...v3, ...v2,
    ...v5, ...v4, ...v3,
    ...v5, ...v1, ...v4,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
};

const SHARED_OCTAHEDRON_GEOMETRY = _buildOctahedronGeometry();

const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.8,
});

const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

const GlobalOctahedronMediumLODRenderer = React.memo(({ octahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToOctaIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  const mediumOctahedrons = useMemo(() => {
    if (!lodEnabled) return [];

    return octahedrons.filter(octa => {
      const isGroupingContainer = octa.merfolkData?.isContainer === true;
      if (isGroupingContainer) return false;

      const lodLevel = lodLevels.get(octa.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.MEDIUM;
    });
  }, [octahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = mediumOctahedrons.length;

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
    prevFilteredRef.current = mediumOctahedrons;
    if (
      prev !== null &&
      !needsFullUpdateRef.current &&
      mediumOctahedrons.length >= prev.length
    ) {
      let appendOnly = true;
      for (let pfx = 0; pfx < prev.length; pfx++) {
        if (mediumOctahedrons[pfx] !== prev[pfx]) { appendOnly = false; break; }
      }
      if (appendOnly) {
        hasPendingAppendsRef.current = true;
        return;
      }
    }
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [mediumOctahedrons]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = octahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (
      !hasActiveTransforms &&
      !needsInitialSetup &&
      !hasPendingAppendsRef.current
    ) return;

    hasPendingAppendsRef.current = false;
    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < mediumOctahedrons.length; i++) {
      const octa = mediumOctahedrons[i];
      const octaId = octa.id?.toString();
      idMap[i] = octaId;

      const realtimeTransform = octahedronTransformMap.get(octaId);
      const position = realtimeTransform?.position || octa.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || octa.scale || [1, 1, 1];

      const isParent = parentIds.has(octa.id);
      const color = isParent ? '#d0d0d0' : (octa.color || '#808080');

      const lastKnown = lastDataRef.current.get(octaId);
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

        lastDataRef.current.set(octaId, {
          px: position[0], py: position[1], pz: position[2],
          sx: scale[0], sy: scale[1], sz: scale[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToOctaIdRef.current = idMap;


    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.boundingSphere = null;
      needsFullUpdateRef.current = false;
    }
  });

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId == null) return;
      const octaId = indexToOctaIdRef.current[instanceId];
      if (octaId && onInstanceClick) {
        onInstanceClick(octaId);
      }
    },
    [onInstanceClick]
  );

  if (capacity === 0) return null;

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[SHARED_OCTAHEDRON_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalOctahedronMediumLODRenderer.displayName = 'GlobalOctahedronMediumLODRenderer';

export default GlobalOctahedronMediumLODRenderer;
