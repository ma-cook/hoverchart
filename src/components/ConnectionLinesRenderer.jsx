import { useRef, useMemo, useEffect, useCallback, memo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { createLineMaterial } from '../utils/lineMaterialFactory';
import { computeConnectionPath } from '../utils/pathfindingUtils';

// Reusable vectors for raycasting - allocated once at module level
const _start = new THREE.Vector3();
const _end = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();
const _w0 = new THREE.Vector3();
const _rayPoint = new THREE.Vector3();
const _lineDir = new THREE.Vector3();

// Reusable color object
const _color = new THREE.Color();

const EMPTY_SET = new Set();

// Base quad geometry positions - shared across all instances
const BASE_POSITIONS = new Float32Array([
  0, -1, 0, 1, -1, 0, 0, 1, 0,
  1, -1, 0, 1, 1, 0, 0, 1, 0,
]);

const INITIAL_CAPACITY = 100;

/**
 * Compute a numeric cache key from connection id + start/end positions.
 * Uses Math.imul rolling hash — zero string allocations.
 * Positions are quantized to 0.1 units.
 */
function numericCacheKey(connId, start, end) {
  let h = typeof connId === 'number' ? connId : 0;
  if (typeof connId === 'string') {
    for (let i = 0; i < connId.length; i++) {
      h = Math.imul(h ^ connId.charCodeAt(i), 0x9e3779b9);
    }
  }
  h = Math.imul(h ^ ((start[0] * 10) | 0), 0x9e3779b9);
  h = Math.imul(h ^ ((start[1] * 10) | 0), 0x9e3779b9);
  h = Math.imul(h ^ ((start[2] * 10) | 0), 0x9e3779b9);
  h = Math.imul(h ^ ((end[0] * 10) | 0), 0x9e3779b9);
  h = Math.imul(h ^ ((end[1] * 10) | 0), 0x9e3779b9);
  h = Math.imul(h ^ ((end[2] * 10) | 0), 0x9e3779b9);
  return h;
}

function createGeometry(capacity) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));

  const instanceStart = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  const instanceEnd = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  const instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  const instanceWidth = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);

  instanceStart.setUsage(THREE.DynamicDrawUsage);
  instanceEnd.setUsage(THREE.DynamicDrawUsage);
  instanceColor.setUsage(THREE.DynamicDrawUsage);
  instanceWidth.setUsage(THREE.DynamicDrawUsage);

  geo.setAttribute('instanceStart', instanceStart);
  geo.setAttribute('instanceEnd', instanceEnd);
  geo.setAttribute('instanceColor', instanceColor);
  geo.setAttribute('instanceWidth', instanceWidth);
  geo.instanceCount = 0;

  return geo;
}

/**
 * ConnectionLinesRenderer — the single shader renderer for every solid
 * connection line (straight or curved).
 *
 * PERFORMANCE:
 * - One instanced draw call for all solid connection lines
 * - In-place buffer updates (no geometry recreation on position changes)
 * - Pre-allocated oversized buffers to avoid reallocation
 * - Zero per-frame string allocation while hashing updates
 * - Efficient segment-to-connection mapping for raycasting
 *
 * APPEARANCE:
 * - Material is created through createLineMaterial() so the glow uniforms are
 *   configured before the first rendered frame (no halo flash on mount).
 * - Straight and curved lines share identical material state, so a connection
 *   can move between them across categorization passes without changing look.
 * - Per-instance width drives selected (2.5), follow (2.5) and flow-path (2)
 *   emphasis without mounting separate components.
 */
