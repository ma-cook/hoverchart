import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';

// 2D square geometry to represent cubes at LOW LOD
// Sized larger than full-detail to remain visible at extreme distance
const SHARED_SQUARE_GEOMETRY = new THREE.PlaneGeometry(20, 20);

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

const GlobalCubeLowLODRenderer = React.memo(({ cubes = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToCubeIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter to LOW-LOD cubes (excludes grouping containers)
  const lowCubes = useMemo(() => {
    if (!lodEnabled) return [];
    return cubes.filter(cube => {
      if (cube.merfolkData?.isContainer === true || cube.merfolkData?.isRepoContainer === true) return false;
      const isParent = parentIds.has(cube.id);
      const isChild = childParentMap.has(cube.id);
      if (!isParent && !isChild) return false;
      const lodLevel = lodLevels.get(cube.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.LOW;
    });
  }, [cubes, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = lowCubes.length;

  // Grow-only capacity (power-of-2)
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  // Track structural changes
  const cubeIds = useMemo(() => lowCubes.map(c => c.id).join(','), [lowCubes]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [cubeIds]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = cubeTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < lowCubes.length; i++) {
      const cube = lowCubes[i];
      const cubeId = cube.id?.toString();
      idMap[i] = cubeId;

      const realtimeTransform = cubeTransformMap.get(cubeId);
      const position = realtimeTransform?.position || cube.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];

      const color = cube.color || '#888888';

      const lastKnown = lastDataRef.current.get(cubeId);
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

        lastDataRef.current.set(cubeId, {
          px: position[0], py: position[1], pz: position[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToCubeIdRef.current = idMap;

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
      const cubeId = indexToCubeIdRef.current[instanceId];
      if (cubeId && onInstanceClick) {
        onInstanceClick(cubeId);
      }
    },
    [onInstanceClick]
  );

  if (capacity === 0) return null;

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[SHARED_SQUARE_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalCubeLowLODRenderer.displayName = 'GlobalCubeLowLODRenderer';

export default GlobalCubeLowLODRenderer;
