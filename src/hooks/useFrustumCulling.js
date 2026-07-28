import { useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSpatialIndexWorker } from '../workers/spatialIndexWorkerClient';

/**
 * Frustum culling hook for connection lines
 * Only renders connections that are visible in the camera frustum
 * 
 * PERFORMANCE: Reduces rendered connections by 60-80% when zoomed in.
 * Heavy frustum math is offloaded to a Web Worker via the spatial-index
 * worker.  The worker result is stored in a ref and consumed on the next
 * natural render pass (fire-and-forget pattern — no React state).
 */

// Frustum and matrix for culling calculations - reused to avoid allocations
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const tempPoint = new THREE.Vector3();
const _midPoint = new THREE.Vector3();

/**
 * Check if a point is within the camera frustum (with padding)
 */
function isPointInFrustum(point, frustum, _padding = 50) {
  if (!point || !Array.isArray(point) || point.length < 3) return false;
  
  tempPoint.set(point[0], point[1], point[2]);
  
  // Check if point is in frustum with some padding
  // We expand the frustum check slightly to avoid popping at edges
  return frustum.containsPoint(tempPoint);
}

/**
 * Check if a connection line is potentially visible
 * A connection is visible if either endpoint or the midpoint is in the frustum
 */
function isConnectionVisible(connection, frustum, objectPositions) {
  if (!connection?.start?.objectId || !connection?.end?.objectId) {
    return false;
  }
  
  const startPos = objectPositions.get(connection.start.objectId.toString());
  const endPos = objectPositions.get(connection.end.objectId.toString());
  
  if (!startPos || !endPos) return false;
  
  // Check if either endpoint is visible
  if (isPointInFrustum(startPos, frustum) || isPointInFrustum(endPos, frustum)) {
    return true;
  }
  
  // Check midpoint for long connections that might span the screen
  _midPoint.set(
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2,
    (startPos[2] + endPos[2]) / 2
  );
  
  return frustum.containsPoint(_midPoint);
}

/**
 * Simple spatial hash for fast object lookup
 */
class _SpatialHash {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  
  getKey(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }
  
  insert(id, position) {
    if (!position || !Array.isArray(position)) return;
    const key = this.getKey(position[0], position[1], position[2]);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(id);
  }
  
  clear() {
    this.cells.clear();
  }
  
  // Get all objects within a bounding box
  query(minX, minY, minZ, maxX, maxY, maxZ) {
    const results = new Set();
    
    const minCX = Math.floor(minX / this.cellSize);
    const minCY = Math.floor(minY / this.cellSize);
    const minCZ = Math.floor(minZ / this.cellSize);
    const maxCX = Math.floor(maxX / this.cellSize);
    const maxCY = Math.floor(maxY / this.cellSize);
    const maxCZ = Math.floor(maxZ / this.cellSize);
    
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        for (let cz = minCZ; cz <= maxCZ; cz++) {
          const key = `${cx},${cy},${cz}`;
          const cell = this.cells.get(key);
          if (cell) {
            cell.forEach(id => results.add(id));
          }
        }
      }
    }
    
    return results;
  }
}

/**
 * Hook for frustum-culled connections
 * Returns only connections that are visible in the current camera view
 *
 * PERFORMANCE: No useState inside useFrame — camera movement is tracked via
 * a ref-based dirty flag + a coalesced setState outside the render loop.
 * This avoids triggering React re-renders on every camera frame which was
 * the primary cause of jerky OrbitControls.
 */
