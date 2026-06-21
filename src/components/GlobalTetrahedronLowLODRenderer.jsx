import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { tetrahedronTransformMap } from './GlobalTetrahedronEdgesRenderer';

// 2D triangle geometry to represent tetrahedrons at LOW LOD
// Larger than full-detail to remain visible at extreme distance
const _buildTriangleGeometry = () => {
  const S = 10;
  const h = S * Math.sqrt(3) / 2;
  const positions = new Float32Array([
    0, h * 2 / 3, 0,
    -S / 2, -h / 3, 0,
    S / 2, -h / 3, 0,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
};

const SHARED_TRIANGLE_GEOMETRY = _buildTriangleGeometry();

const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthWrite: true,
});

// Reusable objects to avoid GC pressure in useFrame
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

const GlobalTetrahedronLowLODRenderer = React.memo(({ tetrahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToTetraIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter to LOW-LOD tetrahedrons (excludes grouping containers)
  const lowTetrahedrons = useMemo(() => {
    if (!lodEnabled) return [];
    return tetrahedrons.filter(tetra => {
      if (tetra.merfolkData?.isContainer === true) return false;
      const lodLevel = lodLevels.get(tetra.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.LOW;
    });
  }, [tetrahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = lowTetrahedrons.length;

  // Grow-only capacity (power-of-2)
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  // Track structural changes
  const tetraIds = useMemo(() => lowTetrahedrons.map(t => t.id).join(','), [lowTetrahedrons]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [tetraIds]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = tetrahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < lowTetrahedrons.length; i++) {
      const tetra = lowTetrahedrons[i];
      const tetraId = tetra.id?.toString();
      idMap[i] = tetraId;

      const realtimeTransform = tetrahedronTransformMap.get(tetraId);
      const position = realtimeTransform?.position || tetra.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || tetra.scale || [1, 1, 1];

      const color = tetra.color || '#808080';

      const lastKnown = lastDataRef.current.get(tetraId);
      const changed = !lastKnown ||
        lastKnown.px !== position[0] ||
        lastKnown.py !== position[1] ||
        lastKnown.pz !== position[2] ||
        lastKnown.color !== color;

      if (changed || needsInitialSetup) {
        tempMatrix.makeScale(scale[0], scale[1], scale[2]);
        tempMatrix.setPosition(position[0], position[1], position[2]);
        mesh.setMatrixAt(i, tempMatrix);

        tempColor.set(color);
        mesh.setColorAt(i, tempColor);

        lastDataRef.current.set(tetraId, {
          px: position[0], py: position[1], pz: position[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToTetraIdRef.current = idMap;

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
      args={[SHARED_TRIANGLE_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalTetrahedronLowLODRenderer.displayName = 'GlobalTetrahedronLowLODRenderer';

export default GlobalTetrahedronLowLODRenderer;
