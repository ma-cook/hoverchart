import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useObjectsStore from '../stores/objectsStore';

// Red used for "LLM is editing this file" — matches the app's CONTROL_FLOW red.
const HIGHLIGHT_COLOR = '#F44336';
// Base object geometry is a cube of half-size 5 (see CUBE_SIZE in Cube.jsx).
const BASE_HALF = 5;

/**
 * Overlays a pulsing red highlight (red edges + translucent red face shell) on
 * every scene object whose source file the LLM is currently editing. Rendered
 * on top of the existing batched/per-object rendering so no global renderer
 * needs to know about this state.
 *
 * Each active object owns its geometry/materials (memoized) and shares a single
 * pulse clock via useFrame, so N highlighted objects cost one uniform write per
 * frame per material.
 */

function HighlightBox({ obj }) {
  const scale = obj.scale || [1, 1, 1];
  const pos = obj.position || [0, 0, 0];
  const sx = scale[0] || 1;
  const sy = scale[1] || 1;
  const sz = scale[2] || 1;

  // Slightly inflate so the highlight sits just outside the object surface.
  const dims = useMemo(() => {
    const inflate = 1.03;
    return [
      BASE_HALF * 2 * sx * inflate,
      BASE_HALF * 2 * sy * inflate,
      BASE_HALF * 2 * sz * inflate,
    ];
  }, [sx, sy, sz]);

  const edgeWidth = dims[0];
  const edgeHeight = dims[1];
  const edgeDepth = dims[2];
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(edgeWidth, edgeHeight, edgeDepth)),
    [edgeWidth, edgeHeight, edgeDepth]
  );
  // Dispose the derived geometry when it is replaced/unmounted.
  React.useEffect(() => () => edgesGeometry.dispose(), [edgesGeometry]);

  const shellRef = useRef();
  const lineRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const wave = 0.5 + 0.5 * Math.sin(t * 3);
    if (shellRef.current) shellRef.current.opacity = 0.12 + 0.28 * wave;
    if (lineRef.current) lineRef.current.opacity = 0.55 + 0.45 * wave;
  });

  return (
    <group position={pos}>
      {/* Translucent pulsing red face shell */}
      <mesh renderOrder={30}>
        <boxGeometry args={dims} />
        <meshBasicMaterial
          ref={shellRef}
          color={HIGHLIGHT_COLOR}
          transparent
          opacity={0.2}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Red edges, drawn on top so they stay visible through geometry */}
      <lineSegments geometry={edgesGeometry} renderOrder={31}>
        <lineBasicMaterial
          ref={lineRef}
          color={HIGHLIGHT_COLOR}
          transparent
          opacity={0.9}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function LlmEditHighlight({ llmActiveObjectIds }) {
  const objects = useObjectsStore((s) => s.objects);

  // Resolve the active object data once per change. Objects mutate in place, so
  // reading position/scale happens live in HighlightBox.
  const activeObjects = useMemo(() => {
    if (!llmActiveObjectIds || llmActiveObjectIds.size === 0) return [];
    const out = [];
    for (const obj of objects || []) {
      if (llmActiveObjectIds.has(obj.id)) out.push(obj);
    }
    return out;
  }, [objects, llmActiveObjectIds]);

  if (activeObjects.length === 0) return null;

  return (
    <group>
      {activeObjects.map((obj) => (
        <HighlightBox key={obj.id} obj={obj} />
      ))}
    </group>
  );
}

export default React.memo(LlmEditHighlight);
