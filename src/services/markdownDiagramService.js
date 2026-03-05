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
  static DEFAULT_CAMERA_DISTANCE = 100;
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
          childNode.type === MarkdownDiagramService.NODE_TYPE_CONTROL ||
          childNode.type === MarkdownDiagramService.NODE_TYPE_HOOK)
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
    const internalComponentChildren = new Set(); // component children that are INTERNAL (nested inside parent)
    const componentConnectionTypes = new Map(); // Track connection types between components: 'parent->child' -> Set of types

    // Analyze connections to build parent-child relationships
    if (graph.connections && graph.connections.size > 0) {
    

      // Check if targetNodeId is already reachable from startNodeId through parentChildMap.
      // Used to prevent cycles before they are added.
      const wouldCreateCycle = (startNodeId, targetNodeId) => {
        const visited = new Set();
        const dfs = (nodeId) => {
          if (nodeId === targetNodeId) return true;
          if (visited.has(nodeId)) return false;
          visited.add(nodeId);
          const children = parentChildMap.get(nodeId);
          if (!children) return false;
          for (const child of children) {
            if (dfs(child)) return true;
          }
          return false;
        };
        return dfs(startNodeId);
      };

      const addParentChildRelation = (parentId, childId) => {
        if (!parentId || !childId) return;
        if (parentId === childId) return; // Prevent self-referential parent-child relationships

        // Cycle detection: if parentId is already reachable FROM childId,
        // adding parentId→childId would create a cycle and make both nodes
        // unreachable as roots. Skip the cycle-creating edge.
        if (wouldCreateCycle(childId, parentId)) {
          console.warn(`⚠️ Skipping cycle-creating relationship: ${parentId} → ${childId} (would orphan both from root)`);
          return;
        }
      
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, new Set());
        }
        parentChildMap.get(parentId).add(childId);
        
        // Only set hierarchical parent if not already set
        // This prevents overwriting with a different parent when a component is used by multiple parents
        if (!childParentMap.has(childId)) {
          childParentMap.set(childId, parentId);
        }
      };
      Array.from(graph.connections.values()).forEach((connection) => {
        const sourceId = connection.source?.nodeId || connection.source;
        const targetId = connection.target?.nodeId || connection.target;

        const sourceNode = graph.nodes.get(sourceId);
        const targetNode = graph.nodes.get(targetId);

        // Determine parent-child relationship based on node types
        let parentId = null,
          childId = null;
        let isInternalComponent = false;

        if (sourceNode && targetNode) {
          // Determine containment based ONLY on node types
          // RULE: Component-internal functions are declared as [Function:],
          //       while standalone hooks/services/stores use [Hook:]/((Service:))/[[Store:]]

          // Functions that connect TO components belong IN those components
          // IMPORTANT: Only dashed (controlflow) arrows create containment. Solid arrows are usage/calls.
          if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
          ) {
            // Function -.-> Component (dashed) = function belongs IN component
            // Function -->  Component (solid) = function USES/CALLS component — no containment
            const connectionType = connection.type || 'dataflow';
            const isDashed = connectionType === 'controlflow' || connectionType === 'dotted';
            if (isDashed) {
              parentId = targetId; // Component is the parent
              childId = sourceId; // Function is the child
            }
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION
          ) {
            // Component -.-> Function (dashed) = function belongs IN component (explicit containment)
            // Component -->  Function (solid) = component USES/CALLS the function — no containment
            // This prevents utility file containers from being stolen into components when a component calls them.
            const connectionType = connection.type || 'dataflow';
            const isDashed = connectionType === 'controlflow' || connectionType === 'dotted';
            if (isDashed) {
              parentId = sourceId; // Component is the parent
              childId = targetId; // Function is the child
            }
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_SERVICE &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION
          ) {
            // Service connects TO function = service file contains service function
            // This handles service files like "connectionPositionResolver" containing functions like "resolveConnectionPositions"
            parentId = sourceId; // Service file is the parent
            childId = targetId; // Function is the child
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_HOOK &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION
          ) {
            // Hook connects TO function = hook file contains internal function
            // This handles hook files like "useGlobalClickHandler" containing functions like "handleGlobalClick"
            parentId = sourceId; // Hook file is the parent
            childId = targetId; // Function is the child
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_FUNCTION
          ) {
            // Function connects TO function = utility file contains utility function
            // This handles utility files like "bvhRaycasting" containing functions like "bvhIntersectsObjects"
            parentId = sourceId; // Source function (utility file) is the parent
            childId = targetId; // Target function is the child
          } else if (
            sourceNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
            targetNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
          ) {
            // Component connects TO component
            // Check connection TYPE to determine if this is an INTERNAL component (nested helper)
            // or an EXTERNAL component (usage/composition)
            // Dashed arrows (-.->)  indicate internal/nested components
            // Solid arrows (-->) indicate external usage/composition

            // DEBUG: Log the entire connection object
       

            // 3d-ast-generator sets connection.type based on arrow syntax:
            // '-->' = 'dataflow' (solid arrow for data flow/usage)
            // '-.->'' = 'controlflow' (dashed arrow for control flow/internal structure)
            // We use dashed arrows for internal components, solid for external usage
            const connectionType = connection.type || 'dataflow';
            isInternalComponent =
              connectionType === 'controlflow' || connectionType === 'dotted';

            parentId = sourceId; // Source component is the parent
            childId = targetId; // Target component is the child

            // Track all connection types between these components
            const connectionKey = `${parentId}->${childId}`;
            if (!componentConnectionTypes.has(connectionKey)) {
              componentConnectionTypes.set(connectionKey, new Set());
            }
            componentConnectionTypes.get(connectionKey).add(connectionType);

            if (isInternalComponent) {
        
              // Ensure the hierarchy knows this dashed arrow means containment
              addParentChildRelation(parentId, childId);
              internalComponentChildren.add(childId);
            } else {
              console.log(
                `🔗 EXTERNAL COMPONENT USAGE (dataflow/solid arrow): ${sourceId} uses ${targetId}`
              );
            }
          }
          // Skip other connection types - they don't establish containment
        }

        // Only add parent-child relationship for non-internal components here
        // Internal components were already processed above
        if (parentId && childId && !isInternalComponent) {
          addParentChildRelation(parentId, childId);
        }
      });

      // After processing all connections, ensure components with ANY dashed connection are marked as internal
  
      componentConnectionTypes.forEach((types, key) => {
        const [parentId, childId] = key.split('->');
        const hasControlFlow = types.has('controlflow') || types.has('dotted');
        const hasDataFlow = types.has('dataflow');

        if (hasControlFlow && hasDataFlow) {
       
          internalComponentChildren.add(childId);
          if (!childParentMap.has(childId)) {
            addParentChildRelation(parentId, childId);
          }
        } else if (hasControlFlow) {
         
          internalComponentChildren.add(childId);
          if (!childParentMap.has(childId)) {
            addParentChildRelation(parentId, childId);
          }
        } else {
        
        }
      });

     
    }

    // Identify root nodes (nodes with no parents)
    Array.from(graph.nodes.keys()).forEach((nodeId) => {
      if (!childParentMap.has(nodeId)) {
        rootNodes.add(nodeId);
      }
    });


    return {
      parentChildMap,
      childParentMap,
      rootNodes,
      internalComponentChildren,
    };
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
   * @param {Set} internalComponentChildren - Set of component IDs that are internal
   * @param {number} level - Hierarchy level
   * @returns {Object} - Object containing nodeScale and containerSize
   */
  calculateDodecahedronScale(
    nodeId,
    parentChildMap,
    graphNodes,
    internalComponentChildren,
    level = 0
  ) {
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

    // Filter component children to ONLY include internal ones (that should be positioned inside)
    const internalComponentChildrenArray = componentChildren.filter(
      (childId) =>
        internalComponentChildren && internalComponentChildren.has(childId)
    );

    // Total children that need to fit INSIDE the dodecahedron
    const totalNestedChildren =
      cubeChildren.length + internalComponentChildrenArray.length;


    if (totalNestedChildren > 0) {
      // For cone-based hierarchies, use more conservative scaling
      // Scale for BOTH functions AND nested components that are contained within
      let maxChildSize = this.calculateMaxChildSize(
        children,
        parentChildMap,
        graphNodes,
        internalComponentChildren,
        level // Pass the level for proper recursive calculation
      );

      // Calculate required space based on what needs to fit inside
      const hasInternalContent =
        cubeChildren.length > 0 || internalComponentChildrenArray.length > 0;
      const hasInternalComponents = internalComponentChildrenArray.length > 0;
      
      // IMPORTANT: This spacing MUST match the actual spacing used in calculateNodePosition
      // for internal components/functions (currently 50 units)
      const actualChildSpacing = 50; // Must match the 'spacing' value in calculateNodePosition
      
      let requiredSpace;

      if (hasInternalComponents && cubeChildren.length === 0) {
        // Only internal helper components, no functions
        // Parent should be 2x the size of the internal component to contain it
      
        requiredSpace = maxChildSize * 2; // Parent is 2x the internal component
      } else if (hasInternalComponents && cubeChildren.length > 0) {
        // Has both internal components AND functions
        // Need space for both
       
        const totalInternalChildren = cubeChildren.length + internalComponentChildrenArray.length;
        
        // Use the actual spacing from positioning logic
        if (totalInternalChildren <= 2) {
          requiredSpace = maxChildSize * 2.5;
        } else {
          // Calculate 3D grid dimensions
          const gridSize3D = Math.ceil(Math.pow(totalInternalChildren, 1 / 3));
          // Grid spans from -(gridSize-1)/2 to +(gridSize-1)/2 in each dimension
          // So total span is (gridSize-1) * spacing, plus child size on each edge
          requiredSpace = (gridSize3D - 1) * actualChildSpacing + maxChildSize * 2;
        }
      } else if (cubeChildren.length > 0) {
        // Only functions, no internal components
        if (cubeChildren.length === 1) {
          requiredSpace = maxChildSize * 2;
        } else {
          // Calculate 3D grid dimensions
          const gridSize3D = Math.ceil(Math.pow(cubeChildren.length, 1 / 3));
          // Grid spans from -(gridSize-1)/2 to +(gridSize-1)/2 in each dimension
          // So total span is (gridSize-1) * spacing, plus child size on each edge
          requiredSpace = (gridSize3D - 1) * actualChildSpacing + maxChildSize * 2;
        }
      } else {
        // No internal content (shouldn't happen if totalNestedChildren > 0)
        requiredSpace = maxChildSize * 1.2;
      }

      // Add generous padding to ensure children don't touch dodecahedron edges
      // Dodecahedrons have irregular edges, so we need extra room
      const adaptivePadding = hasInternalContent
        ? Math.max(30, requiredSpace * 0.3) // 30% padding or at least 30 units
        : 10;

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
   * @param {Object} context - Hierarchical relationship context
   * @param {number} level - Current hierarchy level for recursion depth tracking
   * @returns {number} - Maximum child size
   */
  calculateMaxChildSize(
    children,
    parentChildMap,
    graphNodes,
    context,
    level = 0
  ) {
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
          context?.internalComponentChildren || new Set(),
          level + 1
        );

        // Use dampened scaling to prevent exponential growth across hierarchy levels
        // Take square root of the scale to reduce compounding effect
        const dampenedScale = Math.sqrt(Math.max(...childScale.nodeScale));
        const childActualSize =
          MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS * dampenedScale;

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
   * @param {Object} context - Hierarchical relationship context
   * @param {number} level - Hierarchy level
   * @returns {Object} - Object containing width and height of the bounding box
   */
  calculateSubtreeBoundingBox(
    nodeId,
    parentChildMap,
    graphNodes,
    context,
    level = 0
  ) {
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
      context?.internalComponentChildren || new Set(),
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
        context || {},
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
   * @param {Set} internalComponentChildren - Set of component IDs that are internal (nested) components
   * @param {Array} siblingIds - Array of sibling node IDs for calculating max sibling size
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
    parentChildMap, // Added parameter for calculating actual component sizes
    internalComponentChildren, // NEW: Set of internal component IDs
    siblingIds = [] // NEW: Array of sibling node IDs
  ) {
    // Get node type to determine positioning strategy
    const node = graphNodes.get(nodeId);
    const nodeType = node ? node.type : 'unknown';

    // No Y offset — root nodes are placed directly at the camera-based position
    // so the diagram builds in front of the camera
    const componentYOffset = 0;

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

        // Spread roots in X and Z only — Y is flat so that hierarchy levels
        // are clearly separated by depth (children are always below their parent)
        const spacing = 200;

        return [
          basePosition[0] + (col - (gridSize - 1) / 2) * spacing,
          basePosition[1] + componentYOffset,  // All roots at same Y
          basePosition[2] + (row - (gridSize - 1) / 2) * spacing,  // row → Z
        ];
      }
    } else {
      // Nested level - different strategies for components vs functions

      // Check if this component is an INTERNAL component (nested helper)
      const isInternalComponent =
        nodeType === 'component' && internalComponentChildren.has(nodeId);

      if (nodeType === 'component' && !isInternalComponent) {
        // EXTERNAL COMPONENT POSITIONING: Dynamic square grid arrangement around parent
        // These are regular child components that should be positioned OUTSIDE the parent

        const baseDodecahedronRadius = 10; // Base dodecahedron size

        // Calculate the actual size of this component (for reference)
        const componentScale = this.calculateDodecahedronScale(
          nodeId,
          parentChildMap,
          graphNodes,
          internalComponentChildren,
          level
        );
        const actualComponentSize =
          baseDodecahedronRadius * Math.max(...componentScale.nodeScale);

        // Filter siblingIds to only EXTERNAL components for correct grid positioning
        // This prevents sparse grids when there are mixed children (components + functions)
        const externalComponentSiblings = siblingIds.filter((sibId) => {
          const sibNode = graphNodes.get(sibId);
          return sibNode && sibNode.type === 'component' && !internalComponentChildren.has(sibId);
        });
        
        // Calculate this component's index among external component siblings only
        const componentSiblingIndex = externalComponentSiblings.indexOf(nodeId);
        const componentSiblingCount = externalComponentSiblings.length;

        // Calculate spacing based on the MAXIMUM sibling size
        // This ensures all siblings in a grid use consistent spacing
        let maxSiblingSize = actualComponentSize;
        externalComponentSiblings.forEach((sibId) => {
          const sibScale = this.calculateDodecahedronScale(
            sibId,
            parentChildMap,
            graphNodes,
            internalComponentChildren,
            level
          );
          const sibSize = baseDodecahedronRadius * Math.max(...sibScale.nodeScale);
          if (sibSize > maxSiblingSize) {
            maxSiblingSize = sibSize;
          }
        });
        
        // Gap between edges - scale based on BOTH component size AND hierarchy level
        // Higher levels (level 1, 2) need more spacing for large dodecahedrons
        // Lower levels (level 3+) with small components need much less spacing
        const levelFactor = level <= 2 ? 1.0 : 0.3;
        const baseMinGap = level <= 2 ? 80 : 20;
        const proportionalGap = maxSiblingSize * 0.5 * levelFactor;
        const gapBetweenEdges = Math.max(baseMinGap, proportionalGap);
        
        // Spacing = diameter of largest + gap
        // For deeper levels, reduce the diameter multiplier as well
        const diameterMultiplier = level <= 2 ? 2.0 : 1.5;
        const spacingBetweenComponents = (maxSiblingSize * diameterMultiplier) + gapBetweenEdges;

        // Calculate depth offset based on parent's actual size to prevent overlap
        // Each hierarchy level should be clearly below the previous one
        let depthOffset = 300; // Base offset — large enough to separate levels visually
        if (containerSize && typeof containerSize === 'number') {
          depthOffset = Math.max(300, containerSize * 2.5);
        }

        // Debug spacing for problematic components
        if (nodeId === 'TextStyleUI' || nodeId === 'ObjectUI' || nodeId === 'TetrahedronFace' || nodeId === 'TextSprite') {
          console.log(`📐 ${nodeId} spacing: maxSiblingSize=${maxSiblingSize.toFixed(1)}, level=${level}, spacing=${spacingBetweenComponents.toFixed(1)}, siblingCount=${componentSiblingCount}, siblingIndex=${componentSiblingIndex}, depthOffset=${depthOffset.toFixed(1)}`);
        }

        if (componentSiblingCount <= 1) {
          // Single external component child - place directly to the right of parent
          const totalSpacing = spacingBetweenComponents;
          const position = [
            parentPosition[0] + totalSpacing,
            parentPosition[1] - depthOffset,
            parentPosition[2],
          ];
         
          return position;
        } else {
          // Multiple external component children - arrange in a grid using component-only indices
          const gridSize = Math.ceil(Math.sqrt(componentSiblingCount));
          const row = Math.floor(componentSiblingIndex / gridSize);
          const col = componentSiblingIndex % gridSize;

          // Position grid starting at parent + spacing for first element (col=0)
          const offsetX = spacingBetweenComponents * (col + 1);
          const offsetZ = (row * spacingBetweenComponents) - ((gridSize - 1) * spacingBetweenComponents / 2);

          const position = [
            parentPosition[0] + offsetX,
            parentPosition[1] - depthOffset,
            parentPosition[2] + offsetZ,
          ];
          
          // Debug actual positions for problematic components
          if (nodeId === 'TextStyleUI' || nodeId === 'ObjectUI' || nodeId === 'TetrahedronFace' || nodeId === 'TextSprite') {
            console.log(`📍 ${nodeId} position: [${position.map(p => p.toFixed(1)).join(', ')}], parent: [${parentPosition.map(p => p.toFixed(1)).join(', ')}]`);
          }
          
          return position;
        }
      } else {
        // INTERNAL COMPONENT or FUNCTION POSITIONING: Contained within parent component
        // Internal components (nested helpers) use the same positioning as functions
        // Use consistent fixed spacing for all group sizes
        if (siblingCount === 1) {
          // Single child function/internal-component at parent's center
          return [...parentPosition];
        } else {
          // 3D grid for all groups with consistent spacing
          const gridSize = Math.ceil(Math.pow(siblingCount, 1 / 3));
          const layer = Math.floor(siblingIndex / (gridSize * gridSize));
          const remaining = siblingIndex % (gridSize * gridSize);
          const row = Math.floor(remaining / gridSize);
          const col = remaining % gridSize;

          const spacing = 50; // Fixed spacing between child cubes/dodecahedrons

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

    // Skip top-level utility functions, hooks, services, and stores - they are positioned by positionGroupedNodes
    // Top-level functions (utilities) and hooks have no parent and will be grouped separately
    const nodeType = (node.type || '').toLowerCase().trim();
    const isTopLevel = !childParentMap.has(nodeId);

    // Skip internal components ONLY if they're at root level (no parent)
    // If they have a parent, they should be positioned as normal children
    if (
      context.internalComponentChildren &&
      context.internalComponentChildren.has(nodeId) &&
      isTopLevel
    ) {
      console.log(
        `   ⏭️ SKIPPING root-level internal component: ${nodeId} (should only appear inside parent)`
      );
      return;
    }

   

    if (
      nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE ||
      nodeType === MarkdownDiagramService.NODE_TYPE_STORE
    ) {
      return; // Always skip services and stores for grouped positioning
    }

    if (
      (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
        nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) &&
      isTopLevel
    ) {
    
      return; // Skip top-level functions (utility modules) and hooks for grouped positioning
    }

    // Don't skip components here - let them all be processed in the hierarchy
    // Ungrouped components will be identified and positioned separately in positionGroupedNodes

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
        context?.internalComponentChildren || new Set(),
        level
      );
      nodeScale = scaleResult.nodeScale;
      containerSize = scaleResult.containerSize;
    }

    // Calculate position

    // Get sibling IDs from parent's children for consistent grid spacing
    // IMPORTANT: Only include siblings that share the same HIERARCHICAL parent
    // This prevents mixing components from different hierarchical groups
    const parentId = context.childParentMap.get(nodeId);
    let siblingIds = [];
    if (parentId && parentId !== nodeId) {  // Prevent self-referential parent
      const allParentChildren = Array.from(parentChildMap.get(parentId) || new Set());
      // Filter to only include COMPONENT children whose hierarchical parent is the same as ours
      // Functions should NOT be in this list - they use internal positioning
      siblingIds = allParentChildren.filter((sibId) => {
        const sibNode = graphNodes.get(sibId);
        const isComponent = sibNode && sibNode.type === 'component';
        const hasSameParent = context.childParentMap.get(sibId) === parentId;
        return isComponent && hasSameParent;
      }).sort();
      
      // Log sibling groups (only once per unique group)
      const groupKey = siblingIds.join(',');
      if (!this._loggedGroups) this._loggedGroups = new Set();
      if (siblingIds.length > 0 && !this._loggedGroups.has(groupKey)) {
        this._loggedGroups.add(groupKey);
        console.log(`👥 Sibling group at level ${level}: [${siblingIds.join(', ')}]`);
      }
    }
    
  
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
      parentChildMap,
      context?.internalComponentChildren || new Set(),
      siblingIds
    );

    // Store position and scale
    nodePositions.set(nodeId, nodePosition);
    nodeScales.set(nodeId, nodeScale);

    // Debug log for tracking position accumulation
  

    // Process children recursively
    const children = parentChildMap.get(nodeId) || new Set();
    if (children.size > 0) {
      // Sort children by ID to ensure consistent ordering for circular arrangement
      const childArray = Array.from(children).sort();

      // For component parents with external component children, we need to ensure consistent
      // positioning by passing the full sibling context to each child
      // This prevents recalculation mismatches in calculateNodePosition
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
   * Resolve collisions between component subtrees by moving them apart
   * @param {Object} context - Processing context containing all maps and data
   */
  /**
   * Resolve collisions between CONTAINER CUBES only (not individual components)
   * Containers are created for parents with 2+ component children
   * When containers collide, we move the entire container group (parent + all children)
   * Also handles the ungrouped components container to maintain 200 units above root
   */
  resolveCollisions(context) {
    const {
      parentChildMap,
      graphNodes,
      nodePositions,
      internalComponentChildren,
      ungroupedComponents = [],
    } = context;

    // Helper function to recursively move a component and all its descendants
    const moveComponentTree = (nodeId, offsetX, offsetZ, visited = new Set()) => {
      // Prevent infinite recursion from circular references
      if (visited.has(nodeId)) {
        console.warn(`⚠️  Circular reference detected for ${nodeId}, skipping`);
        return;
      }
      visited.add(nodeId);
      
      const position = nodePositions.get(nodeId);
      if (!position) return;

      // Update this node's position
      const newPos = [
        position[0] + offsetX,
        position[1],
        position[2] + offsetZ,
      ];
      nodePositions.set(nodeId, newPos);

      // Recursively update all children
      const children = parentChildMap.get(nodeId);
      if (children) {
        for (const childId of children) {
          moveComponentTree(childId, offsetX, offsetZ, visited);
        }
      }
    };

    // Helper function to get component children only (excluding internal components)
    const getComponentChildren = (nodeId) => {
      const children = parentChildMap.get(nodeId);
      if (!children) return [];

      return Array.from(children).filter((childId) => {
        // Filter out internal components - they don't need external containers
        if (internalComponentChildren && internalComponentChildren.has(childId)) {
          return false;
        }
        const childNode = graphNodes.get(childId);
        return (
          childNode &&
          childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
        );
      });
    };

    // Helper function to check if two bounding boxes overlap
    const checkOverlap = (bbox1, bbox2) => {
      return !(
        bbox1.maxX < bbox2.minX ||
        bbox1.minX > bbox2.maxX ||
        bbox1.maxZ < bbox2.minZ ||
        bbox1.minZ > bbox2.maxZ
      );
    };

    // Find all nodes that will have containers (parents with 2+ component children)
    const containerParents = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      if (node.type !== MarkdownDiagramService.NODE_TYPE_COMPONENT) continue;
      if (internalComponentChildren && internalComponentChildren.has(nodeId))
        continue;
      if (!nodePositions.has(nodeId)) continue;

      const componentChildren = getComponentChildren(nodeId);

      // Only nodes with 2+ component children get containers
      if (componentChildren.length >= 2) {
        containerParents.push(nodeId);
      
      }
    }

   

    if (containerParents.length < 2) {
      
      return; // Need at least 2 containers to have collisions
    }

    // Organize containers by depth level
    const containersByLevel = new Map();

    for (const containerId of containerParents) {
      const childParentMap = context.childParentMap;

      // Calculate level by traversing up to root
      let level = 0;
      let currentId = containerId;

      while (childParentMap.has(currentId)) {
        level++;
        currentId = childParentMap.get(currentId);
        if (level > 20) break; // Safety limit
      }

      // ONLY include root-level containers (level 0) for collision detection
      // Skip lower-level containers to preserve their internal spacing
      if (level === 0) {
        if (!containersByLevel.has(level)) {
          containersByLevel.set(level, []);
        }
        containersByLevel.get(level).push(containerId);
      }
    }

    // Add virtual containers at level -1 (above/beside root)
    // These will be positioned dynamically around root components
    if (!containersByLevel.has(-1)) {
      containersByLevel.set(-1, []);
    }
    
    if (ungroupedComponents.length > 0) {
      containersByLevel.get(-1).push('__UNGROUPED__');
    }
    
    // Get utility/hook/service/store/backend nodes from context
    const utilityNodes = [];
    const hookNodes = [];
    const serviceNodes = [];
    const storeNodes = [];
    const backendCollisionNodes = [];
    
    for (const [nodeId, node] of graphNodes.entries()) {
      const childParentMap = context.childParentMap;
      if (childParentMap.has(nodeId)) continue; // Only top-level nodes
      
      const nodeType = (node.type || '').toLowerCase().trim();
      if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        utilityNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) {
        hookNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE) {
        if (nodeId.startsWith('backend_')) {
          backendCollisionNodes.push(nodeId);
        } else {
          serviceNodes.push(nodeId);
        }
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      }
    }
    
    if (utilityNodes.length > 0) {
      containersByLevel.get(-1).push('__UTILITIES__');
    }
    if (hookNodes.length > 0) {
      containersByLevel.get(-1).push('__HOOKS__');
    }
    if (serviceNodes.length > 0) {
      containersByLevel.get(-1).push('__SERVICES__');
    }
    if (storeNodes.length > 0) {
      containersByLevel.get(-1).push('__STORES__');
    }
    if (backendCollisionNodes.length > 0) {
      containersByLevel.get(-1).push('__BACKEND__');
    }

    // Process each level from deepest to shallowest
    const levels = Array.from(containersByLevel.keys()).sort((a, b) => b - a);

    for (const level of levels) {
      const containers = containersByLevel.get(level);
      if (containers.length < 2) continue;

   

      // Calculate bounding boxes for each container
      const containerBBoxes = [];

      for (const containerId of containers) {
        let minX = Infinity,
          minZ = Infinity;
        let maxX = -Infinity,
          maxZ = -Infinity;

        // Handle virtual group containers
        let nodeList = null;
        if (containerId === '__UNGROUPED__') {
          nodeList = ungroupedComponents;
        } else if (containerId === '__UTILITIES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) && 
                node.type === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__HOOKS__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) && 
                node.type === MarkdownDiagramService.NODE_TYPE_HOOK) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__SERVICES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) && 
                node.type === MarkdownDiagramService.NODE_TYPE_SERVICE) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__STORES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) && 
                node.type === MarkdownDiagramService.NODE_TYPE_STORE) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__BACKEND__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) && 
                node.type === MarkdownDiagramService.NODE_TYPE_SERVICE &&
                nodeId.startsWith('backend_')) {
              nodeList.push(nodeId);
            }
          }
        }
        
        if (nodeList) {
          for (const nodeId of nodeList) {
            const pos = nodePositions.get(nodeId);
            if (!pos) continue;

            // Use actual node scale, not subtree bounding box
            const nodeScale = context.nodeScales?.get(nodeId) || [1, 1, 1];
            const nodeSize = MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS * Math.max(...nodeScale);

            const nodeMinX = pos[0] - nodeSize;
            const nodeMaxX = pos[0] + nodeSize;
            const nodeMinZ = pos[2] - nodeSize;
            const nodeMaxZ = pos[2] + nodeSize;

            minX = Math.min(minX, nodeMinX);
            maxX = Math.max(maxX, nodeMaxX);
            minZ = Math.min(minZ, nodeMinZ);
            maxZ = Math.max(maxZ, nodeMaxZ);
          }
        } else {
          // Normal container with component children
          const componentChildren = getComponentChildren(containerId);
          if (componentChildren.length < 2) continue;

          for (const childId of componentChildren) {
            const childPos = nodePositions.get(childId);
            if (!childPos) continue;

            // Use actual child scale, not subtree bounding box
            // This prevents collision detection from using inflated sizes
            const childScale = context.nodeScales?.get(childId) || [1, 1, 1];
            const childSize = MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS * Math.max(...childScale);

            const childMinX = childPos[0] - childSize;
            const childMaxX = childPos[0] + childSize;
            const childMinZ = childPos[2] - childSize;
            const childMaxZ = childPos[2] + childSize;

            minX = Math.min(minX, childMinX);
            maxX = Math.max(maxX, childMaxX);
            minZ = Math.min(minZ, childMinZ);
            maxZ = Math.max(maxZ, childMaxZ);
          }
        }

        // Skip if no valid bounds found
        if (minX === Infinity || maxX === -Infinity) continue;

        // Add padding for the container
        const padding = 120; // Increased by 100 units for better separation
        minX -= padding;
        maxX += padding;
        minZ -= padding;
        maxZ += padding;

        containerBBoxes.push({
          nodeId: containerId,
          minX,
          maxX,
          minZ,
          maxZ,
          width: maxX - minX,
          height: maxZ - minZ,
        });
      }

      // Detect and resolve collisions between containers
      for (let i = 0; i < containerBBoxes.length; i++) {
        for (let j = i + 1; j < containerBBoxes.length; j++) {
          const bbox1 = containerBBoxes[i];
          const bbox2 = containerBBoxes[j];

          if (checkOverlap(bbox1, bbox2)) {
        

            // Calculate actual overlap distance
            const overlapX =
              Math.min(bbox1.maxX, bbox2.maxX) -
              Math.max(bbox1.minX, bbox2.minX);
            const overlapZ =
              Math.min(bbox1.maxZ, bbox2.maxZ) -
              Math.max(bbox1.minZ, bbox2.minZ);

            // Only resolve if there's meaningful overlap (> 1 unit)
            if (overlapX < 1 && overlapZ < 1) {
             
              continue;
            }

            // Calculate centers
            const center1X = (bbox1.minX + bbox1.maxX) / 2;
            const center1Z = (bbox1.minZ + bbox1.maxZ) / 2;
            const center2X = (bbox2.minX + bbox2.maxX) / 2;
            const center2Z = (bbox2.minZ + bbox2.maxZ) / 2;

            // Move along the axis with smaller overlap
            if (overlapX < overlapZ) {
              // Push apart horizontally - move just enough to separate + small gap
              const direction = center2X > center1X ? 1 : -1;
              const halfWidth1 = bbox1.width / 2;
              const halfWidth2 = bbox2.width / 2;
              const minGap = 150; // Minimum gap between containers (increased by 100 units)
              const requiredDistance = halfWidth1 + halfWidth2 + minGap;
              const currentDistance = Math.abs(center2X - center1X);
              const moveDistance = requiredDistance - currentDistance;

              if (moveDistance > 0) {
                const offsetX = direction * moveDistance;

                // Move the entire container tree (parent + all children)
                const virtualContainerMap = {
                  '__UNGROUPED__': ungroupedComponents,
                  '__UTILITIES__': [],
                  '__HOOKS__': [],
                  '__SERVICES__': [],
                  '__STORES__': [],
                  '__BACKEND__': []
                };
                
                // Populate virtual container node lists
                if (bbox2.nodeId.startsWith('__')) {
                  for (const [nodeId, node] of graphNodes.entries()) {
                    if (context.childParentMap.has(nodeId)) continue;
                    const nodeType = (node.type || '').toLowerCase().trim();
                    if (bbox2.nodeId === '__UTILITIES__' && nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
                      virtualContainerMap['__UTILITIES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__HOOKS__' && nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) {
                      virtualContainerMap['__HOOKS__'].push(nodeId);
                    } else if (bbox2.nodeId === '__SERVICES__' && nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE && !nodeId.startsWith('backend_')) {
                      virtualContainerMap['__SERVICES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__STORES__' && nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
                      virtualContainerMap['__STORES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__BACKEND__' && nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE && nodeId.startsWith('backend_')) {
                      virtualContainerMap['__BACKEND__'].push(nodeId);
                    }
                  }
                }
                
                if (virtualContainerMap[bbox2.nodeId]) {
                  // Move all nodes in virtual container
                  for (const nodeId of virtualContainerMap[bbox2.nodeId]) {
                    moveComponentTree(nodeId, offsetX, 0);
                  }
                } else {
                  moveComponentTree(bbox2.nodeId, offsetX, 0);
                }

                // Update bbox for further collision checks
                bbox2.minX += offsetX;
                bbox2.maxX += offsetX;

           
              }
            } else {
              // Push apart depth-wise - move just enough to separate + small gap
              const direction = center2Z > center1Z ? 1 : -1;
              const halfDepth1 = bbox1.height / 2;
              const halfDepth2 = bbox2.height / 2;
              const minGap = 150; // Minimum gap between containers (increased by 100 units)
              const requiredDistance = halfDepth1 + halfDepth2 + minGap;
              const currentDistance = Math.abs(center2Z - center1Z);
              const moveDistance = requiredDistance - currentDistance;

              if (moveDistance > 0) {
                const offsetZ = direction * moveDistance;

                // Move the entire container tree (parent + all children)
                const virtualContainerMap = {
                  '__UNGROUPED__': ungroupedComponents,
                  '__UTILITIES__': [],
                  '__HOOKS__': [],
                  '__SERVICES__': [],
                  '__STORES__': [],
                  '__BACKEND__': []
                };
                
                // Populate virtual container node lists
                if (bbox2.nodeId.startsWith('__')) {
                  for (const [nodeId, node] of graphNodes.entries()) {
                    if (context.childParentMap.has(nodeId)) continue;
                    const nodeType = (node.type || '').toLowerCase().trim();
                    if (bbox2.nodeId === '__UTILITIES__' && nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
                      virtualContainerMap['__UTILITIES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__HOOKS__' && nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) {
                      virtualContainerMap['__HOOKS__'].push(nodeId);
                    } else if (bbox2.nodeId === '__SERVICES__' && nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE && !nodeId.startsWith('backend_')) {
                      virtualContainerMap['__SERVICES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__STORES__' && nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
                      virtualContainerMap['__STORES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__BACKEND__' && nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE && nodeId.startsWith('backend_')) {
                      virtualContainerMap['__BACKEND__'].push(nodeId);
                    }
                  }
                }
                
                if (virtualContainerMap[bbox2.nodeId]) {
                  // Move all nodes in virtual container
                  for (const nodeId of virtualContainerMap[bbox2.nodeId]) {
                    moveComponentTree(nodeId, 0, offsetZ);
                  }
                } else {
                  moveComponentTree(bbox2.nodeId, 0, offsetZ);
                }

                // Update bbox for further collision checks
                bbox2.minZ += offsetZ;
                bbox2.maxZ += offsetZ;

               
              }
            }
          }
        }
      }
    }

  
  }

  /**
   * Calculate the bounding box and dimensions of the root hierarchy container
   * This must match the logic in createRootHierarchyContainer to ensure alignment
   * @param {Object} context - Processing context
   * @param {Map} graphNodes - All graph nodes
   * @param {Map} childParentMap - Child to parent mapping
   * @param {Map} nodePositions - Node positions
   * @param {Map} nodeScales - Node scales
   * @param {Set} rootNodes - Root nodes
   * @returns {Object} Container bounds {centerX, centerY, centerZ, width, height, depth}
   */
  calculateRootHierarchyContainerBounds(
    context,
    graphNodes,
    childParentMap,
    nodePositions,
    nodeScales,
    rootNodes
  ) {
    // Collect all hierarchy nodes (components reachable from root modules + their children)
    const hierarchyNodes = [];

    // Build set of components reachable from actual root modules
    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

    // Traverse from root modules to mark all reachable components
    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    // Build a set of components that have their own child containers
    const componentsWithChildContainers = new Set();
    for (const [parentNodeId, children] of context.parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (
        !parentNode ||
        parentNode.type !== MarkdownDiagramService.NODE_TYPE_COMPONENT
      ) {
        continue;
      }

      // Get component children only
      const componentChildren = Array.from(children).filter((childId) => {
        const childNode = graphNodes.get(childId);
        return (
          childNode &&
          childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
        );
      });

      // If has 2+ component children, it gets its own container
      if (componentChildren.length >= 2) {
        componentsWithChildContainers.add(parentNodeId);
      }
    }

    // Build a set of all nodes that are inside child containers
    const nodesInChildContainers = new Set();
    const markDescendantsInChildContainers = (nodeId) => {
      if (nodesInChildContainers.has(nodeId)) return;
      nodesInChildContainers.add(nodeId);

      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    };

    // Mark all descendants of components with child containers
    componentsWithChildContainers.forEach((componentId) => {
      const children = context.parentChildMap.get(componentId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    });

    // Collect all hierarchy nodes (EXCLUDE nodes in child containers)
    for (const [nodeId, position] of nodePositions.entries()) {
      if (!position) continue;

      // Skip if this node is in a child container
      if (nodesInChildContainers.has(nodeId)) continue;

      const node = graphNodes.get(nodeId);
      if (!node) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      // Include components that are reachable from root modules
      if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        if (reachableFromRootModules.has(nodeId)) {
          hierarchyNodes.push(nodeId);
        }
      }
      // Include functions that are children of hierarchy components
      else if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        const parentId = childParentMap.get(nodeId);
        if (parentId && reachableFromRootModules.has(parentId)) {
          hierarchyNodes.push(nodeId);
        }
      }
    }

    if (hierarchyNodes.length === 0) {
      console.log('⚠️ No hierarchy nodes found for container bounds calculation');
      // Return a fallback bounds
      const firstRootId = Array.from(rootNodes)[0];
      const firstRootPos = nodePositions.get(firstRootId);
      const fallbackY = firstRootPos ? firstRootPos[1] : context.basePosition[1];
      return {
        centerX: 0,
        centerY: fallbackY,
        centerZ: 0,
        width: 100,
        height: 100,
        depth: 100,
        minX: -50,
        maxX: 50,
        minY: fallbackY - 50,
        maxY: fallbackY + 50,
        minZ: -50,
        maxZ: 50
      };
    }

    // Calculate bounding box (matching createRootHierarchyContainer logic)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    hierarchyNodes.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;

      // Get the actual scale of the node
      const scale = nodeScales.get(nodeId) || [1, 1, 1];
      const node = graphNodes.get(nodeId);
      const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

      // Calculate node size based on type and scale
      let nodeSize = 5; // Default size for cubes/tetrahedrons
      if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        nodeSize = Math.max(...scale) * 10; // Scale factor times base size
      }

      minX = Math.min(minX, pos[0] - nodeSize);
      maxX = Math.max(maxX, pos[0] + nodeSize);
      minY = Math.min(minY, pos[1] - nodeSize);
      maxY = Math.max(maxY, pos[1] + nodeSize);
      minZ = Math.min(minZ, pos[2] - nodeSize);
      maxZ = Math.max(maxZ, pos[2] + nodeSize);
    });

    // Add padding (matching createRootHierarchyContainer)
    const padding = 15;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    minZ -= padding;
    maxZ += padding;

    // Return full bounds
    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ,
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ
    };
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
      rootNodes,
      internalComponentChildren,
    } = context;

   

    // Collect top-level nodes by type (nodes without parents)
    const utilityNodes = []; // Top-level function nodes (utility modules)
    const serviceNodes = [];
    const storeNodes = [];
    const hookNodes = []; // Top-level hook nodes
    const backendNodes = []; // Top-level backend service nodes (node ID starts with 'backend_')
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
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) {
        // Top-level hooks - include ALL hook files (both single and multi-hook files)
        hookNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE) {
        // Backend nodes are service-type but carry a 'backend_' prefix on their ID
        if (nodeId.startsWith('backend_')) {
          backendNodes.push(nodeId);
        } else {
          serviceNodes.push(nodeId);
        }
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      }
    }

    // Build set of components reachable from actual root modules
    // Root modules are components with specific names like 'main', 'firebase', 'index'
    const reachableFromRootModules = new Set();

    // Identify likely root module names (entry points)
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];

    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

   

    // Traverse from root modules to mark all reachable components
    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return; // Already visited

      const node = graphNodes.get(nodeId);
      if (!node) return;

      // Only track components (not functions/services/etc)
      if (node.type === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      
      }

      // Recursively mark children as reachable (hierarchical contains relationships)
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
      
      // Also follow component usage connections (solid arrows between components)
      if (context.graphConnections) {
        Array.from(context.graphConnections.values()).forEach((connection) => {
          // If this node is the source of a connection to another component, mark that component as reachable
          if (connection.source === nodeId && connection.target) {
            const targetNode = graphNodes.get(connection.target);
            if (targetNode && targetNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
              markReachable(connection.target);
            }
          }
        });
      }
    };

    // Start traversal from each root module
    actualRootModules.forEach((rootModuleId) => {
     
      markReachable(rootModuleId);
    });

    // Detect ungrouped components (components not reachable from root modules)
    // IMPORTANT: Also skip internal components - they should only appear inside their parent
    for (const nodeId of graphNodes.keys()) {
      const node = graphNodes.get(nodeId);
      const nodeType = (node.type || '').toLowerCase().trim();

      if (
        nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
        nodeId !== 'MainEntry'
      ) {
        // Skip internal components - they're positioned inside their parent dodecahedron
        if (
          context.internalComponentChildren &&
          context.internalComponentChildren.has(nodeId)
        ) {
         
          continue;
        }

        // A component is ungrouped only if positionNodeHierarchy hasn't already placed it.
        // Using nodePositions membership is reliable regardless of what the root module is named
        // (avoids the fragile hardcoded ['main','index','firebase','App'] name check).
        if (!nodePositions.has(nodeId)) {
          ungroupedComponents.push(nodeId);
        }
      }
    }

    // Position each group in a horizontal square grid
    // Calculate adaptive spacing based on the largest node in the group
    const calculateGroupSpacing = (nodes) => {
      let maxScale = 1;
      nodes.forEach((nodeId) => {
        const scale = nodeScales.get(nodeId);
        if (scale) {
          const nodeScale = Math.max(...scale);
          maxScale = Math.max(maxScale, nodeScale);
        }
      });

      // A cube's geometry is [10,10,10], so its world-space half-size is 5 * scale.
      // Minimum center-to-center distance = diameter + gap = maxScale * 10 + 40.
      // Base spacing of 100 handles scale ≤ 6; larger scales need more room.
      const nodeHalfSize = maxScale * 5;
      const gap = 40; // minimum gap between edges of adjacent nodes
      return Math.max(100, nodeHalfSize * 2 + gap);
    };

    // Helper to calculate group bounds without actually positioning nodes
    // Grid starts at corner (0,0) and extends in positive X and Z directions
    const calculateGroupBounds = (nodes) => {
      if (nodes.length === 0) {
        return { width: 0, height: 0, depth: 0 };
      }

      const nodeSpacing = calculateGroupSpacing(nodes);
      const gridSize = Math.ceil(Math.sqrt(nodes.length));

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      nodes.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Calculate position in local grid (corner-based, matching positionGroup)
        const x = col * nodeSpacing;
        const z = row * nodeSpacing;

        // Get node scale for size calculation
        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const node = graphNodes.get(nodeId);
        const nodeType = node ? (node.type || '').toLowerCase().trim() : '';
        
        // Components (dodecahedrons) have base radius ≈ 10 * scale.
        // All other node types are cubes with geometry [10,10,10]: half-size = 5 * scale.
        let nodeHalfSize;
        if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
          nodeHalfSize = Math.max(...scale) * 10;
        } else {
          nodeHalfSize = Math.max(...scale) * 5;
        }

        minX = Math.min(minX, x - nodeHalfSize);
        maxX = Math.max(maxX, x + nodeHalfSize);
        minY = Math.min(minY, -nodeHalfSize);
        maxY = Math.max(maxY, nodeHalfSize);
        minZ = Math.min(minZ, z - nodeHalfSize);
        maxZ = Math.max(maxZ, z + nodeHalfSize);
      });

      // Add padding
      const padding = 15;
      return {
        width: (maxX - minX) + padding * 2,
        height: (maxY - minY) + padding * 2,
        depth: (maxZ - minZ) + padding * 2
      };
    };

    const positionGroup = (nodes, xOffset, yOffset, zOffset) => {
      if (nodes.length === 0) return;

      // Use adaptive spacing based on node sizes in this group
      const nodeSpacing = calculateGroupSpacing(nodes);

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
        // Only set default scale if not already set (e.g., for utility files with children)
        if (!nodeScales.has(nodeId)) {
          nodeScales.set(nodeId, [1, 1, 1]); // Default scale for grouped nodes
        }
      });
    };

    // Calculate scales for utility files BEFORE positioning
    // This ensures proper scaling based on their children functions
    // Use cube-specific scaling approach optimized for utility file containers
    utilityNodes.forEach((utilityId) => {
      const children = context.parentChildMap.get(utilityId) || new Set();
      if (children.size > 0) {
        // Calculate scale based on number of child functions using cube arrangement
        const childCount = children.size;

        // Use 3D grid calculation similar to dodecahedron but optimized for cubes
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));

        // Calculate required space for child cubes with appropriate spacing
        const childCubeSize = 10; // Default cube size
        const spacing = 50; // Spacing between child cubes (matches positioning logic)
        const requiredSpace = (gridSize3D - 1) * spacing + childCubeSize * 2;

        // Calculate scale factor to fit all children with generous padding
        // Use larger base size and more padding to prevent child cubes from spilling out
        const baseCubeSize = 20; // Base size of the parent utility cube
        const generousPadding = Math.max(30, childCount * 8); // Scale padding with child count
        const totalRequiredSize = requiredSpace + generousPadding * 2;

        // Use more aggressive scaling for larger child counts
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3); // More generous minimum
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);

        const scale = [scaleFactor, scaleFactor, scaleFactor];

  

        nodeScales.set(utilityId, scale);
      } else {
        // Default scale for utility files with no children
        nodeScales.set(utilityId, [1, 1, 1]);
      }
    });

    // Calculate scales for service files BEFORE positioning
    // This ensures proper scaling based on their children functions
    // Use same cube-specific scaling approach as utility files
    serviceNodes.forEach((serviceId) => {
      const children = context.parentChildMap.get(serviceId) || new Set();
      if (children.size > 0) {
        // Calculate scale based on number of child functions using cube arrangement
        const childCount = children.size;

        // Use 3D grid calculation similar to utility files
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));

        // Calculate required space for child tetrahedrons with appropriate spacing
        const childTetrahedronSize = 10; // Default tetrahedron size
        const spacing = 50; // Spacing between child tetrahedrons (matches positioning logic)
        const requiredSpace =
          (gridSize3D - 1) * spacing + childTetrahedronSize * 2;

        // Calculate scale factor to fit all children with generous padding
        const baseCubeSize = 20; // Base size of the parent service cube
        const generousPadding = Math.max(30, childCount * 8); // Scale padding with child count
        const totalRequiredSize = requiredSpace + generousPadding * 2;

        // Use more aggressive scaling for larger child counts
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3); // More generous minimum
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);

        const scale = [scaleFactor, scaleFactor, scaleFactor];

     

        nodeScales.set(serviceId, scale);
      } else {
        // Default scale for service files with no children
        nodeScales.set(serviceId, [1, 1, 1]);
      }
    });

    // Calculate scales for backend files BEFORE positioning
    // Same approach as service files
    backendNodes.forEach((backendId) => {
      const children = context.parentChildMap.get(backendId) || new Set();
      if (children.size > 0) {
        const childCount = children.size;
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));
        const childSize = 10;
        const spacing = 50;
        const requiredSpace = (gridSize3D - 1) * spacing + childSize * 2;
        const baseCubeSize = 20;
        const generousPadding = Math.max(30, childCount * 8);
        const totalRequiredSize = requiredSpace + generousPadding * 2;
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3);
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);
        nodeScales.set(backendId, [scaleFactor, scaleFactor, scaleFactor]);
      } else {
        nodeScales.set(backendId, [1, 1, 1]);
      }
    });

    // Calculate scales for hook files BEFORE positioning
    // This ensures proper scaling based on their children functions
    // Use same cube-specific scaling approach as utility files
    hookNodes.forEach((hookId) => {
      const children = context.parentChildMap.get(hookId) || new Set();
      if (children.size > 0) {
        // Calculate scale based on number of child functions using cube arrangement
        const childCount = children.size;

        // Use 3D grid calculation similar to utility files
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));

        // Calculate required space for child cubes with appropriate spacing
        const childCubeSize = 10; // Default cube size for hook functions
        const spacing = 50; // Spacing between child cubes (matches positioning logic)
        const requiredSpace = (gridSize3D - 1) * spacing + childCubeSize * 2;

        // Calculate scale factor to fit all children with generous padding
        const baseCubeSize = 20; // Base size of the parent hook cube
        const generousPadding = Math.max(30, childCount * 8); // Scale padding with child count
        const totalRequiredSize = requiredSpace + generousPadding * 2;

        // Use more aggressive scaling for larger child counts
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3); // More generous minimum
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);

        const scale = [scaleFactor, scaleFactor, scaleFactor];

       

        nodeScales.set(hookId, scale);
      } else {
        // Default scale for hook files with no children
        nodeScales.set(hookId, [1, 1, 1]);
      }
    });

  
    // Position group containers and ungrouped components
    // Calculate the actual bounding box of the root hierarchy container
    // This ensures proper edge-to-edge spacing between containers
    const rootHierarchyBounds = this.calculateRootHierarchyContainerBounds(
      context,
      graphNodes,
      childParentMap,
      nodePositions,
      nodeScales,
      rootNodes
    );
    
    // Use the root hierarchy container's center Y position for alignment
    // Don't calculate as offset since positionGroup adds to basePosition
    const groupContainerYOffset = rootHierarchyBounds.centerY - basePosition[1];
    const ungroupedYOffset = groupContainerYOffset + 200; // Ungrouped 200 above groups
    
    // Define edge-to-edge spacing between containers
    const edgeSpacing = 100;
    
    // Calculate bounds for each group to ensure proper spacing
    const utilityBounds = calculateGroupBounds(utilityNodes);
    const hookBounds = calculateGroupBounds(hookNodes);
    const serviceBounds = calculateGroupBounds(serviceNodes);
    const storeBounds = calculateGroupBounds(storeNodes);
    const backendBounds = calculateGroupBounds(backendNodes);
    
    // Root hierarchy container edges (absolute positions)
    const rootLeftEdge = rootHierarchyBounds.minX;
    const rootRightEdge = rootHierarchyBounds.maxX;
    const rootFrontEdge = rootHierarchyBounds.maxZ;
    const rootBackEdge = rootHierarchyBounds.minZ;
    
    // Utility Modules: positioned to the left with edge-to-edge spacing
    // Grid extends in positive X from xOffset, so place xOffset so right edge of utility is 100 units from root's left edge
    // Utility right edge = basePosition[0] + xOffset + utilityBounds.width
    // We want: utilityRightEdge = rootLeftEdge - edgeSpacing
    // So: basePosition[0] + xOffset + utilityBounds.width = rootLeftEdge - edgeSpacing
    // xOffset = rootLeftEdge - edgeSpacing - utilityBounds.width - basePosition[0]
    const utilityXOffset = rootLeftEdge - edgeSpacing - utilityBounds.width - basePosition[0];
    positionGroup(utilityNodes, utilityXOffset, groupContainerYOffset, 0);

    // Backend: positioned to the left of utilities
    // backendRightEdge = utilityLeftEdge - edgeSpacing
    // utilityLeftEdge = basePosition[0] + utilityXOffset (the grid starts at that X)
    const backendXOffset = utilityXOffset - edgeSpacing - backendBounds.width;
    positionGroup(backendNodes, backendXOffset, groupContainerYOffset, 0);

    // Hooks: positioned to the right with edge-to-edge spacing
    // Grid extends in positive X from xOffset, so place xOffset at root's right edge + spacing
    const hookXOffset = rootRightEdge + edgeSpacing - basePosition[0];
    positionGroup(hookNodes, hookXOffset, groupContainerYOffset, 0);

    // Services: positioned to the front with edge-to-edge spacing
    // Grid extends in positive Z from zOffset, so place zOffset at root's front edge + spacing
    const serviceZOffset = rootFrontEdge + edgeSpacing - basePosition[2];
    positionGroup(serviceNodes, 0, groupContainerYOffset, serviceZOffset);

    // Stores: positioned to the back with edge-to-edge spacing
    // Grid extends in positive Z from zOffset, so place zOffset so front edge of stores is 100 units from root's back edge
    const storeZOffset = rootBackEdge - edgeSpacing - storeBounds.depth - basePosition[2];
    positionGroup(storeNodes, 0, groupContainerYOffset, storeZOffset);

    // Ungrouped Components: center, above (0, +600, 0)
    // Position 100 units above the top-level component grouping
   

    // Calculate scales for ungrouped components BEFORE positioning
    // This ensures proper spacing based on actual dodecahedron sizes
    ungroupedComponents.forEach((componentId) => {
      const scaleResult = this.calculateDodecahedronScale(
        componentId,
        context.parentChildMap,
        graphNodes,
        context?.internalComponentChildren || new Set(),
        0
      );
      nodeScales.set(componentId, scaleResult.nodeScale);
    });

    // Position with dynamic spacing based on dodecahedron scales
    if (ungroupedComponents.length > 0) {
      const gridSize = Math.ceil(Math.sqrt(ungroupedComponents.length));
      const baseSpacing = 80; // Base spacing for dodecahedrons (larger than cubes)

      ungroupedComponents.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Get the scale to determine appropriate spacing
        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const scaleFactor = Math.max(...scale);
        const nodeSpacing = baseSpacing * scaleFactor;

        const position = [
          basePosition[0] + 0 + col * nodeSpacing,
          basePosition[1] + ungroupedYOffset,
          basePosition[2] + 50 + row * nodeSpacing,
        ];

        nodePositions.set(nodeId, position);
      });
    }

    // Process children of ungrouped components (their internal functions)
    // These components were positioned above, but their children need to be processed too
    ungroupedComponents.forEach((componentId) => {
      const children = context.parentChildMap.get(componentId) || new Set();
      if (children.size > 0) {
        const componentPosition = nodePositions.get(componentId);

        // Get container size from the already-calculated scale
        const scaleResult = this.calculateDodecahedronScale(
          componentId,
          context.parentChildMap,
          graphNodes,
          context?.internalComponentChildren || new Set(),
          0
        );
        const containerSize = scaleResult.containerSize;

        // Process each child (internal functions)
        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          // Process functions AND internal components that belong to this component
          if (
            childType === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
            (childType === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
              context.internalComponentChildren &&
              context.internalComponentChildren.has(childId))
          ) {
            // Position function inside the component using the same logic as hierarchy
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1, // level 1 (child of ungrouped component)
              index,
              childArray.length,
              componentPosition,
              containerSize,
              new Set(), // Not a root node
              graphNodes,
              context.parentChildMap,
              context?.internalComponentChildren || new Set()
            );

            nodePositions.set(childId, childPosition);
            nodeScales.set(childId, [1, 1, 1]);
            context.processedNodes.add(childId);

            const childTypeLabel =
              childType === MarkdownDiagramService.NODE_TYPE_FUNCTION
                ? 'function'
                : 'internal component';
       
          }
        });
      }
    });

    // Process children of utility functions (utility file-function relationships)
    // Utility files like "bvhRaycasting" should contain their functions like "bvhIntersectsObjects"
    utilityNodes.forEach((utilityId) => {
      const children = context.parentChildMap.get(utilityId) || new Set();
      if (children.size > 0) {
        const utilityPosition = nodePositions.get(utilityId);

        // Process each child function
        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          // Only process functions that belong to this utility file
          if (childType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
            // Position function inside the utility file using grid positioning
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1, // level 1 (child of utility function)
              index,
              childArray.length,
              utilityPosition,
              50, // Default container size for utility files
              new Set(), // Not a root node
              graphNodes,
              context.parentChildMap,
              context?.internalComponentChildren || new Set()
            );

            nodePositions.set(childId, childPosition);
            nodeScales.set(childId, [1, 1, 1]);
            context.processedNodes.add(childId);

        
          }
        });
      }
    });

    // Process children of service functions (service file-function relationships)
    // Service files like "connectionPositionResolver" should contain their functions like "resolveConnectionPositions"
    serviceNodes.forEach((serviceId) => {
      const children = context.parentChildMap.get(serviceId) || new Set();
      if (children.size > 0) {
        const servicePosition = nodePositions.get(serviceId);

        // Process each child function
        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          // Only process functions that belong to this service file
          if (childType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
            // Position function inside the service file using grid positioning
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1, // level 1 (child of service function)
              index,
              childArray.length,
              servicePosition,
              50, // Default container size for service files
              new Set(), // Not a root node
              graphNodes,
              context.parentChildMap,
              context?.internalComponentChildren || new Set()
            );

            nodePositions.set(childId, childPosition);
            nodeScales.set(childId, [1, 1, 1]);
            context.processedNodes.add(childId);

         
          }
        });
      }
    });

    // Process children of backend functions (backend file-function relationships)
    backendNodes.forEach((backendId) => {
      const children = context.parentChildMap.get(backendId) || new Set();
      if (children.size > 0) {
        const backendPosition = nodePositions.get(backendId);
        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;
          const childType = (childNode.type || '').toLowerCase().trim();
          if (
            childType === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
            childType === MarkdownDiagramService.NODE_TYPE_SERVICE
          ) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              backendPosition,
              50,
              new Set(),
              graphNodes,
              context.parentChildMap,
              context?.internalComponentChildren || new Set()
            );
            nodePositions.set(childId, childPosition);
            nodeScales.set(childId, [1, 1, 1]);
            context.processedNodes.add(childId);
          }
        });
      }
    });

    // Process children of hook functions (hook file-function relationships)
    // Hook files like "useGlobalClickHandler" should contain their functions like "handleGlobalClick"
    hookNodes.forEach((hookId) => {
      const children = context.parentChildMap.get(hookId) || new Set();
      if (children.size > 0) {
        const hookPosition = nodePositions.get(hookId);

        // Process each child function
        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          // Process functions that belong to this hook file
          if (
            childType === MarkdownDiagramService.NODE_TYPE_FUNCTION ||
            childType === MarkdownDiagramService.NODE_TYPE_HOOK
          ) {
            // Position function inside the hook file using grid positioning
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1, // level 1 (child of hook function)
              index,
              childArray.length,
              hookPosition,
              50, // Default container size for hook files
              new Set(), // Not a root node
              graphNodes,
              context.parentChildMap,
              context?.internalComponentChildren || new Set()
            );

            nodePositions.set(childId, childPosition);
            nodeScales.set(childId, [1, 1, 1]);
            context.processedNodes.add(childId);

           
          }
        });
      }
    });
  }

  /**
   * Create container cubes around grouped nodes (utilities, services, stores, hooks)
   * @param {Object} context - Processing context
   * @param {Array} allObjectsToSave - Array to collect containers for saving
   * @param {string} currentSpaceId - Current space ID
   * @param {Object} user - Current user
   */
  async createGroupContainers(context, allObjectsToSave) {
    const {
      graphNodes,
      childParentMap,
      parentChildMap,
      nodePositions,
      nodeScales,
      rootNodes,
    } = context;

    const { useObjectsStore } = await import('../stores');
    const { getCellCoordinates, getCellId } = await import(
      './spatialPartitioning'
    );

    // Collect top-level nodes by type
    const utilityNodes = []; // Top-level function nodes (utility modules)
    const serviceNodes = [];
    const storeNodes = [];
    const hookNodes = []; // Top-level hook nodes
    const backendNodes = []; // Backend service nodes (backend_ prefix)
    const ungroupedComponents = []; // Components not reachable from root modules

    // Build set of components reachable from actual root modules
    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

    // Traverse from root modules to mark all reachable components
    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    for (const [nodeId, node] of graphNodes.entries()) {
      // Only include top-level nodes (nodes without parents)
      if (childParentMap.has(nodeId)) {
        continue;
      }

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        // Top-level functions are utility modules
        utilityNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_HOOK) {
        // Top-level hooks - include ALL hook files (both single and multi-hook files)
        hookNodes.push(nodeId);
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_SERVICE) {
        // Backend nodes carry a 'backend_' prefix on their ID
        if (nodeId.startsWith('backend_')) {
          backendNodes.push(nodeId);
        } else {
          serviceNodes.push(nodeId);
        }
      } else if (nodeType === MarkdownDiagramService.NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      } else if (
        nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT &&
        nodeId !== 'MainEntry'
      ) {
        // Skip internal components - they're positioned inside their parent dodecahedron
        if (
          context.internalComponentChildren &&
          context.internalComponentChildren.has(nodeId)
        ) {
          console.log(
            `   ⏭️ Skipping ${nodeId} (internal component - positioned inside parent) [SECOND LOOP]`
          );
          continue;
        }

        // Only treat as ungrouped if not already positioned by positionNodeHierarchy
        if (!nodePositions.has(nodeId)) {
          ungroupedComponents.push(nodeId);
        }
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
        if (!pos) {
          console.log(`   ⚠️  No position found for node: ${nodeId}`);
          return;
        }
       

        // Get the actual scale of the node (important for dodecahedrons which can vary in size)
        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const node = graphNodes.get(nodeId);
        const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

        // Calculate node half-size based on type and scale.
        // Components (dodecahedrons) have base radius ≈ 10 * scale.
        // All other types are cubes with geometry [10,10,10]: half-size = 5 * scale.
        let nodeHalfSize;
        if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
          nodeHalfSize = Math.max(...scale) * 10;
        } else {
          nodeHalfSize = Math.max(...scale) * 5;
        }

        minX = Math.min(minX, pos[0] - nodeHalfSize);
        maxX = Math.max(maxX, pos[0] + nodeHalfSize);
        minY = Math.min(minY, pos[1] - nodeHalfSize);
        maxY = Math.max(maxY, pos[1] + nodeHalfSize);
        minZ = Math.min(minZ, pos[2] - nodeHalfSize);
        maxZ = Math.max(maxZ, pos[2] + nodeHalfSize);
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

      // Validate position data - skip containers with invalid positions
      if (!Number.isFinite(containerPosition[0]) || 
          !Number.isFinite(containerPosition[1]) || 
          !Number.isFinite(containerPosition[2])) {
        console.warn('⚠️ Skipping group container with invalid position:', groupName, containerPosition);
        return; // Exit this helper function early
      }

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

    // Create containers for each group with their specific colors
    createContainerForGroup(utilityNodes, 'Utility Modules', '#4CAF50'); // Green
    createContainerForGroup(hookNodes, 'Hooks', '#2196F3'); // Blue
    createContainerForGroup(serviceNodes, 'Services', '#FF9800'); // Orange
    createContainerForGroup(storeNodes, 'Stores', '#9C27B0'); // Purple
    createContainerForGroup(backendNodes, 'Backend', '#F44336'); // Red
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
   * Create container for root-level component hierarchy
   * @param {Object} context - Processing context
   * @param {Array} allObjectsToSave - Array to collect containers for saving
   */
  async createRootHierarchyContainer(context, allObjectsToSave) {
    const { graphNodes, childParentMap, nodePositions, nodeScales, rootNodes } =
      context;

    const { useObjectsStore } = await import('../stores');
    const { getCellCoordinates, getCellId } = await import(
      './spatialPartitioning'
    );

    // Collect all hierarchy nodes (components reachable from root modules + their children)
    const hierarchyNodes = [];

    // Build set of components reachable from actual root modules
    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

    // Traverse from root modules to mark all reachable components
    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    // Build a set of components that have their own child containers
    // (components with 2+ component children get their own containers)
    const componentsWithChildContainers = new Set();
    for (const [parentNodeId, children] of context.parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (
        !parentNode ||
        parentNode.type !== MarkdownDiagramService.NODE_TYPE_COMPONENT
      ) {
        continue;
      }

      // Get component children only (not functions)
      const componentChildren = Array.from(children).filter((childId) => {
        const childNode = graphNodes.get(childId);
        return (
          childNode &&
          childNode.type === MarkdownDiagramService.NODE_TYPE_COMPONENT
        );
      });

      // If has 2+ component children, it gets its own container
      if (componentChildren.length >= 2) {
        componentsWithChildContainers.add(parentNodeId);
      }
    }

    // Build a set of all nodes that are inside child containers
    // (descendants of components that have their own containers)
    const nodesInChildContainers = new Set();
    const markDescendantsInChildContainers = (nodeId) => {
      if (nodesInChildContainers.has(nodeId)) return;
      nodesInChildContainers.add(nodeId);

      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    };

    // Mark all descendants of components with child containers
    componentsWithChildContainers.forEach((componentId) => {
      const children = context.parentChildMap.get(componentId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    });

    // Collect all hierarchy nodes (components + their children)
    // EXCLUDE nodes that are in child containers
    for (const [nodeId, position] of nodePositions.entries()) {
      if (!position) continue;

      // Skip if this node is in a child container
      if (nodesInChildContainers.has(nodeId)) continue;

      const node = graphNodes.get(nodeId);
      if (!node) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      // Include components that are reachable from root modules
      if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        if (reachableFromRootModules.has(nodeId)) {
          hierarchyNodes.push(nodeId);
        }
      }
      // Include functions that are children of hierarchy components
      else if (nodeType === MarkdownDiagramService.NODE_TYPE_FUNCTION) {
        const parentId = childParentMap.get(nodeId);
        if (parentId && reachableFromRootModules.has(parentId)) {
          hierarchyNodes.push(nodeId);
        }
      }
    }

    if (hierarchyNodes.length === 0) {
      console.log('⚠️ No hierarchy nodes to create container for');
      return;
    }

 

    // Calculate bounding box
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    hierarchyNodes.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;

      // Get the actual scale of the node (important for dodecahedrons which can vary in size)
      const scale = nodeScales.get(nodeId) || [1, 1, 1];
      const node = graphNodes.get(nodeId);
      const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

      // Calculate node size based on type and scale
      let nodeSize = 5; // Default size for cubes/tetrahedrons
      if (nodeType === MarkdownDiagramService.NODE_TYPE_COMPONENT) {
        // For dodecahedrons (components), use the actual scale
        nodeSize = Math.max(...scale) * 10; // Scale factor times base size
      }

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

    // Validate position data - skip if invalid
    if (!Number.isFinite(containerPosition[0]) || 
        !Number.isFinite(containerPosition[1]) || 
        !Number.isFinite(containerPosition[2])) {
      console.warn('⚠️ Skipping Component Hierarchy container with invalid position:', containerPosition);
      return null;
    }

    // Generate unique ID
    const containerId = `group-container-Component Hierarchy-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const cellCoords = getCellCoordinates(containerPosition);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

    // Create container cube (matching the style from createContainerCubesAtPositions)
    const containerCube = {
      id: containerId,
      type: 'cube',
      position: [...containerPosition],
      scale: [...containerScale],
      color: '#e0e0e0', // Light gray for containers
      lineWidth: 2,
      cellId: cellId,
      createdAt: Date.now(),
      headerText: 'Component Hierarchy Group',
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
        groupType: 'Component Hierarchy',
        nodeCount: hierarchyNodes.length,
      },
    };

    // Prepare for Cloud Function bulk save
    const containerForSave = {
      id: containerId,
      position: [...containerPosition],
      size: [...containerScale],
      scale: [...containerScale],
      type: 'cube',
      color: '#e0e0e0',
      lineWidth: 2,
      content: 'Component Hierarchy Group',
      createdAt: Date.now(),
      cellId: cellId,
      headerText: 'Component Hierarchy Group',
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
        groupType: 'Component Hierarchy',
        nodeCount: hierarchyNodes.length,
      },
    };

    allObjectsToSave.push(containerForSave);

    // Add container cube to store
    const currentObjects = useObjectsStore.getState().objects;
    useObjectsStore.getState().setObjects([...currentObjects, containerCube]);
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
    const {
      parentChildMap,
      childParentMap,
      rootNodes,
      internalComponentChildren,
    } = this.buildHierarchicalRelationships(graph);

    // Calculate hierarchical positions and scales
    const nodePositions = new Map();
    const nodeScales = new Map();
    const processedNodes = new Set();

    // Create processing context
    const context = {
      parentChildMap,
      childParentMap,
      rootNodes,
      internalComponentChildren,
      graphNodes: graph.nodes,
      graphConnections: graph.connections, // Add connections for reachability traversal
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

    // Apply collision detection and resolution to prevent overlapping subtrees
    this.resolveCollisions(context);

    // Create 3D objects with batch processing for better performance
    let objectsCreated = 0;
    const nodeEntries = Array.from(nodePositions);

    

    const OBJECT_BATCH_SIZE = 50; // Process objects in smaller batches

    // Collect all objects for this diagram before adding to store
    const allObjectsForDiagram = [];

    // Build a lookup map of existing objects by merfolkData.nodeId to avoid re-creating
    // objects that were already created in a previous scan of the same repository.
    const existingObjects = useObjectsStore.getState().objects;
    const existingNodeIdMap = new Map();
    for (const obj of existingObjects) {
      if (obj.merfolkData?.nodeId) {
        existingNodeIdMap.set(obj.merfolkData.nodeId, obj.id);
      }
    }

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
                fontSize: 1.5,
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
              headerText: node.name || node.id || 'Node',
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
          // Validate position data - skip objects with invalid positions
          if (!Array.isArray(data.position) || data.position.length < 3 ||
              !Number.isFinite(data.position[0]) || 
              !Number.isFinite(data.position[1]) || 
              !Number.isFinite(data.position[2])) {
            console.warn('⚠️ Skipping object with invalid position:', data.nodeId, data.position);
            continue;
          }

          // Skip nodes that already have a corresponding object in the store
          // (i.e. from a previous scan), but register their ID so connections work.
          if (existingNodeIdMap.has(data.nodeId)) {
            nodeToObjectIdMap.set(data.nodeId, existingNodeIdMap.get(data.nodeId));
            continue;
          }

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
      childParentMap,
      graph.nodes,
      nodePositions,
      nodeScales,
      internalComponentChildren
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

    // Create container for root-level component hierarchy
    await this.createRootHierarchyContainer(context, allObjectsToSave);

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
   * @param {Map} childParentMap - Map of child to parent relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {Map} nodePositions - Map of node positions
   * @param {Map} nodeScales - Map of node scales
   * @returns {Map} - Map of parent node IDs to their container dimensions
   */
  calculateContainerDimensions(
    parentChildMap,
    childParentMap,
    graphNodes,
    nodePositions,
    nodeScales,
    internalComponentChildren = new Set()
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

      // Filter out internal components - they are positioned inside parent, not in external container
      const externalComponentChildren = componentChildren.filter(
        (childId) => !internalComponentChildren.has(childId)
      );

      // IMPORTANT: Only include children where THIS component is their hierarchical parent
      // This prevents the same child from appearing in multiple containers when it's used by multiple parents
      // When there's a conflict between import-based parent and hierarchical parent, we use hierarchical parent
      const hierarchicalChildren = externalComponentChildren.filter((childId) => {
        const hierarchicalParent = childParentMap.get(childId);
        return hierarchicalParent === parentNodeId;
      });

      // Log grouped components for debugging
      if (hierarchicalChildren.length > 0) {
        const parentNode = graphNodes.get(parentNodeId);
        const parentLabel = parentNode?.name || parentNodeId;
        const childLabels = hierarchicalChildren.map(id => {
          const node = graphNodes.get(id);
          return node?.name || id;
        });
        console.log(`📦 Group under "${parentLabel}": [${childLabels.join(', ')}] (${hierarchicalChildren.length} children)`);
      }


      // Calculate bounding box for all child components
      let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

      hierarchicalChildren.forEach((childId) => {
        const childPos = nodePositions.get(childId);
        const childScale = nodeScales.get(childId);

        if (!childPos || !childScale) return;

        // Calculate child's actual size
        const childSize =
          MarkdownDiagramService.BASE_DODECAHEDRON_RADIUS *
          Math.max(...childScale);

        const childNode = graphNodes.get(childId);
        const childLabel = childNode ? (childNode.name || childId) : childId;
       

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

      // Calculate dimensions for container cube
      const width = maxX - minX;
      const height = maxY - minY;
      const depth = maxZ - minZ;

      // Container cube scale (divide by 10 because default cube size is 10)
      const containerScale = [width / 10, height / 10, depth / 10];
      
      // Position container at the CENTER of the bounding box of its children
      // This ensures the container tightly wraps around the children regardless of parent position
      const containerPosition = [
        (minX + maxX) / 2,  // Center X of bounding box
        (minY + maxY) / 2,  // Center Y of bounding box
        (minZ + maxZ) / 2   // Center Z of bounding box
      ];

      // Log container details for debugging
      const parentLabel = parentNode.name || parentNodeId;
     

      // Store container dimensions for this parent
      containerDimensions.set(parentNodeId, {
        position: containerPosition,
        scale: containerScale,
        width: width,
        height: height,
        depth: depth,
        bottomY: minY, // Bottom edge Y coordinate
        childCount: hierarchicalChildren.length,
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

      // Validate position data - skip containers with invalid positions
      if (!Array.isArray(position) || position.length < 3 ||
          !Number.isFinite(position[0]) || 
          !Number.isFinite(position[1]) || 
          !Number.isFinite(position[2])) {
        console.warn('⚠️ Skipping container with invalid position:', parentNodeId, position);
        continue;
      }

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
        headerText: `${parentNode.name || parentNode.id} Group`,
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
        content: `${parentNode.name || parentNode.id} Group`,
        createdAt: Date.now(),
        cellId: cellId,
        headerText: `${parentNode.name || parentNode.id} Group`,
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
   * Parse flowpath directives and #tag annotations from Merfolk code blocks.
   * Returns a Map of "sourceNodeId|targetNodeId" -> Set<flowpathName> so that
   * createConnectionsFromDiagram can tag each connection with its flow paths.
   *
   * Supported syntax:
   *   flowpath "name" : A --> B --> C
   *   flowpath "name" (-.->): A --> B --> C
   *   flowpath "name" : A --> B --> C : "description"
   *   A --> B : "text" #tag1 #tag2
   *
   * @param {string} content - Raw markdown content
   * @returns {Map} connectionTags - "src|tgt" -> Set<name>
   */
  parseFlowPaths(content) {
    const connectionTags = new Map();

    // Only process content inside ```merfolk ... ``` code blocks
    const blockRegex = /```merfolk\n([\s\S]*?)```/g;
    const merfolkChunks = [];
    let blockMatch;
    while ((blockMatch = blockRegex.exec(content)) !== null) {
      merfolkChunks.push(blockMatch[1]);
    }
    if (merfolkChunks.length === 0) return connectionTags;
    const merfolkContent = merfolkChunks.join('\n');

    const addTag = (src, tgt, name) => {
      const key = `${src}|${tgt}`;
      if (!connectionTags.has(key)) connectionTags.set(key, new Set());
      connectionTags.get(key).add(name);
    };

    // 1. Parse flowpath directives
    const flowpathRegex =
      /^[ \t]*flowpath\s+"([^"]+)"\s*(?:\([^)]*\))?\s*:\s*(.+?)(?:\s*:\s*"[^"]*")?\s*$/gm;
    let match;
    while ((match = flowpathRegex.exec(merfolkContent)) !== null) {
      const name = match[1];
      const sequenceStr = match[2];
      const nodes = sequenceStr
        .split(/\s*(?:-->|-.->|-\.->|===+>|--[^>]*>)\s*/)
        .map(n => n.trim())
        .filter(Boolean);
      for (let i = 0; i < nodes.length - 1; i++) {
        addTag(nodes[i], nodes[i + 1], name);
      }
    }

    // 2. Parse #tag annotations on individual connection lines
    //    NodeA --> NodeB : "text" #tag1 #tag2
    const taggedConnRegex =
      /^[ \t]*(\w[\w-]*)[ \t]*(?:-->|-.->|-\.->|===+>|--[^>]*>)[ \t]*(\w[\w-]*)[ \t]*(?::\s*"[^"]*")?[ \t]*((?:#\w+[ \t]*)+)/gm;
    while ((match = taggedConnRegex.exec(merfolkContent)) !== null) {
      const srcId = match[1];
      const tgtId = match[2];
      const tags = (match[3].match(/#(\w+)/g) || []).map(t => t.slice(1));
      tags.forEach(tag => addTag(srcId, tgtId, tag));
    }

    return connectionTags;
  }

  /**
   * Remove flowpath directives from raw markdown content before passing to
   * MarkdownProcessor, which doesn't understand this syntax.
   * @param {string} content - Raw markdown content
   * @returns {string} - Cleaned markdown content
   */
  stripFlowPathSyntax(content) {
    // Remove flowpath directive lines wherever they appear
    return content.replace(/^[ \t]*flowpath\b[^\n]*/gm, '');
  }

  /**
   * Create connections between objects
   * @param {Object} diagram - The processed diagram
   * @param {Map} nodeToObjectIdMap - Map of node ID to object ID
   * @param {Array} allConnectionsToSave - Array to collect all connections
   * @param {Map} connectionTags - Optional flow path tags per node pair
   */
  createConnectionsFromDiagram(
    diagram,
    nodeToObjectIdMap,
    allConnectionsToSave,
    connectionTags = new Map()
  ) {
    const graph = diagram.graph;
    if (!graph || !graph.connections) {
      return;
    }

    // Process connections
    const existingConnections = useConnectionStore.getState().connections;
    // Build a Set of existing connection pairs for O(1) duplicate lookups
    const existingConnectionPairs = new Set(
      existingConnections
        .filter((conn) => conn.start?.objectId && conn.end?.objectId)
        .map((conn) => `${conn.start.objectId}|${conn.end.objectId}`)
    );
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
        // Skip if a connection between these two objects already exists
        if (existingConnectionPairs.has(`${sourceObjectId}|${targetObjectId}`)) {
          return;
        }

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

        // Distribute connections across faces to prevent text label stacking.
        // Previously only dodecahedrons got face distribution; cubes/tetrahedrons
        // were hardcoded to 'front', causing all connections from the same object
        // to share the same endpoint and midpoint.
        const CUBE_FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        const TETRAHEDRON_FACES = ['front', 'left', 'right', 'bottom'];

        const getFaceForObject = (objectId, objectType, isSource) => {
          const key = `${objectId}_${isSource ? 'source' : 'target'}`;

          if (!window._faceDistributionCounters) {
            window._faceDistributionCounters = new Map();
          }

          const currentCount = window._faceDistributionCounters.get(key) || 0;
          window._faceDistributionCounters.set(key, currentCount + 1);

          if (objectType === 'dodecahedron') {
            return currentCount % 12;
          } else if (objectType === 'tetrahedron') {
            return TETRAHEDRON_FACES[currentCount % TETRAHEDRON_FACES.length];
          } else {
            // Cube and all other 3D object types
            return CUBE_FACES[currentCount % CUBE_FACES.length];
          }
        };

        // Helper: compute cube/tetrahedron face world position from face name
        const computeFaceWorldPosition = (objectPosition, objectScale, faceName, objectType) => {
          const pos = [...objectPosition];
          const s = objectScale || [1, 1, 1];
          const cubeSize = 5; // Must match cubeHelpers / facePositionUtils

          if (objectType === 'tetrahedron') {
            // Tetrahedron face centers (same vertex layout as facePositionUtils)
            const TETRA_SIZE = 5;
            const v = [
              [0, TETRA_SIZE, 0],
              [-TETRA_SIZE, -TETRA_SIZE, TETRA_SIZE],
              [TETRA_SIZE, -TETRA_SIZE, TETRA_SIZE],
              [0, -TETRA_SIZE, -TETRA_SIZE * 1.5],
            ];
            let fc;
            switch (faceName) {
              case 'bottom': fc = [(v[1][0]+v[2][0]+v[3][0])/3, (v[1][1]+v[2][1]+v[3][1])/3, (v[1][2]+v[2][2]+v[3][2])/3]; break;
              case 'front':  fc = [(v[0][0]+v[2][0]+v[1][0])/3, (v[0][1]+v[2][1]+v[1][1])/3, (v[0][2]+v[2][2]+v[1][2])/3]; break;
              case 'left':   fc = [(v[0][0]+v[1][0]+v[3][0])/3, (v[0][1]+v[1][1]+v[3][1])/3, (v[0][2]+v[1][2]+v[3][2])/3]; break;
              case 'right':  fc = [(v[0][0]+v[3][0]+v[2][0])/3, (v[0][1]+v[3][1]+v[2][1])/3, (v[0][2]+v[3][2]+v[2][2])/3]; break;
              default:       fc = [0, 0, 0];
            }
            return [pos[0] + fc[0] * s[0], pos[1] + fc[1] * s[1], pos[2] + fc[2] * s[2]];
          }

          // Cube face offsets
          switch (faceName) {
            case 'front':  return [pos[0], pos[1], pos[2] + cubeSize * s[2]];
            case 'back':   return [pos[0], pos[1], pos[2] - cubeSize * s[2]];
            case 'left':   return [pos[0] - cubeSize * s[0], pos[1], pos[2]];
            case 'right':  return [pos[0] + cubeSize * s[0], pos[1], pos[2]];
            case 'top':    return [pos[0], pos[1] + cubeSize * s[1], pos[2]];
            case 'bottom': return [pos[0], pos[1] - cubeSize * s[1], pos[2]];
            default:       return pos;
          }
        };

        // Calculate face positions for both objects
        let sourceFaceIndex, targetFaceIndex;
        let sourceWorldPosition, targetWorldPosition;

        // Distribute faces for ALL object types (not just dodecahedrons)
        sourceFaceIndex = getFaceForObject(sourceObjectId, sourceObject.type, true);
        targetFaceIndex = getFaceForObject(targetObjectId, targetObject.type, false);

        if (sourceObject.type === 'dodecahedron') {
          sourceWorldPosition = [...sourceObject.position];
        } else {
          // Compute accurate face world position for cubes/tetrahedrons
          sourceWorldPosition = computeFaceWorldPosition(
            sourceObject.position, sourceObject.scale, sourceFaceIndex, sourceObject.type
          );
        }

        if (targetObject.type === 'dodecahedron') {
          targetWorldPosition = [...targetObject.position];
        } else {
          targetWorldPosition = computeFaceWorldPosition(
            targetObject.position, targetObject.scale, targetFaceIndex, targetObject.type
          );
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

        // Now that calculateDodecahedronFaceCenter is defined, compute accurate face world positions
        if (sourceObject.type === 'dodecahedron') {
          const fc = calculateDodecahedronFaceCenter(sourceFaceIndex);
          const s = sourceObject.scale || [1, 1, 1];
          sourceWorldPosition = [
            sourceObject.position[0] + fc[0] * s[0],
            sourceObject.position[1] + fc[1] * s[1],
            sourceObject.position[2] + fc[2] * s[2],
          ];
        }
        if (targetObject.type === 'dodecahedron') {
          const fc = calculateDodecahedronFaceCenter(targetFaceIndex);
          const s = targetObject.scale || [1, 1, 1];
          targetWorldPosition = [
            targetObject.position[0] + fc[0] * s[0],
            targetObject.position[1] + fc[1] * s[1],
            targetObject.position[2] + fc[2] * s[2],
          ];
        }

        const connectionData = {
          id: connectionId,
          start: {
            objectId: sourceObjectId,
            type:
              sourceObject.type === 'dodecahedron'
                ? 'dodecahedron'
                : sourceObject.type || 'cube',
            face: sourceFaceIndex,
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
            face: targetFaceIndex,
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
            flowPaths: Array.from(
              connectionTags.get(`${sourceNodeId}|${targetNodeId}`) || []
            ),
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
        type: obj.type,
        color: obj.color,
        content: obj.content || '',
        createdAt: obj.createdAt || Date.now(),
        cellId: obj.cellId,
        ...(obj.size && { size: obj.size }),
        ...(obj.scale && { scale: obj.scale }),
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

      // Prepare payload
      const payload = {
        idToken,
        userId: user.uid,
        spaceId: currentSpaceId,
        objects,
        connections,
      };

      // Log payload size for debugging
      const payloadSize = JSON.stringify(payload).length;
     

      // Check if payload is too large (Cloud Functions have ~10MB limit)
      if (payloadSize > 9 * 1024 * 1024) {
        console.warn(
          '⚠️ [CloudFunction] Payload too large, falling back to client-side save'
        );
        return this._backgroundSaveConnections(
          allConnectionsToSave,
          currentSpaceId,
          user
        );
      }

      // Call Cloud Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error || errorData.message || JSON.stringify(errorData);
          console.error('❌ [CloudFunction] Error response:', errorData);
        } catch {
          // If we can't parse the error as JSON, get the text
          try {
            const errorText = await response.text();
            console.error('❌ [CloudFunction] Error text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch {
            console.error('❌ [CloudFunction] Could not read error response');
          }
        }
        throw new Error(`Cloud Function error: ${errorMessage}`);
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
    const BATCH_SIZE = 20; // Reduced to avoid Firestore index entry limits
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

    // Parse flowpath directives before stripping them from the content
    const connectionTags = this.parseFlowPaths(content);
    // Strip flowpath syntax so MarkdownProcessor doesn't encounter unknown directives
    const processedContent = this.stripFlowPathSyntax(content);

    // Process the markdown using 3d-ast-generator
    const diagrams = this.processor.processMarkdown(processedContent);

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

    // Reset face distribution counters for a fresh diagram processing run.
    // This ensures each diagram generation starts with a clean slate rather
    // than accumulating counters from previous runs.
    window._faceDistributionCounters = new Map();

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
        allConnectionsToSave,
        connectionTags
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
