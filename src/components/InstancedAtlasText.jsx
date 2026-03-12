import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { isFrameBudgetExhausted } from '../utils/renderWorkScheduler';
import { getGlobalTextAtlas, TextAtlas } from '../utils/textAtlas';
import useTextAtlasStore from '../stores/textAtlasStore';

// =============================================================================
// Reusable THREE objects — avoids GC pressure in the per-frame loop
// =============================================================================
const _tempPosition = new THREE.Vector3();
const _tempQuaternion = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();
const _tempMatrix = new THREE.Matrix4();

// =============================================================================
// Custom shaders for instanced atlas text
// =============================================================================
const VERTEX_SHADER = /* glsl */ `
  // Per-instance UV rectangle in the atlas: (u, v, uWidth, vHeight)
  attribute vec4 instanceUV;
  varying vec2 vUv;

  void main() {
    // Map base PlaneGeometry UVs [0,1]² to the atlas sub-rectangle.
    // PlaneGeometry vertex UVs:
    //   top-left (0,1)  top-right (1,1)
    //   bot-left (0,0)  bot-right (1,0)
    //
    // Atlas v = entryY / canvasHeight  (v=0 is canvas top).
    // THREE.CanvasTexture flipY=true  → texture V=1 is canvas top.
    //
    // Mapping: atlasU = u + uv.x * uWidth
    //          atlasV = (1-v) - (1-uv.y) * vHeight
    vUv = vec2(
      instanceUV.x + uv.x * instanceUV.z,
      (1.0 - instanceUV.y) - (1.0 - uv.y) * instanceUV.w
    );

    // Standard instanced transform
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(map, vUv);
    if (texColor.a < 0.01) discard;
    gl_FragColor = texColor;
  }
`;

// =============================================================================
// InstancedAtlasText
// =============================================================================

/**
 * Renders many text labels from a shared texture atlas using InstancedMesh.
 * Groups labels by atlas page texture — typically 1–3 InstancedMesh draw calls
 * instead of one Mesh per label (the previous approach).
 *
 * @param {Object}   props
 * @param {Array}    props.labels      - Array of { id, text, position:[x,y,z], textStyle }
 * @param {number}   props.maxDistance  - Max camera distance for visibility (default 500)
 * @param {Function} props.onLabelClick - (event, labelId) click handler
 * @param {number}   props.renderOrder - Three.js render order (default 20)
 * @param {number}   props.scale       - Base scale multiplier (default 0.45)
 */
const InstancedAtlasText = ({
  labels,
  maxDistance = 500,
  onLabelClick,
  renderOrder = 20,
  scale = 0.45,
}) => {
  const atlas = useMemo(() => getGlobalTextAtlas(), []);
  const { gl } = useThree();

  // Subscribe to atlas version so this component re-renders when the worker
  // delivers rendered text bitmaps.
  const atlasVersion = useTextAtlasStore((s) => s.atlasVersion);

  // Detect GPU max texture size once
  useMemo(() => {
    if (!TextAtlas._gpuLimitDetected && gl) {
      const glCtx = gl.getContext();
      if (glCtx) {
        TextAtlas.setMaxGPUTextureSize(
          glCtx.getParameter(glCtx.MAX_TEXTURE_SIZE)
        );
      }
    }
  }, [gl]);

  // -----------------------------------------------------------------------
  // Phase 1: Add every label to the atlas (may trigger page resizes).
  // Phase 2: Read post-resize UVs and group items by atlas page texture.
  // -----------------------------------------------------------------------
  const pageGroups = useMemo(() => {
    if (!labels || labels.length === 0) return [];

    // Phase 1 — add all texts (triggers any needed resizes)
    const atlasEntries = [];
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (!label.text || !label.text.trim()) {
        atlasEntries.push(null);
        continue;
      }
      const fontSizeRaw = label.textStyle?.fontSize || 1.5;
      const entry = atlas.addText(label.text, {
        fontSize: fontSizeRaw * 10,
        color: label.textStyle?.color || 'black',
        underline: label.textStyle?.underline || false,
      });
      atlasEntries.push(entry);
    }

    // Phase 2 — build groups using post-resize UVs
    const groupMap = new Map(); // textureId → { texture, items[] }

    for (let i = 0; i < labels.length; i++) {
      const entry = atlasEntries[i];
      if (!entry) continue;

      const label = labels[i];
      const texture = entry.texture || atlas.getTexture();
      const texId = texture.id;

      if (!groupMap.has(texId)) {
        groupMap.set(texId, { texture, items: [] });
      }

      const fontSizeRaw = label.textStyle?.fontSize || 1.5;
      const aspectRatio = entry.width / entry.height;
      const baseHeight =
        (fontSizeRaw < 10 ? fontSizeRaw : fontSizeRaw / 10) * 3;
      const baseWidth = baseHeight * aspectRatio;

      groupMap.get(texId).items.push({
        label,
        // Snapshot UVs — may be refreshed later if the atlas resizes again
        uvs: { ...entry.uvs },
        displayWidth: baseWidth * scale,
        displayHeight: baseHeight * scale,
        // Store the key so we can re-read UVs after atlas resize
        atlasKey: atlas._getKey(label.text, {
          fontSize: fontSizeRaw * 10,
          color: label.textStyle?.color || 'black',
          underline: label.textStyle?.underline || false,
        }),
      });
    }

    return Array.from(groupMap.values());
  }, [labels, atlas, scale, atlasVersion]);

  // Kick off one batched texture upload after all texts are added
  useEffect(() => {
    if (pageGroups.length > 0) {
      const frameId = requestAnimationFrame(() => atlas.updateTexture());
      return () => cancelAnimationFrame(frameId);
    }
  }, [atlas, pageGroups]);

  if (pageGroups.length === 0) return null;

  return (
    <>
      {pageGroups.map((group) => (
        <PageInstancedMesh
          key={`instanced-page-${group.texture.id}`}
          atlas={atlas}
          texture={group.texture}
          items={group.items}
          maxDistance={maxDistance}
          onLabelClick={onLabelClick}
          renderOrder={renderOrder}
        />
      ))}
    </>
  );
};

