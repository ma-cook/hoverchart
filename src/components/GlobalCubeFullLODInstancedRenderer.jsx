import React, { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useCubeStore } from '../stores';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';

const CUBE_SIZE = 5;

// Shared geometry for the instanced hitbox cubes
const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(
  CUBE_SIZE * 2,
  CUBE_SIZE * 2,
  CUBE_SIZE * 2
);

// Transparent material — visible as a very faint wireframe-fill so users
// know the faces are clickable, but the cube still looks like a wireframe.
const TRANSPARENT_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.04,
  side: THREE.DoubleSide,
  depthWrite: false,
});

// Reusable temp objects (avoid GC pressure)
const tempMatrix = new THREE.Matrix4();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

/**
 * Determines whether a cube is "unmodified" — i.e. has no user customisation
 * beyond what the markdownDiagramService set at creation time.
 *
 * Unmodified cubes are rendered entirely via instanced renderers (edges +
 * this transparent hitbox) instead of mounting a heavy per-cube <Cube>
 * React component.
 *
 * @param {string} cubeId
 * @param {Map} cubesMap - cubeStore.cubes Map
 * @returns {boolean}
 */
export function isCubeUnmodified(cubeId, cubesMap) {
  const state = cubesMap?.get(cubeId?.toString());
  if (!state) return true; // No store entry yet = freshly loaded = unmodified

  const hasFaceColors =
    state.faceColors && Object.keys(state.faceColors).length > 0;
  const hasFaceTexts =
    state.faceTexts && Object.keys(state.faceTexts).length > 0;
  const hasHeaderText = state.headerText && state.headerText.length > 0;

  return !hasFaceColors && !hasFaceTexts && !hasHeaderText;
}

/**
 * GlobalCubeFullLODInstancedRenderer
 *
 * Renders a single instanced transparent-box mesh for all FULL-LOD
 * *unmodified* cubes.  This gives the cubes clickable faces without
 * mounting individual <Cube> React components.
 *
 * Edges are already handled by GlobalCubeEdgesRenderer.
 * Colored faces (for modified cubes) are handled by GlobalCubeFaceRenderer.
 *
 * When a user clicks an instance, `onInstanceClick(cubeId)` is called so
 * the parent can select the cube and promote it to a full component.
 */
const GlobalCubeFullLODInstancedRenderer = React.memo(
  ({ cubes = [], onInstanceClick }) => {
    const meshRef = useRef();
    const needsFullUpdateRef = useRef(true);
    const lastDataRef = useRef(new Map());
    // Map from instance index → cube ID (rebuilt each time filtered set changes)
    const indexToCubeIdRef = useRef([]);

    const { lodLevels, childParentMap, parentIds, lodEnabled, _lodVersion } =
      useLODStore();

    // We read cubeStore state in useFrame (non-reactive) for per-frame
    // unmodified checks, but also subscribe to the cubes Map reference
    // so the filtered list recomputes when cubes are modified.
    const cubesMap = useCubeStore((s) => s.cubes);

    // Filter to FULL-LOD, non-container, unmodified, non-selected cubes
    const instancedCubes = useMemo(() => {
      return cubes.filter((cube) => {
        // Containers are handled separately
        if (cube.merfolkData?.isContainer === true) return false;

        // LOD check: only FULL LOD cubes
        if (lodEnabled) {
          const isParent = parentIds.has(cube.id);
          const isChild = childParentMap.has(cube.id);
          if (isParent || isChild) {
            const lodLevel = lodLevels.get(cube.id) ?? LOD_LEVELS.FULL;
            if (lodLevel !== LOD_LEVELS.FULL) return false;
          }
        }

        // Only unmodified cubes
        if (!isCubeUnmodified(cube.id, cubesMap)) return false;

        // Skip selected cubes — they need the full component
        const cubeState = cubesMap?.get(cube.id?.toString());
        if (cubeState?.selected) return false;

        return true;
      });
    }, [
      cubes,
      cubesMap,
      lodLevels,
      _lodVersion,
      childParentMap,
      parentIds,
      lodEnabled,
    ]);

    const count = instancedCubes.length;

    // Grow-only power-of-2 capacity
    const capacityRef = useRef(0);
    if (count > capacityRef.current) {
      capacityRef.current = Math.max(
        16,
        2 ** Math.ceil(Math.log2(Math.max(1, count)))
      );
    }
    const capacity = capacityRef.current;

    // Track structural changes
    const cubeIds = useMemo(
      () => instancedCubes.map((c) => c.id).join(','),
      [instancedCubes]
    );

    // Mark for full update when the set changes
    useMemo(() => {
      needsFullUpdateRef.current = true;
      lastDataRef.current.clear();
      // Intentional: useMemo as side-effect trigger keyed on cubeIds
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cubeIds]);

    // Sync transforms every frame
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

      for (let i = 0; i < instancedCubes.length; i++) {
        const cube = instancedCubes[i];
        const cubeId = cube.id?.toString();
        idMap[i] = cubeId;

        const realtimeTransform = cubeTransformMap.get(cubeId);
        const position =
          realtimeTransform?.position || cube.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || cube.scale || [1, 1, 1];

        const lastKnown = lastDataRef.current.get(cubeId);
        const changed =
          !lastKnown ||
          lastKnown.px !== position[0] ||
          lastKnown.py !== position[1] ||
          lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] ||
          lastKnown.sy !== scale[1] ||
          lastKnown.sz !== scale[2];

        if (changed || needsInitialSetup) {
          tempMatrix.makeScale(scale[0], scale[1], scale[2]);
          tempMatrix.setPosition(position[0], position[1], position[2]);
          mesh.setMatrixAt(i, tempMatrix);

          lastDataRef.current.set(cubeId, {
            px: position[0],
            py: position[1],
            pz: position[2],
            sx: scale[0],
            sy: scale[1],
            sz: scale[2],
          });

          needsUpdate = true;
        }
      }

      indexToCubeIdRef.current = idMap;

      // Zero-out unused instances
      if (needsInitialSetup) {
        for (let i = count; i < capacity; i++) {
          mesh.setMatrixAt(i, ZERO_SCALE_MATRIX);
        }
      }

      if (needsUpdate) {
        mesh.instanceMatrix.needsUpdate = true;
        needsFullUpdateRef.current = false;
      }
    });

    // Click handler — maps instanceId back to cube ID
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
        args={[SHARED_BOX_GEOMETRY, TRANSPARENT_MATERIAL, capacity]}
        frustumCulled={false}
        onClick={handleClick}
      />
    );
  }
);

GlobalCubeFullLODInstancedRenderer.displayName =
  'GlobalCubeFullLODInstancedRenderer';

export default GlobalCubeFullLODInstancedRenderer;
