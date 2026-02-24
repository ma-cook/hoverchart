import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getGlobalTextAtlas, TextAtlas } from '../utils/textAtlas';
import { isFrameBudgetExhausted } from '../utils/renderWorkScheduler';

// =============================================================================
// PERFORMANCE OPTIMIZATION: Reusable THREE objects to avoid GC pressure
// These are created once and reused across all AtlasTextSprite instances
// =============================================================================
const tempVec3A = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();
const tempVec3C = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempFlipMatrix = new THREE.Matrix4().makeRotationY(Math.PI);

// =============================================================================
// PERFORMANCE OPTIMIZATION: Shared material cache
// Instead of creating a new material per instance, share materials with same settings
// This dramatically reduces draw calls when many text labels have the same style
// =============================================================================
const materialCache = new Map();

/**
 * Get a shared material keyed by (texture, side, depthWrite, depthTest, opacity).
 * Multi-page atlas: each page has its own texture, so materials must be per-texture.
 */
function getSharedMaterial(texture, side, depthWrite, depthTest, opacity) {
  const texId = texture.id; // THREE.js unique id per texture object
  const key = `${texId}-${side}-${depthWrite}-${depthTest}-${opacity}`;
  
  if (!materialCache.has(key)) {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: side,
      depthWrite: depthWrite,
      depthTest: depthTest,
      opacity: opacity,
    });
    materialCache.set(key, mat);
  }
  
  return materialCache.get(key);
}

// Throttle intervals by text type (ms) - less critical text updates less often
const THROTTLE_FACE_TEXT = 66;      // 15fps - face visibility doesn't need high refresh
const THROTTLE_HEADER_TEXT = 50;    // 20fps - headers follow objects
const THROTTLE_CONNECTION_TEXT = 33; // 30fps - connection text needs smooth movement
const THROTTLE_STANDARD = 50;       // 20fps - standard billboard text

/**
 * Optimized text sprite using a shared texture atlas
 * Reduces texture binds and improves performance for diagrams with many text labels
 *
 * Performance benefits:
 * - Single texture atlas shared across all text instances
 * - Reduced texture binding operations (major GPU bottleneck)
 * - Lower memory usage compared to individual textures per text
 * - Efficient UV mapping instead of separate materials
 * - Shared material cache reduces draw calls
 */