// =============================================================================
// PageInstancedMesh — one InstancedMesh per atlas page
// =============================================================================

/**
 * Renders all labels that live on one atlas page as a single InstancedMesh.
 * Handles billboard orientation, distance-based visibility, atlas-resize UV
 * fixup, and per-instance click events.
 */
const PageInstancedMesh = React.memo(
  ({ atlas, texture, items, maxDistance, onLabelClick, renderOrder }) => {
    const meshRef = useRef();
    const maxDistanceSq = maxDistance * maxDistance;
    const lastUpdateRef = useRef(0);
    const atlasVersionRef = useRef(atlas.version);

    // ----- geometry (unit quad + per-instance UV attribute) -----
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(1, 1);

      const uvArr = new Float32Array(items.length * 4);
      for (let i = 0; i < items.length; i++) {
        const { uvs } = items[i];
        uvArr[i * 4 + 0] = uvs.u;
        uvArr[i * 4 + 1] = uvs.v;
        uvArr[i * 4 + 2] = uvs.uWidth;
        uvArr[i * 4 + 3] = uvs.vHeight;
      }
      geo.setAttribute(
        'instanceUV',
        new THREE.InstancedBufferAttribute(uvArr, 4)
      );

      return geo;
    }, [items]);

    // ----- material (custom shader) -----
    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          uniforms: {
            map: { value: texture },
          },
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
        }),
      [texture]
    );

    // ----- initialise instance matrices on mount -----
    useEffect(() => {
      if (!meshRef.current) return;

      for (let i = 0; i < items.length; i++) {
        const { label, displayWidth, displayHeight } = items[i];
        const pos = label.position;

        _tempPosition.set(pos[0], pos[1], pos[2]);
        _tempQuaternion.identity();
        _tempScale.set(displayWidth, displayHeight, 1);
        _tempMatrix.compose(_tempPosition, _tempQuaternion, _tempScale);

        meshRef.current.setMatrixAt(i, _tempMatrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    }, [items]);

    // ----- per-frame: billboard, distance culling, UV fixup -----
    useFrame(({ camera }) => {
      if (!meshRef.current) return;
      // FREEZE FIX: Skip instanced billboard updates when main thread is lagging
      if (isFrameBudgetExhausted()) return;

      const now = Date.now();
      // Throttle updates to ~10 Hz — billboard rotation and distance-based
      // toggling don't need 60 fps updates for static labels.
      if (now - lastUpdateRef.current < 100) return;
      lastUpdateRef.current = now;

      // ----- Atlas resize UV fixup -----
      const currentVersion = atlas.version;
      if (currentVersion !== atlasVersionRef.current) {
        atlasVersionRef.current = currentVersion;
        const uvAttr = meshRef.current.geometry.getAttribute('instanceUV');
        for (let i = 0; i < items.length; i++) {
          const entry = atlas.entries.get(items[i].atlasKey);
          if (entry) {
            uvAttr.setXYZW(
              i,
              entry.uvs.u,
              entry.uvs.v,
              entry.uvs.uWidth,
              entry.uvs.vHeight
            );
          }
        }
        uvAttr.needsUpdate = true;
        // Also make sure the texture uniform is current
        material.uniforms.map.value = texture;
        material.uniformsNeedUpdate = true;
      }

      // ----- Billboard + distance hide -----
      for (let i = 0; i < items.length; i++) {
        const { label, displayWidth, displayHeight } = items[i];
        const pos = label.position;

        // Squared-distance visibility check (no sqrt)
        const dx = camera.position.x - pos[0];
        const dy = camera.position.y - pos[1];
        const dz = camera.position.z - pos[2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > maxDistanceSq) {
          // Hide instance by collapsing to zero scale
          _tempPosition.set(0, 0, 0);
          _tempScale.set(0, 0, 0);
          _tempQuaternion.identity();
        } else {
          _tempPosition.set(pos[0], pos[1], pos[2]);
          _tempQuaternion.copy(camera.quaternion);
          _tempScale.set(displayWidth, displayHeight, 1);
        }

        _tempMatrix.compose(_tempPosition, _tempQuaternion, _tempScale);
        meshRef.current.setMatrixAt(i, _tempMatrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    // ----- click handler (uses Three.js instanceId) -----
    const handleClick = useCallback(
      (e) => {
        if (e.instanceId !== undefined && onLabelClick) {
          const item = items[e.instanceId];
          if (item) {
            e.stopPropagation();
            onLabelClick(e, item.label.id);
          }
        }
      },
      [items, onLabelClick]
    );

    // ----- cleanup -----
    useEffect(() => {
      return () => {
        geometry.dispose();
        material.dispose();
      };
    }, [geometry, material]);

    if (items.length === 0) return null;

    return (
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, items.length]}
        renderOrder={renderOrder}
        onClick={handleClick}
        frustumCulled={false}
      />
    );
  }
);

PageInstancedMesh.displayName = 'PageInstancedMesh';

export default React.memo(InstancedAtlasText);
