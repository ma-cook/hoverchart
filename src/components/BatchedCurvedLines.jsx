import { useRef, useMemo, useEffect, useCallback, memo } from 'react';
import * as THREE from 'three';
import { extend, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';
import {
  computeConnectionPath,
} from '../utils/pathfindingUtils';

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
 * Convert a path of connected points into line segments
 * Path: [p0, p1, p2, p3] -> Segments: [[p0, p1], [p1, p2], [p2, p3]]
 * Each segment is a pair of [start, end] points
 */
function pathToSegments(path) {
  if (!path || path.length < 2) return [];
  
  const segments = [];
  for (let i = 0; i < path.length - 1; i++) {
    const start = Array.isArray(path[i]) ? path[i] : [path[i].x, path[i].y, path[i].z];
    const end = Array.isArray(path[i + 1]) ? path[i + 1] : [path[i + 1].x, path[i + 1].y, path[i + 1].z];
    segments.push({ start, end });
  }
  return segments;
}

/**
 * BatchedCurvedLines - Optimized renderer for curved/pathfinding connection lines
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single draw call for ALL curved connections (vs 100+ individual components)
 * - In-place buffer updates when positions change
 * - Pre-allocated oversized buffers to avoid reallocation
 * - Zero object allocation during updates (reuses module-level vectors)
 * - Efficient connection-to-index mapping for raycasting
 * 
 * This component handles connections that need pathfinding around objects.
 * Each curved connection may have 20+ segments from the Catmull-Rom spline.
 */
const BatchedCurvedLines = memo(({
  connections,
  objectPositions, // Map<objectId, [x,y,z]>
  pathfindingObjects, // Array of objects for intersection testing
  selectedConnectionId,
  onConnectionClick,
  lineWidth = 1,
}) => {
  const meshRef = useRef();
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const connectionIndexMapRef = useRef(new Map()); // Maps instance index -> connectionId
  const segmentToConnectionRef = useRef(new Map()); // Maps segment index -> connectionId
  const bufferCapacityRef = useRef(0);
  const currentCountRef = useRef(0);
  // PERFORMANCE: Track previous buffer state to avoid unnecessary GPU uploads
  const prevBufferHashRef = useRef(0);
  const pathCacheRef = useRef(new Map()); // Cache computed paths
  // Track previous pathfindingObjects reference so we can detect changes
  // and invalidate the path cache (which is keyed only on start+end positions,
  // not on the positions of blocking objects).
  const prevPathfindingObjectsRef = useRef(null);
  
  const { camera, size } = useThree();
  
  // PERFORMANCE: Calculate paths for all connections with intersections
  // Cache paths to avoid recalculation when nothing changed
  const pathsData = useMemo(() => {
    if (!connections?.length) return { segments: [], connectionMap: new Map() };
    
    const allSegments = [];
    const segmentConnectionMap = new Map(); // Maps segment index -> connectionId
    const pathCache = pathCacheRef.current;
    
    // When the set of blocking objects changes, previously-cached straight paths
    // may now need to curve (or vice-versa).  Clear internal cache so fresh
    // intersection checks are performed against the updated object layout.
    if (pathfindingObjects !== prevPathfindingObjectsRef.current) {
      pathCache.clear();
      prevPathfindingObjectsRef.current = pathfindingObjects;
    }
    
    connections.forEach(conn => {
      if (!conn?.start?.objectId || !conn?.end?.objectId) return;
      
      // Get connection positions
      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;
      
      // Fallback to object positions if needed
      if (!startPos && conn.start?.objectId) {
        startPos = objectPositions?.get(conn.start.objectId.toString());
      }
      if (!endPos && conn.end?.objectId) {
        endPos = objectPositions?.get(conn.end.objectId.toString());
      }
      
      if (!startPos || !endPos) return;
      
      // Normalize positions to arrays
      const start = Array.isArray(startPos) ? startPos : [startPos.x, startPos.y, startPos.z];
      const end = Array.isArray(endPos) ? endPos : [endPos.x, endPos.y, endPos.z];
      
      // Skip invalid positions
      if (isNaN(start[0]) || isNaN(start[1]) || isNaN(start[2]) ||
          isNaN(end[0]) || isNaN(end[1]) || isNaN(end[2])) return;
      
      // Create cache key from positions
      const cacheKey = `${conn.id}:${start[0].toFixed(1)},${start[1].toFixed(1)},${start[2].toFixed(1)}-${end[0].toFixed(1)},${end[1].toFixed(1)},${end[2].toFixed(1)}`;
      
      let pathPoints;
      
      // Check local cache first
      const cached = pathCache.get(cacheKey);
      if (cached) {
        pathPoints = cached;
      } else {
        // computeConnectionPath checks the worker-precomputed cache first,
        // then falls back to synchronous checkLineIntersection + generateCurvedPath.
        const connStartId = conn.start.objectId?.toString() || '';
        const connEndId   = conn.end.objectId?.toString()   || '';
        const result = (pathfindingObjects?.length > 0)
          ? computeConnectionPath(start, end, pathfindingObjects, connStartId, connEndId)
          : { hasIntersections: false, pathPoints: [start, end] };

        pathPoints = result.pathPoints;

        if (window._debugPathfinding) {
          if (result.hasIntersections) {
            console.log(`[BatchedCurved] conn ${conn.id}: hasIntersections=true, pathPoints=${pathPoints?.length}, isCurved=${pathPoints?.length > 2}`);
          } else {
            console.log(`[BatchedCurved] conn ${conn.id}: NO intersections → straight (startPos was: ${start?.map(v=>v.toFixed(2))})`);
          }
        }
        
        // Cache the result locally
        pathCache.set(cacheKey, pathPoints);
      }
      
      // Convert path to line segments
      const segments = pathToSegments(pathPoints);
      
      // Track which connection each segment belongs to
      const startIndex = allSegments.length;
      segments.forEach((_, i) => {
        segmentConnectionMap.set(startIndex + i, conn.id);
      });
      
      // Add color to each segment
      const isSelected = conn.id === selectedConnectionId;
      const colorHex = conn.color || (isSelected ? '#ffff00' : '#000000');
      
      segments.forEach(seg => {
        allSegments.push({
          ...seg,
          color: colorHex,
          connectionId: conn.id,
        });
      });
    });
    
    // Clean up old cache entries (keep only recent 1000)
    if (pathCache.size > 1000) {
      const entries = Array.from(pathCache.entries());
      entries.slice(0, entries.length - 500).forEach(([key]) => pathCache.delete(key));
    }
    
    return { segments: allSegments, connectionMap: segmentConnectionMap };
  }, [connections, objectPositions, pathfindingObjects, selectedConnectionId]);
  
  const { segments: allSegments, connectionMap: segmentConnectionMap } = pathsData;
  
  // PERFORMANCE: Create/resize geometry only when capacity needs to grow
  // Initial geometry is created inline below (lazy init) so the mesh mounts on the first render.
  useEffect(() => {
    const count = allSegments.length;
    const neededCapacity = Math.max(count, 100);
    
    // Only resize when we need MORE capacity than currently allocated
    if (bufferCapacityRef.current < neededCapacity) {
      const newCapacity = Math.max(neededCapacity * 2, 500);
      
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
  }, [allSegments.length]);
  
  // PERFORMANCE: Update buffers in-place
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || !allSegments.length) {
      currentCountRef.current = 0;
      prevBufferHashRef.current = 0;
      return;
    }
    
    const instanceStart = geo.getAttribute('instanceStart');
    const instanceEnd = geo.getAttribute('instanceEnd');
    const instanceColor = geo.getAttribute('instanceColor');
    
    if (!instanceStart || !instanceEnd || !instanceColor) return;
    
    // Build numeric rolling hash while updating (no string allocations)
    let bufferHash = allSegments.length;
    
    // Update buffers in-place
    for (let i = 0; i < allSegments.length; i++) {
      const seg = allSegments[i];
      
      const sx = seg.start[0];
      const sy = seg.start[1];
      const sz = seg.start[2];
      const ex = seg.end[0];
      const ey = seg.end[1];
      const ez = seg.end[2];
      
      // Add to numeric hash
      bufferHash = Math.imul(bufferHash ^ ((sx * 10) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((sy * 10) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ex * 10) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ey * 10) | 0), 0x9e3779b9);
      
      // Update positions
      instanceStart.setXYZ(i, sx, sy, sz);
      instanceEnd.setXYZ(i, ex, ey, ez);
      
      // Update color
      _color.set(seg.color);
      instanceColor.setXYZ(i, _color.r, _color.g, _color.b);
    }
    
    // Check if anything changed
    if (bufferHash === prevBufferHashRef.current) {
      return;
    }
    prevBufferHashRef.current = bufferHash;
    
    // Mark buffers as needing update
    instanceStart.needsUpdate = true;
    instanceEnd.needsUpdate = true;
    instanceColor.needsUpdate = true;
    
    // Update draw range
    geo.instanceCount = allSegments.length;
    
    segmentToConnectionRef.current = segmentConnectionMap;
    currentCountRef.current = allSegments.length;
    
    // Update instance matrices
    if (meshRef.current && allSegments.length > 0) {
      for (let i = 0; i < allSegments.length; i++) {
        meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = allSegments.length;
    }
  }, [allSegments, segmentConnectionMap]);
  
  // Create material once
  useEffect(() => {
    if (!materialRef.current) {
      materialRef.current = LineShaderMaterial.clone();
    }
    materialRef.current.uniforms.linewidth.value = lineWidth;
  }, [lineWidth]);

  // Keep resolution uniform in sync with the actual viewport size.
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
    const segToConn = segmentToConnectionRef.current;
    
    // Track which connections we've already added to avoid duplicates
    const addedConnections = new Set();
    
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
        const connectionId = segToConn.get(i);
        
        // Only add first hit per connection
        if (connectionId && !addedConnections.has(connectionId)) {
          addedConnections.add(connectionId);
          intersects.push({
            distance: sc,
            point: _closestPoint.clone(),
            object: meshRef.current,
            instanceId: i,
            connectionId,
          });
        }
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
    const initialCapacity = 500;
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

BatchedCurvedLines.displayName = 'BatchedCurvedLines';

export default BatchedCurvedLines;
