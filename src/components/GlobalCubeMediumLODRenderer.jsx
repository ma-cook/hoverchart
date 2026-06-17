import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';

const CUBE_SIZE = 5;

// Shared geometry — created once, reused by every mount of this component
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(CUBE_SIZE * 2, CUBE_SIZE * 2, CUBE_SIZE * 2);

// Shared material — MeshBasicMaterial with per-instance color via instanceColor attribute
const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.8,
  // vertexColors enables reading from instanceColor attribute
  // (Three.js instancedMesh sets this automatically when setColorAt is used)
});

// Reusable objects to avoid GC pressure in useFrame
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * GlobalCubeMediumLODRenderer — Renders all MEDIUM-LOD cubes in a single
 * instanced draw call, replacing the per-cube <mesh> that Cube.jsx used to
 * render at LOD_LEVELS.MEDIUM.
 *
 * Performance: O(N) draw calls → O(1) draw call for medium-distance cubes.
 *
 * Uses useFrame to sync with cubeTransformMap for real-time drag updates,
 * keeping the same pattern as GlobalCubeEdgesRenderer.
 *
 * @param {Array} cubes - Array of ALL cube objects (filtering done internally)
 */
const GlobalCubeMediumLODRenderer = React.memo(({ cubes = [] }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map()); // Track last known data to detect changes

  // Get LOD data from store
  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter cubes to only those at MEDIUM LOD level
  // Grouping containers are excluded (they always render at full detail)
  const mediumCubes = useMemo(() => {
    if (!lodEnabled) return [];

    return cubes.filter(cube => {
      const isGroupingContainer = cube.merfolkData?.isContainer === true || cube.merfolkData?.isRepoContainer === true;
      if (isGroupingContainer) return false;

      const isParent = parentIds.has(cube.id);
      const isChild = childParentMap.has(cube.id);

      // If neither parent nor child, LOD doesn't apply
      if (!isParent && !isChild) return false;

      const lodLevel = lodLevels.get(cube.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.MEDIUM;
    });
  }, [cubes, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = mediumCubes.length;

  // Grow-only capacity (power-of-2) to avoid instancedMesh remounts
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  // Track cube IDs to detect structural changes
  const cubeIds = useMemo(() => mediumCubes.map(c => c.id).join(','), [mediumCubes]);

  // Mark for full update when the set of medium cubes changes
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [cubeIds]);

  // Sync transforms every frame (handles drag + position changes)
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Always keep draw count in sync
    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = cubeTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    // Early exit when nothing to update
    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;

    for (let i = 0; i < mediumCubes.length; i++) {
      const cube = mediumCubes[i];
      const cubeId = cube.id?.toString();

      // Use real-time transform if being dragged, else use store position
      const realtimeTransform = cubeTransformMap.get(cubeId);
      const position = realtimeTransform?.position || cube.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];

      // Parent objects get a different color/opacity
      const isParent = parentIds.has(cube.id);
      const color = isParent ? '#e0e0e0' : (cube.color || '#2a2a2a');
      const opacity = isParent ? 0.6 : 0.8;

      // Check if this cube's data changed
      const lastKnown = lastDataRef.current.get(cubeId);
      const changed = !lastKnown ||
        lastKnown.px !== position[0] ||
        lastKnown.py !== position[1] ||
        lastKnown.pz !== position[2] ||
        lastKnown.sx !== scale[0] ||
        lastKnown.sy !== scale[1] ||
        lastKnown.sz !== scale[2] ||
        lastKnown.color !== color;

      if (changed || needsInitialSetup) {
        // Set transform matrix
        tempMatrix.makeScale(scale[0], scale[1], scale[2]);
        tempMatrix.setPosition(position[0], position[1], position[2]);
        mesh.setMatrixAt(i, tempMatrix);

        // Set color
        tempColor.set(color);
        mesh.setColorAt(i, tempColor);

        lastDataRef.current.set(cubeId, {
          px: position[0], py: position[1], pz: position[2],
          sx: scale[0], sy: scale[1], sz: scale[2],
          color,
        });

        needsUpdate = true;
      }
    }

    // Zero-out unused instances beyond count (if capacity > count)
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
      args={[SHARED_BOX_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
    />
  );
});

GlobalCubeMediumLODRenderer.displayName = 'GlobalCubeMediumLODRenderer';

export default GlobalCubeMediumLODRenderer;
