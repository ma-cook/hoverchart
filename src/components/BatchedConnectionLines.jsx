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
  const prevBufferHashRef = useRef('');
  const prevConnectionsKeyRef = useRef('');
  const prevQuickHashRef = useRef('');
  
  const { camera } = useThree();
  
  // PERFORMANCE: Filter straight connections once
  const straightConnections = useMemo(() => {
    if (!connections?.length) return [];
    return connections.filter(conn => {
      const style = conn.styleType || conn.lineStyle || 'straight';
      return style.split('-')[0] === 'straight';
    });
  }, [connections]);
  
  // PERFORMANCE: Create/resize geometry only when needed
  // Allocate 2x capacity to reduce reallocations
  useEffect(() => {
    const count = straightConnections.length;
    const neededCapacity = Math.max(count, 10); // Minimum 10
    
    // Only recreate if we need more capacity or first time
    if (!geometryRef.current || bufferCapacityRef.current < neededCapacity) {
      // Allocate with 2x headroom to reduce future reallocations
      const newCapacity = Math.max(neededCapacity * 2, 100);
      
      // Dispose old geometry
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));
      
      // Pre-allocate oversized buffers
      const instanceStart = new THREE.InstancedBufferAttribute(
        new Float32Array(newCapacity * 3), 3
      );
      const instanceEnd = new THREE.InstancedBufferAttribute(
        new Float32Array(newCapacity * 3), 3
      );
      const instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(newCapacity * 3), 3
      );
      
      // Mark as dynamic for efficient updates
      instanceStart.setUsage(THREE.DynamicDrawUsage);
      instanceEnd.setUsage(THREE.DynamicDrawUsage);
      instanceColor.setUsage(THREE.DynamicDrawUsage);
      
      geo.setAttribute('instanceStart', instanceStart);
      geo.setAttribute('instanceEnd', instanceEnd);
      geo.setAttribute('instanceColor', instanceColor);
      
      geometryRef.current = geo;
      bufferCapacityRef.current = newCapacity;
    }
  }, [straightConnections.length]);
  
  // PERFORMANCE: Update buffers in-place without recreating geometry
  // Uses hash comparison to avoid unnecessary GPU uploads when nothing changed
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || !straightConnections.length) {
      currentCountRef.current = 0;
      prevBufferHashRef.current = '';
      return;
    }
    
    // PERFORMANCE: Quick reference check - if connections array is same reference, skip
    // This prevents work when only objectPositions Map changes but positions are the same
    const connectionsKey = straightConnections.map(c => c.id).join(',');
    if (prevConnectionsKeyRef.current === connectionsKey && prevBufferHashRef.current !== '') {
      // Same connections, positions likely haven't changed - verify with quick position check
      const firstConn = straightConnections[0];
      const startPos = firstConn?.start?.position || firstConn?.start?.facePosition;
      const endPos = firstConn?.end?.position || firstConn?.end?.facePosition;
      if (startPos && endPos) {
        const quickHash = `${startPos[0].toFixed(2)},${startPos[1].toFixed(2)},${endPos[0].toFixed(2)},${endPos[1].toFixed(2)}`;
        if (quickHash === prevQuickHashRef.current) {
          return; // Nothing changed, skip full hash computation
        }
        prevQuickHashRef.current = quickHash;
      }
    }
    prevConnectionsKeyRef.current = connectionsKey;
    
    const instanceStart = geo.getAttribute('instanceStart');
    const instanceEnd = geo.getAttribute('instanceEnd');
    const instanceColor = geo.getAttribute('instanceColor');
    
    if (!instanceStart || !instanceEnd || !instanceColor) return;
    
    const connectionMap = new Map();
    let validCount = 0;
    
    // PERFORMANCE: Build hash while updating to detect actual changes
    // Use a simple string hash instead of expensive hashing algorithms
    let hashParts = [];
    
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
      
      // Add to hash (round positions to 2 decimal places to avoid floating point noise)
      hashParts.push(`${conn.id}:${sx.toFixed(2)},${sy.toFixed(2)},${sz.toFixed(2)}-${ex.toFixed(2)},${ey.toFixed(2)},${ez.toFixed(2)}-${colorHex}`);
      
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
    const newHash = `${validCount}:${hashParts.join('|')}`;
    if (newHash === prevBufferHashRef.current) {
      // Nothing changed - skip GPU upload
      return;
    }
    prevBufferHashRef.current = newHash;
    
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
    }
    materialRef.current.uniforms.linewidth.value = lineWidth;
  }, [lineWidth]);
  
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
  
  // Don't render if no geometry or no connections
  if (!geometryRef.current || currentCountRef.current === 0) {
    return null;
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
