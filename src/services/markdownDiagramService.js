import { MarkdownProcessor } from '3d-ast-generator';
import * as THREE from 'three';
import useConnectionStore from '../stores/connectionStore';
import { useObjectsStore } from '../stores';
import {
  pauseConnectionListeners,
  resumeConnectionListeners,
} from './connectionsService';
import {
  bulkSaveConnectionsToCell,
  getCellCoordinates,
  getCellId,
} from './spatialPartitioning';
import { auth } from '../firebase';

/**
 * Service for processing Markdown files containing Merfolk diagrams
 * and converting them to 3D objects and connections
 */
export class MarkdownDiagramService {
  // Node type constants
  static NODE_TYPE_COMPONENT = 'component';
  static NODE_TYPE_FUNCTION = 'function';
  static NODE_TYPE_STORE = 'store';
  static NODE_TYPE_SERVICE = 'service';
  static NODE_TYPE_LIBRARY = 'library';
  static NODE_TYPE_UTILITY = 'utility';
  static NODE_TYPE_DATAPATH = 'datapath';
  static NODE_TYPE_HANDLER = 'handler';
  static NODE_TYPE_CONTROL = 'control';
  static NODE_TYPE_STATE = 'state';
  static NODE_TYPE_DATA = 'data';
  static NODE_TYPE_HOOK = 'hook';

  // Object type constants
  static OBJECT_TYPE_CUBE = 'cube';
  static OBJECT_TYPE_DODECAHEDRON = 'dodecahedron';
  static OBJECT_TYPE_TETRAHEDRON = 'tetrahedron';

  // UI component identifiers
  static UI_COMPONENTS = [
    'HeaderInput',
    'FaceTextInput',
    'TextObjectUI',
    'TextStyleUIContainer',
  ];

  // Magic number constants
  static MAX_RECURSION_DEPTH = 15;
  static BASE_DODECAHEDRON_SIZE = 10;
  static BASE_DODECAHEDRON_RADIUS = 10;
  static DEFAULT_CAMERA_DISTANCE = 15;
  static SPACING_BETWEEN_COMPONENTS = 200;
  static DEFAULT_CUBE_SIZE = 5;
  static DEFAULT_SPHERE_SIZE = 4;
  static DEFAULT_CONTAINER_SIZE = 50;
  static MIN_SCALE_FACTOR = 1.0;
  static DESIRED_GAP = 8;

  constructor() {
    this.processor = null;
    this.scaleCache = new Map(); // Cache for dodecahedron scale calculations
    this.boundingBoxCache = new Map(); // Cache for bounding box calculations
  }

  /**
   * Check if a node ID belongs to a UI component
   * @param {string} nodeId - The node ID to check
   * @returns {boolean} - True if the node is a UI component
   */
  static isUIComponent(nodeId) {
    return MarkdownDiagramService.UI_COMPONENTS.includes(nodeId);
  }

