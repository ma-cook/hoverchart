import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { initWasmKernels, fillEdgeBuffers, getScratchStartView, getScratchEndView, getScratchColorView, isWasmReady } from '../utils/wasmKernels';

extend({ LineShaderMaterial });

initWasmKernels();

const FRUSTUM_CULLING_THRESHOLD = 50;

const tempFrustum = new THREE.Frustum();
const tempProjectionMatrix = new THREE.Matrix4();
const tempSphere = new THREE.Sphere();

const OCTAHEDRON_SIZE = 5;

const OCTA_VERTICES = [
  [0, OCTAHEDRON_SIZE, 0],
  [OCTAHEDRON_SIZE, 0, 0],
  [0, 0, OCTAHEDRON_SIZE],
  [-OCTAHEDRON_SIZE, 0, 0],
  [0, 0, -OCTAHEDRON_SIZE],
  [0, -OCTAHEDRON_SIZE, 0],
];

const OCTA_EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [5, 1], [5, 2], [5, 3], [5, 4],
  [1, 2], [2, 3], [3, 4], [4, 1],
];

const BASE_OCTA_EDGES = OCTA_EDGES.map(([a, b]) => [
  OCTA_VERTICES[a],
  OCTA_VERTICES[b],
]);

const EDGES_PER_OCTAHEDRON = 12;
const IDENTITY_MATRIX = new THREE.Matrix4();

const OCTA_TEMPLATE_START = new Float32Array(EDGES_PER_OCTAHEDRON * 3);
const OCTA_TEMPLATE_END = new Float32Array(EDGES_PER_OCTAHEDRON * 3);
for (let i = 0; i < EDGES_PER_OCTAHEDRON; i++) {
  const [s, e] = BASE_OCTA_EDGES[i];
  OCTA_TEMPLATE_START[i * 3] = s[0];
  OCTA_TEMPLATE_START[i * 3 + 1] = s[1];
  OCTA_TEMPLATE_START[i * 3 + 2] = s[2];
  OCTA_TEMPLATE_END[i * 3] = e[0];
  OCTA_TEMPLATE_END[i * 3 + 1] = e[1];
  OCTA_TEMPLATE_END[i * 3 + 2] = e[2];
}

let _octaWasmPositions = new Float32Array(0);
let _octaWasmScales = new Float32Array(0);
let _octaWasmColors = new Float32Array(0);
let _octaWasmVisible = new Uint8Array(0);
const _octaWasmColor = new THREE.Color();

function _ensureOctaWasmBuffers(n) {
  if (_octaWasmPositions.length < n * 3) {
    const cap = Math.max(n, 64) * 2;
    _octaWasmPositions = new Float32Array(cap * 3);
    _octaWasmScales = new Float32Array(cap * 3);
    _octaWasmColors = new Float32Array(cap * 3);
    _octaWasmVisible = new Uint8Array(cap);
  }
}

const tempVec = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

export const octahedronTransformMap = new Map();

