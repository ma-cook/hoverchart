import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useThemeStore from '../stores/themeStore';
import { resolveEdgeColor } from '../utils/themeColors';
import {
  BASE_CUBE_EDGES,
  EDGES_PER_CUBE,
  cubeTransformMap,
} from './GlobalCubeEdgesRenderer';

const VERTICES_PER_CUBE = EDGES_PER_CUBE * 2;

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
 * LineSegments draw call using the standard LineBasicMaterial (no custom
 * shaders) and is INDEPENDENT of the LOD system.
 *
 * Grouping containers have no LOD level, so their edges should not be rebuilt
 * every time another object's LOD changes or when unrelated objects
 * mount/unmount.  This renderer keeps container edges in their own stable
 * buffers keyed only to the container set.
 *
 * @param {Array} cubes - Array of cube objects (containers are filtered out internally)
 * @param {number} defaultLineWidth - Line width for all edges
 */
const ContainerEdgesRenderer = React.memo(({ cubes = [], defaultLineWidth = 1 }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  // Track last-known transform/color per container to detect in-place mutations.
  const lastStateRef = useRef(new Map());
  const themeMode = useThemeStore((s) => s.mode);

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

  // Grow-only power-of-2 capacity so the geometry is not recreated on every
  // container addition.
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

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(capacity * 2 * 3);
    const colors = new Float32Array(capacity * 2 * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: defaultLineWidth,
      transparent: false,
      depthTest: true,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [capacity, defaultLineWidth]);

  // Dispose GPU resources when geometry/material change or on unmount
  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  // Container set or buffer allocation changed — force a full rewrite.
  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastStateRef.current.clear();
  }, [containers, geometry]);

  // Per-frame: write container edges.  Containers are few, so a targeted
  // dirty-check per container is cheap.  Position updates mutate objects in
  // place, so we compare current values against last-known state rather than
  // relying on array identity.
  useFrame(() => {
    if (!geometry || !meshRef.current) return;
    geometry.setDrawRange(0, totalEdges * 2);
    if (containers.length === 0) return;

    const positionAttr = geometry.getAttribute('position');
    const colorAttr = geometry.getAttribute('color');

    let minDirty = needsFullUpdateRef.current ? 0 : Infinity;

    for (let i = 0; i < containers.length; i++) {
      const cube = containers[i];
      const cubeId = cube.id?.toString();
      const realtime = cubeTransformMap.get(cubeId);
      const position = realtime?.position || cube.position || [0, 0, 0];
      const scale = realtime?.scale || cube.scale || [1, 1, 1];
      const color = resolveEdgeColor(cube.color, themeMode) || '#000000';

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
        const vertexIndex = (edgeStartIndex + e) * 2;
        const sp = BASE_CUBE_EDGES[e * 2];
        const ep = BASE_CUBE_EDGES[e * 2 + 1];
        tempVec.set(sp[0], sp[1], sp[2]).applyMatrix4(tempMatrix);
        positionAttr.setXYZ(vertexIndex, tempVec.x, tempVec.y, tempVec.z);
        tempVec.set(ep[0], ep[1], ep[2]).applyMatrix4(tempMatrix);
        positionAttr.setXYZ(vertexIndex + 1, tempVec.x, tempVec.y, tempVec.z);
        colorAttr.setXYZ(vertexIndex, tempColor.r, tempColor.g, tempColor.b);
        colorAttr.setXYZ(vertexIndex + 1, tempColor.r, tempColor.g, tempColor.b);
      }
      if (i < minDirty) minDirty = i;
    }

    if (minDirty !== Infinity) {
      const startF = minDirty * VERTICES_PER_CUBE * 3;
      const endF = containers.length * VERTICES_PER_CUBE * 3;
      const lenF = endF - startF;
      applyUpdateRange(positionAttr, startF, lenF);
      applyUpdateRange(colorAttr, startF, lenF);
    }
    needsFullUpdateRef.current = false;
  });

  if (!geometry || capacity === 0) {
    return null;
  }

  return (
    <lineSegments
      key={capacity}
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={10}
    />
  );
});

ContainerEdgesRenderer.displayName = 'ContainerEdgesRenderer';

export default ContainerEdgesRenderer;