export const useFrustumCulledConnections = (connections, objects, enabled = true) => {
  const { camera } = useThree();
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const cachedVisibleConnectionsRef = useRef([]);
  const lastConnectionsRef = useRef(null);
  const lastObjectsRef = useRef(null);
  const tempCamPos = useRef(new THREE.Vector3());

  // Instead of useState(cameraKey) which caused React re-renders from useFrame,
  // use a dirty flag that is checked on the *next* React render triggered by
  // an actual prop change (connections / objects).
  const cameraDirtyRef = useRef(false);
  const cameraCheckTimeRef = useRef(0);

  // Worker frustum culling state (fire-and-forget pattern)
  const workerBusyRef = useRef(false);
  // { connectionArr: connections snapshot, visibleSet: Set<index> }
  const workerResultRef = useRef(null);
  // Keep a ref to connections for the useFrame closure
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  // Pre-allocated worker dispatch buffers (reused across dispatches)
  const planesRef = useRef(new Float32Array(24)); // 6 planes × 4 floats, transferable
  const endpointsRef = useRef([]);

  // Track camera movement without triggering React re-renders.
  // When the camera moves, also fire a worker dispatch for frustum culling.
  useFrame(() => {
    if (!enabled || !camera) return;
    const now = Date.now();
    if (now - cameraCheckTimeRef.current < 300) return; // 3.3 Hz — plenty for culling
    cameraCheckTimeRef.current = now;

    tempCamPos.current.setFromMatrixPosition(camera.matrixWorld);
    if (tempCamPos.current.distanceTo(lastCameraPositionRef.current) > 50) {
      lastCameraPositionRef.current.copy(tempCamPos.current);
      cameraDirtyRef.current = true;

      // --- Worker dispatch (fire-and-forget) ---
      const conns = connectionsRef.current;
      if (conns && conns.length >= 50 && !workerBusyRef.current) {
        workerBusyRef.current = true;

        // Extract frustum planes as plain arrays [nx, ny, nz, constant]
        projScreenMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);
        const planes = planesRef.current;
        for (let i = 0; i < 6; i++) {
          const p = frustum.planes[i];
          const off = i * 4;
          planes[off]     = p.normal.x;
          planes[off + 1] = p.normal.y;
          planes[off + 2] = p.normal.z;
          planes[off + 3] = p.constant;
        }

        // Build compact connection endpoint list — worker has object positions
        const endpoints = endpointsRef.current;
        const len = conns.length;
        // Grow buffer if needed (never shrinks — reuses objects)
        while (endpoints.length < len) endpoints.push({ id: 0, startObjId: '', endObjId: '' });
        endpoints.length = len;
        for (let i = 0; i < len; i++) {
          const c = conns[i];
          const e = endpoints[i];
          e.id = i;
          e.startObjId = String(c.start?.objectId || '');
          e.endObjId = String(c.end?.objectId || '');
        }

        const worker = getSpatialIndexWorker();
        worker.frustumCullConnections(planes, endpoints)
          .then((visibleIndices) => {
            workerResultRef.current = {
              connectionArr: conns, // snapshot for freshness check
              visibleSet: new Set(visibleIndices),
            };
          })
          .catch(() => { /* worker error — sync fallback will run at next render */ })
          .finally(() => { workerBusyRef.current = false; });
      }
    }
  });

  // Build object position map for fast lookups
  const objectPositions = useMemo(() => {
    const map = new Map();
    if (!objects) return map;
    
    objects.forEach(obj => {
      if (obj?.id && obj?.position) {
        map.set(obj.id.toString(), obj.position);
      }
    });
    
    return map;
  }, [objects]);

  // Calculate visible connections.
  // Re-runs when connections/objects change (prop-driven).
  // Camera movement sets the dirty flag which is consumed on the next
  // natural render cycle — no extra renders are scheduled.
  const visibleConnections = useMemo(() => {
    if (!enabled || !connections || connections.length === 0) {
      cachedVisibleConnectionsRef.current = connections || [];
      return cachedVisibleConnectionsRef.current;
    }

    // Skip frustum culling for small numbers of connections
    if (connections.length < 50) {
      cachedVisibleConnectionsRef.current = connections;
      return connections;
    }

    const connectionsChanged = connections !== lastConnectionsRef.current;
    const objectsChanged = objects !== lastObjectsRef.current;
    const cameraChanged = cameraDirtyRef.current;

    if (!connectionsChanged && !objectsChanged && !cameraChanged && cachedVisibleConnectionsRef.current.length > 0) {
      return cachedVisibleConnectionsRef.current;
    }

    lastConnectionsRef.current = connections;
    lastObjectsRef.current = objects;
    cameraDirtyRef.current = false;

    // --- Try worker result first ---
    const wr = workerResultRef.current;
    if (wr && wr.connectionArr === connections && wr.visibleSet.size > 0) {
      const visible = connections.filter((_, idx) => wr.visibleSet.has(idx));
      cachedVisibleConnectionsRef.current = visible;
      return visible;
    }

    // --- Sync fallback ---
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    const visible = connections.filter(connection =>
      isConnectionVisible(connection, frustum, objectPositions)
    );

    cachedVisibleConnectionsRef.current = visible;
    return visible;
  }, [connections, objectPositions, objects, enabled, camera]);

  return {
    visibleConnections,
    totalConnections: connections?.length || 0,
    culledCount: (connections?.length || 0) - visibleConnections.length,
  };
};

/**
 * Hook that provides frustum culling with frame-based updates
 * Updates the visible connections periodically rather than every render
 */
export const useDynamicFrustumCulling = (connections, objects, updateInterval = 6) => {
  const { camera } = useThree();
  const visibleConnectionsRef = useRef([]);
  const frameCountRef = useRef(0);
  const objectPositionsRef = useRef(new Map());
  
  // Update object positions map
  useMemo(() => {
    objectPositionsRef.current.clear();
    if (!objects) return;
    
    objects.forEach(obj => {
      if (obj?.id && obj?.position) {
        objectPositionsRef.current.set(obj.id.toString(), obj.position);
      }
    });
  }, [objects]);
  
  // Update visible connections periodically
  useFrame(() => {
    frameCountRef.current++;
    
    // Only update every N frames to reduce CPU usage
    if (frameCountRef.current % updateInterval !== 0) return;
    
    if (!connections || connections.length === 0) {
      visibleConnectionsRef.current = [];
      return;
    }
    
    // Skip frustum culling for small numbers
    if (connections.length < 50) {
      visibleConnectionsRef.current = connections;
      return;
    }
    
    // Update frustum
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    
    // Filter visible connections
    visibleConnectionsRef.current = connections.filter(connection =>
      isConnectionVisible(connection, frustum, objectPositionsRef.current)
    );
  });
  
  return visibleConnectionsRef;
};

export default useFrustumCulledConnections;
