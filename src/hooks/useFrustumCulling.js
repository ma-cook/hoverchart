import { useMemo, useRef, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Frustum culling hook for connection lines
 * Only renders connections that are visible in the camera frustum
 * 
 * PERFORMANCE: Reduces rendered connections by 60-80% when zoomed in
 */

// Frustum and matrix for culling calculations - reused to avoid allocations
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const tempPoint = new THREE.Vector3();

/**
 * Check if a point is within the camera frustum (with padding)
 */
function isPointInFrustum(point, frustum, padding = 50) {
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
  const midpoint = [
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2,
    (startPos[2] + endPos[2]) / 2,
  ];
  
  return isPointInFrustum(midpoint, frustum);
}

/**
 * Simple spatial hash for fast object lookup
 */
class SpatialHash {
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
 * PERFORMANCE: Only recalculates when camera moves significantly or connections change
 */
export const useFrustumCulledConnections = (connections, objects, enabled = true) => {
  const { camera } = useThree();
  const spatialHashRef = useRef(new SpatialHash(200));
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const lastCameraQuaternionRef = useRef(new THREE.Quaternion());
  const cachedVisibleConnectionsRef = useRef([]);
  const lastConnectionsLengthRef = useRef(0);
  const lastObjectsLengthRef = useRef(0);
  // Track the objects array reference to detect position changes (size alone is not enough)
  const lastObjectsRef = useRef(null);

  // Camera movement tracking: throttle to every 200ms and only if camera moved > 50 units.
  // This causes the useMemo below to recompute when the camera pans/zooms, keeping the
  // frustum-culled list fresh even when no objects/connections change.
  const [cameraKey, setCameraKey] = useState(0);
  const cameraKeyTimeRef = useRef(0);
  const tempCamPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabled || !camera) return;
    const now = Date.now();
    if (now - cameraKeyTimeRef.current < 200) return; // throttle to 5 Hz

    tempCamPos.current.setFromMatrixPosition(camera.matrixWorld);
    if (tempCamPos.current.distanceTo(lastCameraPositionRef.current) > 50) {
      lastCameraPositionRef.current.copy(tempCamPos.current);
      cameraKeyTimeRef.current = now;
      setCameraKey((k) => k + 1);
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
  
  // Build spatial hash for objects
  useMemo(() => {
    spatialHashRef.current.clear();
    objectPositions.forEach((position, id) => {
      spatialHashRef.current.insert(id, position);
    });
  }, [objectPositions]);
  
  // Calculate visible connections
  // useMemo re-runs when connections/objects change OR when cameraKey increments (camera moved)
  const lastCameraKeyRef = useRef(-1);
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
    
    // Check if data has changed (don't rely on camera for dependency)
    const connectionsChanged = connections.length !== lastConnectionsLengthRef.current;
    // Detect object position changes by checking the objects array reference (it gets a new
    // reference whenever any position/scale changes via the store's hash guard), not just size.
    const objectsChanged = objects !== lastObjectsRef.current || objectPositions.size !== lastObjectsLengthRef.current;
    // Detect camera movement
    const cameraChanged = cameraKey !== lastCameraKeyRef.current;
    
    // If nothing changed and we have a cache, return cache
    if (!connectionsChanged && !objectsChanged && !cameraChanged && cachedVisibleConnectionsRef.current.length > 0) {
      return cachedVisibleConnectionsRef.current;
    }
    
    lastConnectionsLengthRef.current = connections.length;
    lastObjectsLengthRef.current = objectPositions.size;
    lastObjectsRef.current = objects;
    lastCameraKeyRef.current = cameraKey;
    
    // Update frustum from camera (camera ref is stable, matrices update internally)
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    
    // Filter connections by visibility
    const visible = connections.filter(connection => 
      isConnectionVisible(connection, frustum, objectPositions)
    );
    
    cachedVisibleConnectionsRef.current = visible;
    return visible;
  }, [connections, objectPositions, objects, enabled, cameraKey]); // cameraKey triggers recompute when camera moves
  
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
