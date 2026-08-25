import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCubeStore } from '../stores';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';

// Mobile detection (same as CubeFace.jsx)
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const FACE_SIZE = isMobile ? 15.6 : 9.8;
const SHARED_FACE_GEOMETRY = new THREE.BoxGeometry(FACE_SIZE, FACE_SIZE, 0.05);
const CUBE_SIZE = 5;
const NORMAL_OFFSET = 0.02; // Prevent z-fighting (matches CubeFace offsetMultiplier)

// Material matching CubeFace colored material properties
const FACE_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xffffff, // White base; per-instance color replaces it
  opacity: 1.0,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: true,
});

// Face definitions matching cubeHelpers.js getFaceIndicatorProps
const CUBE_FACES = [
  { name: 'front',  pos: [0, 0, CUBE_SIZE],  normal: [0, 0, 1] },
  { name: 'back',   pos: [0, 0, -CUBE_SIZE], normal: [0, 0, -1] },
  { name: 'top',    pos: [0, CUBE_SIZE, 0],   normal: [0, 1, 0] },
  { name: 'bottom', pos: [0, -CUBE_SIZE, 0],  normal: [0, -1, 0] },
  { name: 'right',  pos: [CUBE_SIZE, 0, 0],   normal: [1, 0, 0] },
  { name: 'left',   pos: [-CUBE_SIZE, 0, 0],  normal: [-1, 0, 0] },
];

// Pre-compute face quaternions (matching cubeHelpers.js rotations)
const FACE_QUATERNIONS = [
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),             // front
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),             // back
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), // top
  new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),  // bottom
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),  // right
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)), // left
];

// Reusable temp objects (avoid GC pressure)
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();

/**
 * GlobalCubeFaceRenderer - Renders colored cube faces via a single InstancedMesh.
 *
 * Only renders faces that have a color AND belong to non-selected cubes.
 * Selected cubes render their own CubeFace components for interaction.
 *
 * Performance: replaces N individual colored-face draw calls with 1 instanced draw call.
 */
const GlobalCubeFaceRenderer = React.memo(({ cubes = [] }) => {
  const meshRef = useRef();
  const lastCapacityRef = useRef(0);
  const needsFullUpdateRef = useRef(true);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  // Filter to full-LOD cubes (same logic as GlobalCubeEdgesRenderer)
  const filteredCubes = useMemo(() => {
    if (!lodEnabled) return cubes;
    return cubes.filter(cube => {
      if (cube.merfolkData?.isContainer === true || cube.merfolkData?.isRepoContainer === true) return true;
      const isParent = parentIds.has(cube.id);
      const isChild = childParentMap.has(cube.id);
      if (!isParent && !isChild) return true;
      const lodLevel = lodLevels.get(cube.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.FULL;
    });
  }, [cubes, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  // Append-aware invalidation: keep incremental state when the filtered
  // set grows by appending (progressive mounting); full rebuild otherwise.
  // New tail items are absent from the dirty-check map, so per-frame
  // changed-detection writes them, and hasPendingAppendsRef keeps the
  // frame loop alive until that pass has run.
  const prevFilteredRef = useRef(null);
  const hasPendingAppendsRef = useRef(false);
  useEffect(() => {
    const prev = prevFilteredRef.current;
    prevFilteredRef.current = filteredCubes;
    if (
      prev !== null &&
      !needsFullUpdateRef.current &&
      filteredCubes.length >= prev.length
    ) {
      let appendOnly = true;
      for (let pfx = 0; pfx < prev.length; pfx++) {
        if (filteredCubes[pfx] !== prev[pfx]) { appendOnly = false; break; }
      }
      if (appendOnly) {
        hasPendingAppendsRef.current = true;
        return;
      }
    }
    needsFullUpdateRef.current = true;
  }, [filteredCubes]);

  // Power-of-2 grow-only capacity (6 faces per cube max)
  const maxPossible = filteredCubes.length * 6;
  if (maxPossible > lastCapacityRef.current) {
    lastCapacityRef.current = Math.max(32768, 2 ** Math.ceil(Math.log2(Math.max(1, maxPossible))));
  }
  const capacity = lastCapacityRef.current;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const hasActiveTransforms = cubeTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    if (
      !hasActiveTransforms &&
      !needsInitialSetup &&
      !hasPendingAppendsRef.current
    ) return;

    hasPendingAppendsRef.current = false;
    const cubeStoreState = useCubeStore.getState();
    let idx = 0;

    for (let ci = 0; ci < filteredCubes.length; ci++) {
      const cube = filteredCubes[ci];
      const cubeId = cube.id?.toString();
      const cubeState = cubeStoreState.cubes.get(cubeId);
      if (!cubeState) continue;

      // Skip selected cubes — they render their own CubeFace components
      if (cubeState.selected) continue;

      const faceColors = cubeState.faceColors;
      if (!faceColors) continue;

      // Get real-time transform (drag) or fall back to object data
      const transform = cubeTransformMap.get(cubeId);
      const px = transform?.position?.[0] ?? cube.position?.[0] ?? 0;
      const py = transform?.position?.[1] ?? cube.position?.[1] ?? 0;
      const pz = transform?.position?.[2] ?? cube.position?.[2] ?? 0;
      const sx = transform?.scale?.[0] ?? cube.scale?.[0] ?? 1;
      const sy = transform?.scale?.[1] ?? cube.scale?.[1] ?? 1;
      const sz = transform?.scale?.[2] ?? cube.scale?.[2] ?? 1;

      for (let fi = 0; fi < 6; fi++) {
        const color = faceColors[CUBE_FACES[fi].name];
        if (!color) continue;

        const fLocal = CUBE_FACES[fi].pos;
        const fNormal = CUBE_FACES[fi].normal;

        // World position = cubePos + faceLocalPos * cubeScale + normalOffset
        tempPosition.set(
          px + fLocal[0] * sx + fNormal[0] * NORMAL_OFFSET,
          py + fLocal[1] * sy + fNormal[1] * NORMAL_OFFSET,
          pz + fLocal[2] * sz + fNormal[2] * NORMAL_OFFSET,
        );

        tempScale.set(sx, sy, sz);
        tempMatrix.compose(tempPosition, FACE_QUATERNIONS[fi], tempScale);
        mesh.setMatrixAt(idx, tempMatrix);

        tempColor.set(color);
        mesh.setColorAt(idx, tempColor);
        idx++;
      }
    }

    mesh.count = idx;
    if (idx > 0) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    needsFullUpdateRef.current = false;
  });

  if (capacity === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[SHARED_FACE_GEOMETRY, FACE_MATERIAL, capacity]}
      frustumCulled={false}
    />
  );
});

GlobalCubeFaceRenderer.displayName = 'GlobalCubeFaceRenderer';

export default GlobalCubeFaceRenderer;
