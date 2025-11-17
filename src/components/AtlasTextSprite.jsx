import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getGlobalTextAtlas } from '../utils/textAtlas';

/**
 * Optimized text sprite using a shared texture atlas
 * Reduces texture binds and improves performance for diagrams with many text labels
 *
 * Performance benefits:
 * - Single texture atlas shared across all text instances
 * - Reduced texture binding operations (major GPU bottleneck)
 * - Lower memory usage compared to individual textures per text
 * - Efficient UV mapping instead of separate materials
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
}) => {
  const meshRef = useRef();
  const lastUpdateTimeRef = useRef(0);

  // Get shared atlas instance
  const atlas = useMemo(() => getGlobalTextAtlas(), []);

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

  // Initialize smoothedPositionRef with calculated position
  const smoothedPositionRef = useRef(
    new THREE.Vector3(
      calculatedPosition[0] || 0,
      calculatedPosition[1] || 0,
      calculatedPosition[2] || 0
    )
  );

  // Create geometry and material using the atlas
  const { geometry, material } = useMemo(() => {
    if (!text || text.trim() === '') {
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
      return { geometry: null, material: null };
    }

    // Force texture update immediately
    atlas.updateTexture();

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

    // Create material using the shared atlas texture
    const mat = new THREE.MeshBasicMaterial({
      map: atlas.getTexture(),
      transparent: true,
      side: side, // Use passed side parameter
      depthWrite: style.depthWrite !== undefined ? style.depthWrite : false,
      depthTest: style.depthTest !== undefined ? style.depthTest : true,
      opacity: style.opacity !== undefined ? style.opacity : 1,
    });

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

  // Update atlas texture when text changes
  useEffect(() => {
    if (geometry && material) {
      atlas.updateTexture();
    }
  }, [atlas, geometry, material]);

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
      if (material) {
        if (material.map && material.map !== atlas.getTexture()) {
          material.map.dispose();
        }
        material.dispose();
      }
    };
  }, [geometry, material, atlas]);

  // Billboard and positioning effect using useFrame
  useFrame(({ camera }) => {
    if (!meshRef.current) return;

    // Throttle updates to 30fps for better performance
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 33) return; // ~30fps
    lastUpdateTimeRef.current = now;

    // === FACE TEXT HANDLING ===
    // Face text uses normal-based billboarding and visibility
    if (style.isFaceText && normal) {
      const worldNormal = new THREE.Vector3(...normal).normalize();
      const textWorldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(textWorldPos);
      const viewDir = textWorldPos.clone().sub(camera.position).normalize();

      // Calculate dot product between normal and view direction
      const dotProduct = worldNormal.dot(viewDir);

      // Set visibility based on viewing angle
      if (dotProduct < 0) {
        // We're looking at the face from the front
        meshRef.current.visible = true;

        // Build rotation matrix for text orientation
        const matrix = new THREE.Matrix4();
        matrix.lookAt(
          new THREE.Vector3(0, 0, 0),
          worldNormal,
          new THREE.Vector3(0, 1, 0)
        );

        // Flip text 180° to face viewer
        const flipMatrix = new THREE.Matrix4().makeRotationY(Math.PI);
        matrix.multiply(flipMatrix);

        meshRef.current.setRotationFromMatrix(matrix);
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
        const calculatedPos = Array.isArray(position)
          ? position
          : [position?.x || 0, position?.y || 0, position?.z || 0];
        const distanceToCamera = camera.position.distanceTo(
          new THREE.Vector3(...calculatedPos)
        );
        const baseScale = Math.min(Math.max(distanceToCamera * 0.01, 0.5), 1.5);

        meshRef.current.position.set(
          calculatedPos[0],
          calculatedPos[1],
          calculatedPos[2]
        );
        meshRef.current.scale.set(
          baseScale * scale,
          baseScale * scale,
          baseScale * scale
        );

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

        const worldPos = new THREE.Vector3();
        meshRef.current.getWorldPosition(worldPos);
        const distanceToCamera = camera.position.distanceTo(worldPos);

        if (distanceToCamera < 1000) {
          meshRef.current.quaternion.copy(camera.quaternion);
        }

        const scaleValue = Math.min(
          Math.max(distanceToCamera * 0.01, 0.5),
          2.0
        );
        meshRef.current.scale.set(
          scaleValue * scale,
          scaleValue * scale,
          scaleValue * scale
        );
      } else if (style.isHeaderText) {
        // General header text (cubes, tetrahedrons)
        const [x, y, z] = position;
        const avgScale = (targetScale.x + targetScale.y + targetScale.z) / 3;

        meshRef.current.position.set(
          targetPos.x + x * avgScale,
          targetPos.y + y * avgScale,
          targetPos.z + z * avgScale
        );

        const worldPos = new THREE.Vector3();
        meshRef.current.getWorldPosition(worldPos);
        const distanceToCamera = camera.position.distanceTo(worldPos);

        if (distanceToCamera < 1000) {
          meshRef.current.quaternion.copy(camera.quaternion);
        }

        const scaleValue = Math.min(
          Math.max(distanceToCamera * 0.01, 0.5),
          2.0
        );
        meshRef.current.scale.set(
          scaleValue * scale * avgScale,
          scaleValue * scale * avgScale,
          scaleValue * scale * avgScale
        );
      }
      return; // Header text handling complete
    }

    // === CONNECTION TEXT HANDLING ===
    // Update position with smoothing for connection lines
    if (calculatedPosition && smoothedPositionRef.current) {
      const targetPosition = Array.isArray(calculatedPosition)
        ? new THREE.Vector3(
            calculatedPosition[0],
            calculatedPosition[1],
            calculatedPosition[2]
          )
        : new THREE.Vector3(
            calculatedPosition.x,
            calculatedPosition.y,
            calculatedPosition.z
          );

      // Smooth position updates (faster for connection texts)
      const isConnectionText = lineStyle && pathPoints && pathPoints.length > 0;
      const smoothingFactor = isConnectionText ? 0.5 : 0.3;

      // Lerp toward target position
      smoothedPositionRef.current.lerp(targetPosition, smoothingFactor);

      // Apply smoothed position
      meshRef.current.position.copy(smoothedPositionRef.current);
    }

    // === STANDARD BILLBOARD ===
    // Standard billboard behavior for non-face, non-header text
    if (billboard) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const distance = camera.position.distanceTo(worldPos);

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
};

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
