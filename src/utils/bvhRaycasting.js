import * as THREE from 'three';
import useLODStore, { calculateLODLevel, LOD_THRESHOLDS } from '../stores/lodStore';

/**
 * BVH (Bounding Volume Hierarchy) Accelerated Raycasting System
 *
 * This system creates a spatial hierarchy to dramatically improve raycasting performance
 * by allowing the raycaster to quickly skip large groups of objects that can't possibly
 * be intersected by the ray.
 * 
 * Also handles LOD (Level of Detail) calculations for objects inside parent containers.
 */

// Reusable THREE objects to avoid GC pressure
const _tempBox3 = new THREE.Box3();
const _tempVec3A = new THREE.Vector3();
const _tempVec3B = new THREE.Vector3();
const _tempVec3C = new THREE.Vector3();
const _tempVec3D = new THREE.Vector3();
const _tempSize = new THREE.Vector3();
const _tempCenter = new THREE.Vector3();
const _tempMin = new THREE.Vector3();
const _tempMax = new THREE.Vector3();

// For LOD calculations
const _lodCameraPos = new THREE.Vector3();
const _lodObjectPos = new THREE.Vector3();

// For intersectConnectionLine - hot path
const _segmentDir = new THREE.Vector3();
const _rayToStart = new THREE.Vector3();
const _pointOnRay = new THREE.Vector3();
const _pointOnSegment = new THREE.Vector3();
const _intersectionPoint = new THREE.Vector3();

// For traverseNode
const _cameraPos = new THREE.Vector3();

// BVH Node structure
class BVHNode {
  constructor() {
    this.bounds = new THREE.Box3();
    this.objects = [];
    this.children = [];
    this.isLeaf = false;
    this.depth = 0;
  }
}

class BVHAcceleratedRaycaster {
  constructor() {
    this.bvhRoot = null;
    this.objects = [];
    this.connectionLines = []; // Add support for connection lines
    this.needsRebuild = true;
    this.maxObjectsPerNode = 10; // Tunable parameter
    this.maxDepth = 16; // Prevent infinite recursion
    this.lastUpdateTime = 0;
    this.updateThreshold = 100; // Only rebuild every 100ms at most

    // Performance tracking
    this.stats = {
      totalRaycasts: 0,
      totalIntersectionTests: 0,
      bvhTraversalTime: 0,
      intersectionTime: 0,
      connectionLineTests: 0,
      virtualObjectTests: 0,
    };
  }

  /**
   * Add objects to the BVH system - now includes connection lines
   */
  setObjects(objects, connectionLines = []) {
    // Filter valid 3D objects
    this.objects = objects.filter((obj) => obj && obj.visible !== false);

    // Add connection lines as special objects
    this.connectionLines = connectionLines.filter(
      (line) =>
        line &&
        line.points &&
        Array.isArray(line.points) &&
        line.points.length >= 2
    );

    this.needsRebuild = true;

    // Build BVH immediately if we have objects
    if (this.objects.length > 0 || this.connectionLines.length > 0) {
      this.buildBVH();
    }
  }

  /**
   * Update a single object's position (for dynamic objects)
   */
  updateObject(object) {
    // For dynamic updates, we mark for rebuild
    // In a production system, we'd have more sophisticated update logic
    // Currently just triggers a rebuild - could be optimized further
    if (object) {
      this.needsRebuild = true;
    }
  }