const AtlasTextSprite = ({
  text,
  position = [0, 0, 0],
  style = {},
  onClick,
  onPointerOver,
  onPointerOut,
  billboard = true,
  visible = true,
  renderOrder = 20,
  scale = 1,
  // Connection line support
  lineStyle,
  pathPoints,
  // Header text support
  followTarget, // Ref to object mesh to follow
  // Face text support
  normal, // Face normal for orientation and visibility
  side = THREE.DoubleSide, // Material side
  // PERFORMANCE: Skip continuous billboard updates for static text
  skipBillboardUpdates = false,
}) => {
  const meshRef = useRef();
  const lastUpdateTimeRef = useRef(0);

  // Get shared atlas instance
  const atlas = useMemo(() => getGlobalTextAtlas(), []);

  // PERFORMANCE: Detect the GPU's max texture size on first render
  // so the atlas never grows beyond what the hardware supports.
  // R3F's `gl` is THREE.WebGLRenderer — use getContext() for the raw WebGL context.
  const { gl } = useThree();
  useMemo(() => {
    if (!TextAtlas._gpuLimitDetected && gl) {
      const glCtx = gl.getContext();
      if (glCtx) {
        const maxSize = glCtx.getParameter(glCtx.MAX_TEXTURE_SIZE);
        TextAtlas.setMaxGPUTextureSize(maxSize);
      }
    }
  }, [gl]);

  // Calculate position based on line style and path points (for connection lines)
  const calculatedPosition = useMemo(() => {
    // If no lineStyle or pathPoints, use provided position
    if (!lineStyle || !pathPoints || pathPoints.length < 3) {
      return position;
    }

    // For curved lines with path points, calculate midpoint
    if (lineStyle === 'curved' && pathPoints && pathPoints.length > 2) {
      const midIdx = Math.floor(pathPoints.length / 2);
      const midPoint = pathPoints[midIdx];
      const pos = Array.isArray(midPoint)
        ? midPoint
        : [midPoint.x, midPoint.y, midPoint.z];

      // Add offset for text visibility
      const offset = 5;
      return [pos[0], pos[1] + offset, pos[2]];
    }

    // For straight lines, calculate midpoint between start and end
    if (lineStyle === 'straight' && pathPoints && pathPoints.length >= 2) {
      const start = pathPoints[0];
      const end = pathPoints[pathPoints.length - 1];
      const startPos = Array.isArray(start)
        ? start
        : [start.x, start.y, start.z];
      const endPos = Array.isArray(end) ? end : [end.x, end.y, end.z];
      const midX = (startPos[0] + endPos[0]) / 2;
      const midY = (startPos[1] + endPos[1]) / 2;
      const midZ = (startPos[2] + endPos[2]) / 2;
      return [midX, midY + 2, midZ];
    }

    return position;
  }, [position, lineStyle, pathPoints]);

  // PERFORMANCE: Lazy-initialize smoothedPositionRef to avoid creating Vector3 until actually needed
  const smoothedPositionRef = useRef(null);

  // Track atlas version at geometry creation to detect resizes
  const atlasVersionRef = useRef(0);
  const atlasEntryKeyRef = useRef(null);

  // Create geometry and material using the atlas
  const { geometry, material } = useMemo(() => {
    if (!text || text.trim() === '') {
      atlasEntryKeyRef.current = null;
      return { geometry: null, material: null };
    }

    // Convert fontSize to pixels if it's in world units (< 10)
    // Face text uses world units like 0.5, header text might use pixels like 16
    // VALIDATION: Ensure fontSize is always numeric, never string values like 'medium'
    let fontSizeValue = style.fontSize || 1.5;

    // Convert string fontSize to numeric (shouldn't happen, but safety check)
    if (typeof fontSizeValue === 'string') {
      console.warn('[AtlasTextSprite] Non-numeric fontSize detected:', {
        fontSize: fontSizeValue,
        text: text,
        style: style,
      });
      // Parse numeric value or use default
      const parsed = parseFloat(fontSizeValue);
      fontSizeValue = isNaN(parsed) ? 1.5 : parsed;
    }

    // Ensure fontSize is a valid number
    if (
      typeof fontSizeValue !== 'number' ||
      isNaN(fontSizeValue) ||
      fontSizeValue <= 0
    ) {
      console.warn('[AtlasTextSprite] Invalid fontSize, using default 1.5:', {
        fontSize: fontSizeValue,
        text: text,
      });
      fontSizeValue = 1.5;
    }

    const fontSizeInPixels =
      fontSizeValue < 10 ? fontSizeValue * 32 : fontSizeValue;

    // Add text to atlas and get UV coordinates
    const entry = atlas.addText(text, {
      fontSize: fontSizeInPixels,
      color: style.color || '#000000',
      fontFamily: style.fontFamily || 'Arial, sans-serif',
      bold: style.bold || false,
      italic: style.italic || false,
      underline: style.underline || false,
    });

    if (!entry) {
      console.warn('Failed to add text to atlas:', text);
      atlasEntryKeyRef.current = null;
      return { geometry: null, material: null };
    }

    // Store atlas version and entry key for post-resize UV fixup
    atlasVersionRef.current = atlas.version;
    atlasEntryKeyRef.current = atlas._getKey(text, {
      fontSize: fontSizeInPixels,
      color: style.color || '#000000',
      fontFamily: style.fontFamily || 'Arial, sans-serif',
      bold: style.bold || false,
      italic: style.italic || false,
      underline: style.underline || false,
    });

    // NOTE: Don't call atlas.updateTexture() here - it's batched in the effect below

    // Create plane geometry sized to match the text
    const aspectRatio = entry.width / entry.height;
    // Use original fontSize for world-unit sizing, multiply by 3 for base size
    const baseHeight =
      (fontSizeValue < 10 ? fontSizeValue : fontSizeValue / 10) * 3;
    const baseWidth = baseHeight * aspectRatio;

    const geo = new THREE.PlaneGeometry(baseWidth, baseHeight);

    // Update UVs to match atlas coordinates
    const uvAttr = geo.attributes.uv;
    const { u, v, uWidth, vHeight } = entry.uvs;

    // Set UV coordinates for each vertex
    // Three.js PlaneGeometry vertices order: bottom-left, bottom-right, top-left, top-right
    // Canvas Y goes down, Three.js texture Y goes up, so we need to flip V
    uvAttr.setXY(0, u, 1 - v); // Bottom-left (flip V)
    uvAttr.setXY(1, u + uWidth, 1 - v); // Bottom-right (flip V)
    uvAttr.setXY(2, u, 1 - (v + vHeight)); // Top-left (flip V)
    uvAttr.setXY(3, u + uWidth, 1 - (v + vHeight)); // Top-right (flip V)
    uvAttr.needsUpdate = true;

    // PERFORMANCE: Use shared material from cache instead of creating new one per instance
    // Multi-page atlas: entry.texture points to the correct page's texture
    const entryTexture = entry.texture || atlas.getTexture();
    const depthWriteValue = style.depthWrite !== undefined ? style.depthWrite : false;
    const depthTestValue = style.depthTest !== undefined ? style.depthTest : true;
    const opacityValue = style.opacity !== undefined ? style.opacity : 1;
    const mat = getSharedMaterial(entryTexture, side, depthWriteValue, depthTestValue, opacityValue);

    return {
      geometry: geo,
      material: mat,
    };
  }, [
    text,
    style.fontSize,
    style.color,
    style.fontFamily,
    style.bold,
    style.italic,
    style.underline,
    style.depthTest,
    style.depthWrite,
    style.opacity,
    side,
    atlas,
  ]);

  // Update atlas texture once when geometry is created
  // This batches all text additions and updates the texture once
  // Also fixes UVs if the atlas auto-expanded after this geometry was created
  useEffect(() => {
    if (geometry) {
      const frameId = requestAnimationFrame(() => {
        atlas.updateTexture();

        // If the atlas resized after our geometry was created, re-apply corrected UVs
        if (atlasVersionRef.current !== atlas.version && atlasEntryKeyRef.current) {
          const entry = atlas.entries.get(atlasEntryKeyRef.current);
          if (entry && geometry.attributes.uv) {
            const uvAttr = geometry.attributes.uv;
            const { u, v, uWidth, vHeight } = entry.uvs;
            uvAttr.setXY(0, u, 1 - v);
            uvAttr.setXY(1, u + uWidth, 1 - v);
            uvAttr.setXY(2, u, 1 - (v + vHeight));
            uvAttr.setXY(3, u + uWidth, 1 - (v + vHeight));
            uvAttr.needsUpdate = true;
            atlasVersionRef.current = atlas.version;
          }
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [atlas, geometry]);

  // BUGFIX: Continuously watch for atlas version changes (resizes) that happen
  // AFTER this component's initial mount. During progressive loading, later
  // batches of text may trigger atlas resize, invalidating UVs for all
  // previously-mounted sprites. Without this, UVs stay stale until the
  // component remounts (e.g. zoom out/in triggers LOD change).
  useFrame(() => {
    if (!geometry || !atlasEntryKeyRef.current) return;
    if (atlasVersionRef.current === atlas.version) return;

    const entry = atlas.entries.get(atlasEntryKeyRef.current);
    if (entry && geometry.attributes.uv) {
      const uvAttr = geometry.attributes.uv;
      const { u, v, uWidth, vHeight } = entry.uvs;
      uvAttr.setXY(0, u, 1 - v);
      uvAttr.setXY(1, u + uWidth, 1 - v);
      uvAttr.setXY(2, u, 1 - (v + vHeight));
      uvAttr.setXY(3, u + uWidth, 1 - (v + vHeight));
      uvAttr.needsUpdate = true;
      atlasVersionRef.current = atlas.version;
      // Also ensure texture is uploaded
      atlas.updateTexture();
    }
  });

  // Cleanup geometry on unmount
  // NOTE: Material is shared via cache, so we don't dispose it here
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
      // Don't dispose shared material - it's managed by the cache
    };
  }, [geometry]);

  // PERFORMANCE: For static billboard text, we render StaticBillboardMesh which has NO useFrame
  // For dynamic text (headers, face text), we render DynamicBillboardMesh which has useFrame
  // This completely eliminates the per-frame callback overhead for 100+ connection labels
  
  if (!geometry || !material) {
    return null;
  }

  // Static text - no useFrame overhead at all
  if (skipBillboardUpdates) {
    return (
      <StaticBillboardMesh
        meshRef={meshRef}
        position={position}
        geometry={geometry}
        material={material}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        visible={visible}
        renderOrder={renderOrder}
        scale={scale}
        billboard={billboard}
      />
    );
  }

  // Dynamic text - needs useFrame for continuous updates
  return (
    <DynamicBillboardMesh
      meshRef={meshRef}
      position={position}
      calculatedPosition={calculatedPosition}
      smoothedPositionRef={smoothedPositionRef}
      geometry={geometry}
      material={material}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      visible={visible}
      renderOrder={renderOrder}
      scale={scale}
      billboard={billboard}
      style={style}
      normal={normal}
      followTarget={followTarget}
      lineStyle={lineStyle}
      pathPoints={pathPoints}
      lastUpdateTimeRef={lastUpdateTimeRef}
    />
  );
};

/**
 * Static billboard mesh - NO useFrame, sets orientation once on mount
 * Used for connection text labels that don't need continuous updates
 */
const StaticBillboardMesh = React.memo(({
  meshRef,
  position,
  geometry,
  material,
  onClick,
  onPointerOver,
  onPointerOut,
  visible,
  renderOrder,
  scale,
  billboard,
}) => {
  const { camera } = useThree();
  const initializedRef = useRef(false);
  
  // Set billboard orientation once on mount
  useEffect(() => {
    if (meshRef.current && billboard && !initializedRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
      initializedRef.current = true;
    }
  }, [billboard, camera, meshRef]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      material={material}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      visible={visible}
      renderOrder={renderOrder}
      scale={[scale, scale, scale]}
      frustumCulled={false}
    />
  );
});

StaticBillboardMesh.displayName = 'StaticBillboardMesh';

/**
 * Dynamic billboard mesh - HAS useFrame for continuous position/orientation updates
 * Used for headers, face text, and other text that needs to follow objects or billboard
 */
const DynamicBillboardMesh = React.memo(({
  meshRef,
  position,
  calculatedPosition,
  smoothedPositionRef,
  geometry,
  material,
  onClick,
  onPointerOver,
  onPointerOut,
  visible,
  renderOrder,
  scale,
  billboard,
  style,
  normal,
  followTarget,
  lineStyle,
  pathPoints,
  lastUpdateTimeRef,
}) => {
  // Billboard and positioning effect using useFrame
  // PERFORMANCE OPTIMIZED: Uses reusable THREE objects and smart throttling
  useFrame(({ camera }) => {
    if (!meshRef.current) return;
    // FREEZE FIX: Skip billboard updates when main thread is lagging
    if (isFrameBudgetExhausted()) return;

    // Determine throttle interval based on text type
    const now = Date.now();
    let throttleInterval = THROTTLE_STANDARD;
    
    if (style.isFaceText) {
      throttleInterval = THROTTLE_FACE_TEXT;
    } else if (style.isHeaderText || followTarget?.current) {
      throttleInterval = THROTTLE_HEADER_TEXT;
    } else if (lineStyle && pathPoints) {
      throttleInterval = THROTTLE_CONNECTION_TEXT;
    }
    
    if (now - lastUpdateTimeRef.current < throttleInterval) return;
    lastUpdateTimeRef.current = now;

    // === FACE TEXT HANDLING ===
    // Face text uses normal-based billboarding and visibility
    if (style.isFaceText && normal) {
      // Reuse tempVec3A for world normal
      tempVec3A.set(normal[0], normal[1], normal[2]).normalize();
      
      // Reuse tempVec3B for text world position
      meshRef.current.getWorldPosition(tempVec3B);
      
      // Reuse tempVec3C for view direction
      tempVec3C.copy(tempVec3B).sub(camera.position).normalize();

      // Calculate dot product between normal and view direction
      const dotProduct = tempVec3A.dot(tempVec3C);

      // Set visibility based on viewing angle
      if (dotProduct < 0) {
        // We're looking at the face from the front
        meshRef.current.visible = true;

        // Build rotation matrix for text orientation using reusable matrix
        tempMatrix.lookAt(
          tempVec3C.set(0, 0, 0), // origin
          tempVec3A,              // look at normal direction
          tempVec3B.set(0, 1, 0)  // up vector
        );

        // Flip text 180° to face viewer using pre-computed flip matrix
        tempMatrix.multiply(tempFlipMatrix);

        meshRef.current.setRotationFromMatrix(tempMatrix);
      } else {
        // We're looking at the face from behind
        meshRef.current.visible = false;
      }
      return; // Face text handling complete
    }

    // Non-face text is always visible
    meshRef.current.visible = visible;

    // === HEADER TEXT HANDLING ===
    // Header text follows a target object and scales with distance
    if (followTarget?.current) {
      const targetPos = followTarget.current.position;
      const targetScale = followTarget.current.scale;

      if (style.isDodecahedronHeader) {
        // Dodecahedron headers use calculated position with distance-based scaling
        const posX = Array.isArray(position) ? position[0] : (position?.x || 0);
        const posY = Array.isArray(position) ? position[1] : (position?.y || 0);
        const posZ = Array.isArray(position) ? position[2] : (position?.z || 0);
        
        // Reuse tempVec3A for distance calculation
        tempVec3A.set(posX, posY, posZ);
        const distanceToCamera = camera.position.distanceTo(tempVec3A);
        const baseScale = Math.min(Math.max(distanceToCamera * 0.01, 0.5), 1.5);

        meshRef.current.position.set(posX, posY, posZ);
        meshRef.current.scale.setScalar(baseScale * scale);

        // Billboard orientation
        if (distanceToCamera < 1000) {
          meshRef.current.quaternion.copy(camera.quaternion);
        }
      } else if (style.isHeaderText && style.isPlaneHeader) {
        // Plane headers follow target with position offset
        if (!style.fixedPosition) {
          const [x, y, z] = position;
          meshRef.current.position.set(
            targetPos.x + x,
            targetPos.y + y,
            targetPos.z + z
          );
        }

        // Reuse tempVec3A for world position
        meshRef.current.getWorldPosition(tempVec3A);
        const distanceToCamera = camera.position.distanceTo(tempVec3A);

        if (distanceToCamera < 1000) {
          meshRef.current.quaternion.copy(camera.quaternion);
        }

        const scaleValue = Math.min(Math.max(distanceToCamera * 0.01, 0.5), 2.0);
        meshRef.current.scale.setScalar(scaleValue * scale);
      } else if (style.isHeaderText) {
        // General header text (cubes, tetrahedrons)
        const [x, y, z] = position;
        const avgScale = (targetScale.x + targetScale.y + targetScale.z) / 3;

        meshRef.current.position.set(
          targetPos.x + x * avgScale,
          targetPos.y + y * avgScale,
          targetPos.z + z * avgScale
        );

        // Reuse tempVec3A for world position
        meshRef.current.getWorldPosition(tempVec3A);
        const distanceToCamera = camera.position.distanceTo(tempVec3A);

        if (distanceToCamera < 1000) {
          meshRef.current.quaternion.copy(camera.quaternion);
        }

        const scaleValue = Math.min(Math.max(distanceToCamera * 0.01, 0.5), 2.0);
        meshRef.current.scale.setScalar(scaleValue * scale * avgScale);
      }
      return; // Header text handling complete
    }

    // === CONNECTION TEXT HANDLING ===
    // Update position with smoothing for connection lines
    if (calculatedPosition) {
      // Lazy-initialize smoothedPositionRef
      if (!smoothedPositionRef.current) {
        if (Array.isArray(calculatedPosition)) {
          smoothedPositionRef.current = new THREE.Vector3(
            calculatedPosition[0], calculatedPosition[1], calculatedPosition[2]
          );
        } else {
          smoothedPositionRef.current = new THREE.Vector3(
            calculatedPosition.x, calculatedPosition.y, calculatedPosition.z
          );
        }
      }
      
      // Reuse tempVec3A for target position
      if (Array.isArray(calculatedPosition)) {
        tempVec3A.set(calculatedPosition[0], calculatedPosition[1], calculatedPosition[2]);
      } else {
        tempVec3A.set(calculatedPosition.x, calculatedPosition.y, calculatedPosition.z);
      }

      // Smooth position updates (faster for connection texts)
      const isConnectionText = lineStyle && pathPoints && pathPoints.length > 0;
      const smoothingFactor = isConnectionText ? 0.5 : 0.3;

      // Lerp toward target position
      smoothedPositionRef.current.lerp(tempVec3A, smoothingFactor);

      // Apply smoothed position
      meshRef.current.position.copy(smoothedPositionRef.current);
    }

    // === STANDARD BILLBOARD ===
    // Standard billboard behavior for non-face, non-header text
    if (billboard) {
      // Reuse tempVec3A for world position
      meshRef.current.getWorldPosition(tempVec3A);
      const distance = camera.position.distanceTo(tempVec3A);

      if (distance < 1000) {
        meshRef.current.quaternion.copy(camera.quaternion);
      }
    }
  });

  if (!geometry || !material) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      material={material}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      visible={visible}
      renderOrder={renderOrder}
      scale={[scale, scale, scale]}
      frustumCulled={false}
    />
  );
});

DynamicBillboardMesh.displayName = 'DynamicBillboardMesh';

export default React.memo(AtlasTextSprite, (prevProps, nextProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.style?.fontSize === nextProps.style?.fontSize &&
    prevProps.style?.color === nextProps.style?.color &&
    prevProps.style?.fontFamily === nextProps.style?.fontFamily &&
    prevProps.style?.bold === nextProps.style?.bold &&
    prevProps.style?.italic === nextProps.style?.italic &&
    prevProps.style?.underline === nextProps.style?.underline &&
    prevProps.style?.depthTest === nextProps.style?.depthTest &&
    prevProps.style?.depthWrite === nextProps.style?.depthWrite &&
    prevProps.style?.opacity === nextProps.style?.opacity &&
    prevProps.style?.isFaceText === nextProps.style?.isFaceText &&
    prevProps.style?.isHeaderText === nextProps.style?.isHeaderText &&
    prevProps.style?.isDodecahedronHeader ===
      nextProps.style?.isDodecahedronHeader &&
    prevProps.style?.isPlaneHeader === nextProps.style?.isPlaneHeader &&
    prevProps.style?.fixedPosition === nextProps.style?.fixedPosition &&
    prevProps.billboard === nextProps.billboard &&
    prevProps.visible === nextProps.visible &&
    prevProps.renderOrder === nextProps.renderOrder &&
    prevProps.scale === nextProps.scale &&
    prevProps.lineStyle === nextProps.lineStyle &&
    prevProps.pathPoints?.length === nextProps.pathPoints?.length &&
    prevProps.followTarget === nextProps.followTarget &&
    prevProps.normal?.[0] === nextProps.normal?.[0] &&
    prevProps.normal?.[1] === nextProps.normal?.[1] &&
    prevProps.normal?.[2] === nextProps.normal?.[2] &&
    prevProps.side === nextProps.side
  );
});
