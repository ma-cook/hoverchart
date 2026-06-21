import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { octahedronTransformMap } from './GlobalOctahedronEdgesRenderer';

const _buildOctagonGeometry = () => {
  const S = 10;
  const segments = 8;
  const positions = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    positions[i * 3] = Math.cos(angle) * S;
    positions[i * 3 + 1] = Math.sin(angle) * S;
    positions[i * 3 + 2] = 0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const indices = [];
  for (let i = 1; i < segments - 1; i++) {
    indices.push(0, i, i + 1);
  }
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

const SHARED_OCTAGON_GEOMETRY = _buildOctagonGeometry();

const SHARED_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthWrite: true,
});

const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const ZERO_SCALE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

const GlobalOctahedronLowLODRenderer = React.memo(({ octahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToOctaIdRef = useRef([]);

  const lodLevels = useLODStore((s) => s.lodLevels);
  const childParentMap = useLODStore((s) => s.childParentMap);
  const parentIds = useLODStore((s) => s.parentIds);
  const lodEnabled = useLODStore((s) => s.lodEnabled);
  const _lodVersion = useLODStore((s) => s._lodVersion);

  const lowOctahedrons = useMemo(() => {
    if (!lodEnabled) return [];
    return octahedrons.filter(octa => {
      if (octa.merfolkData?.isContainer === true) return false;
      const lodLevel = lodLevels.get(octa.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.LOW;
    });
  }, [octahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = lowOctahedrons.length;

  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  const octaIds = useMemo(() => lowOctahedrons.map(t => t.id).join(','), [lowOctahedrons]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [octaIds]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = octahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < lowOctahedrons.length; i++) {
      const octa = lowOctahedrons[i];
      const octaId = octa.id?.toString();
      idMap[i] = octaId;

      const realtimeTransform = octahedronTransformMap.get(octaId);
      const position = realtimeTransform?.position || octa.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || octa.scale || [1, 1, 1];

      const color = octa.color || '#808080';

      const lastKnown = lastDataRef.current.get(octaId);
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

        lastDataRef.current.set(octaId, {
          px: position[0], py: position[1], pz: position[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToOctaIdRef.current = idMap;

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
      args={[SHARED_OCTAGON_GEOMETRY, SHARED_MATERIAL, capacity]}
      frustumCulled={false}
      onClick={handleClick}
    />
  );
});

GlobalOctahedronLowLODRenderer.displayName = 'GlobalOctahedronLowLODRenderer';

export default GlobalOctahedronLowLODRenderer;