  /**
   * Build or rebuild the BVH tree - now includes connection lines
   */
  buildBVH() {
    // Combine 3D objects and connection lines
    const allRenderableItems = [
      ...this.objects,
      ...this.connectionLines.map((line) => ({
        ...line,
        _isConnectionLine: true,
      })),
    ];

    if (!allRenderableItems.length) {
      this.bvhRoot = null;
      return;
    }

    // Create root node
    this.bvhRoot = new BVHNode();
    this.bvhRoot.objects = [...allRenderableItems];

    // Calculate bounds for all objects
    this.calculateBounds(this.bvhRoot);

    // Recursively subdivide
    this.subdivideNode(this.bvhRoot, 0);

    this.needsRebuild = false;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Calculate bounding box for a node's objects - now handles connection lines
   */
  calculateBounds(node) {
    node.bounds.makeEmpty();

    for (const object of node.objects) {
      // Reuse temp box instead of allocating new one
      _tempBox3.makeEmpty();

      // Handle connection lines specially
      if (object._isConnectionLine && object.points) {
        this.calculateLineBounds(object, _tempBox3);
      }
      // Handle different 3D object types
      else if (object.geometry) {
        if (!object.geometry.boundingBox) {
          object.geometry.computeBoundingBox();
        }
        _tempBox3.copy(object.geometry.boundingBox);
        _tempBox3.applyMatrix4(object.matrixWorld);
      } else if (object.position) {
        // Fallback for objects without geometry (like groups)
        const pos = object.position;
        const size = object.scale
          ? Math.max(...Object.values(object.scale)) * 5
          : 5;
        _tempVec3A.set(
          pos[0] || pos.x || 0,
          pos[1] || pos.y || 0,
          pos[2] || pos.z || 0
        );
        _tempVec3B.set(size, size, size);
        _tempBox3.setFromCenterAndSize(_tempVec3A, _tempVec3B);
      }

      node.bounds.union(_tempBox3);
    }
  }

  /**
   * Calculate bounding box for connection lines
   */
  calculateLineBounds(line, bounds) {
    bounds.makeEmpty();

    for (const point of line.points) {
      let x, y, z;

      // Handle both Vector3 objects and arrays
      if (point && typeof point === 'object' && 'x' in point) {
        x = point.x;
        y = point.y;
        z = point.z;
      } else if (Array.isArray(point) && point.length >= 3) {
        x = point[0];
        y = point[1];
        z = point[2];
      } else {
        continue; // Skip invalid points
      }

      // Reuse temp vector instead of allocating new one
      _tempVec3C.set(x, y, z);
      bounds.expandByPoint(_tempVec3C);
    }

    // Add some padding for line width
    const padding = (line.lineWidth || 2) * 0.5;
    bounds.expandByScalar(padding);
  }

  /**
   * Recursively subdivide a node
   */
  subdivideNode(node, depth) {
    // Stop if we've reached max depth or have few enough objects
    if (
      depth >= this.maxDepth ||
      node.objects.length <= this.maxObjectsPerNode
    ) {
      node.isLeaf = true;
      node.depth = depth;

      return;
    }

    // Reuse temp vector for size calculation
    node.bounds.getSize(_tempSize);

    // Find the longest axis to split on
    let splitAxis = 0;
    if (_tempSize.y > _tempSize.x) splitAxis = 1;
    if (_tempSize.z > _tempSize[splitAxis === 0 ? 'x' : splitAxis === 1 ? 'y' : 'z'])
      splitAxis = 2;

    // Calculate split position (middle of bounds) - reuse temp vector
    _tempCenter.copy(node.bounds.min).add(node.bounds.max).multiplyScalar(0.5);
    const splitValue = _tempCenter.getComponent(splitAxis);

    // Split objects into two groups
    const leftObjects = [];
    const rightObjects = [];

    for (const object of node.objects) {
      let objectCenter;

      if (object.position) {
        // Handle both array and object position formats
        if (Array.isArray(object.position)) {
          objectCenter = object.position[splitAxis] || 0;
        } else if (object.position.x !== undefined) {
          // Object format: { x, y, z }
          objectCenter =
            splitAxis === 0
              ? object.position.x
              : splitAxis === 1
              ? object.position.y
              : object.position.z;
        } else if (object.position.getComponent) {
          // Three.js Vector3 format
          objectCenter = object.position.getComponent(splitAxis);
        } else {
          objectCenter = 0;
        }
      } else if (object.geometry?.boundingBox) {
        // Reuse temp box and vector for bounds calculation
        _tempBox3.copy(object.geometry.boundingBox);
        _tempBox3.applyMatrix4(object.matrixWorld);
        objectCenter = _tempBox3.getCenter(_tempVec3D).getComponent(splitAxis);
      } else {
        objectCenter = 0;
      }

      if (objectCenter < splitValue) {
        leftObjects.push(object);
      } else {
        rightObjects.push(object);
      }
    }

    // Avoid creating empty nodes
    if (leftObjects.length === 0 || rightObjects.length === 0) {
      node.isLeaf = true;
      node.depth = depth;

      return;
    }

    // Create child nodes
    const leftChild = new BVHNode();
    leftChild.objects = leftObjects;
    this.calculateBounds(leftChild);

    const rightChild = new BVHNode();
    rightChild.objects = rightObjects;
    this.calculateBounds(rightChild);

    node.children = [leftChild, rightChild];
    node.objects = []; // Clear objects from internal node

    // Recursively subdivide children
    this.subdivideNode(leftChild, depth + 1);
    this.subdivideNode(rightChild, depth + 1);
  }

  /**
   * Perform accelerated raycasting using BVH
   */
  intersectObjects(raycaster, recursive = true) {
    const startTime = performance.now();

    // Rebuild BVH if needed (throttled)
    const now = Date.now();
    if (this.needsRebuild && now - this.lastUpdateTime > this.updateThreshold) {
      this.buildBVH();
    }

    if (!this.bvhRoot) {
      return [];
    }

    // Reset virtual object test counter for this raycast
    this.stats.virtualObjectTests = 0;

    const intersections = [];
    const traversalStart = performance.now();

    // Traverse BVH tree
    this.traverseNode(this.bvhRoot, raycaster, intersections, recursive);

    const traversalTime = performance.now() - traversalStart;
    const totalTime = performance.now() - startTime;

    // Update stats
    this.stats.totalRaycasts++;
    this.stats.bvhTraversalTime += traversalTime;
    this.stats.intersectionTime += totalTime - traversalTime;

    // Sort by distance
    intersections.sort((a, b) => a.distance - b.distance);

    // Log performance periodically (less frequent for better performance)

    return intersections;
  }

  /**
   * Recursively traverse BVH nodes with enhanced inside-object detection
   */
  traverseNode(node, raycaster, intersections, recursive) {
    // Early exit if ray doesn't intersect node bounds
    if (!raycaster.ray.intersectsBox(node.bounds)) {
      return;
    }

    if (node.isLeaf) {
      // Debug: Log the types of objects in this leaf

      // Test intersections with objects in this leaf
      for (const object of node.objects) {
        if (object && object.visible !== false) {
          try {
            let objectIntersections = [];

            // Handle connection lines specially
            if (object._isConnectionLine) {
              const lineIntersection = this.intersectConnectionLine(
                raycaster,
                object
              );
              if (lineIntersection) {
                objectIntersections = [lineIntersection];
                this.stats.connectionLineTests++;
              }
            }
            // Handle virtual objects (from state data, not real Three.js objects)
            else if (
              object._isVirtualObject ||
              object.userData?.isVirtualObject
            ) {
              this.stats.virtualObjectTests++; // Count every test attempt
              const virtualIntersection = this.intersectVirtualObject(
                raycaster,
                object
              );
              if (virtualIntersection) {
                objectIntersections = [virtualIntersection];
              }
            }
            // Handle regular 3D objects
            else {
              objectIntersections = raycaster.intersectObject(
                object,
                recursive
              );
            }

            // Enhanced filtering for nested object interaction
            for (const intersection of objectIntersections) {
              // Check if camera is inside this object's bounds (skip for connection lines and virtual objects)
              if (
                !object._isConnectionLine &&
                !object._isVirtualObject &&
                !object.userData?.isVirtualObject &&
                (object.geometry?.boundingBox || object.children?.length > 0)
              ) {
                try {
                  _tempBox3.setFromObject(object);

                  if (_tempBox3.containsPoint(raycaster.ray.origin)) {
                    // Camera is inside - mark for special handling
                    intersection._cameraInside = true;
                    intersection._objectSize = _tempBox3.getSize(_tempSize).length();
                  }
                } catch (error) {
                  // Skip bounds checking for objects that don't support it
                  console.warn(
                    'Bounds checking failed for object:',
                    object,
                    error
                  );
                }
              }

              intersections.push(intersection);
            }

            this.stats.totalIntersectionTests++;
          } catch (error) {
            // Skip objects that cause raycasting errors
            console.warn('BVH raycasting error with object:', object, error);
          }
        }
      }
    } else {
      // Traverse child nodes - use distance-based ordering for better early exit
      // Reuse temp vector for camera position reference
      _cameraPos.copy(raycaster.ray.origin);
      const childDistances = node.children.map((child) => ({
        child,
        distance: child.bounds.distanceToPoint(_cameraPos),
      }));

      // Sort by distance to prioritize closer nodes
      childDistances.sort((a, b) => a.distance - b.distance);

      for (const { child } of childDistances) {
        this.traverseNode(child, raycaster, intersections, recursive);
      }
    }
  }

  /**
   * Intersection test for connection lines
   */
  intersectConnectionLine(raycaster, line) {
    if (!line.points || line.points.length < 2) {
      return null;
    }

    const lineWidth = (line.lineWidth || 2) * 0.5; // Half width for radius
    const ray = raycaster.ray;
    let closestDistance = Infinity;
    let closestPoint = null;
    let segmentIndex = 0;

    // Test each line segment
    for (let i = 0; i < line.points.length - 1; i++) {
      // Use temp vectors instead of creating new ones
      if (!this.pointToVector3Into(line.points[i], _tempVec3A)) continue;
      if (!this.pointToVector3Into(line.points[i + 1], _tempVec3B)) continue;

      // Calculate closest point on line segment to ray - reuse vectors
      _segmentDir.subVectors(_tempVec3B, _tempVec3A);
      const segmentLength = _segmentDir.length();

      if (segmentLength === 0) continue;

      _segmentDir.normalize();

      // Vector from ray origin to segment start - reuse vector
      _rayToStart.subVectors(_tempVec3A, ray.origin);

      // Project ray direction and segment direction
      const rayDotSeg = ray.direction.dot(_segmentDir);
      const rayDotRayToStart = ray.direction.dot(_rayToStart);
      const segDotRayToStart = _segmentDir.dot(_rayToStart);

      const denom = 1 - rayDotSeg * rayDotSeg;

      if (Math.abs(denom) < 0.0001) {
        // Lines are parallel - check distance
        // Note: cross modifies _rayToStart in place, but we don't need it after this
        const distance = _tempVec3C.copy(_rayToStart).cross(ray.direction).length();
        if (distance <= lineWidth) {
          const t = -rayDotRayToStart;
          if (t >= 0) {
            _pointOnRay.copy(ray.direction).multiplyScalar(t).add(ray.origin);
            const projOnSegment = _segmentDir.dot(
              _tempVec3D.subVectors(_pointOnRay, _tempVec3A)
            );

            if (projOnSegment >= 0 && projOnSegment <= segmentLength) {
              if (t < closestDistance) {
                closestDistance = t;
                // Clone here since we need to keep the result
                closestPoint = _pointOnRay.clone();
                segmentIndex = i;
              }
            }
          }
        }
      } else {
        // Lines are not parallel
        const t = (segDotRayToStart - rayDotSeg * rayDotRayToStart) / denom;
        const s = (rayDotRayToStart - rayDotSeg * segDotRayToStart) / denom;

        if (t >= 0 && s >= 0 && s <= segmentLength) {
          _pointOnRay.copy(ray.direction).multiplyScalar(t).add(ray.origin);
          _pointOnSegment.copy(_segmentDir).multiplyScalar(s).add(_tempVec3A);
          const distance = _pointOnRay.distanceTo(_pointOnSegment);

          if (distance <= lineWidth && t < closestDistance) {
            closestDistance = t;
            // Clone here since we need to keep the result
            closestPoint = _pointOnRay.clone();
            segmentIndex = i;
          }
        }
      }
    }

    if (closestPoint) {
      return {
        distance: closestDistance,
        point: closestPoint,
        object: line,
        segmentIndex: segmentIndex,
        face: null,
        faceIndex: null,
        uv: null,
      };
    }

    return null;
  }

  /**
   * Convert point to Vector3 into a target vector (no allocation)
   */
  pointToVector3Into(point, target) {
    if (!point) return false;

    if (point && typeof point === 'object' && 'x' in point) {
      target.set(point.x, point.y, point.z);
      return true;
    } else if (Array.isArray(point) && point.length >= 3) {
      target.set(point[0], point[1], point[2]);
      return true;
    }

    return false;
  }

  /**
   * Convert point to Vector3 (handles both arrays and Vector3 objects)
   * @deprecated Use pointToVector3Into for better performance
   */
  pointToVector3(point) {
    if (!point) return null;

    if (point && typeof point === 'object' && 'x' in point) {
      return new THREE.Vector3(point.x, point.y, point.z);
    } else if (Array.isArray(point) && point.length >= 3) {
      return new THREE.Vector3(point[0], point[1], point[2]);
    }

    return null;
  }

  /**
   * Intersection test for virtual objects (created from state data)
   */
  intersectVirtualObject(raycaster, virtualObject) {
    if (!virtualObject.position) {
      return null;
    }

    const ray = raycaster.ray;
    const position = virtualObject.position;
    const scale = virtualObject.scale || { x: 1, y: 1, z: 1 };

    // Always create a large, easy-to-hit bounding box for debugging
    const size = 10; // Large size to ensure we can hit it
    // Reuse temp vectors instead of allocating new ones
    _tempMin.set(
      position.x - size,
      position.y - size,
      position.z - size
    );
    _tempMax.set(
      position.x + size,
      position.y + size,
      position.z + size
    );
    _tempBox3.set(_tempMin, _tempMax);

    // Test basic ray-box intersection first - reuse intersection point vector
    const intersectionResult = ray.intersectBox(_tempBox3, _intersectionPoint);

    // Debug every test for the first 3 virtual objects

    if (intersectionResult) {
      const distance = ray.origin.distanceTo(intersectionResult);

      // Ensure distance is valid
      if (isNaN(distance) || distance < 0) {
        console.warn('🎯 Invalid distance calculated:', distance);
        return null;
      }

      return {
        distance: distance,
        point: intersectionResult.clone(),
        object: virtualObject,
        face: null,
        faceIndex: null,
        uv: null,
        // Mark as virtual for special handling
        _isVirtualIntersection: true,
        _originalData: virtualObject.userData?.originalData,
      };
    }

    return null;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      nodesInTree: this.countNodes(this.bvhRoot),
      maxDepth: this.getMaxDepth(this.bvhRoot),
      objectCount: this.objects.length,
      connectionLineCount: this.connectionLines.length,
    };
  }