  /**
   * Filter children by cube-type nodes (function, handler, control)
   * @param {Set} children - Set of child node IDs
   * @param {Map} graphNodes - Map of all nodes
   * @returns {Array} - Array of cube-type child IDs
   */
  filterCubeChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        (childNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_HANDLER ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_CONTROL)
      );
    });
  }

  /**
   * Filter children by component-type nodes
   * @param {Set} children - Set of child node IDs
   * @param {Map} graphNodes - Map of all nodes
   * @returns {Array} - Array of component-type child IDs
   */
  filterComponentChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
      );
    });
  }

  /**
   * Initialize the MarkdownProcessor with default configuration
   */
  initializeProcessor() {
    this.processor = new MarkdownProcessor({
      layout: {
        algorithm: 'none', // Try to disable automatic layout entirely
        nodeSpacing: 60.0, // Keep spacing for relative positioning between objects
        layers: 5,
        basePosition: [0, 0, 0], // Set base to origin, we'll add camera offset in our code
        enableAutoLayout: false, // Disable automatic positioning
      },
      visual: {
        theme: 'dark',
        colors: {
          function: '#4CAF50', // Green for functions
          component: '#2196F3', // Blue for components
          datapath: '#FF9800', // Orange for datapaths
        },
      },
    });
  }

  /**
   * Get camera position for positioning the objects
   * @returns {Array} - [x, y, z] position
   */
  getCameraBasedPosition() {
    const DEFAULT_POSITION = [0, 0, -50];

    try {
      // Try multiple camera sources
      const workingCamera =
        window.cameraRef?.current?.camera ||
        window.camera ||
        window.orbitControls?.object;

      if (!workingCamera?.position) {
        return DEFAULT_POSITION;
      }

      const cameraDirection = new THREE.Vector3();
      try {
        workingCamera.getWorldDirection(cameraDirection);
      } catch {
        cameraDirection.set(0, 0, -1); // Default forward direction
      }

      // Position diagrams exactly like manual objects - close to camera
      const distance = MarkdownDiagramService.DEFAULT_CAMERA_DISTANCE;
      const cameraPos = workingCamera.position;

      return [
        cameraPos.x + cameraDirection.x * distance,
        cameraPos.y + cameraDirection.y * distance,
        cameraPos.z + cameraDirection.z * distance,
      ];
    } catch {
      return DEFAULT_POSITION;
    }
  }

  /**
   * Build hierarchical relationships from connections
   * @param {Object} graph - The graph object from the processed diagram
   * @returns {Object} - Object containing parentChildMap, childParentMap, and rootNodes
   */
  buildHierarchicalRelationships(graph) {
    const parentChildMap = new Map(); // parent -> Set of children
    const childParentMap = new Map(); // child -> parent
    const rootNodes = new Set(); // nodes with no parents

    // Analyze connections to build parent-child relationships
    if (graph.connections && graph.connections.size > 0) {
      Array.from(graph.connections.values()).forEach((connection) => {
        const sourceId = connection.source?.nodeId || connection.source;
        const targetId = connection.target?.nodeId || connection.target;

        const sourceNode = graph.nodes.get(sourceId);
        const targetNode = graph.nodes.get(targetId);

        // Determine parent-child relationship based on node types
        let parentId = null,
          childId = null;

        if (sourceNode && targetNode) {
          // Functions that connect TO services belong IN those services
          if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
          ) {
            // Function connects TO component = function belongs IN component
            parentId = targetId; // Service is the parent
            childId = sourceId; // Function is the child
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION
          ) {
            // Component connects TO function = function belongs IN component
            parentId = sourceId; // Service is the parent
            childId = targetId; // Function is the child
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
          ) {
            // Component connects TO component = child component belongs IN parent component
            // The source component is the parent, target component is the child
            parentId = sourceId; // Source component is the parent
            childId = targetId; // Target component is the child
          }
          // Skip other connection types - they don't establish containment
        }

        if (parentId && childId) {
          if (!parentChildMap.has(parentId)) {
            parentChildMap.set(parentId, new Set());
          }
          parentChildMap.get(parentId).add(childId);
          childParentMap.set(childId, parentId);
        }
      });
    }

    // Identify root nodes (nodes with no parents)
    Array.from(graph.nodes.keys()).forEach((nodeId) => {
      if (!childParentMap.has(nodeId)) {
        rootNodes.add(nodeId);
      }
    });

    return { parentChildMap, childParentMap, rootNodes };
  }

  /**
   * Determine the 3D object type based on node type
   * @param {Object} node - The node from the graph
   * @returns {string} - The 3D object type
   */
  getObjectTypeForNode(node) {
    // The 3d-ast-generator correctly sets node.type based on bracket syntax:
    // {Component: name} → type: 'component' → Dodecahedron
    // [Function: name] → type: 'function' → Cube
    // [[Store: name]] → type: 'store' → Cube
    // ((Service: name)) → type: 'service' → Tetrahedron
    // <Library: name> → type: 'library' → Cube
    // <<Utility: name>> → type: 'utility' → Cube

    const nodeType = (node.type || '').toLowerCase().trim();

    switch (nodeType) {
      case MarkdownDiagramService.NODE_TYPE_COMPONENT:
        return MarkdownDiagramService.OBJECT_TYPE_DODECAHEDRON;
      case MarkdownDiagramService.NODE_TYPE_SERVICE:
        return MarkdownDiagramService.OBJECT_TYPE_TETRAHEDRON;
      case MarkdownDiagramService.NODE_TYPE_DATAPATH:
        return null;
      case MarkdownDiagramService.NODE_TYPE_FUNCTION:
      case MarkdownDiagramService.NODE_TYPE_STORE:
      case MarkdownDiagramService.NODE_TYPE_LIBRARY:
      case MarkdownDiagramService.NODE_TYPE_UTILITY:
      case MarkdownDiagramService.NODE_TYPE_HOOK:
        return MarkdownDiagramService.OBJECT_TYPE_CUBE;
      default:
        console.warn(
          `⚠️ Unknown node type '${nodeType}' for '${node.id}' - defaulting to cube`
        );
        return MarkdownDiagramService.OBJECT_TYPE_CUBE;
    }
  }

  /**
   * Calculate scale for a dodecahedron based on its children
   * @param {string} nodeId - The node ID
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {number} level - Hierarchy level
   * @returns {Object} - Object containing nodeScale and containerSize
   */
  calculateDodecahedronScale(nodeId, parentChildMap, graphNodes, level = 0) {
    // Use memoization to avoid recalculating the same node multiple times
    const cacheKey = `${nodeId}-${level}`;
    if (this.scaleCache.has(cacheKey)) {
      return this.scaleCache.get(cacheKey);
    }

    const children = parentChildMap.get(nodeId) || new Set();
    const childCount = children.size;

    let nodeScale = [1, 1, 1];
    let containerSize = 25; // Increased base size for circular arrangements

    // Prevent excessive recursion depth to avoid infinite loops, but allow deep hierarchies
    if (level > MarkdownDiagramService.MAX_RECURSION_DEPTH) {
      return { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 }; // Reasonable fallback
    }

    if (childCount === 0) {
      // Default scale for dodecahedrons without children - slightly larger for visibility
      const result = { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 };
      this.scaleCache.set(cacheKey, result);
      return result;
    }

    // Calculate children count and determine scale
    const cubeChildren = this.filterCubeChildren(children, graphNodes);
    const componentChildren = this.filterComponentChildren(
      children,
      graphNodes
    );
    const totalNestedChildren = cubeChildren.length + componentChildren.length;

    if (totalNestedChildren > 0) {
      // For cone-based hierarchies, use more conservative scaling
      // Only scale for functions contained within components, not for child components
      let maxChildSize = this.calculateMaxChildSize(
        children,
        parentChildMap,
        graphNodes,
        level // Pass the level for proper recursive calculation
      );

      // Conservative scaling since child components are positioned outside parent
      const baseSiblingSpacing = Math.max(
        25,
        maxChildSize * 1.5 + MarkdownDiagramService.DESIRED_GAP
      );

      // Calculate required space - much more conservative for cone structure
      let requiredSpace;
      const functionsOnly =
        cubeChildren.length > 0 && componentChildren.length === 0;

      if (functionsOnly) {
        // Only scaling for contained functions, not external child components
        if (cubeChildren.length === 1) {
          requiredSpace = maxChildSize * 2; // More space for single function
        } else if (cubeChildren.length <= 8) {
          requiredSpace = baseSiblingSpacing + maxChildSize;
        } else {
          const gridSize3D = Math.ceil(Math.pow(cubeChildren.length, 1 / 3));
          requiredSpace = (gridSize3D - 1) * baseSiblingSpacing + maxChildSize;
        }
      } else if (cubeChildren.length > 0) {
        // Has both functions AND components - scale for functions that need to be contained
        if (cubeChildren.length === 1) {
          requiredSpace = maxChildSize * 2; // More space for single function
        } else if (cubeChildren.length <= 8) {
          requiredSpace = baseSiblingSpacing + maxChildSize;
        } else {
          const gridSize3D = Math.ceil(Math.pow(cubeChildren.length, 1 / 3));
          requiredSpace = (gridSize3D - 1) * baseSiblingSpacing + maxChildSize;
        }
      } else {
        // Only component children (they go outside anyway)
        requiredSpace = maxChildSize * 1.2;
      }

      // Conservative padding for cone structure
      const adaptivePadding =
        functionsOnly || cubeChildren.length > 0
          ? Math.max(20, maxChildSize * 0.4) // More padding for internal functions
          : 5; // Minimal padding if child components are external

      const requiredSize = requiredSpace + adaptivePadding;

      // Much more conservative scaling for cone structure
      const scaleFactor = Math.max(
        MarkdownDiagramService.MIN_SCALE_FACTOR,
        requiredSize / MarkdownDiagramService.BASE_DODECAHEDRON_SIZE
      );

      nodeScale = [scaleFactor, scaleFactor, scaleFactor];
      containerSize =
        MarkdownDiagramService.BASE_DODECAHEDRON_SIZE * scaleFactor;
    }

    const result = { nodeScale, containerSize };
    this.scaleCache.set(cacheKey, result); // Cache the result
    return result;
  }

  /**
   * Calculate the maximum child size for spacing calculations
   * Recursively calculates actual child sizes including all nested hierarchy
   * @param {Set} children - Set of child node IDs
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {number} level - Current hierarchy level for recursion depth tracking
   * @returns {number} - Maximum child size
   */
  calculateMaxChildSize(children, parentChildMap, graphNodes, level = 0) {
    let maxChildSize = 0;

    // Prevent excessive recursion depth to avoid infinite loops
    if (level > MarkdownDiagramService.MAX_RECURSION_DEPTH) {
      return MarkdownDiagramService.BASE_DODECAHEDRON_SIZE;
    }

    Array.from(children).forEach((childId) => {
      const childNode = graphNodes.get(childId);

      if (
        childNode &&
        childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
      ) {
        // For child components in cone structure, use conservative sizing
        // since they're positioned externally, we don't need their full recursive size
        const childScale = this.calculateDodecahedronScale(
          childId,
          parentChildMap,
          graphNodes,
          level + 1
        );

        // Use more conservative scaling for cone structure - child components are external
        const childActualSize =
          MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS *
          Math.min(2.0, Math.max(...childScale.nodeScale));

        maxChildSize = Math.max(maxChildSize, childActualSize);
      } else if (
        childNode &&
        (childNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_HANDLER ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_CONTROL)
      ) {
        maxChildSize = Math.max(
          maxChildSize,
          MarkdownDiagramService.DEFAULT_CUBE_SIZE
        );
      } else if (
        childNode &&
        (childNode.type === MarkdownDiagramService.NODE_TYPE_STATE ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_DATA)
      ) {
        maxChildSize = Math.max(
          maxChildSize,
          MarkdownDiagramService.DEFAULT_SPHERE_SIZE
        );
      } else {
        maxChildSize = Math.max(
          maxChildSize,
          MarkdownDiagramService.DEFAULT_CUBE_SIZE
        );
      }
    });

    return maxChildSize;
  }

  /**
   * Count nested children of a given set of children
   * @param {Set} children - Set of child node IDs
   * @param {Map} graphNodes - Map of all nodes
   * @returns {number} - Count of nested children
   */
  countNestedChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        (childNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_HANDLER ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_CONTROL ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT)
      );
    }).length;
  }

  /**
   * Calculate the total bounding box size needed for a component and all its descendants
   * This prevents cousin groups from overlapping by reserving enough space
   * @param {string} nodeId - The node ID
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {number} level - Hierarchy level
   * @returns {Object} - Object containing width and height of the bounding box
   */
  calculateSubtreeBoundingBox(nodeId, parentChildMap, graphNodes, level = 0) {
    // Prevent excessive recursion depth to avoid stack overflow
    if (level > MarkdownDiagramService.MAX_RECURSION_DEPTH) {
      console.warn(
        `⚠️ Max recursion depth reached for bounding box calculation of ${nodeId}`
      );
      return { width: 100, height: 100 }; // Reasonable fallback
    }

    // Use memoization to avoid recalculating the same node multiple times
    const cacheKey = `${nodeId}-${level}`;
    if (this.boundingBoxCache.has(cacheKey)) {
      return this.boundingBoxCache.get(cacheKey);
    }

    const node = graphNodes.get(nodeId);
    if (!node || node.type !== MarkdownDiagramService.NODE_TYPE_COMPONENT) {
      // Non-components have minimal size
      const result = { width: 20, height: 20 };
      this.boundingBoxCache.set(cacheKey, result);
      return result;
    }

    // Get this component's actual size
    const componentScale = this.calculateDodecahedronScale(
      nodeId,
      parentChildMap,
      graphNodes,
      level
    );
    const actualComponentSize =
      MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS *
      Math.max(...componentScale.nodeScale);

    // Get component children (not function children, as those are contained within)
    const children = parentChildMap.get(nodeId) || new Set();
    const componentChildren = Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return childNode && childNode.type === 'component';
    });

    if (componentChildren.length === 0) {
      // Leaf component - just its own size
      const result = {
        width: actualComponentSize * 2,
        height: actualComponentSize * 2,
      };
      this.boundingBoxCache.set(cacheKey, result);
      return result;
    }

    // Calculate bounding boxes for all children recursively
    const childBoundingBoxes = componentChildren.map((childId) =>
      this.calculateSubtreeBoundingBox(
        childId,
        parentChildMap,
        graphNodes,
        level + 1
      )
    );

    // Calculate grid dimensions for children
    const gridSize = Math.ceil(Math.sqrt(componentChildren.length));

    // Find max child dimensions to ensure grid cells are large enough
    const maxChildWidth = Math.max(
      ...childBoundingBoxes.map((bb) => bb.width),
      0
    );
    const maxChildHeight = Math.max(
      ...childBoundingBoxes.map((bb) => bb.height),
      0
    );

    // Calculate total grid size
    const gridWidth =
      gridSize *
      (maxChildWidth + MarkdownDiagramService.SPACING_BETWEEN_COMPONENTS);
    const gridHeight =
      gridSize *
      (maxChildHeight + MarkdownDiagramService.SPACING_BETWEEN_COMPONENTS);

    // The total bounding box is the larger of:
    // 1. The grid containing all children
    // 2. The component's own size
    const totalWidth = Math.max(gridWidth, actualComponentSize * 2);
    const totalHeight = Math.max(gridHeight, actualComponentSize * 2);

    const result = {
      width: totalWidth,
      height: totalHeight,
    };
    this.boundingBoxCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate position for a node in the hierarchy
   * @param {string} nodeId - The node ID
   * @param {Array} basePosition - Base position for root level
   * @param {number} level - Hierarchy level
   * @param {number} siblingIndex - Index among siblings
   * @param {number} siblingCount - Total number of siblings
   * @param {Array} parentPosition - Position of parent node
   * @param {number} containerSize - Size of parent container
   * @param {Set} rootNodes - Set of root node IDs
   * @param {Map} graphNodes - Map of all nodes
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @returns {Array} - [x, y, z] position
   */
  calculateNodePosition(
    nodeId,
    basePosition,
    level,
    siblingIndex,
    siblingCount,
    parentPosition,
    containerSize,
    rootNodes,
    graphNodes,
    parentChildMap // Added parameter for calculating actual component sizes
  ) {
    // Get node type to determine positioning strategy
    const node = graphNodes.get(nodeId);
    const nodeType = node ? node.type : 'unknown';

    // Add Y offset for component hierarchies to raise them 300 units higher
    const componentYOffset = 1300;

    if (level === 0) {
      // Root level - arrange in a reasonable grid pattern with adequate spacing for circular children
      const rootArray = Array.from(rootNodes);
      const rootIndex = rootArray.indexOf(nodeId);

      if (rootArray.length === 1) {
        return [
          basePosition[0],
          basePosition[1] + componentYOffset,
          basePosition[2],
        ];
      } else {
        const gridSize = Math.ceil(Math.sqrt(rootArray.length));
        const row = Math.floor(rootIndex / gridSize);
        const col = rootIndex % gridSize;

        // Increased spacing to accommodate circular child arrangements
        const spacing = 200; // Increased spacing to prevent overlap of circular arrangements

        return [
          basePosition[0] + (col - (gridSize - 1) / 2) * spacing,
          basePosition[1] +
            (row - (gridSize - 1) / 2) * spacing +
            componentYOffset,
          basePosition[2],
        ];
      }
    } else {
      // Nested level - different strategies for components vs functions

      if (nodeType === 'component') {
        // COMPONENT POSITIONING: Dynamic square grid arrangement around parent
        // Use actual component sizes (not subtrees) and 200 units spacing

        const spacingBetweenComponents = 200; // Fixed spacing between sibling components
        const baseDodecahedronRadius = 10; // Base dodecahedron size

        // Calculate the actual size of this component (not its entire subtree)
        const componentScale = this.calculateDodecahedronScale(
          nodeId,
          parentChildMap,
          graphNodes,
          level
        );
        const actualComponentSize =
          baseDodecahedronRadius * Math.max(...componentScale.nodeScale);

        // Significant Y offset to ensure child components are well below parent containers
        // This prevents child containers from intersecting with parent containers
        const depthOffset = level * 100; // Increased from 20 to 300 for clear vertical separation

        if (siblingCount === 1) {
          // Single child component - place directly to the right of parent
          const totalSpacing =
            actualComponentSize * 2 + spacingBetweenComponents;
          return [
            parentPosition[0] + totalSpacing,
            parentPosition[1] - depthOffset,
            parentPosition[2],
          ];
        } else {
          // Multiple child components - arrange in a square grid
          const gridSize = Math.ceil(Math.sqrt(siblingCount));
          const row = Math.floor(siblingIndex / gridSize);
          const col = siblingIndex % gridSize;

          // Calculate max actual component size among all siblings (not subtrees)
          let maxComponentSize = actualComponentSize;

          // Try to find siblings to get their actual sizes
          try {
            for (const [, children] of parentChildMap.entries()) {
              if (children.has(nodeId)) {
                // Found our parent, get all sibling components
                const siblings = Array.from(children).filter((sibId) => {
                  const sibNode = graphNodes.get(sibId);
                  return sibNode && sibNode.type === 'component';
                });

                // Calculate max component size across all siblings
                siblings.forEach((sibId) => {
                  const sibScale = this.calculateDodecahedronScale(
                    sibId,
                    parentChildMap,
                    graphNodes,
                    level
                  );
                  const sibSize =
                    baseDodecahedronRadius * Math.max(...sibScale.nodeScale);
                  maxComponentSize = Math.max(maxComponentSize, sibSize);
                });
                break;
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ Error calculating sibling sizes for ${nodeId}:`,
              error
            );
          }

          // Total spacing includes the max component size plus the gap
          const cellWidth = maxComponentSize * 2 + spacingBetweenComponents;
          const cellHeight = maxComponentSize * 2 + spacingBetweenComponents;

          // Calculate grid dimensions to center it around the parent
          const gridWidth = (gridSize - 1) * cellWidth;
          const gridHeight = (gridSize - 1) * cellHeight;

          // Offset to center the grid around parent position
          const offsetX = col * cellWidth - gridWidth / 2;
          const offsetZ = row * cellHeight - gridHeight / 2;

          // Add level-based offset to separate nested layers from parent
          const layerOffset = (level - 1) * cellWidth;

          return [
            parentPosition[0] + offsetX + layerOffset,
            parentPosition[1] - depthOffset,
            parentPosition[2] + offsetZ,
          ];
        }
      } else {
        // FUNCTION POSITIONING: Contained within parent component (traditional approach)
        if (siblingCount === 1) {
          // Single child function at parent's center
          return [...parentPosition];
        } else if (siblingCount <= 8) {
          // Corner positioning for small groups within parent
          const positions = this.getCornerPositions(containerSize * 0.4);
          const safeIndex = Math.min(siblingIndex, positions.length - 1);
          const selectedPosition = positions[safeIndex];

          return [
            parentPosition[0] + selectedPosition[0],
            parentPosition[1] + selectedPosition[1],
            parentPosition[2] + selectedPosition[2],
          ];
        } else {
          // 3D grid for larger groups within parent
          const gridSize = Math.ceil(Math.pow(siblingCount, 1 / 3));
          const layer = Math.floor(siblingIndex / (gridSize * gridSize));
          const remaining = siblingIndex % (gridSize * gridSize);
          const row = Math.floor(remaining / gridSize);
          const col = remaining % gridSize;

          const spacing = (containerSize * 0.8) / Math.max(1, gridSize - 1);

          return [
            parentPosition[0] + (col - (gridSize - 1) / 2) * spacing,
            parentPosition[1] + (row - (gridSize - 1) / 2) * spacing,
            parentPosition[2] + (layer - (gridSize - 1) / 2) * spacing,
          ];
        }
      }
    }
  }

  /**
   * Get corner positions for small groups (up to 8 objects)
   * @param {number} radius - Radius for positioning
   * @returns {Array} - Array of [x, y, z] positions
   */
  getCornerPositions(radius) {
    return [
      [-radius, -radius, -radius], // Bottom-back-left
      [radius, -radius, -radius], // Bottom-back-right
      [-radius, radius, -radius], // Bottom-front-left
      [radius, radius, -radius], // Bottom-front-right
      [-radius, -radius, radius], // Top-back-left
      [radius, -radius, radius], // Top-back-right
      [-radius, radius, radius], // Top-front-left
      [radius, radius, radius], // Top-front-right
    ];
  }

  /**
   * Process hierarchical node positioning
   * @param {string} nodeId - The node ID to process
   * @param {Object} context - Processing context containing all maps and data
   * @param {Array} parentPosition - Position of parent node
   * @param {number} level - Hierarchy level
   * @param {number} siblingIndex - Index among siblings
   * @param {number} siblingCount - Total number of siblings
   * @param {number} parentContainerSize - Size of parent container
   */
  positionNodeHierarchy(
    nodeId,
    context,
    parentPosition,
    level = 0,
    siblingIndex = 0,
    siblingCount = 1,
    parentContainerSize = 50
  ) {
    const {
      parentChildMap,
      childParentMap,
      graphNodes,
      rootNodes,
      basePosition,
      nodePositions,
      nodeScales,
      processedNodes,
    } = context;

    if (processedNodes.has(nodeId)) return;

    const node = graphNodes.get(nodeId);
    if (!node) return;

    processedNodes.add(nodeId);

    // Skip datapath nodes
    if (node.type === MarkdownDiagramService.NODE_TYPE_DATAPATH) {
      return;
    }

    // Skip top-level utility functions, services, and stores - they are positioned by positionGroupedNodes
    // Top-level functions (utilities) have no parent and will be grouped separately
    const nodeType = (node.type || '').toLowerCase().trim();
    const isTopLevel = !childParentMap.has(nodeId);

    if (
      nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE ||
      nodeType === MarkdownDiagramService.NODE_TYPE_STORE
    ) {
      return; // Always skip services and stores for grouped positioning
    }

    if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION && isTopLevel) {
      return; // Skip top-level functions (utility modules) for grouped positioning
    }

    // Determine object type
    const objectType = this.getObjectTypeForNode(node);
    if (!objectType) return;

    // Calculate scale and container size
    let nodeScale = [1, 1, 1];
    let containerSize = MarkdownDiagramService.DEFAULT_CONTAINER_SIZE;

    if (objectType === MarkdownDiagramService.OBJECT_TYPE_DODECAHEDRON) {
      const scaleResult = this.calculateDodecahedronScale(
        nodeId,
        parentChildMap,
        graphNodes,
        level
      );
      nodeScale = scaleResult.nodeScale;
      containerSize = scaleResult.containerSize;
    }

    // Calculate position

    const nodePosition = this.calculateNodePosition(
      nodeId,
      basePosition,
      level,
      siblingIndex,
      siblingCount,
      parentPosition,
      parentContainerSize,
      rootNodes,
      graphNodes,
      parentChildMap
    );

    // Store position and scale
    nodePositions.set(nodeId, nodePosition);
    nodeScales.set(nodeId, nodeScale);

    // Process children recursively
    const children = parentChildMap.get(nodeId) || new Set();
    if (children.size > 0) {
      // Sort children by ID to ensure consistent ordering for circular arrangement
      const childArray = Array.from(children).sort();
      childArray.forEach((childId, index) => {
        this.positionNodeHierarchy(
          childId,
          context,
          nodePosition,
          level + 1,
          index,
          childArray.length,
          containerSize
        );
      });
    }
  }

  /**
   * Position utility modules, services, and stores in grouped square grids
   * @param {Object} context - Processing context containing all maps and data
   */
  positionGroupedNodes(context) {
    const {
      graphNodes,
      childParentMap,
      nodePositions,
      nodeScales,
      basePosition,
    } = context;

    // Collect top-level nodes by type (nodes without parents)
    const utilityNodes = []; // Top-level function nodes (utility modules)
    const serviceNodes = [];
    const storeNodes = [];
    const ungroupedComponents = []; // Top-level component nodes (not in hierarchy)

    for (const [nodeId, node] of graphNodes.entries()) {
      // Only include top-level nodes (nodes without parents)
      if (childParentMap.has(nodeId)) {
        continue; // Skip nodes that have parents
      }

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        // Top-level functions are utility modules
        utilityNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE) {
        serviceNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      } else if (
        nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
        nodeId !== 'MainEntry'
      ) {
        // Top-level components that aren't in the hierarchy
        ungroupedComponents.push(nodeId);
      }
    }

    // Position each group in a horizontal square grid
    const nodeSpacing = 50; // Spacing between nodes in the grid

    const positionGroup = (nodes, xOffset, yOffset, zOffset) => {
      if (nodes.length === 0) return;

      const gridSize = Math.ceil(Math.sqrt(nodes.length));

      nodes.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        const position = [
          basePosition[0] + xOffset + col * nodeSpacing,
          basePosition[1] + yOffset,
          basePosition[2] + zOffset + row * nodeSpacing,
        ];

        nodePositions.set(nodeId, position);
        nodeScales.set(nodeId, [1, 1, 1]); // Default scale for grouped nodes
      });
    };

    // Position groups at specific offsets from base position
    // Utility Modules: left front, below (-800, -500, 0)
    positionGroup(utilityNodes, -800, -500, 400);

    // Services: left back, below (-800, -500, -600)
    positionGroup(serviceNodes, -400, -0, 400);

    // Stores: center, below (0, -500, 0)
    positionGroup(storeNodes, 0, -500, 400);

    // Ungrouped Components: center, above (0, +600, 0)
    // Position 100 units above the top-level component grouping
    positionGroup(ungroupedComponents, 0, 600, 200);
  }

  /**
   * Create container cubes around grouped nodes (utilities, services, stores)
   * @param {Object} context - Processing context
   * @param {Array} allObjectsToSave - Array to collect containers for saving
   * @param {string} currentSpaceId - Current space ID
   * @param {Object} user - Current user
   */
  async createGroupContainers(context, allObjectsToSave) {
    const { graphNodes, childParentMap, nodePositions } = context;

    const { useObjectsStore } = await import('../stores');
    const { getCellCoordinates, getCellId } = await import(
      './spatialPartitioning'
    );

    // Collect top-level nodes by type
    const utilityNodes = []; // Top-level function nodes (utility modules)
    const serviceNodes = [];
    const storeNodes = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      // Only include top-level nodes (nodes without parents)
      if (childParentMap.has(nodeId)) {
        continue;
      }

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        // Top-level functions are utility modules
        utilityNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE) {
        serviceNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      }
    }

    const containerCubes = [];

    // Helper function to create a container for a group
    const createContainerForGroup = (nodes, groupName, color) => {
      if (nodes.length === 0) {
        return;
      }

      // Calculate bounding box
      let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

      nodes.forEach((nodeId) => {
        const pos = nodePositions.get(nodeId);
        if (!pos) return;

        const nodeSize = 5; // Default size for cubes/tetrahedrons

        minX = Math.min(minX, pos[0] - nodeSize);
        maxX = Math.max(maxX, pos[0] + nodeSize);
        minY = Math.min(minY, pos[1] - nodeSize);
        maxY = Math.max(maxY, pos[1] + nodeSize);
        minZ = Math.min(minZ, pos[2] - nodeSize);
        maxZ = Math.max(maxZ, pos[2] + nodeSize);
      });

      // Add padding
      const padding = 15;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;
      minZ -= padding;
      maxZ += padding;

      // Calculate center and dimensions
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      const width = maxX - minX;
      const height = maxY - minY;
      const depth = maxZ - minZ;

      const containerScale = [width / 10, height / 10, depth / 10];
      const containerPosition = [centerX, centerY, centerZ];

      // Generate unique ID
      const containerId = `group-container-${groupName}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const cellCoords = getCellCoordinates(containerPosition);
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

      // Create container cube
      const containerCube = {
        id: containerId,
        type: 'cube',
        position: containerPosition,
        scale: containerScale,
        color: color,
        lineWidth: 2,
        cellId: cellId,
        createdAt: Date.now(),
        headerText: `${groupName} Group`,
        faceColors: {},
        faceTexts: {
          front: '',
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        textStyle: {
          fontSize: 1.0,
          color: 'black',
          underline: false,
        },
        merfolkData: {
          isContainer: true,
          groupType: groupName,
          nodeCount: nodes.length,
        },
      };

      containerCubes.push(containerCube);

      // Prepare for Cloud Function bulk save
      const containerForSave = {
        id: containerId,
        position: containerPosition,
        size: containerScale,
        scale: containerScale,
        type: 'cube',
        color: color,
        lineWidth: 2,
        content: `${groupName} Group`,
        createdAt: Date.now(),
        cellId: cellId,
        headerText: `${groupName} Group`,
        faceColors: {},
        faceTexts: {
          front: '',
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        merfolkData: {
          isContainer: true,
          groupType: groupName,
          nodeCount: nodes.length,
        },
      };

      allObjectsToSave.push(containerForSave);
    };

    // Collect ungrouped component nodes for container
    const ungroupedComponents = [];
    for (const [nodeId, node] of graphNodes.entries()) {
      if (childParentMap.has(nodeId)) continue;
      const nodeType = (node.type || '').toLowerCase().trim();
      if (nodeType === 'component' && nodeId !== 'MainEntry') {
        const position = nodePositions.get(nodeId);
        if (position) {
          ungroupedComponents.push(nodeId);
        }
      }
    }

    // Create containers for each group with their specific colors
    createContainerForGroup(utilityNodes, 'Utility Modules', '#4CAF50'); // Green
    createContainerForGroup(serviceNodes, 'Services', '#FF9800'); // Orange
    createContainerForGroup(storeNodes, 'Stores', '#9C27B0'); // Purple
    createContainerForGroup(
      ungroupedComponents,
      'Ungrouped Components',
      '#757575'
    ); // Gray

    // Add container cubes to store
    if (containerCubes.length > 0) {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore
        .getState()
        .setObjects([...currentObjects, ...containerCubes]);
    }
  }

  /**
   * Create 3D objects from processed diagram data
   * @param {Object} diagram - The processed diagram
   * @param {Function} onCreateObject - Callback to create 3D objects
   * @param {Map} nodeToObjectIdMap - Map to track node ID to object ID mapping
   * @param {Array} basePosition - Base position for root level objects
   * @param {Array} allObjectsToSave - Array to collect all objects for bulk import
   * @returns {number} - Number of objects created
   */
  async createObjectsFromDiagram(
    diagram,
    onCreateObject,
    nodeToObjectIdMap,
    basePosition,
    user,
    currentSpaceId,
    allObjectsToSave
  ) {
    const graph = diagram.graph;
    if (!graph || !graph.nodes) {
      return 0;
    }

    // Build hierarchical relationships
    const { parentChildMap, childParentMap, rootNodes } =
      this.buildHierarchicalRelationships(graph);

    // Calculate hierarchical positions and scales
    const nodePositions = new Map();
    const nodeScales = new Map();
    const processedNodes = new Set();

    // Create processing context
    const context = {
      parentChildMap,
      childParentMap,
      rootNodes,
      graphNodes: graph.nodes,
      basePosition,
      nodePositions,
      nodeScales,
      processedNodes,
    };

    // Process root nodes
    const rootArray = Array.from(rootNodes);
    rootArray.forEach((rootId, index) => {
      this.positionNodeHierarchy(
        rootId,
        context,
        basePosition,
        0,
        index,
        rootArray.length
      );
    });

    // Position grouped nodes (utilities, services, stores) in square grids
    this.positionGroupedNodes(context);

    // Create 3D objects with batch processing for better performance
    let objectsCreated = 0;
    const nodeEntries = Array.from(nodePositions);
    const OBJECT_BATCH_SIZE = 50; // Process objects in smaller batches

    // Collect all objects for this diagram before adding to store
    const allObjectsForDiagram = [];

    for (let i = 0; i < nodeEntries.length; i += OBJECT_BATCH_SIZE) {
      const batch = nodeEntries.slice(i, i + OBJECT_BATCH_SIZE);
      const batchNumber = Math.floor(i / OBJECT_BATCH_SIZE) + 1; // eslint-disable-line no-unused-vars
      const totalBatches = Math.ceil(nodeEntries.length / OBJECT_BATCH_SIZE); // eslint-disable-line no-unused-vars

      // Add a small delay between batches to prevent React's "Maximum update depth exceeded" error
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay between batches
      }

      // Prepare batch data for batch creation to prevent re-render loops
      const batchData = batch
        .map(([nodeId, position]) => {
          const node = graph.nodes.get(nodeId);
          const scale = nodeScales.get(nodeId);
          const objectType = this.getObjectTypeForNode(node);

          if (!objectType || !node) return null;

          // Calculate appropriate header style based on object scale
          const calculateHeaderStyle = (scale, objectType) => {
            if (objectType !== 'dodecahedron' || !scale) {
              return {
                fontSize: 'medium',
                color: 'black',
                underline: false,
              };
            }

            const scaleFactor = Math.max(...scale);
            const uiValue = Math.min(
              10,
              Math.max(1, Math.round(1 + scaleFactor * 1.5))
            );
            const fontSize = uiValue * 0.7;

            return {
              fontSize: fontSize,
              color: 'black',
              underline: false,
            };
          };

          const headerStyle = calculateHeaderStyle(scale, objectType);

          return {
            nodeId,
            type: objectType,
            position,
            extraData: {
              scale,
              headerText: node.label || node.id || '',
              headerStyle: headerStyle,
              ...(node.properties || {}),
            },
          };
        })
        .filter(Boolean);

      // Instead of saving to Firebase immediately, collect objects for bulk import
      // AND add to local store for immediate rendering
      const { getCellCoordinates, getCellId } = await import(
        './spatialPartitioning'
      );

      for (const data of batchData) {
        try {
          // Generate unique object ID
          const objectId = `merfolk-obj-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Calculate cellId for spatial partitioning
          const cellCoords = getCellCoordinates(data.position);
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

          // Create full object data matching the expected format
          const objectData = {
            id: objectId,
            type: data.type,
            position: data.position,
            scale: data.extraData.scale || [1, 1, 1],
            color: data.extraData.color || '#4a90e2',
            cellId: cellId,
            createdAt: Date.now(),
            // Type-specific fields based on object type
            ...(data.type === 'dodecahedron'
              ? {
                  headerText: data.extraData.headerText || '',
                  headerStyle: data.extraData.headerStyle || {
                    fontSize: 1.5,
                    color: 'black',
                    underline: false,
                  },
                  faceColors: {},
                  faceTexts: Array(12)
                    .fill('')
                    .reduce((acc, _, idx) => {
                      acc[idx] = '';
                      return acc;
                    }, {}),
                  faceTextStyles: Array(12)
                    .fill(null)
                    .reduce((acc, _, idx) => {
                      acc[idx] = {
                        fontSize: 0.5,
                        color: 'black',
                        underline: false,
                      };
                      return acc;
                    }, {}),
                }
              : data.type === 'cube'
              ? {
                  headerText: data.extraData.headerText || '',
                  faceColors: {},
                  faceTexts: {
                    front: '',
                    back: '',
                    top: '',
                    bottom: '',
                    right: '',
                    left: '',
                  },
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5,
                    color: 'black',
                    underline: false,
                  },
                }
              : data.type === 'tetrahedron'
              ? {
                  headerText: data.extraData.headerText || '',
                  faceColors: {},
                  faceTexts: { front: '', back: '', left: '', right: '' },
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5,
                    color: 'black',
                    underline: false,
                  },
                }
              : data.type === 'plane'
              ? {
                  content: data.extraData.headerText || '',
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5,
                    color: 'black',
                    underline: false,
                  },
                }
              : {}),
            merfolkData: {
              nodeId: data.nodeId,
              ...(data.extraData.merfolkData || {}),
            },
          };

          // Collect object for batch addition to store
          allObjectsForDiagram.push(objectData);

          // Prepare complete data for Cloud Function bulk save (including all type-specific fields)
          const objectForSave = {
            id: objectId,
            position: data.position,
            size: data.extraData.scale || [1, 1, 1], // Cloud Function will convert 'size' to 'scale'
            scale: data.extraData.scale || [1, 1, 1], // Also send as 'scale' for compatibility
            type: data.type,
            color: data.extraData.color || '#4a90e2',
            content: data.extraData.headerText || '',
            createdAt: Date.now(),
            cellId: cellId,
            ...(data.extraData.rotation && {
              rotation: data.extraData.rotation,
            }),
            ...(data.extraData.headerStyle && {
              textStyle: data.extraData.headerStyle,
            }),
            // Include type-specific fields
            ...(data.type === 'dodecahedron' && {
              headerText: data.extraData.headerText || '',
              headerStyle: data.extraData.headerStyle || {
                fontSize: 1.5,
                color: 'black',
                underline: false,
              },
              faceColors: {},
              faceTexts: Array(12)
                .fill('')
                .reduce((acc, _, idx) => {
                  acc[idx] = '';
                  return acc;
                }, {}),
              faceTextStyles: Array(12)
                .fill(null)
                .reduce((acc, _, idx) => {
                  acc[idx] = {
                    fontSize: 0.5,
                    color: 'black',
                    underline: false,
                  };
                  return acc;
                }, {}),
            }),
            ...(data.type === 'cube' && {
              headerText: data.extraData.headerText || '',
              faceColors: {},
              faceTexts: {
                front: '',
                back: '',
                top: '',
                bottom: '',
                right: '',
                left: '',
              },
            }),
            ...(data.type === 'tetrahedron' && {
              headerText: data.extraData.headerText || '',
              faceColors: {},
              faceTexts: { front: '', back: '', left: '', right: '' },
            }),
            merfolkData: {
              nodeId: data.nodeId,
              ...(data.extraData.merfolkData || {}),
            },
          };

          // Collect for bulk Cloud Function save
          allObjectsToSave.push(objectForSave);

          // Update node mapping
          nodeToObjectIdMap.set(data.nodeId, objectId);
          objectsCreated++;
        } catch (err) {
          console.error(
            `Failed to create object for node ${data.nodeId}:`,
            err
          );
        }
      }
    }

    // Add all objects to store in one batch for this diagram
    // This ensures all objects are available before connections are created
    if (allObjectsForDiagram.length > 0) {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore
        .getState()
        .setObjects([...currentObjects, ...allObjectsForDiagram]);
    }

    // Calculate container dimensions for component child groupings
    const containerDimensions = this.calculateContainerDimensions(
      parentChildMap,
      graph.nodes,
      nodePositions,
      nodeScales
    );

    // Create containers around the component children
    // Note: Not adjusting positions because the 300-unit depthOffset already provides
    // sufficient vertical separation between parent and child components
    await this.createContainerCubesAtPositions(
      containerDimensions,
      graph.nodes,
      allObjectsToSave
    );

    // Create group containers for utilities, services, and stores
    await this.createGroupContainers(context, allObjectsToSave);

    return objectsCreated;
  }

  /**
   * Adjust child component positions to be placed below their parent containers
   * This ensures child containers are positioned outside and below parent containers,
   * dynamically adjusting based on actual parent container size.
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {Map} nodePositions - Map of node positions (will be modified)
   * @param {Map} containerDimensions - Map of parent node IDs to container dimensions (will be modified)
   */
  async adjustChildPositionsForContainers(
    parentChildMap,
    graphNodes,
    nodePositions,
    containerDimensions
  ) {
    const containerSpacing = 30; // Vertical spacing between parent container bottom and child container top

    // Build a map of which nodes have their own containers (are parents of multiple components)
    const nodesWithContainers = new Set(containerDimensions.keys());

    // Iterate through each parent that has a container
    for (const [
      parentNodeId,
      parentContainerInfo,
    ] of containerDimensions.entries()) {
      const children = parentChildMap.get(parentNodeId);
      if (!children) continue;

      // Find child nodes that ALSO have containers
      const childrenWithContainers = Array.from(children).filter((childId) => {
        return nodesWithContainers.has(childId);
      });

      if (childrenWithContainers.length === 0) continue;

      // For each child that has its own container, we need to move that child's
      // entire subtree (including its container) below the parent container
      childrenWithContainers.forEach((childNodeId) => {
        const childContainerInfo = containerDimensions.get(childNodeId);
        if (!childContainerInfo) return;

        // Calculate where the child container should be positioned:
        // Parent container bottom + spacing - child container's current top edge
        const parentBottomY = parentContainerInfo.bottomY;
        const childContainerTopY =
          childContainerInfo.position[1] + childContainerInfo.height / 2;
        const targetChildTopY = parentBottomY - containerSpacing;
        const yOffset = targetChildTopY - childContainerTopY;

        // Apply this offset to the child node and ALL its descendants
        const visited = new Set();

        const adjustNodeAndDescendants = (nodeId, offset) => {
          // Prevent infinite recursion
          if (visited.has(nodeId)) return;
          visited.add(nodeId);

          const pos = nodePositions.get(nodeId);
          if (pos) {
            nodePositions.set(nodeId, [pos[0], pos[1] + offset, pos[2]]);
          }

          // Also update the container info if this node has one
          if (containerDimensions.has(nodeId)) {
            const containerInfo = containerDimensions.get(nodeId);
            containerInfo.position[1] += offset;
            containerInfo.bottomY += offset;
          }

          // Recursively adjust descendants
          const nodeChildren = parentChildMap.get(nodeId);
          if (nodeChildren) {
            nodeChildren.forEach((childId) => {
              adjustNodeAndDescendants(childId, offset);
            });
          }
        };

        adjustNodeAndDescendants(childNodeId, yOffset);
      });
    }

    // Update the actual objects in the store with adjusted positions
    const { useObjectsStore } = await import('../stores');
    const objectsStore = useObjectsStore.getState();
    const updatedObjects = objectsStore.objects.map((obj) => {
      // Update regular node objects
      if (obj.merfolkData?.nodeId) {
        const newPos = nodePositions.get(obj.merfolkData.nodeId);
        if (newPos) {
          return { ...obj, position: [...newPos] };
        }
      }
      return obj;
    });

    objectsStore.setObjects(updatedObjects);
  }

  /**
   * Calculate container dimensions for child component groupings
   * This calculates where containers WOULD be without creating them yet
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {Map} nodePositions - Map of node positions
   * @param {Map} nodeScales - Map of node scales
   * @returns {Map} - Map of parent node IDs to their container dimensions
   */
  calculateContainerDimensions(
    parentChildMap,
    graphNodes,
    nodePositions,
    nodeScales
  ) {
    const containerDimensions = new Map();

    // Iterate through each parent that has component children
    for (const [parentNodeId, children] of parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (
        !parentNode ||
        parentNode.type !== MarkdownDiagramService.NODE_TYPE_COMPONENT
      )
        continue;

      // Get component children only (not functions)
      const componentChildren = this.filterComponentChildren(
        children,
        graphNodes
      );

      // Only create container if there are 2 or more child components
      if (componentChildren.length < 2) continue;

      // Calculate bounding box for all child components
      let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

      componentChildren.forEach((childId) => {
        const childPos = nodePositions.get(childId);
        const childScale = nodeScales.get(childId);

        if (!childPos || !childScale) return;

        // Calculate child's actual size
        const childSize =
          MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS *
          Math.max(...childScale);

        // Expand bounding box
        minX = Math.min(minX, childPos[0] - childSize);
        maxX = Math.max(maxX, childPos[0] + childSize);
        minY = Math.min(minY, childPos[1] - childSize);
        maxY = Math.max(maxY, childPos[1] + childSize);
        minZ = Math.min(minZ, childPos[2] - childSize);
        maxZ = Math.max(maxZ, childPos[2] + childSize);
      });

      // Add padding around the bounding box
      const padding = 20;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;
      minZ -= padding;
      maxZ += padding;

      // Calculate center and scale for container cube
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      const width = maxX - minX;
      const height = maxY - minY;
      const depth = maxZ - minZ;

      // Container cube scale (divide by 10 because default cube size is 10)
      const containerScale = [width / 10, height / 10, depth / 10];
      const containerPosition = [centerX, centerY, centerZ];

      // Store container dimensions for this parent
      containerDimensions.set(parentNodeId, {
        position: containerPosition,
        scale: containerScale,
        width: width,
        height: height,
        depth: depth,
        bottomY: minY, // Bottom edge Y coordinate
        childCount: componentChildren.length,
      });
    }

    return containerDimensions;
  }

  /**
   * Helper: Calculate bounding box for a set of nodes
   * @param {Array} nodeIds - Array of node IDs
   * @param {Map} nodePositions - Map of node positions
   * @param {Map} nodeScales - Map of node scales (optional)
   * @param {number} nodeSize - Base size for nodes
   * @param {number} padding - Padding around bounding box
   * @returns {Object} - Bounding box with min/max coordinates and center/dimensions
   */
  calculateBoundingBox(nodeIds, nodePositions, nodeScales, nodeSize, padding) {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    nodeIds.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;

      let size = nodeSize;

      // If scales provided, calculate actual size
      if (nodeScales) {
        const scale = nodeScales.get(nodeId);
        if (scale) {
          size = nodeSize * Math.max(...scale);
        }
      }

      minX = Math.min(minX, pos[0] - size);
      maxX = Math.max(maxX, pos[0] + size);
      minY = Math.min(minY, pos[1] - size);
      maxY = Math.max(maxY, pos[1] + size);
      minZ = Math.min(minZ, pos[2] - size);
      maxZ = Math.max(maxZ, pos[2] + size);
    });

    // Add padding
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    minZ -= padding;
    maxZ += padding;

    // Calculate center and dimensions
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    return {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
      width,
      height,
      depth,
      scale: [width / 10, height / 10, depth / 10],
      position: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    };
  }

  /**
   * Helper: Create a container cube object
   * @param {string} containerId - Unique ID for container
   * @param {Array} position - [x, y, z] position
   * @param {Array} scale - [x, y, z] scale
   * @param {string} color - Container color
   * @param {string} headerText - Container header text
   * @param {string} cellId - Spatial partitioning cell ID
   * @param {Object} merfolkData - Additional merfolk metadata
   * @returns {Object} - Container cube object
   */
  createContainerCubeObject(
    containerId,
    position,
    scale,
    color,
    headerText,
    cellId,
    merfolkData
  ) {
    return {
      id: containerId,
      type: 'cube',
      position: [...position],
      scale: [...scale],
      color: color,
      lineWidth: 2,
      cellId: cellId,
      createdAt: Date.now(),
      headerText: headerText,
      faceColors: {},
      faceTexts: {
        front: '',
        back: '',
        top: '',
        bottom: '',
        right: '',
        left: '',
      },
      textStyle: {
        fontSize: 1.0,
        color: 'black',
        underline: false,
      },
      merfolkData: {
        isContainer: true,
        ...merfolkData,
      },
    };
  }

  /**
   * Create container cube objects at their calculated positions
   * @param {Map} containerDimensions - Map of parent node IDs to container dimensions
   * @param {Map} graphNodes - Map of all nodes
   * @param {Array} allObjectsToSave - Array to collect container cubes for saving
   * @param {string} currentSpaceId - Current space ID
   * @param {Object} user - Current user
   */
  async createContainerCubesAtPositions(
    containerDimensions,
    graphNodes,
    allObjectsToSave
  ) {
    const { useObjectsStore } = await import('../stores');
    const { getCellCoordinates, getCellId } = await import(
      './spatialPartitioning'
    );

    const containerCubes = [];

    // Create a container cube for each parent in the dimensions map
    for (const [parentNodeId, containerInfo] of containerDimensions.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (!parentNode) continue;

      const { position, scale, childCount } = containerInfo;

      // Generate unique ID for container cube
      const containerId = `container-${parentNodeId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Calculate cellId for spatial partitioning
      const cellCoords = getCellCoordinates(position);
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

      // Create container cube object
      const containerCube = {
        id: containerId,
        type: 'cube',
        position: [...position],
        scale: [...scale],
        color: '#e0e0e0', // Light gray for containers
        lineWidth: 2, // Container cube outline thickness
        cellId: cellId,
        createdAt: Date.now(),
        headerText: `${parentNode.label || parentNode.id} Group`,
        faceColors: {},
        faceTexts: {
          front: '',
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        textStyle: {
          fontSize: 1.0,
          color: 'black',
          underline: false,
        },
        merfolkData: {
          isContainer: true,
          parentNodeId: parentNodeId,
          childCount: childCount,
        },
      };

      containerCubes.push(containerCube);

      // Prepare for Cloud Function bulk save
      const containerForSave = {
        id: containerId,
        position: [...position],
        size: [...scale],
        scale: [...scale],
        type: 'cube',
        color: '#e0e0e0',
        lineWidth: 2,
        content: `${parentNode.label || parentNode.id} Group`,
        createdAt: Date.now(),
        cellId: cellId,
        headerText: `${parentNode.label || parentNode.id} Group`,
        faceColors: {},
        faceTexts: {
          front: '',
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        merfolkData: {
          isContainer: true,
          parentNodeId: parentNodeId,
          childCount: childCount,
        },
      };

      allObjectsToSave.push(containerForSave);
    }

    // Add container cubes to store
    if (containerCubes.length > 0) {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore
        .getState()
        .setObjects([...currentObjects, ...containerCubes]);
    }
  }

  /**
   * Create connections between objects
   * @param {Object} diagram - The processed diagram
   * @param {Map} nodeToObjectIdMap - Map of node ID to object ID
   * @param {Array} allConnectionsToSave - Array to collect all connections
   */
  createConnectionsFromDiagram(
    diagram,
    nodeToObjectIdMap,
    allConnectionsToSave
  ) {
    const graph = diagram.graph;
    if (!graph || !graph.connections) {
      return;
    }

    // Process connections
    Array.from(graph.connections.values()).forEach((connection) => {
      const sourceNodeId = connection.source?.nodeId || connection.source;
      const targetNodeId = connection.target?.nodeId || connection.target;

      const sourceObjectId = nodeToObjectIdMap.get(sourceNodeId);
      const targetObjectId = nodeToObjectIdMap.get(targetNodeId);

      if (
        sourceObjectId &&
        targetObjectId &&
        sourceObjectId !== targetObjectId
      ) {
        // Extract connection label - check multiple possible locations
        let connectionText = '';
        if (connection.visual?.label?.text) {
          connectionText = connection.visual.label.text;
        } else if (connection.label) {
          connectionText = connection.label;
        } else if (connection.text) {
          connectionText = connection.text;
        }

        // Generate unique connection ID
        const connectionId = `merfolk-conn-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Get object positions and types from the objects store
        const objectsStore = useObjectsStore.getState();
        const sourceObject = objectsStore.objects.find(
          (obj) => obj.id === sourceObjectId
        );
        const targetObject = objectsStore.objects.find(
          (obj) => obj.id === targetObjectId
        );

        if (!sourceObject || !targetObject) {
          console.warn(
            `Cannot create connection: missing object data for ${sourceObjectId} or ${targetObjectId}`
          );
          return;
        }

        // Track face usage for dodecahedrons to distribute connections across faces
        const getFaceForObject = (objectId, isSource) => {
          const key = `${objectId}_${isSource ? 'source' : 'target'}`;

          if (!window.dodecahedronFaceCounters) {
            window.dodecahedronFaceCounters = new Map();
          }

          const currentCount = window.dodecahedronFaceCounters.get(key) || 0;
          const faceIndex = currentCount % 12; // 12 faces on a dodecahedron (0-11)

          window.dodecahedronFaceCounters.set(key, currentCount + 1);
          return faceIndex;
        };

        // Calculate dodecahedron face position (same logic as original code) - UNUSED
        /* const calculateDodecahedronFacePosition = (
          objectType,
          faceIndex,
          objectPosition,
          objectScale = [1, 1, 1]
        ) => {
          if (objectType !== 'dodecahedron') {
            return objectPosition;
          }

          // Same calculation as Dodecahedron component's face indicator positioning
          const phi = (1 + Math.sqrt(5)) / 2;
          const scale = 5;

          // Vertices of a dodecahedron (matching Dodecahedron component)
          const vertices = [
            [-1, -1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1],
            [0, -phi, -1 / phi],
            [0, phi, -1 / phi],
            [0, phi, 1 / phi],
            [0, -phi, 1 / phi],
            [-1 / phi, 0, -phi],
            [1 / phi, 0, -phi],
            [1 / phi, 0, phi],
            [-1 / phi, 0, phi],
            [-phi, -1 / phi, 0],
            [-phi, 1 / phi, 0],
            [phi, 1 / phi, 0],
            [phi, -1 / phi, 0],
          ].map((v) => v.map((coord) => coord * scale));

          // Faces of the dodecahedron (matching Dodecahedron component)
          const faces = [
            [0, 12, 13, 1, 8],
            [0, 16, 17, 3, 12],
            [0, 8, 11, 4, 16],
            [1, 19, 5, 11, 8],
            [1, 13, 2, 18, 19],
            [2, 13, 12, 3, 9],
            [2, 9, 10, 6, 18],
            [3, 17, 7, 10, 9],
            [4, 11, 5, 14, 15],
            [4, 15, 7, 17, 16],
            [5, 19, 18, 6, 14],
            [6, 10, 7, 15, 14],
          ];

          if (faceIndex < 0 || faceIndex >= faces.length) {
            return objectPosition;
          }

          // Calculate face center using same geometry as Dodecahedron component
          const faceIndices = faces[faceIndex];
          const faceVertices = faceIndices.map((index) => vertices[index]);

          // Pentagon center
          const center = faceVertices.reduce(
            (acc, v) => acc.map((coord, i) => coord + v[i] / 5),
            [0, 0, 0]
          );

          // Create triangles from center to each edge
          const triangleVertices = [];
          for (let i = 0; i < 5; i++) {
            triangleVertices.push(
              ...center,
              ...faceVertices[i],
              ...faceVertices[(i + 1) % 5]
            );
          }

          // Calculate face center exactly like getFaceInfo() does
          let centerX = 0,
            centerY = 0,
            centerZ = 0;
          const vertexCount = triangleVertices.length / 3;

          for (let i = 0; i < triangleVertices.length; i += 3) {
            centerX += triangleVertices[i];
            centerY += triangleVertices[i + 1];
            centerZ += triangleVertices[i + 2];
          }

          const geometryFaceCenter = [
            centerX / vertexCount,
            centerY / vertexCount,
            centerZ / vertexCount,
          ];

          // Apply object scale to match the actual rendered dodecahedron
          const scaledFaceCenter = [
            geometryFaceCenter[0] * objectScale[0],
            geometryFaceCenter[1] * objectScale[1],
            geometryFaceCenter[2] * objectScale[2],
          ];

          // Calculate face normal for indicator offset
          const normalLength = Math.sqrt(
            scaledFaceCenter.reduce((sum, v) => sum + v * v, 0)
          );
          const faceNormal = [
            scaledFaceCenter[0] / normalLength,
            scaledFaceCenter[1] / normalLength,
            scaledFaceCenter[2] / normalLength,
          ];

          // Calculate EXACT face indicator cube position (same as FaceIndicator component)
          const indicatorOffset = 1.0 * objectScale[0];
          const indicatorPosition = [
            objectPosition[0] +
              scaledFaceCenter[0] +
              faceNormal[0] * indicatorOffset,
            objectPosition[1] +
              scaledFaceCenter[1] +
              faceNormal[1] * indicatorOffset,
            objectPosition[2] +
              scaledFaceCenter[2] +
              faceNormal[2] * indicatorOffset,
          ];

          return indicatorPosition;
        }; */

        // Calculate face positions for both objects
        let sourceFaceIndex, targetFaceIndex;
        let sourceWorldPosition, targetWorldPosition;

        if (sourceObject.type === 'dodecahedron') {
          sourceFaceIndex = getFaceForObject(sourceObjectId, true);
          // For dodecahedrons, we don't pre-calculate world positions
          // Let the existing facePositionUtils.js handle this
          sourceWorldPosition = [...sourceObject.position];
        } else {
          sourceFaceIndex = 'front';
          sourceWorldPosition = [...sourceObject.position];
        }

        if (targetObject.type === 'dodecahedron') {
          targetFaceIndex = getFaceForObject(targetObjectId, false);
          // For dodecahedrons, we don't pre-calculate world positions
          // Let the existing facePositionUtils.js handle this
          targetWorldPosition = [...targetObject.position];
        } else {
          targetFaceIndex = 'front';
          targetWorldPosition = [...targetObject.position];
        }

        // Calculate face centers for dodecahedrons using EXACT same logic as Dodecahedron.jsx getFaceInfo
        const calculateDodecahedronFaceCenter = (faceIndex) => {
          // This must match EXACTLY with Dodecahedron.jsx's geometry and getFaceInfo function
          const phi = (1 + Math.sqrt(5)) / 2;
          const scale = 5;

          // EXACT same vertices as Dodecahedron component
          const vertices = [
            [-1, -1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1],
            [0, -phi, -1 / phi],
            [0, phi, -1 / phi],
            [0, phi, 1 / phi],
            [0, -phi, 1 / phi],
            [-1 / phi, 0, -phi],
            [1 / phi, 0, -phi],
            [1 / phi, 0, phi],
            [-1 / phi, 0, phi],
            [-phi, -1 / phi, 0],
            [-phi, 1 / phi, 0],
            [phi, 1 / phi, 0],
            [phi, -1 / phi, 0],
          ];

          // EXACT same faces array as Dodecahedron component
          const faces = [
            [0, 12, 13, 1, 8],
            [0, 16, 17, 3, 12],
            [0, 8, 11, 4, 16],
            [1, 19, 5, 11, 8],
            [1, 13, 2, 18, 19],
            [2, 13, 12, 3, 9],
            [2, 9, 10, 6, 18],
            [3, 17, 7, 10, 9],
            [4, 11, 5, 14, 15],
            [4, 15, 7, 17, 16],
            [5, 19, 18, 6, 14],
            [6, 10, 7, 15, 14],
          ];

          if (faceIndex < 0 || faceIndex >= faces.length) {
            return [0, 0, 0]; // Default to center if invalid face
          }

          // Generate face geometry positions (same as Dodecahedron component)
          const faceVertices = faces[faceIndex];
          const positions = [];

          for (const vertexIndex of faceVertices) {
            const vertex = vertices[vertexIndex];
            positions.push(
              vertex[0] * scale,
              vertex[1] * scale,
              vertex[2] * scale
            );
          }

          // Calculate center using EXACT same logic as getFaceInfo in Dodecahedron.jsx
          let centerX = 0,
            centerY = 0,
            centerZ = 0;
          for (let i = 0; i < positions.length; i += 3) {
            centerX += positions[i];
            centerY += positions[i + 1];
            centerZ += positions[i + 2];
          }
          const vertexCount = positions.length / 3;

          return [
            centerX / vertexCount,
            centerY / vertexCount,
            centerZ / vertexCount,
          ];
        };

        const connectionData = {
          id: connectionId,
          start: {
            objectId: sourceObjectId,
            type:
              sourceObject.type === 'dodecahedron'
                ? 'dodecahedron'
                : sourceObject.type || 'cube',
            face:
              sourceObject.type === 'dodecahedron' ? sourceFaceIndex : 'front',
            position: sourceWorldPosition,
            ...(sourceObject.type === 'dodecahedron' && {
              faceCenter: calculateDodecahedronFaceCenter(sourceFaceIndex),
            }),
            cube: {
              id: sourceObjectId,
              position: [...sourceObject.position],
              scale: sourceObject.scale || [1, 1, 1],
              userData: {
                objectId: sourceObjectId,
              },
            },
            id: sourceObjectId,
          },
          end: {
            objectId: targetObjectId,
            type:
              targetObject.type === 'dodecahedron'
                ? 'dodecahedron'
                : targetObject.type || 'cube',
            face:
              targetObject.type === 'dodecahedron' ? targetFaceIndex : 'front',
            position: targetWorldPosition,
            ...(targetObject.type === 'dodecahedron' && {
              faceCenter: calculateDodecahedronFaceCenter(targetFaceIndex),
            }),
            cube: {
              id: targetObjectId,
              position: [...targetObject.position],
              scale: targetObject.scale || [1, 1, 1],
              userData: {
                objectId: targetObjectId,
              },
            },
            id: targetObjectId,
          },
          text: connectionText,
          color: connection.visual?.color || '#888888',
          thickness: connection.visual?.thickness || 2,
          // Don't set lineStyle - let it auto-detect intersections and curve when needed
          // lineStyle will default to 'straight' but will auto-curve when intersections detected
          textStyle: {
            fontSize: 4,
            color: 'black',
          },
          // Calculate cellId for Cloud Function bulk import
          cellId: (() => {
            const coords = getCellCoordinates(sourceWorldPosition);
            return getCellId(coords.x, coords.y, coords.z);
          })(),
          // Mark as created from Merfolk for debugging
          merfolkData: {
            sourceNode: sourceNodeId,
            targetNode: targetNodeId,
            connectionType: connection.type,
          },
        };

        allConnectionsToSave.push(connectionData);
      }
    });
  }

  /**
   * Save all connections using Cloud Function for bulk import
   * This bypasses client-side Firebase SDK limitations (WebChannel crashes)
   * @param {Array} allConnectionsToSave - Array of connection data to save
   * @param {string} currentSpaceId - Current space ID
   * @param {Object} user - User object for authentication
   * @param {Array} allObjectsToSave - Array of object data to save (optional)
   * @returns {Promise} Promise that resolves when bulk import completes
   */
  async saveConnections(
    allConnectionsToSave,
    currentSpaceId,
    user,
    allObjectsToSave = []
  ) {
    if (allConnectionsToSave.length === 0 && allObjectsToSave.length === 0)
      return Promise.resolve();

    const connectionStore = useConnectionStore.getState();

    // Add connections to store for immediate rendering
    // Pathfinding is disabled for Merfolk connections to prevent delays
    try {
      connectionStore.bulkAddConnections(allConnectionsToSave);
    } catch (error) {
      console.error('Failed to bulk add connections to store:', error);
    }

    // If no user or space, we're done (local-only mode)
    if (!user || !currentSpaceId) {
      return Promise.resolve();
    }

    // Call Cloud Function for server-side bulk import
    return this._cloudFunctionBulkImport(
      allConnectionsToSave,
      currentSpaceId,
      user,
      allObjectsToSave
    );
  }

  /**
   * Call Cloud Function to perform bulk import server-side
   * Uses Firebase Admin SDK to bypass client-side WebChannel limitations
   * @private
   */
  async _cloudFunctionBulkImport(
    allConnectionsToSave,
    currentSpaceId,
    user,
    allObjectsToSave = []
  ) {
    const startTime = performance.now();

    try {
      // Get user's ID token for authentication
      const idToken = await auth.currentUser.getIdToken();

      // Prepare connections data - serialize complex objects to avoid Cloud Function errors
      const connections = allConnectionsToSave.map((conn) => ({
        id: conn.id,
        start: conn.start || {
          objectId: conn.from?.objectId || conn.from?.id,
          type: conn.from?.type,
          face: conn.from?.face,
          position: conn.from?.position,
        },
        end: conn.end || {
          objectId: conn.to?.objectId || conn.to?.id,
          type: conn.to?.type,
          face: conn.to?.face,
          position: conn.to?.position,
        },
        type: conn.type || 'line',
        color: conn.color || '#000000',
        createdAt: conn.createdAt || Date.now(),
        cellId: conn.cellId,
        ...(conn.text && { text: conn.text }),
        ...(conn.thickness && { thickness: conn.thickness }),
        ...(conn.textStyle && { textStyle: conn.textStyle }),
        ...(conn.curvedPath && {
          curvedPath: conn.curvedPath.map((p) =>
            Array.isArray(p) ? [...p] : p
          ),
        }),
        ...(conn.merfolkData && { merfolkData: conn.merfolkData }),
      }));

      // Prepare objects data for Cloud Function
      const objects = allObjectsToSave.map((obj) => ({
        id: obj.id,
        position: obj.position,
        size: obj.size,
        type: obj.type,
        color: obj.color,
        content: obj.content || '',
        createdAt: obj.createdAt || Date.now(),
        cellId: obj.cellId,
        ...(obj.rotation && { rotation: obj.rotation }),
        ...(obj.textStyle && { textStyle: obj.textStyle }),
        ...(obj.headerText !== undefined && { headerText: obj.headerText }),
        ...(obj.headerStyle && { headerStyle: obj.headerStyle }),
        ...(obj.faceColors && { faceColors: obj.faceColors }),
        ...(obj.faceTexts && { faceTexts: obj.faceTexts }),
        ...(obj.faceTextStyles && { faceTextStyles: obj.faceTextStyles }),
        ...(obj.lineColor && { lineColor: obj.lineColor }),
        ...(obj.borderStyle && { borderStyle: obj.borderStyle }),
        ...(obj.borderColor && { borderColor: obj.borderColor }),
        ...(obj.lineThickness && { lineThickness: obj.lineThickness }),
        ...(obj.merfolkData && { merfolkData: obj.merfolkData }),
      }));

      // Use production Cloud Function (always - emulator not needed for this)
      const functionUrl = 'https://bulkimport-qtk2xsi74a-uc.a.run.app';

      // Call Cloud Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          userId: user.uid,
          spaceId: currentSpaceId,
          objects,
          connections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Cloud Function error: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      const duration = ((performance.now() - startTime) / 1000).toFixed(2); // eslint-disable-line no-unused-vars

      return result;
    } catch (error) {
      console.error('❌ [CloudFunction] Bulk import failed:', error);

      // Fall back to client-side save if Cloud Function fails

      return this._backgroundSaveConnections(
        allConnectionsToSave,
        currentSpaceId,
        user
      );
    }
  }

  /**
   * Background process for saving connections to Firebase (FALLBACK ONLY)
   * This is now only used if the Cloud Function fails
   * Runs asynchronously without blocking the main thread
   * @private
   */
  async _backgroundSaveConnections(allConnectionsToSave, currentSpaceId, user) {
    const BATCH_SIZE = 50; // Back to 50 - the issue is not batch size
    const startTime = performance.now();

    try {
      // PAUSE listeners before bulk save to prevent feedback loops

      await pauseConnectionListeners();

      // CRITICAL: Give Firebase 3 seconds to settle after pausing listeners
      // The WebChannel streams need time to close and clear their queues

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // CRITICAL: Limit concurrent batches to avoid overwhelming Firebase
      // Firebase has concurrency limits - too many concurrent writes cause 400 errors
      // Start with 1 concurrent batch to let Firebase warm up, then increase
      const MAX_CONCURRENT_BATCHES = 1; // Process 1 batch at a time initially
      const totalBatches = Math.ceil(allConnectionsToSave.length / BATCH_SIZE);
      let savedCount = 0;

      // Process batches in controlled groups with throttling (like objects do)
      for (
        let batchGroup = 0;
        batchGroup < totalBatches;
        batchGroup += MAX_CONCURRENT_BATCHES
      ) {
        const groupPromises = [];

        // Add delay between batch groups to prevent Firebase WebChannel overload
        // No warm-up needed since we already waited 3 seconds before starting
        if (batchGroup > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        for (
          let batchOffset = 0;
          batchOffset < MAX_CONCURRENT_BATCHES;
          batchOffset++
        ) {
          const batchIndex = batchGroup + batchOffset;
          if (batchIndex >= totalBatches) break;

          const i = batchIndex * BATCH_SIZE;
          const batch = allConnectionsToSave.slice(
            i,
            Math.min(i + BATCH_SIZE, allConnectionsToSave.length)
          );
          const currentBatchNumber = batchIndex + 1;

          // Create a promise for this batch
          const batchPromise = (async () => {
            const batchStart = performance.now();

            try {
              // Group connections by cell for bulk operations
              const connectionsByCell = new Map();

              for (const connectionData of batch) {
                const startPosition = connectionData.start?.position;
                const endPosition = connectionData.end?.position;

                if (!startPosition || !endPosition) {
                  continue;
                }

                const startCellCoords = getCellCoordinates(startPosition);
                const startCellId = getCellId(
                  startCellCoords.x,
                  startCellCoords.y,
                  startCellCoords.z
                );

                if (!connectionsByCell.has(startCellId)) {
                  connectionsByCell.set(startCellId, []);
                }
                connectionsByCell.get(startCellId).push(connectionData);
              }

              // Process cells SEQUENTIALLY within each batch to avoid Firebase overload
              // Each cell write creates a Firebase write stream, and too many concurrent streams
              // cause Firebase to throttle and return 400 errors
              let batchSavedCount = 0;
              const cellEntries = Array.from(connectionsByCell.entries());

              for (let cellIdx = 0; cellIdx < cellEntries.length; cellIdx++) {
                const [cellId, connections] = cellEntries[cellIdx];
                try {
                  const success = await bulkSaveConnectionsToCell(
                    user.uid,
                    currentSpaceId,
                    cellId,
                    connections,
                    false // Let each cell write check/create its own cell sequentially
                  );
                  if (success) {
                    batchSavedCount += connections.length;
                  }
                } catch (error) {
                  console.error(
                    `✗ Cell ${cellId} in batch ${currentBatchNumber} failed:`,
                    error
                  );
                }
              }

              const batchDuration = // eslint-disable-line no-unused-vars
              ((performance.now() - batchStart) / 1000).toFixed(2);

              return batchSavedCount;
            } catch (error) {
              console.error(`❌ Batch ${currentBatchNumber} failed:`, error);
              return 0;
            }
          })();

          groupPromises.push(batchPromise);
        }

        // Wait for this group of batches to complete before starting next group
        const groupResults = await Promise.all(groupPromises);
        const groupSaved = groupResults.reduce((sum, count) => sum + count, 0);
        savedCount += groupSaved; // eslint-disable-line no-unused-vars
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2); // eslint-disable-line no-unused-vars

      // RESUME listeners after bulk save completes
      await resumeConnectionListeners();
    } catch (error) {
      console.error('❌ Background save process failed:', error);

      // Make sure to resume listeners even if save failed
      try {
        await resumeConnectionListeners();
      } catch (resumeError) {
        console.error('❌ Failed to resume listeners:', resumeError);
      }
    }
  }

  /**
   * Process a markdown file and create 3D objects and connections
   * @param {File} file - The markdown file to process
   * @param {Function} onCreateObject - Callback to create 3D objects
   * @param {string} currentSpaceId - Current space ID
   * @returns {Promise<Object>} - Processing results
   */
  async processMarkdownFile(file, onCreateObject, currentSpaceId, user) {
    // Clear caches for new processing session
    this.scaleCache.clear();
    this.boundingBoxCache.clear();

    // Validate file type
    const validExtensions = ['.md', '.markdown'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Please select a Markdown file (.md or .markdown)');
    }

    // Read file content
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    // Initialize processor if not already done
    if (!this.processor) {
      this.initializeProcessor();
    }

    // Process the markdown using 3d-ast-generator
    const diagrams = this.processor.processMarkdown(content);

    if (!diagrams || diagrams.length === 0) {
      throw new Error(
        'No Merfolk diagrams found in the markdown file. Make sure your file contains properly formatted Merfolk syntax with ```merfolk code blocks.'
      );
    }

    // PERFORMANCE FIX: Track Merfolk processing time
    window._lastMerfolkProcessTime = performance.now();

    // Get camera-based position
    const basePosition = this.getCameraBasedPosition();

    let totalObjectsCreated = 0;
    const nodeToObjectIdMap = new Map();
    const allConnectionsToSave = [];
    const allObjectsToSave = [];

    // Process each diagram
    for (let diagramIndex = 0; diagramIndex < diagrams.length; diagramIndex++) {
      const diagram = diagrams[diagramIndex];

      if (diagram.errors && diagram.errors.length > 0) {
        console.warn(`Diagram ${diagramIndex} has errors:`, diagram.errors);
        continue;
      }

      // Create objects from diagram (collects data, doesn't save yet)
      const objectsCreated = await this.createObjectsFromDiagram(
        diagram,
        onCreateObject,
        nodeToObjectIdMap,
        basePosition,
        user,
        currentSpaceId,
        allObjectsToSave
      );

      totalObjectsCreated += objectsCreated;

      // Create connections from diagram
      this.createConnectionsFromDiagram(
        diagram,
        nodeToObjectIdMap,
        allConnectionsToSave
      );
    }

    // Objects and connections added to local store for immediate rendering

    // Save all objects and connections via Cloud Function - returns a promise for tracking completion
    // UI remains responsive, objects/connections render immediately from local store
    const savePromise = this.saveConnections(
      allConnectionsToSave,
      currentSpaceId,
      user,
      allObjectsToSave
    );

    const validDiagrams = diagrams.filter(
      (d) => !d.errors || d.errors.length === 0
    );

    // Return results with save tracking promise
    return {
      diagramCount: validDiagrams.length,
      objectsCreated: totalObjectsCreated,
      connectionsCreated: allConnectionsToSave.length,
      success: totalObjectsCreated > 0,
      // Include the save promise so callers can track when database save completes
      savePromise: savePromise,
    };
  }
}

// Export singleton instance
export const markdownDiagramService = new MarkdownDiagramService();