const GlobalOctahedronEdgesRenderer = React.memo(({
  octahedrons = [],
  defaultLineWidth = 1,
  cullingThreshold = FRUSTUM_CULLING_THRESHOLD
}) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastPositionsRef = useRef(new Map());
  const visibilityRef = useRef(new Map());

  const { camera, size } = useThree();

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  const filteredOctahedrons = useMemo(() => {
    if (!lodEnabled) return octahedrons;

    return octahedrons.filter(octa => {
      const isGroupingContainer = octa.merfolkData?.isContainer === true;
      if (isGroupingContainer) {
        return true;
      }

      const isParent = parentIds.has(octa.id);
      const isChild = childParentMap.has(octa.id);

      if (!isParent && !isChild) {
        return true;
      }

      const lodLevel = lodLevels.get(octa.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.FULL;
    });
  }, [octahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const totalEdges = filteredOctahedrons.length * EDGES_PER_OCTAHEDRON;

  const octahedronIds = useMemo(() => filteredOctahedrons.map(t => t.id).join(','), [filteredOctahedrons]);

  const capacityRef = useRef(0);
  if (totalEdges > capacityRef.current) {
    capacityRef.current = Math.max(128, 2 ** Math.ceil(Math.log2(Math.max(1, totalEdges))));
  }
  const capacity = capacityRef.current;

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

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.x = size.width;
      material.uniforms.resolution.value.y = size.height;
    }
  }, [material, size.width, size.height]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastPositionsRef.current.clear();
    visibilityRef.current.clear();
  }, [octahedronIds, filteredOctahedrons]);

  const isOctahedronVisible = useCallback((position, scale) => {
    const maxScale = Math.max(scale[0], scale[1], scale[2]);
    const radius = maxScale * OCTAHEDRON_SIZE * 2;
    tempSphere.center.set(position[0], position[1], position[2]);
    tempSphere.radius = radius;
    return tempFrustum.intersectsSphere(tempSphere);
  }, []);

  const updateOctahedronEdges = useCallback((octaIndex, position, scale, color, instanceStart, instanceEnd, instanceColor) => {
    const edgeStartIndex = octaIndex * EDGES_PER_OCTAHEDRON;

    tempMatrix.makeScale(scale[0], scale[1], scale[2]);
    tempMatrix.setPosition(position[0], position[1], position[2]);

    tempColor.set(color);

    for (let i = 0; i < EDGES_PER_OCTAHEDRON; i++) {
      const edgeIndex = edgeStartIndex + i;
      const [startPoint, endPoint] = BASE_OCTA_EDGES[i];

      tempVec.set(startPoint[0], startPoint[1], startPoint[2]);
      tempVec.applyMatrix4(tempMatrix);
      instanceStart.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);

      tempVec.set(endPoint[0], endPoint[1], endPoint[2]);
      tempVec.applyMatrix4(tempMatrix);
      instanceEnd.setXYZ(edgeIndex, tempVec.x, tempVec.y, tempVec.z);

      instanceColor.setXYZ(edgeIndex, tempColor.r, tempColor.g, tempColor.b);
    }
  }, []);

  const cullingFrameCounterRef = useRef(0);
  const CULLING_FRAME_INTERVAL = 3;

  useFrame(() => {
    if (!geometry || !meshRef.current) return;

    meshRef.current.count = totalEdges;

    if (filteredOctahedrons.length === 0) return;

    const hasActiveTransforms = octahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;
    const enableCulling = filteredOctahedrons.length > cullingThreshold;

    if (!hasActiveTransforms && !needsInitialSetup && !enableCulling) {
      return;
    }

    if (enableCulling && !hasActiveTransforms && !needsInitialSetup) {
      cullingFrameCounterRef.current++;
      if (cullingFrameCounterRef.current % CULLING_FRAME_INTERVAL !== 0) {
        return;
      }
    }

    const instanceStart = geometry.getAttribute('instanceStart');
    const instanceEnd = geometry.getAttribute('instanceEnd');
    const instanceColor = geometry.getAttribute('instanceColor');

    let needsUpdate = needsFullUpdateRef.current;

    if (enableCulling) {
      camera.updateMatrixWorld();
      tempProjectionMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      tempFrustum.setFromProjectionMatrix(tempProjectionMatrix);
    }

    const count = filteredOctahedrons.length;

    if (isWasmReady()) {
      _ensureOctaWasmBuffers(count);

      let anyChanged = needsInitialSetup;
      for (let i = 0; i < count; i++) {
        const octa = filteredOctahedrons[i];
        const octaId = octa.id?.toString();
        const realtimeTransform = octahedronTransformMap.get(octaId);
        const position = realtimeTransform?.position || octa.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || octa.scale || [1, 1, 1];
        const color = octa.color || '#000000';

        let isVisible = true;
        if (enableCulling) {
          isVisible = isOctahedronVisible(position, scale);
          const wasVisible = visibilityRef.current.get(octaId);
          if (wasVisible === undefined || wasVisible !== isVisible) {
            visibilityRef.current.set(octaId, isVisible);
            anyChanged = true;
          }
        }

        const lastKnown = lastPositionsRef.current.get(octaId);
        if (!lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color) {
          lastPositionsRef.current.set(octaId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          anyChanged = true;
        }

        const pi = i * 3;
        _octaWasmPositions[pi] = position[0]; _octaWasmPositions[pi + 1] = position[1]; _octaWasmPositions[pi + 2] = position[2];
        _octaWasmScales[pi] = scale[0]; _octaWasmScales[pi + 1] = scale[1]; _octaWasmScales[pi + 2] = scale[2];
        _octaWasmColor.set(color);
        _octaWasmColors[pi] = _octaWasmColor.r; _octaWasmColors[pi + 1] = _octaWasmColor.g; _octaWasmColors[pi + 2] = _octaWasmColor.b;
        _octaWasmVisible[i] = (enableCulling && !isVisible) ? 0 : 1;
      }

      if (anyChanged) {
        fillEdgeBuffers(
          _octaWasmPositions.subarray(0, count * 3),
          _octaWasmScales.subarray(0, count * 3),
          _octaWasmColors.subarray(0, count * 3),
          _octaWasmVisible.subarray(0, count),
          OCTA_TEMPLATE_START,
          OCTA_TEMPLATE_END,
          EDGES_PER_OCTAHEDRON,
        );

        const totalF = count * EDGES_PER_OCTAHEDRON * 3;
        instanceStart.array.set(getScratchStartView(totalF));
        instanceEnd.array.set(getScratchEndView(totalF));
        instanceColor.array.set(getScratchColorView(totalF));
        needsUpdate = true;
      }
    } else {
      filteredOctahedrons.forEach((octa, octaIndex) => {
        const octaId = octa.id?.toString();

        const realtimeTransform = octahedronTransformMap.get(octaId);
        const position = realtimeTransform?.position || octa.position || [0, 0, 0];
        const scale = realtimeTransform?.scale || octa.scale || [1, 1, 1];
        const color = octa.color || '#000000';

        let isVisible = true;
        let visibilityChanged = false;
        if (enableCulling) {
          isVisible = isOctahedronVisible(position, scale);
          const wasVisible = visibilityRef.current.get(octaId);
          if (wasVisible === undefined || wasVisible !== isVisible) {
            visibilityRef.current.set(octaId, isVisible);
            visibilityChanged = true;
          }
        }

        const lastKnown = lastPositionsRef.current.get(octaId);
        const positionChanged = !lastKnown ||
          lastKnown.px !== position[0] || lastKnown.py !== position[1] || lastKnown.pz !== position[2] ||
          lastKnown.sx !== scale[0] || lastKnown.sy !== scale[1] || lastKnown.sz !== scale[2] ||
          lastKnown.color !== color;

        if (positionChanged || visibilityChanged || needsFullUpdateRef.current) {
          if (enableCulling && !isVisible) {
            const edgeStartIndex = octaIndex * EDGES_PER_OCTAHEDRON;
            for (let i = 0; i < EDGES_PER_OCTAHEDRON; i++) {
              const edgeIndex = edgeStartIndex + i;
              instanceStart.setXYZ(edgeIndex, 0, 0, 0);
              instanceEnd.setXYZ(edgeIndex, 0, 0, 0);
              instanceColor.setXYZ(edgeIndex, 0, 0, 0);
            }
          } else {
            updateOctahedronEdges(octaIndex, position, scale, color, instanceStart, instanceEnd, instanceColor);
          }
          lastPositionsRef.current.set(octaId, {
            px: position[0], py: position[1], pz: position[2],
            sx: scale[0], sy: scale[1], sz: scale[2],
            color,
          });
          needsUpdate = true;
        }
      });
    }

    if (needsUpdate) {
      instanceStart.needsUpdate = true;
      instanceEnd.needsUpdate = true;
      instanceColor.needsUpdate = true;

      if (needsFullUpdateRef.current) {
        for (let i = 0; i < capacity; i++) {
          meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        needsFullUpdateRef.current = false;
      }
    }
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

GlobalOctahedronEdgesRenderer.displayName = 'GlobalOctahedronEdgesRenderer';

export default GlobalOctahedronEdgesRenderer;