  /**
   * Count total nodes in tree
   */
  countNodes(node) {
    if (!node) return 0;

    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  /**
   * Get maximum depth of tree
   */
  getMaxDepth(node) {
    if (!node || node.isLeaf) return node?.depth || 0;

    let maxDepth = node.depth;
    for (const child of node.children) {
      maxDepth = Math.max(maxDepth, this.getMaxDepth(child));
    }
    return maxDepth;
  }
}

// Global BVH instance
let globalBVH = null;

/**
 * Initialize the global BVH system
 */
export const initBVHRaycasting = () => {
  if (!globalBVH) {
    globalBVH = new BVHAcceleratedRaycaster();
  }
  return globalBVH;
};

/**
 * Get the global BVH instance
 */
export const getBVH = () => {
  if (!globalBVH) {
    globalBVH = initBVHRaycasting();
  }
  return globalBVH;
};

/**
 * Update the BVH with current scene objects
 */
export const updateBVHObjects = (objects) => {
  const bvh = getBVH();
  bvh.setObjects(objects);
};

/**
 * Perform BVH-accelerated raycasting
 */
export const bvhIntersectObjects = (raycaster, recursive = true) => {
  const bvh = getBVH();
  return bvh.intersectObjects(raycaster, recursive);
};

/**
 * Get BVH performance statistics
 */
export const getBVHStats = () => {
  const bvh = getBVH();
  return bvh.getStats();
};

/**
 * Calculate LOD levels for all objects based on camera position
 * This should be called from useFrame in a component with camera access
 * 
 * @param {THREE.Camera} camera - The active camera
 * @param {Array} objects - Array of objects with position data (from objectsStore)
 * @param {number} throttleMs - Minimum time between LOD updates (default: 100ms)
 */
let lastLODUpdateTime = 0;
export const updateLODLevels = (camera, objects, throttleMs = 100) => {
  const now = Date.now();
  if (now - lastLODUpdateTime < throttleMs) {
    return; // Throttle updates
  }
  lastLODUpdateTime = now;
  
  if (!camera || !objects || objects.length === 0) {
    return;
  }
  
  const lodStore = useLODStore.getState();
  const { childParentMap, lodEnabled } = lodStore;
  
  if (!lodEnabled) {
    return;
  }
  
  // Get camera world position
  _lodCameraPos.setFromMatrixPosition(camera.matrixWorld);
  
  // Calculate LOD updates for children of containers
  const lodUpdates = [];
  
  for (const obj of objects) {
    // Only calculate LOD for objects that are children of containers
    if (!childParentMap.has(obj.id)) {
      continue;
    }
    
    // Get object position
    const pos = obj.position;
    if (!pos) continue;
    
    if (Array.isArray(pos)) {
      _lodObjectPos.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    } else if (pos.x !== undefined) {
      _lodObjectPos.set(pos.x, pos.y, pos.z);
    } else {
      continue;
    }
    
    // Calculate distance to camera
    const distance = _lodCameraPos.distanceTo(_lodObjectPos);
    
    // Calculate LOD level
    const lodLevel = calculateLODLevel(distance);
    
    // Only update if changed
    const currentLevel = lodStore.lodLevels.get(obj.id);
    if (currentLevel !== lodLevel) {
      lodUpdates.push([obj.id, lodLevel]);
    }
  }
  
  // Batch update LOD levels
  if (lodUpdates.length > 0) {
    lodStore.batchSetLODLevels(lodUpdates);
  }
};

/**
 * Register parent-child relationships from objects array
 * Call this when objects are loaded/updated
 * 
 * @param {Array} objects - Array of objects from objectsStore
 */
export const registerObjectRelationships = (objects) => {
  if (!objects || objects.length === 0) return;
  
  const lodStore = useLODStore.getState();
  const relationships = [];
  
  // Find all container objects and their children
  const containers = objects.filter(obj => obj.merfolkData?.isContainer);
  
  for (const container of containers) {
    // Find children by checking if they reference this container as parent
    // or by spatial containment (objects positioned inside container bounds)
    const containerId = container.id;
    const containerPos = container.position || [0, 0, 0];
    const containerScale = container.scale || [1, 1, 1];
    
    // Calculate container bounds (approximate)
    const halfSize = [
      (containerScale[0] || 1) * 5, // CUBE_SIZE is typically 5
      (containerScale[1] || 1) * 5,
      (containerScale[2] || 1) * 5,
    ];
    
    for (const obj of objects) {
      // Skip containers themselves and self-reference
      if (obj.merfolkData?.isContainer || obj.id === containerId) {
        continue;
      }
      
      // Check if object has explicit parent reference
      if (obj.merfolkData?.parentId === containerId) {
        relationships.push({ parentId: containerId, childId: obj.id });
        continue;
      }
      
      // Check spatial containment
      const objPos = obj.position;
      if (!objPos) continue;
      
      const ox = objPos[0] || 0;
      const oy = objPos[1] || 0;
      const oz = objPos[2] || 0;
      const cx = containerPos[0] || 0;
      const cy = containerPos[1] || 0;
      const cz = containerPos[2] || 0;
      
      // Check if object is inside container bounds
      if (
        Math.abs(ox - cx) < halfSize[0] &&
        Math.abs(oy - cy) < halfSize[1] &&
        Math.abs(oz - cz) < halfSize[2]
      ) {
        relationships.push({ parentId: containerId, childId: obj.id });
      }
    }
  }
  
  // Batch register relationships
  if (relationships.length > 0) {
    lodStore.batchRegisterParentChild(relationships);
  }
};

export default {
  initBVHRaycasting,
  getBVH,
  updateBVHObjects,
  bvhIntersectObjects,
  getBVHStats,
  updateLODLevels,
  registerObjectRelationships,
};
