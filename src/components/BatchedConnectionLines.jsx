import { useRef, useMemo, useEffect, useCallback, memo } from 'react';
import * as THREE from 'three';
import { extend, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

// Reusable identity matrix - created once
const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable vectors for raycasting - allocated once at module level
const _start = new THREE.Vector3();
const _end = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();
const _w0 = new THREE.Vector3();
const _rayPoint = new THREE.Vector3();
const _lineDir = new THREE.Vector3();

// Reusable color object  
const _color = new THREE.Color();

// Base quad geometry positions - shared across all instances
const BASE_POSITIONS = new Float32Array([
  0, -1, 0, 1, -1, 0, 0, 1, 0,
  1, -1, 0, 1, 1, 0, 0, 1, 0,
]);

/**
 * BatchedConnectionLines - Ultra-optimized connection line renderer
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single draw call for ALL connections (vs 100+ individual components)
 * - In-place buffer updates (no geometry recreation on position changes)
 * - Pre-allocated oversized buffers to avoid reallocation
 * - Zero object allocation during updates (reuses module-level vectors)
 * - Efficient connection-to-index mapping for raycasting
 */
const BatchedConnectionLines = memo(({
  connections,
  objectPositions, // Map<objectId, [x,y,z]>
  selectedConnectionId,
  onConnectionClick,
  lineWidth = 1,
}) => {
  const meshRef = useRef();
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const connectionIndexMapRef = useRef(new Map());
  const bufferCapacityRef = useRef(0);
  const currentCountRef = useRef(0);
  // PERFORMANCE: Track previous buffer state to avoid unnecessary GPU uploads
  const prevBufferHashRef = useRef(0);
  const prevConnectionsKeyRef = useRef('');
  const prevQuickHashRef = useRef(0);
  
  const { camera, size } = useThree();
  
  // PERFORMANCE: Filter straight connections once
  const straightConnections = useMemo(() => {
    if (!connections?.length) return [];
    return connections.filter(conn => {
      const style = conn.styleType || conn.lineStyle || 'straight';
      return style.split('-')[0] === 'straight';
    });
  }, [connections]);
  
  // PERFORMANCE: Create/resize geometry only when capacity needs to grow
  // Initial geometry is created inline below (lazy init) so the mesh mounts on the first render.
  useEffect(() => {
    const count = straightConnections.length;
    const neededCapacity = Math.max(count, 10);
    
    // Only resize when we need MORE capacity than currently allocated
    if (bufferCapacityRef.current < neededCapacity) {
      const newCapacity = Math.max(neededCapacity * 2, 100);
      
      // Dispose old geometry
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));
      
      const instanceStart = new THREE.InstancedBufferAttribute(new Float32Array(newCapacity * 3), 3);
      const instanceEnd = new THREE.InstancedBufferAttribute(new Float32Array(newCapacity * 3), 3);
      const instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(newCapacity * 3), 3);
      
      instanceStart.setUsage(THREE.DynamicDrawUsage);
      instanceEnd.setUsage(THREE.DynamicDrawUsage);
      instanceColor.setUsage(THREE.DynamicDrawUsage);
      
      geo.setAttribute('instanceStart', instanceStart);
      geo.setAttribute('instanceEnd', instanceEnd);
      geo.setAttribute('instanceColor', instanceColor);
      geo.instanceCount = 0;
      
      geometryRef.current = geo;
      bufferCapacityRef.current = newCapacity;
      
      // Apply new geometry to the mounted mesh directly (args won't auto-update)
      if (meshRef.current) {
        meshRef.current.geometry = geo;
      }
    }
  }, [straightConnections.length]);
  
  // PERFORMANCE: Update buffers in-place without recreating geometry
  // Uses hash comparison to avoid unnecessary GPU uploads when nothing changed
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || !straightConnections.length) {
      currentCountRef.current = 0;
      prevBufferHashRef.current = 0;
      return;
    }
    
    // PERFORMANCE: Quick reference check - if connections array is same reference, skip
    // This prevents work when only objectPositions Map changes but positions are the same
    const connectionsKey = straightConnections.map(c => c.id).join(',');
    if (prevConnectionsKeyRef.current === connectionsKey && prevBufferHashRef.current !== 0) {
      // Same connections, positions likely haven't changed - verify with quick position check
      const firstConn = straightConnections[0];
      const startPos = firstConn?.start?.position || firstConn?.start?.facePosition;
      const endPos = firstConn?.end?.position || firstConn?.end?.facePosition;
      if (startPos && endPos) {
        // Numeric quick hash instead of template literal
        let qh = ((startPos[0] * 100) | 0);
        qh = Math.imul(qh ^ ((startPos[1] * 100) | 0), 0x9e3779b9);
        qh = Math.imul(qh ^ ((endPos[0] * 100) | 0), 0x9e3779b9);
        qh = Math.imul(qh ^ ((endPos[1] * 100) | 0), 0x9e3779b9);
        if (qh === prevQuickHashRef.current) {
          return; // Nothing changed, skip full hash computation
        }
        prevQuickHashRef.current = qh;
      }
    }
    prevConnectionsKeyRef.current = connectionsKey;
    
    const instanceStart = geo.getAttribute('instanceStart');
    const instanceEnd = geo.getAttribute('instanceEnd');
    const instanceColor = geo.getAttribute('instanceColor');
    
    if (!instanceStart || !instanceEnd || !instanceColor) return;
    
    const connectionMap = new Map();
    let validCount = 0;
    
    // PERFORMANCE: Build numeric rolling hash while updating to detect actual changes
    // Uses Math.imul XOR pattern - no string allocations
    let bufferHash = validCount;
    
    // Update buffers in-place - no new array allocations
    for (let i = 0; i < straightConnections.length; i++) {
      const conn = straightConnections[i];
      if (!conn?.start?.objectId || !conn?.end?.objectId) continue;
      
      const startObjId = conn.start.objectId.toString();
      const endObjId = conn.end.objectId.toString();
      
      // Get positions - prefer connection's stored face positions (from RealTimeConnectionUpdater)
      // Only fall back to object center positions as last resort
      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;
      
      // Fallback to object centers if connection positions not available
      if (!startPos) {
        startPos = objectPositions?.get(startObjId);
      }
      if (!endPos) {
        endPos = objectPositions?.get(endObjId);
      }
      
      if (!startPos || !endPos) continue;
      
      // Handle both array and object position formats
      const sx = Array.isArray(startPos) ? startPos[0] : startPos.x;
      const sy = Array.isArray(startPos) ? startPos[1] : startPos.y;
      const sz = Array.isArray(startPos) ? startPos[2] : startPos.z;
      const ex = Array.isArray(endPos) ? endPos[0] : endPos.x;
      const ey = Array.isArray(endPos) ? endPos[1] : endPos.y;
      const ez = Array.isArray(endPos) ? endPos[2] : endPos.z;
      
      // Skip invalid positions
      if (isNaN(sx) || isNaN(sy) || isNaN(sz) || isNaN(ex) || isNaN(ey) || isNaN(ez)) continue;
      
      // Get color
      const isSelected = conn.id === selectedConnectionId;
      const colorHex = conn.color || (isSelected ? '#ffff00' : '#000000');
      
      // Add to numeric hash (multiply by 100 to preserve 2 decimal places)
      bufferHash = Math.imul(bufferHash ^ ((sx * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((sy * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((sz * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ex * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ey * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ez * 100) | 0), 0x9e3779b9);
      
      // Update start position
      instanceStart.setXYZ(validCount, sx, sy, sz);
      
      // Update end position
      instanceEnd.setXYZ(validCount, ex, ey, ez);
      
      // Update color - reuse _color object
      _color.set(colorHex);
      instanceColor.setXYZ(validCount, _color.r, _color.g, _color.b);
      
      // Track connection mapping
      connectionMap.set(validCount, conn.id);
      validCount++;
    }
    
    // PERFORMANCE: Check if anything actually changed
    if (bufferHash === prevBufferHashRef.current) {
      // Nothing changed - skip GPU upload
      return;
    }
    prevBufferHashRef.current = bufferHash;
    
    // Mark buffers as needing update (only when data actually changed)
    instanceStart.needsUpdate = true;
    instanceEnd.needsUpdate = true;
    instanceColor.needsUpdate = true;
    
    // Update draw range to only render valid instances
    geo.instanceCount = validCount;
    
    connectionIndexMapRef.current = connectionMap;
    currentCountRef.current = validCount;
    
    // Update instance matrices if mesh exists
    if (meshRef.current && validCount > 0) {
      for (let i = 0; i < validCount; i++) {
        meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = validCount;
    }
  }, [straightConnections, objectPositions, selectedConnectionId]);
  
  // Create material once
  useEffect(() => {
    if (!materialRef.current) {
      materialRef.current = LineShaderMaterial.clone();
      materialRef.current.uniforms.glowWidth.value = 1.0;
      materialRef.current.uniforms.glowIntensity.value = 0.0;
    }
    materialRef.current.uniforms.linewidth.value = lineWidth;
  }, [lineWidth]);

  // Keep resolution uniform in sync with the actual viewport size.
  // Without this, line widths silently break after orientation changes or window resizes
  // because the singleton material captures window dimensions only at module init time.
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.x = size.width;
      materialRef.current.uniforms.resolution.value.y = size.height;
    }
  }, [size.width, size.height]);
  
  // Custom raycast - optimized with early exits
  const customRaycast = useCallback((raycaster, intersects) => {
    const geo = geometryRef.current;
    const count = currentCountRef.current;
    if (!geo || count === 0) return;
    
    const instanceStart = geo.getAttribute('instanceStart');
    const instanceEnd = geo.getAttribute('instanceEnd');
    if (!instanceStart || !instanceEnd) return;
    
    const ray = raycaster.ray;
    const threshold = Math.max(lineWidth * 0.2, 1.0);
    
    for (let i = 0; i < count; i++) {
      _start.set(instanceStart.getX(i), instanceStart.getY(i), instanceStart.getZ(i));
      _end.set(instanceEnd.getX(i), instanceEnd.getY(i), instanceEnd.getZ(i));
      
      _lineDir.subVectors(_end, _start);
      const lineLength = _lineDir.length();
      if (lineLength === 0) continue;
      _lineDir.normalize();
      
      _w0.subVectors(ray.origin, _start);
      const a = ray.direction.dot(ray.direction);
      const b = ray.direction.dot(_lineDir);
      const c = _lineDir.dot(_lineDir);
      const d = ray.direction.dot(_w0);
      const e = _lineDir.dot(_w0);
      
      const denom = a * c - b * b;
      let sc, tc;
      
      if (Math.abs(denom) < 0.00001) {
        sc = 0;
        tc = b > c ? d / b : e / c;
      } else {
        sc = (b * e - c * d) / denom;
        tc = (a * e - b * d) / denom;
      }
      
      tc = Math.max(0, Math.min(lineLength, tc));
      _closestPoint.copy(_start).addScaledVector(_lineDir, tc);
      _rayPoint.copy(ray.origin).addScaledVector(ray.direction, Math.max(0, sc));
      
      const distance = _rayPoint.distanceTo(_closestPoint);
      const camDist = _closestPoint.distanceTo(camera.position);
      const adjustedThreshold = threshold * (1 + camDist * 0.01);
      
      if (distance < adjustedThreshold && sc > 0) {
        intersects.push({
          distance: sc,
          point: _closestPoint.clone(),
          object: meshRef.current,
          instanceId: i,
          connectionId: connectionIndexMapRef.current.get(i),
        });
      }
    }
  }, [lineWidth, camera]);
  
  // Attach raycast to mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.raycast = customRaycast;
    }
  }, [customRaycast]);
  
  // Handle clicks
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const hit = e.intersections?.find(i => i.object === meshRef.current);
    if (hit?.connectionId && onConnectionClick) {
      onConnectionClick(e, hit.connectionId);
    }
  }, [onConnectionClick]);
  
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  }, []);
  
  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
  }, []);
  
  // Lazy-initialize geometry on first render so the mesh mounts immediately.
  // The buffer-fill effect populates instanceCount; Three.js picks it up on the next frame.
  if (!geometryRef.current) {
    const initialCapacity = 100;
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));
    const instanceStart = new THREE.InstancedBufferAttribute(new Float32Array(initialCapacity * 3), 3);
    const instanceEnd = new THREE.InstancedBufferAttribute(new Float32Array(initialCapacity * 3), 3);
    const instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(initialCapacity * 3), 3);
    instanceStart.setUsage(THREE.DynamicDrawUsage);
    instanceEnd.setUsage(THREE.DynamicDrawUsage);
    instanceColor.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('instanceStart', instanceStart);
    geo.setAttribute('instanceEnd', instanceEnd);
    geo.setAttribute('instanceColor', instanceColor);
    geo.instanceCount = 0;
    geometryRef.current = geo;
    bufferCapacityRef.current = initialCapacity;
  }
  // Lazy-initialize material on first render
  if (!materialRef.current) {
    materialRef.current = LineShaderMaterial.clone();
    materialRef.current.uniforms.linewidth.value = lineWidth;
  }
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometryRef.current, materialRef.current, bufferCapacityRef.current]}
      frustumCulled={false}
      renderOrder={10}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
});

BatchedConnectionLines.displayName = 'BatchedConnectionLines';

export default BatchedConnectionLines;
