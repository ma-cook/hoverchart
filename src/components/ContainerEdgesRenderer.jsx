import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import {
  BASE_CUBE_EDGES,
  EDGES_PER_CUBE,
  cubeTransformMap,
} from './GlobalCubeEdgesRenderer';

extend({ LineShaderMaterial });

const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable objects to avoid GC pressure during frame updates
const tempVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

// Mark only [offset, offset+count) of an attribute dirty for GPU upload.
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

/**
 * ContainerEdgesRenderer - Renders grouping/repo container edges in ONE
 * instanced mesh that is INDEPENDENT of the LOD system.
 *
 * Grouping containers have no LOD level, so their edges should not be rebuilt
 * every time another object's LOD changes or when unrelated objects
 * mount/unmount.  GlobalCubeEdgesRenderer packs all cube edges into a single
 * LOD-reactive instanced mesh that fully rebuilds on any LOD membership change;
 * keeping containers in that mesh meant their edges were re-uploaded on every
 * LOD transition.  This renderer splits container edges into their own stable
 * mesh keyed only to the container set.
 *
 * The container list preserves referential identity across unrelated
 * mount/unmount batches, so the GPU buffers are only rewritten when a container
 * is actually added/removed or its transform/color changes.
 *
 * @param {Array} cubes - Array of cube objects (containers are filtered out internally)
 * @param {number} defaultLineWidth - Line width for all edges
 */
const ContainerEdgesRenderer = React.memo(({ cubes = [], defaultLineWidth = 1 }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  // Track last-known transform/color per container to detect in-place mutations.
  const lastStateRef = useRef(new Map());
  const { size } = useThree();

  // Filter to grouping / repo containers only.  Containers have no LOD, so this
  // memo deliberately does NOT depend on _lodVersion.  Referential identity is
  // preserved when the container set is unchanged so that unrelated objects
  // mounting/unmounting (which changes the `cubes` array identity) does NOT
  // trigger a rebuild.
  const prevContainersRef = useRef([]);
  const containers = useMemo(() => {
    const next = cubes.filter(
      (c) =>
        c.merfolkData?.isContainer === true ||
        c.merfolkData?.isRepoContainer === true
    );
    const prev = prevContainersRef.current;
    if (prev.length === next.length) {
      let same = true;
      for (let i = 0; i < next.length; i++) {
        if (prev[i] !== next[i]) {
          same = false;
          break;
        }
      }
      if (same) return prev; // unchanged — keep previous array identity
    }
    prevContainersRef.current = next;
    return next;
  }, [cubes]);

  const totalEdges = containers.length * EDGES_PER_CUBE;

  // Grow-only power-of-2 capacity so the instanced mesh is not recreated on
  // every container addition.
  const capacityRef = useRef(0);
  if (totalEdges > capacityRef.current) {
    capacityRef.current = Math.max(
      128,
      2 ** Math.ceil(Math.log2(Math.max(1, totalEdges)))
    );
  }
  const capacity = capacityRef.current;

  // Create geometry with capacity-sized buffers (recreated only when capacity grows)
  const { geometry, material } = useMemo(() => {
    if (capacity === 0) return { geometry: null, material: null };

    const geo = new THREE.InstancedBufferGeometry();
    const positions = new Float32Array([
      0, -1, 0, 1, -1, 0, 0, 1, 0,
      1, -1, 0, 1, 1, 0, 0, 1, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const instanceStart = new Float32Array(capacity * 3);
    const instanceEnd = new Float32Array(capacity * 3);
    const instanceColor = new Float32Array(capacity * 3);
    geo.setAttribute('instanceStart', new THREE.InstancedBufferAttribute(instanceStart, 3));
    geo.setAttribute('instanceEnd', new THREE.InstancedBufferAttribute(instanceEnd, 3));
    geo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColor, 3));

    const mat = LineShaderMaterial.clone();
    mat.uniforms.linewidth.value = defaultLineWidth;
    return { geometry: geo, material: mat };
  }, [capacity, defaultLineWidth]);

  // Keep resolution uniform in sync with the actual viewport size so line
  // width matches the other edge renderers.
  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.x = size.width;
      material.uniforms.resolution.value.y = size.height;
    }
  }, [material, size.width, size.height]);

  // Dispose GPU resources when geometry/material change or on unmount
  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  // Set identity instance matrices once per mesh allocation.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;
    for (let i = 0; i < capacity; i++) {
      mesh.setMatrixAt(i, IDENTITY_MATRIX);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [geometry, capacity]);

  // Container set changed (added/removed) — force a full rewrite.
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastStateRef.current.clear();
  }, [containers]);

  // Per-frame: write container edges.  Containers are few, so a targeted
  // dirty-check per container is cheap.  Position updates mutate objects in
  // place, so we compare current values against last-known state rather than
  // relying on array identity.
  useFrame(() => {
    if (!geometry || !meshRef.current) return;
    meshRef.current.count = totalEdges;
    if (containers.length === 0) return;

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let minDirty = needsFullUpdateRef.current ? 0 : Infinity;

    for (let i = 0; i < containers.length; i++) {
      const cube = containers[i];
      const cubeId = cube.id?.toString();
      const realtime = cubeTransformMap.get(cubeId);
      const position = realtime?.position || cube.position || [0, 0, 0];
      const scale = realtime?.scale || cube.scale || [1, 1, 1];
      const color = cube.color || '#000000';

      const last = lastStateRef.current.get(cubeId);
      const changed =
        !last ||
        last.px !== position[0] || last.py !== position[1] || last.pz !== position[2] ||
        last.sx !== scale[0] || last.sy !== scale[1] || last.sz !== scale[2] ||
        last.color !== color;

      if (!changed) continue;

      lastStateRef.current.set(cubeId, {
        px: position[0], py: position[1], pz: position[2],
        sx: scale[0], sy: scale[1], sz: scale[2],
        color,
      });

      // Write this container's 12 edges
      tempMatrix.makeScale(scale[0], scale[1], scale[2]);
      tempMatrix.setPosition(position[0], position[1], position[2]);
      tempColor.set(color);
      const edgeStartIndex = i * EDGES_PER_CUBE;
      for (let e = 0; e < EDGES_PER_CUBE; e++) {
        const edgeIndex = edgeStartIndex + e;
        const sp = BASE_CUBE_EDGES[e * 2];
        const ep = BASE_CUBE_EDGES[e * 2 + 1];
        tempVec.set(sp[0], sp[1], sp[2]).applyMatrix4(tempMatrix);
        instanceStart.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);
        tempVec.set(ep[0], ep[1], ep[2]).applyMatrix4(tempMatrix);
        instanceEnd.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);
        instanceColor.setXYZ(edgeIndex, tempColor.r, tempColor.g, tempColor.b);
      }
      if (i < minDirty) minDirty = i;
    }

    if (minDirty !== Infinity) {
      const startF = minDirty * EDGES_PER_CUBE * 3;
      const endF = containers.length * EDGES_PER_CUBE * 3;
      const lenF = endF - startF;
      applyUpdateRange(instanceStart, startF, lenF);
      applyUpdateRange(instanceEnd, startF, lenF);
      applyUpdateRange(instanceColor, startF, lenF);
    }
    needsFullUpdateRef.current = false;
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

ContainerEdgesRenderer.displayName = 'ContainerEdgesRenderer';

export default ContainerEdgesRenderer;
