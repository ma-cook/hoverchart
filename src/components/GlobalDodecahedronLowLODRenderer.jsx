import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { dodecahedronTransformMap } from './GlobalDodecahedronEdgesRenderer';

// 2D octagon geometry to represent dodecahedrons at LOW LOD
// Larger than full-detail to remain visible at extreme distance
const _buildOctagonGeometry = () => {
  const shape = new THREE.Shape();
  const r = 16;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
};

const SHARED_OCTAGON_GEOMETRY = _buildOctagonGeometry();

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

const GlobalDodecahedronLowLODRenderer = React.memo(({ dodecahedrons = [], onInstanceClick }) => {
  const meshRef = useRef();
  const needsFullUpdateRef = useRef(true);
  const lastDataRef = useRef(new Map());
  const indexToDodecaIdRef = useRef([]);

  const { lodLevels, childParentMap, parentIds, lodEnabled, _lodVersion } = useLODStore();

  // Filter to LOW-LOD dodecahedrons (excludes grouping containers)
  const lowDodecahedrons = useMemo(() => {
    if (!lodEnabled) return [];
    return dodecahedrons.filter(dodeca => {
      if (dodeca.merfolkData?.isContainer === true) return false;
      const isParent = parentIds.has(dodeca.id);
      const isChild = childParentMap.has(dodeca.id);
      if (!isParent && !isChild) return false;
      const lodLevel = lodLevels.get(dodeca.id) ?? LOD_LEVELS.FULL;
      return lodLevel === LOD_LEVELS.LOW;
    });
  }, [dodecahedrons, lodLevels, _lodVersion, childParentMap, parentIds, lodEnabled]);

  const count = lowDodecahedrons.length;

  // Grow-only capacity (power-of-2)
  const capacityRef = useRef(0);
  if (count > capacityRef.current) {
    capacityRef.current = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, count))));
  }
  const capacity = capacityRef.current;

  // Track structural changes
  const dodecaIds = useMemo(() => lowDodecahedrons.map(d => d.id).join(','), [lowDodecahedrons]);

  useEffect(() => {
    needsFullUpdateRef.current = true;
    lastDataRef.current.clear();
  }, [dodecaIds]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.count = count;
    if (count === 0) return;

    const hasActiveTransforms = dodecahedronTransformMap.size > 0;
    const needsInitialSetup = needsFullUpdateRef.current;

    if (!hasActiveTransforms && !needsInitialSetup) return;

    let needsUpdate = needsInitialSetup;
    const idMap = [];

    for (let i = 0; i < lowDodecahedrons.length; i++) {
      const dodeca = lowDodecahedrons[i];
      const dodecaId = dodeca.id?.toString();
      idMap[i] = dodecaId;

      const realtimeTransform = dodecahedronTransformMap.get(dodecaId);
      const position = realtimeTransform?.position || dodeca.position || [0, 0, 0];
      const scale = realtimeTransform?.scale || dodeca.scale || [1, 1, 1];

      const color = dodeca.color || '#888888';

      const lastKnown = lastDataRef.current.get(dodecaId);
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

        lastDataRef.current.set(dodecaId, {
          px: position[0], py: position[1], pz: position[2],
          color,
        });

        needsUpdate = true;
      }
    }

    indexToDodecaIdRef.current = idMap;

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

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId == null) return;
      const dodecaId = indexToDodecaIdRef.current[instanceId];
      if (dodecaId && onInstanceClick) {
        onInstanceClick(dodecaId);
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

GlobalDodecahedronLowLODRenderer.displayName = 'GlobalDodecahedronLowLODRenderer';

export default GlobalDodecahedronLowLODRenderer;
