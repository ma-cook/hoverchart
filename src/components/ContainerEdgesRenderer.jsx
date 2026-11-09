import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import useThemeStore from '../stores/themeStore';
import { resolveEdgeColor } from '../utils/themeColors';
import LineShaderMaterial from './LineShaderMaterial';
import {
  BASE_CUBE_EDGES,
  EDGES_PER_CUBE,
  cubeTransformMap,
} from './GlobalCubeEdgesRenderer';

// Shared base quad for the fat-line shader (same layout as the other line
// renderers).  Container edges need real pixel thickness; WebGL ignores
// LineBasicMaterial.linewidth, so use the app's LineShaderMaterial instead.
const BASE_LINE_QUAD_POSITIONS = new Float32Array([
  0, -1, 0, 1, -1, 0, 0, 1, 0,
  1, -1, 0, 1,  1, 0, 0, 1, 0,
]);

const FLOATS_PER_CUBE = EDGES_PER_CUBE * 3;

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
 * instanced fat-line draw call using LineShaderMaterial and is INDEPENDENT of
 * the LOD system.  WebGL ignores LineBasicMaterial.linewidth, so the shader is
 * required to render these edges thinner than 1px.
 *
 * Grouping containers have no LOD level, so their edges should not be rebuilt
 * every time another object's LOD changes or when unrelated objects
 * mount/unmount.  This renderer keeps container edges in their own stable
 * buffers keyed only to the container set.
 *
 * @param {Array} cubes - Array of cube objects (containers are filtered out internally)
 * @param {number} defaultLineWidth - Core line width in pixels for all edges
 */
const ContainerEdgesRenderer = React.memo(({ cubes = [], defaultLineWidth = 1 }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  // Track last-known transform/color per container to detect in-place mutations.
  const lastStateRef = useRef(new Map());
  const themeMode = useThemeStore((s) => s.mode);
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

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(BASE_LINE_QUAD_POSITIONS, 3));
    geo.setAttribute(
      'instanceStart',
      new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3)
    );
    geo.setAttribute(
      'instanceEnd',
      new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3)
    );
    geo.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3)
    );
    geo.instanceCount = 0;

    const mat = LineShaderMaterial.clone();
    // The shader's solid core is `linewidth` pixels; glowWidth expands the quad
    // around it.  A 2x quad with no halo keeps a 0.5px core antialiased instead
    // of letting it vanish into a hard sub-pixel line.
    mat.uniforms.linewidth.value = defaultLineWidth;
    mat.uniforms.glowWidth.value = 2.0;
    mat.uniforms.glowIntensity.value = 0.0;
    mat.uniforms.opacity.value = 1.0;
    mat.uniforms.resolution.value.x = window.innerWidth;
    mat.uniforms.resolution.value.y = window.innerHeight;

    return { geometry: geo, material: mat };
  }, [capacity, defaultLineWidth]);

  // Keep resolution uniform in sync with the actual viewport size.
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
    geometry.instanceCount = totalEdges;
    if (containers.length === 0) return;

    const startAttr = geometry.getAttribute('instanceStart');
    const endAttr = geometry.getAttribute('instanceEnd');
    const colorAttr = geometry.getAttribute('instanceColor');

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

      // Write this container's 12 edges as line instances
      tempMatrix.makeScale(scale[0], scale[1], scale[2]);
      tempMatrix.setPosition(position[0], position[1], position[2]);
      tempColor.set(color);
      const edgeStartIndex = i * EDGES_PER_CUBE;
      for (let e = 0; e < EDGES_PER_CUBE; e++) {
        const edgeIndex = edgeStartIndex + e;
        const sp = BASE_CUBE_EDGES[e * 2];
        const ep = BASE_CUBE_EDGES[e * 2 + 1];
        tempVec.set(sp[0], sp[1], sp[2]).applyMatrix4(tempMatrix);
        startAttr.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);
        tempVec.set(ep[0], ep[1], ep[2]).applyMatrix4(tempMatrix);
        endAttr.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);
        colorAttr.setXYZ(edgeIndex, tempColor.r, tempColor.g, tempColor.b);
      }
      if (i < minDirty) minDirty = i;
    }

    if (minDirty !== Infinity) {
      const startF = minDirty * FLOATS_PER_CUBE;
      const endF = containers.length * FLOATS_PER_CUBE;
      const lenF = endF - startF;
      applyUpdateRange(startAttr, startF, lenF);
      applyUpdateRange(endAttr, startF, lenF);
      applyUpdateRange(colorAttr, startF, lenF);
    }
    needsFullUpdateRef.current = false;
  });

  if (!geometry || capacity === 0) {
    return null;
  }

  return (
    <mesh
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
