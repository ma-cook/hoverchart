import * as THREE from 'three';

/**
 * BVH (Bounding Volume Hierarchy) Accelerated Raycasting System
 *
 * This system creates a spatial hierarchy to dramatically improve raycasting performance
 * by allowing the raycaster to quickly skip large groups of objects that can't possibly
 * be intersected by the ray.
 */

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
      const objectBounds = new THREE.Box3();

      // Handle connection lines specially
      if (object._isConnectionLine && object.points) {
        this.calculateLineBounds(object, objectBounds);
      }
      // Handle different 3D object types
      else if (object.geometry) {
        if (!object.geometry.boundingBox) {
          object.geometry.computeBoundingBox();
        }
        objectBounds.copy(object.geometry.boundingBox);
        objectBounds.applyMatrix4(object.matrixWorld);
      } else if (object.position) {
        // Fallback for objects without geometry (like groups)
        const pos = object.position;
        const size = object.scale
          ? Math.max(...Object.values(object.scale)) * 5
          : 5;
        objectBounds.setFromCenterAndSize(
          new THREE.Vector3(
            pos[0] || pos.x || 0,
            pos[1] || pos.y || 0,
            pos[2] || pos.z || 0
          ),
          new THREE.Vector3(size, size, size)
        );
      }

      node.bounds.union(objectBounds);
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

      bounds.expandByPoint(new THREE.Vector3(x, y, z));
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

    const size = node.bounds.getSize(new THREE.Vector3());

    // Find the longest axis to split on
    let splitAxis = 0;
    if (size.y > size.x) splitAxis = 1;
    if (size.z > size[splitAxis === 0 ? 'x' : splitAxis === 1 ? 'y' : 'z'])
      splitAxis = 2;

    // Calculate split position (middle of bounds)
    const splitPos = node.bounds.min
      .clone()
      .add(node.bounds.max)
      .multiplyScalar(0.5);
    const splitValue = splitPos.getComponent(splitAxis);

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
        const bounds = object.geometry.boundingBox.clone();
        bounds.applyMatrix4(object.matrixWorld);
        objectCenter = bounds
          .getCenter(new THREE.Vector3())
          .getComponent(splitAxis);
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
                  const objectBounds = new THREE.Box3().setFromObject(object);
                  const cameraPosition = raycaster.ray.origin;

                  if (objectBounds.containsPoint(cameraPosition)) {
                    // Camera is inside - mark for special handling
                    intersection._cameraInside = true;
                    intersection._objectSize = objectBounds
                      .getSize(new THREE.Vector3())
                      .length();
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
      const cameraPos = raycaster.ray.origin;
      const childDistances = node.children.map((child) => ({
        child,
        distance: child.bounds.distanceToPoint(cameraPos),
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
      const start = this.pointToVector3(line.points[i]);
      const end = this.pointToVector3(line.points[i + 1]);

      if (!start || !end) continue;

      // Calculate closest point on line segment to ray
      const segmentDir = new THREE.Vector3().subVectors(end, start);
      const segmentLength = segmentDir.length();

      if (segmentLength === 0) continue;

      segmentDir.normalize();

      // Vector from ray origin to segment start
      const rayToStart = new THREE.Vector3().subVectors(start, ray.origin);

      // Project ray direction and segment direction
      const rayDotSeg = ray.direction.dot(segmentDir);
      const rayDotRayToStart = ray.direction.dot(rayToStart);
      const segDotRayToStart = segmentDir.dot(rayToStart);

      const denom = 1 - rayDotSeg * rayDotSeg;

      if (Math.abs(denom) < 0.0001) {
        // Lines are parallel - check distance
        const distance = rayToStart.cross(ray.direction).length();
        if (distance <= lineWidth) {
          const t = -rayDotRayToStart;
          if (t >= 0) {
            const pointOnRay = new THREE.Vector3().addVectors(
              ray.origin,
              ray.direction.clone().multiplyScalar(t)
            );
            const projOnSegment = segmentDir.dot(
              new THREE.Vector3().subVectors(pointOnRay, start)
            );

            if (projOnSegment >= 0 && projOnSegment <= segmentLength) {
              if (t < closestDistance) {
                closestDistance = t;
                closestPoint = pointOnRay;
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
          const pointOnRay = new THREE.Vector3().addVectors(
            ray.origin,
            ray.direction.clone().multiplyScalar(t)
          );
          const pointOnSegment = new THREE.Vector3().addVectors(
            start,
            segmentDir.clone().multiplyScalar(s)
          );
          const distance = pointOnRay.distanceTo(pointOnSegment);

          if (distance <= lineWidth && t < closestDistance) {
            closestDistance = t;
            closestPoint = pointOnRay;
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
   * Convert point to Vector3 (handles both arrays and Vector3 objects)
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
    const box = new THREE.Box3(
      new THREE.Vector3(
        position.x - size,
        position.y - size,
        position.z - size
      ),
      new THREE.Vector3(position.x + size, position.y + size, position.z + size)
    );

    // Test basic ray-box intersection first

    const intersectionResult = ray.intersectBox(box, new THREE.Vector3());

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

export default {
  initBVHRaycasting,
  getBVH,
  updateBVHObjects,
  bvhIntersectObjects,
  getBVHStats,
};
