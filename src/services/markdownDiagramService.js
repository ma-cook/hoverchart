import { MarkdownProcessor } from '3d-ast-generator';
import * as THREE from 'three';
import useConnectionStore from '../stores/connectionStore';
import { useObjectsStore } from '../stores';

/**
 * Service for processing Markdown files containing Merfolk diagrams
 * and converting them to 3D objects and connections
 */
export class MarkdownDiagramService {
  constructor() {
    this.processor = null;
    this.scaleCache = new Map(); // Cache for dodecahedron scale calculations
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
    let basePosition = [0, 0, -50]; // Default fallback position

    try {
      // Try multiple methods to get the camera
      const cameraRef = window.cameraRef?.current?.camera;
      const windowCamera = window.camera;
      const orbitCamera = window.orbitControls?.object;

      // Safely get camera positions with null checks
      const getCameraPosition = (cam) => {
        if (!cam) return null;
        try {
          return cam.position && typeof cam.position.x === 'number'
            ? [cam.position.x, cam.position.y, cam.position.z]
            : null;
        } catch {
          return null;
        }
      };

      // Find the first working camera with valid position
      let workingCamera = null;

      if (cameraRef && getCameraPosition(cameraRef)) {
        workingCamera = cameraRef;
      } else if (windowCamera && getCameraPosition(windowCamera)) {
        workingCamera = windowCamera;
      } else if (orbitCamera && getCameraPosition(orbitCamera)) {
        workingCamera = orbitCamera;
      }

      if (workingCamera) {
        const cameraPosition = workingCamera.position;
        const cameraDirection = new THREE.Vector3();

        // Safely get world direction
        try {
          workingCamera.getWorldDirection(cameraDirection);
        } catch {
          cameraDirection.set(0, 0, -1); // Default forward direction
        }

        // Position diagrams exactly like manual objects - close to camera
        const distance = 15; // Same distance as manual object creation
        basePosition = [
          cameraPosition.x + cameraDirection.x * distance,
          cameraPosition.y + cameraDirection.y * distance,
          cameraPosition.z + cameraDirection.z * distance,
        ];
      }
    } catch {
      // Use default position if camera access fails
    }

    return basePosition;
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
          // CORRECTED LOGIC: Functions that connect TO services belong IN those services
          if (
            sourceNode.type === 'function' &&
            targetNode.type === 'component'
          ) {
            // Function connects TO component = function belongs IN component
            parentId = targetId; // Service is the parent
            childId = sourceId; // Function is the child
          } else if (
            sourceNode.type === 'component' &&
            targetNode.type === 'function'
          ) {
            // Component connects TO function = function belongs IN component
            parentId = sourceId; // Service is the parent
            childId = targetId; // Function is the child
          } else if (
            sourceNode.type === 'component' &&
            targetNode.type === 'component'
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
    let objectType = 'cube'; // Default

    if (node.type === 'component') {
      objectType = 'dodecahedron';
    } else if (node.type === 'function') {
      objectType = 'cube';
    } else if (node.type === 'datapath') {
      return null; // Skip datapath nodes
    } else if (node.type === 'handler') {
      objectType = 'cube';
    } else if (node.type === 'state') {
      objectType = 'dodecahedron';
    } else if (node.type === 'control') {
      objectType = 'cube';
    } else if (node.type === 'data') {
      objectType = 'dodecahedron';
    }

    return objectType;
  }

  /**
   * Calculate scale for a dodecahedron based on its children
   * @param {string} nodeId - The node ID
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graph.nodes - Map of all nodes
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
    const MAX_RECURSION_DEPTH = 15; // Increased to allow deeper hierarchies
    if (level > MAX_RECURSION_DEPTH) {
      return { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 }; // Reasonable fallback
    }

    if (childCount === 0) {
      // Default scale for dodecahedrons without children - slightly larger for visibility
      const result = { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 };
      this.scaleCache.set(cacheKey, result);
      return result;
    }

    // Calculate children count and determine scale
    const cubeChildren = Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        (childNode.type === 'function' ||
          childNode.type === 'handler' ||
          childNode.type === 'control')
      );
    });

    const componentChildren = Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return childNode && childNode.type === 'component';
    });

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
      const desiredGap = 8;
      const baseSiblingSpacing = Math.max(25, maxChildSize * 1.5 + desiredGap);

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

      // Base dodecahedron size is approximately 10 units radius
      const baseDodecahedronSize = 10;

      // Conservative padding for cone structure
      const adaptivePadding =
        functionsOnly || cubeChildren.length > 0
          ? Math.max(20, maxChildSize * 0.4) // More padding for internal functions
          : 5; // Minimal padding if child components are external

      const requiredSize = requiredSpace + adaptivePadding;

      // Much more conservative scaling for cone structure
      const minScaleFactor = 1.0;
      const scaleFactor = Math.max(
        minScaleFactor,
        requiredSize / baseDodecahedronSize
      );

      nodeScale = [scaleFactor, scaleFactor, scaleFactor];
      containerSize = baseDodecahedronSize * scaleFactor;
    }

    const result = { nodeScale, containerSize };
    this.scaleCache.set(cacheKey, result); // Cache the result
    return result;
  }

  /**
   * Calculate the maximum child size for spacing calculations
   * FIXED: Now recursively calculates actual child sizes including all nested hierarchy
   * @param {Set} children - Set of child node IDs
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
   * @param {number} level - Current hierarchy level for recursion depth tracking
   * @returns {number} - Maximum child size
   */
  calculateMaxChildSize(children, parentChildMap, graphNodes, level = 0) {
    let maxChildSize = 0;

    // Prevent excessive recursion depth to avoid infinite loops, but allow deep hierarchies
    const MAX_RECURSION_DEPTH = 15; // Increased to allow deeper hierarchies
    if (level > MAX_RECURSION_DEPTH) {
      return 10; // Return reasonable default size
    }

    Array.from(children).forEach((childId) => {
      const childNode = graphNodes.get(childId);

      if (childNode && childNode.type === 'component') {
        // For child components in cone structure, use conservative sizing
        // since they're positioned externally, we don't need their full recursive size
        const childScale = this.calculateDodecahedronScale(
          childId,
          parentChildMap,
          graphNodes,
          level + 1
        );

        // Use more conservative scaling for cone structure - child components are external
        const baseDodecahedronRadius = 10;
        const childActualSize =
          baseDodecahedronRadius *
          Math.min(2.0, Math.max(...childScale.nodeScale));

        maxChildSize = Math.max(maxChildSize, childActualSize);
      } else if (
        childNode &&
        (childNode.type === 'function' ||
          childNode.type === 'handler' ||
          childNode.type === 'control')
      ) {
        maxChildSize = Math.max(maxChildSize, 5); // Cube radius
      } else if (
        childNode &&
        (childNode.type === 'state' || childNode.type === 'data')
      ) {
        maxChildSize = Math.max(maxChildSize, 4); // Sphere radius
      } else {
        maxChildSize = Math.max(maxChildSize, 5); // Default size
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
        (childNode.type === 'function' ||
          childNode.type === 'handler' ||
          childNode.type === 'control' ||
          childNode.type === 'component')
      );
    }).length;
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
   * @param {Map} parentChildMap - Map of parent to children relationships
   * @param {Map} graphNodes - Map of all nodes
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
    graphNodes // Added parameter for node type checking
  ) {
    // Get node type to determine positioning strategy
    const node = graphNodes.get(nodeId);
    const nodeType = node ? node.type : 'unknown';

    if (level === 0) {
      // Root level - arrange in a reasonable grid pattern with adequate spacing for circular children
      const rootArray = Array.from(rootNodes);
      const rootIndex = rootArray.indexOf(nodeId);

      if (rootArray.length === 1) {
        return basePosition;
      } else {
        const gridSize = Math.ceil(Math.sqrt(rootArray.length));
        const row = Math.floor(rootIndex / gridSize);
        const col = rootIndex % gridSize;

        // Increased spacing to accommodate circular child arrangements
        const spacing = 200; // Increased spacing to prevent overlap of circular arrangements

        return [
          basePosition[0] + (col - (gridSize - 1) / 2) * spacing,
          basePosition[1] + (row - (gridSize - 1) / 2) * spacing,
          basePosition[2],
        ];
      }
    } else {
      // Nested level - different strategies for components vs functions

      if (nodeType === 'component') {
        // COMPONENT POSITIONING: Horizontal circular arrangement around parent
        const radiusPerLevel = 300 + level * 100; // Much larger radius for better spacing
        const depthOffset = level * 20; // Subtle depth variation for visual hierarchy

        if (siblingCount === 1) {
          // Single child component - place at radius distance horizontally
          return [
            parentPosition[0] + radiusPerLevel,
            parentPosition[1] - depthOffset, // Keep Y constant for horizontal plane
            parentPosition[2], // Keep same Z position
          ];
        } else {
          // Multiple child components - arrange in horizontal circle around parent
          const angleStep = (2 * Math.PI) / siblingCount;
          const angle = siblingIndex * angleStep;

          // Debug logging
          console.log(`Component positioning debug:`, {
            nodeId: nodeId || 'unknown',
            siblingIndex,
            siblingCount,
            angleStep: angleStep * (180 / Math.PI), // Convert to degrees for easier understanding
            angle: angle * (180 / Math.PI),
            radiusPerLevel,
          });

          return [
            parentPosition[0] + Math.cos(angle) * radiusPerLevel,
            parentPosition[1] - depthOffset, // Keep Y constant for horizontal plane, add depth offset
            parentPosition[2] + Math.sin(angle) * radiusPerLevel, // Use Z-axis for circle
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
    if (node.type === 'datapath') {
      return;
    }

    // Determine object type
    const objectType = this.getObjectTypeForNode(node);
    if (!objectType) return;

    // Calculate scale and container size
    let nodeScale = [1, 1, 1];
    let containerSize = 50;

    if (objectType === 'dodecahedron') {
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
    console.log(`Positioning node ${nodeId} at level ${level}:`, {
      siblingIndex,
      siblingCount,
      containerSize,
      parentPosition,
    });

    const nodePosition = this.calculateNodePosition(
      nodeId,
      basePosition,
      level,
      siblingIndex,
      siblingCount,
      parentPosition,
      parentContainerSize,
      rootNodes,
      graphNodes
    );

    // Store position and scale
    nodePositions.set(nodeId, nodePosition);
    nodeScales.set(nodeId, nodeScale);

    // Process children recursively
    const children = parentChildMap.get(nodeId) || new Set();
    if (children.size > 0) {
      const childArray = Array.from(children);
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
   * Create 3D objects from processed diagram data
   * @param {Object} diagram - The processed diagram
   * @param {Function} onCreateObject - Callback to create 3D objects
   * @param {Map} nodeToObjectIdMap - Map to track node ID to object ID mapping
   * @param {Array} basePosition - Base position for root level objects
   * @returns {number} - Number of objects created
   */
  async createObjectsFromDiagram(
    diagram,
    onCreateObject,
    nodeToObjectIdMap,
    basePosition
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

    // Create 3D objects with batch processing for better performance
    let objectsCreated = 0;
    const nodeEntries = Array.from(nodePositions);
    const OBJECT_BATCH_SIZE = 50; // Process objects in smaller batches

    console.log(
      `🔄 Creating ${nodeEntries.length} objects in batches of ${OBJECT_BATCH_SIZE}...`
    );

    for (let i = 0; i < nodeEntries.length; i += OBJECT_BATCH_SIZE) {
      const batch = nodeEntries.slice(i, i + OBJECT_BATCH_SIZE);
      const batchNumber = Math.floor(i / OBJECT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(nodeEntries.length / OBJECT_BATCH_SIZE);

      console.log(
        `📦 Processing object batch ${batchNumber}/${totalBatches} (${batch.length} objects)...`
      );

      for (const [nodeId, position] of batch) {
        const node = graph.nodes.get(nodeId);
        const scale = nodeScales.get(nodeId);
        const objectType = this.getObjectTypeForNode(node);

        if (!objectType || !node) continue;

        try {
          // Calculate appropriate header style based on object scale
          // This matches the TextStyleUI scaling system (values 1-10 with 0.7 multiplier)
          const calculateHeaderStyle = (scale, objectType) => {
            if (objectType !== 'dodecahedron' || !scale) {
              return {
                fontSize: 'medium', // Default for non-dodecahedrons
                color: 'black',
                underline: false,
              };
            }

            // Get the maximum scale factor (assuming uniform scaling)
            const scaleFactor = Math.max(...scale);

            // Calculate TextStyleUI-compatible value (1-10 scale)
            // Scale factor of 1.0 → UI value of 2 (small but readable)
            // Scale factor of 2.0 → UI value of 4
            // Scale factor of 3.0 → UI value of 6, etc.
            const uiValue = Math.min(
              10,
              Math.max(1, Math.round(1 + scaleFactor * 1.5))
            );

            // Apply the same multiplier as TextStyleUI for headers (0.7)
            const fontSize = uiValue * 0.7;

            return {
              fontSize: fontSize,
              color: 'black',
              underline: false,
            };
          };

          const headerStyle = calculateHeaderStyle(scale, objectType);

          const objectId = await onCreateObject(objectType, position, {
            scale,
            headerText: node.label || node.id || '',
            headerStyle: headerStyle,
            // Add any additional properties based on node type
            ...(node.properties || {}),
          });

          if (objectId) {
            nodeToObjectIdMap.set(nodeId, objectId);
            objectsCreated++;
          }

          // Longer delay between object creations to prevent Firebase overload
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Failed to create object for node ${nodeId}:`, error);
        }
      }

      // Longer delay between object batches to prevent overwhelming the system
      if (i + OBJECT_BATCH_SIZE < nodeEntries.length) {
        console.log('⏱️ Waiting 500ms before next object batch...');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `🎉 Object creation completed: ${objectsCreated} objects created`
    );

    return objectsCreated;
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
          lineStyle: 'straight',
          textStyle: {
            fontSize: 4,
            color: 'black',
          },
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
   * Save all connections to the connection store using Firebase batches
   * @param {Array} allConnectionsToSave - Array of connection data to save
   * @param {string} currentSpaceId - Current space ID
   * @param {Object} user - User object for authentication
   */
  async saveConnections(allConnectionsToSave, currentSpaceId, user) {
    if (allConnectionsToSave.length === 0) return;

    const connectionStore = useConnectionStore.getState();

    console.log(
      `🔄 Starting batch save of ${allConnectionsToSave.length} connections...`
    );

    // First, add all connections to the store immediately for UI responsiveness
    allConnectionsToSave.forEach((connectionData) => {
      try {
        connectionStore.addConnection(connectionData);
      } catch (error) {
        console.error('Failed to add connection to store:', error);
      }
    });

    // If no user or space, we're done (local-only mode)
    if (!user || !currentSpaceId) {
      console.log('✅ Connections added to local store (no Firebase save)');
      return;
    }

    // Save to Firebase in very small batches with aggressive rate limiting
    const BATCH_SIZE = 10; // Very small batches to prevent Firebase write stream exhaustion
    let savedCount = 0;
    let batchCount = 0;

    for (let i = 0; i < allConnectionsToSave.length; i += BATCH_SIZE) {
      const batch = allConnectionsToSave.slice(i, i + BATCH_SIZE);
      batchCount++;

      console.log(
        `📦 Processing batch ${batchCount} (${batch.length} connections)...`
      );

      try {
        // Import spatial partitioning for bulk operations
        const { bulkSaveConnectionsToCell, getCellCoordinates, getCellId } =
          await import('./spatialPartitioning');

        let batchSavedCount = 0;

        // Group connections by cell for bulk operations
        const connectionsByCell = new Map();

        for (const connectionData of batch) {
          const startPosition = connectionData.start?.position;
          const endPosition = connectionData.end?.position;

          if (!startPosition || !endPosition) {
            console.warn(
              '⚠️ Skipping connection due to missing positions:',
              connectionData.id
            );
            continue;
          }

          // Get cell coordinates for both endpoints
          const startCellCoords = getCellCoordinates(startPosition);
          const endCellCoords = getCellCoordinates(endPosition);

          const startCellId = getCellId(
            startCellCoords.x,
            startCellCoords.y,
            startCellCoords.z
          );
          const endCellId = getCellId(
            endCellCoords.x,
            endCellCoords.y,
            endCellCoords.z
          );

          // Add to start cell
          if (!connectionsByCell.has(startCellId)) {
            connectionsByCell.set(startCellId, []);
          }
          connectionsByCell.get(startCellId).push(connectionData);

          // Add to end cell if different
          if (startCellId !== endCellId) {
            if (!connectionsByCell.has(endCellId)) {
              connectionsByCell.set(endCellId, []);
            }
            connectionsByCell.get(endCellId).push(connectionData);
          }
        }

        // Bulk save to each cell
        console.log(`📍 Found ${connectionsByCell.size} cells to save to`);
        for (const [cellId, connections] of connectionsByCell) {
          try {
            console.log(
              `💾 Saving ${connections.length} connections to cell ${cellId}`
            );
            const success = await bulkSaveConnectionsToCell(
              user.uid,
              currentSpaceId,
              cellId,
              connections
            );
            console.log(`💾 Cell ${cellId} save result:`, success);
            if (success) {
              batchSavedCount += connections.length;
            }

            // Small delay between cell operations
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Failed to bulk save to cell ${cellId}:`, error);
          }
        }

        savedCount += batchSavedCount;

        console.log(
          `✅ Batch ${batchCount} completed: ${batchSavedCount}/${batch.length} saved`
        );

        // Much longer delay between batches to allow Firebase to fully recover
        if (i + BATCH_SIZE < allConnectionsToSave.length) {
          console.log('⏱️ Waiting 5 seconds before next batch...');
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`❌ Batch ${batchCount} failed:`, error);
      }
    }

    console.log(
      `🎉 Batch save completed: ${savedCount}/${allConnectionsToSave.length} connections saved to Firebase`
    );
  }

  /**
   * Process a markdown file and create 3D objects and connections
   * @param {File} file - The markdown file to process
   * @param {Function} onCreateObject - Callback to create 3D objects
   * @param {string} currentSpaceId - Current space ID
   * @returns {Promise<Object>} - Processing results
   */
  async processMarkdownFile(file, onCreateObject, currentSpaceId, user) {
    // Clear cache for new processing session
    this.scaleCache.clear();

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

    // Process each diagram
    for (let diagramIndex = 0; diagramIndex < diagrams.length; diagramIndex++) {
      const diagram = diagrams[diagramIndex];

      if (diagram.errors && diagram.errors.length > 0) {
        console.warn(`Diagram ${diagramIndex} has errors:`, diagram.errors);
        continue;
      }

      // Create objects from diagram
      const objectsCreated = await this.createObjectsFromDiagram(
        diagram,
        onCreateObject,
        nodeToObjectIdMap,
        basePosition
      );

      totalObjectsCreated += objectsCreated;

      // Create connections from diagram
      this.createConnectionsFromDiagram(
        diagram,
        nodeToObjectIdMap,
        allConnectionsToSave
      );
    }

    // Give Firebase time to recover after object creation before starting connections
    if (allConnectionsToSave.length > 0) {
      console.log(
        '⏱️ Allowing Firebase to recover after object creation (3 seconds)...'
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Save all connections
    await this.saveConnections(allConnectionsToSave, currentSpaceId, user);

    const validDiagrams = diagrams.filter(
      (d) => !d.errors || d.errors.length === 0
    );

    return {
      diagramCount: validDiagrams.length,
      objectsCreated: totalObjectsCreated,
      connectionsCreated: allConnectionsToSave.length,
      success: totalObjectsCreated > 0,
    };
  }
}

// Export singleton instance
export const markdownDiagramService = new MarkdownDiagramService();