const ConnectionLinesRenderer = memo(({
  connections,
  curvedConnectionIds,
  objectPositions, // Map<objectId, [x,y,z]>
  pathfindingObjects,
  selectedConnectionId,
  followActiveConnectionId,
  highlightedFlowPathIds,
  onConnectionClick,
  lineWidth = 1,
}) => {
  const meshRef = useRef();
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const connectionIndexMapRef = useRef(new Map());
  const bufferCapacityRef = useRef(0);
  const currentCountRef = useRef(0);
  const prevBufferHashRef = useRef(0);
  const pathCacheRef = useRef(new Map());
  const prevPathfindingObjectsRef = useRef(null);

  const { camera, size } = useThree();

  // Lazy-initialize geometry and material during the first render so the mesh
  // mounts immediately; the buffer-fill effect populates instanceCount.
  if (!geometryRef.current) {
    geometryRef.current = createGeometry(INITIAL_CAPACITY);
    bufferCapacityRef.current = INITIAL_CAPACITY;
  }
  if (!materialRef.current) {
    materialRef.current = createLineMaterial({
      lineWidth,
      glowWidth: 1,
      glowIntensity: 0,
      resolution: { x: size.width, y: size.height },
    });
  }

  const meshMaterial = materialRef.current;

  // Keep the line width uniform in sync.
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.linewidth.value = lineWidth;
    }
  }, [lineWidth]);

  // Keep resolution uniform in sync with the actual viewport size.
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  // Build the instance buffers from the current solid connection set.
  useEffect(() => {
    const connectionsList = connections || [];
    const geo = geometryRef.current;
    if (!geo) return;

    if (pathfindingObjects !== prevPathfindingObjectsRef.current) {
      pathCacheRef.current.clear();
      prevPathfindingObjectsRef.current = pathfindingObjects;
    }

    if (!connectionsList.length) {
      currentCountRef.current = 0;
      prevBufferHashRef.current = 0;
      connectionIndexMapRef.current = new Map();
      geo.instanceCount = 0;
      return;
    }

    const curvedIds = curvedConnectionIds || EMPTY_SET;
    const pathCache = pathCacheRef.current;

    const getCurvedPath = (conn, start, end) => {
      const key = numericCacheKey(conn.id, start, end);
      const cached = pathCache.get(key);
      if (cached) return cached;

      const connStartId = conn.start.objectId?.toString() || '';
      const connEndId = conn.end.objectId?.toString() || '';
      const result = (pathfindingObjects?.length > 0)
        ? computeConnectionPath(start, end, pathfindingObjects, connStartId, connEndId)
        : { pathPoints: [start, end] };

      pathCache.set(key, result.pathPoints);
      return result.pathPoints;
    };

    // Pass 1: resolve endpoints and count the total number of segments so the
    // buffers can be sized once before writing.
    let totalSegments = 0;
    for (const conn of connectionsList) {
      if (!conn?.start?.objectId || !conn?.end?.objectId) continue;

      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;

      if (!startPos) startPos = objectPositions?.get(conn.start.objectId.toString());
      if (!endPos) endPos = objectPositions?.get(conn.end.objectId.toString());
      if (!startPos || !endPos) continue;

      const start = Array.isArray(startPos) ? startPos : [startPos.x, startPos.y, startPos.z];
      const end = Array.isArray(endPos) ? endPos : [endPos.x, endPos.y, endPos.z];

      if (
        isNaN(start[0]) || isNaN(start[1]) || isNaN(start[2]) ||
        isNaN(end[0]) || isNaN(end[1]) || isNaN(end[2])
      ) continue;

      if (curvedIds.has(conn.id)) {
        const path = getCurvedPath(conn, start, end);
        totalSegments += Math.max(path.length - 1, 0);
      } else {
        totalSegments += 1;
      }
    }

    if (totalSegments === 0) {
      currentCountRef.current = 0;
      prevBufferHashRef.current = 0;
      connectionIndexMapRef.current = new Map();
      geo.instanceCount = 0;
      return;
    }

    // Grow the buffers when needed.
    if (bufferCapacityRef.current < totalSegments) {
      const newCapacity = Math.max(totalSegments * 2, INITIAL_CAPACITY);
      const newGeo = createGeometry(newCapacity);
      geometryRef.current.dispose();
      geometryRef.current = newGeo;
      bufferCapacityRef.current = newCapacity;
      if (meshRef.current) meshRef.current.geometry = newGeo;
    }

    const activeGeo = geometryRef.current;
    const instanceStart = activeGeo.getAttribute('instanceStart');
    const instanceEnd = activeGeo.getAttribute('instanceEnd');
    const instanceColor = activeGeo.getAttribute('instanceColor');
    const instanceWidth = activeGeo.getAttribute('instanceWidth');

    if (!instanceStart || !instanceEnd || !instanceColor || !instanceWidth) return;

    const connectionMap = new Map();
    let index = 0;
    let bufferHash = totalSegments;

    const writeSegment = (sx, sy, sz, ex, ey, ez, colorHex, width, connId) => {
      instanceStart.setXYZ(index, sx, sy, sz);
      instanceEnd.setXYZ(index, ex, ey, ez);
      _color.set(colorHex);
      instanceColor.setXYZ(index, _color.r, _color.g, _color.b);
      instanceWidth.setX(index, width);

      bufferHash = Math.imul(bufferHash ^ ((sx * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((sy * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((sz * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ex * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ey * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((ez * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((_color.r * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((_color.g * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((_color.b * 100) | 0), 0x9e3779b9);
      bufferHash = Math.imul(bufferHash ^ ((width * 100) | 0), 0x9e3779b9);

      connectionMap.set(index, connId);
      index++;
    };

    // Pass 2: write all segments and compute the change hash.
    for (const conn of connectionsList) {
      if (!conn?.start?.objectId || !conn?.end?.objectId) continue;

      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;

      if (!startPos) startPos = objectPositions?.get(conn.start.objectId.toString());
      if (!endPos) endPos = objectPositions?.get(conn.end.objectId.toString());
      if (!startPos || !endPos) continue;

      const start = Array.isArray(startPos) ? startPos : [startPos.x, startPos.y, startPos.z];
      const end = Array.isArray(endPos) ? endPos : [endPos.x, endPos.y, endPos.z];

      if (
        isNaN(start[0]) || isNaN(start[1]) || isNaN(start[2]) ||
        isNaN(end[0]) || isNaN(end[1]) || isNaN(end[2])
      ) continue;

      const isSelected = conn.id === selectedConnectionId;
      const isFollowHighlighted =
        followActiveConnectionId != null &&
        String(conn.id) === followActiveConnectionId;
      const isFlowPathHighlighted =
        !isSelected &&
        highlightedFlowPathIds?.size > 0 &&
        highlightedFlowPathIds.has(conn.id);

      const colorHex = isFollowHighlighted
        ? '#FF9800'
        : isSelected
          ? '#ffff00'
          : isFlowPathHighlighted
            ? '#FF9800'
            : conn.color || '#000000';

      const width = isFollowHighlighted || isSelected
        ? 2.5
        : isFlowPathHighlighted
          ? 2
          : lineWidth;

      if (curvedIds.has(conn.id)) {
        const path = getCurvedPath(conn, start, end);
        for (let p = 0; p < path.length - 1; p++) {
          const a = path[p];
          const b = path[p + 1];
          const ax = Array.isArray(a) ? a[0] : a.x;
          const ay = Array.isArray(a) ? a[1] : a.y;
          const az = Array.isArray(a) ? a[2] : a.z;
          const bx = Array.isArray(b) ? b[0] : b.x;
          const by = Array.isArray(b) ? b[1] : b.y;
          const bz = Array.isArray(b) ? b[2] : b.z;
          writeSegment(ax, ay, az, bx, by, bz, colorHex, width, conn.id);
        }
      } else {
        writeSegment(
          start[0], start[1], start[2],
          end[0], end[1], end[2],
          colorHex, width, conn.id
        );
      }
    }

    // Clean up old path cache entries.
    if (pathCache.size > 2000) {
      const entries = Array.from(pathCache.entries());
      entries.slice(0, entries.length - 1000).forEach(([key]) => pathCache.delete(key));
    }

    if (bufferHash === prevBufferHashRef.current && index === currentCountRef.current) {
      return;
    }
    prevBufferHashRef.current = bufferHash;

    instanceStart.needsUpdate = true;
    instanceEnd.needsUpdate = true;
    instanceColor.needsUpdate = true;
    instanceWidth.needsUpdate = true;

    activeGeo.instanceCount = index;
    connectionIndexMapRef.current = connectionMap;
    currentCountRef.current = index;
  }, [
    connections,
    curvedConnectionIds,
    objectPositions,
    pathfindingObjects,
    selectedConnectionId,
    followActiveConnectionId,
    highlightedFlowPathIds,
    lineWidth,
  ]);

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
        geometryRef.current = null;
      }
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
    };
  }, []);

  // Custom raycast that maps segments back to their connection id.
  const customRaycast = useCallback((raycaster, intersects) => {
    const geo = geometryRef.current;
    const count = currentCountRef.current;
    if (!geo || count === 0) return;

    const instanceStart = geo.getAttribute('instanceStart');
    const instanceEnd = geo.getAttribute('instanceEnd');
    const instanceWidth = geo.getAttribute('instanceWidth');
    if (!instanceStart || !instanceEnd) return;

    const ray = raycaster.ray;

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
      const width = instanceWidth ? instanceWidth.getX(i) : 1;
      const threshold = Math.max(lineWidth * width * 0.2, 1.0);
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

  // Attach raycast to the mesh.
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.raycast = customRaycast;
    }
  }, [customRaycast]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const hit = e.intersections?.find((i) => i.object === meshRef.current);
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

  // Note: geometry/material are created once and swapped in-place on buffer
  // growth; the JSX keeps the initial args so R3F never reconstructs the mesh,
  // and the buffer effect assigns the new geometry directly onto the mesh.
  const meshArgs = useMemo(
    () => [geometryRef.current, meshMaterial],
    // Initial values only — geometry/material refs are swapped in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <mesh
      ref={meshRef}
      args={meshArgs}
      frustumCulled={false}
      renderOrder={10}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
});

ConnectionLinesRenderer.displayName = 'ConnectionLinesRenderer';

export default ConnectionLinesRenderer;
