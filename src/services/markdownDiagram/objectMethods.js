import { useObjectsStore } from '../../stores';
import useDiagramStore from '../../stores/diagramStore.js';
import { getCellCoordinates, getCellId } from '../spatialPartitioning';

export const objectMethods = {
  /**
   * Create 3D objects from processed diagram data.
   *
   * @param {object}      diagram          - Raw diagram from MarkdownProcessor (or a reconstructed
   *                                         diagram-like object when using precomputedLayout).
   * @param {Function}    onCreateObject   - Callback invoked for each new object.
   * @param {Map}         nodeToObjectIdMap - Populated with nodeId → objectId mappings.
   * @param {number[]}    basePosition     - [x, y, z] spawn origin.
   * @param {object}      user             - Authenticated user record.
   * @param {string}      currentSpaceId   - Active space identifier.
   * @param {object[]}    allObjectsToSave - Accumulator for batch-saving to Firebase.
   * @param {object|null} precomputedLayout - When provided (from markdownLayoutWorker) the
   *                                         position/scale/hierarchy computation is skipped and
   *                                         the serialised arrays are restored into ES6 Maps.
   */
  async createObjectsFromDiagram(
    diagram,
    onCreateObject,
    nodeToObjectIdMap,
    basePosition,
    user,
    currentSpaceId,
    allObjectsToSave,
    precomputedLayout = null
  ) {
    const graph = diagram.graph;
    if (!graph || !graph.nodes) {
      return 0;
    }

    let parentChildMap, childParentMap, rootNodes, internalComponentChildren;
    let nodePositions, nodeScales;
    let context;

    if (precomputedLayout) {
      // ── Worker-computed layout ───────────────────────────────────────────
      // Reconstruct ES6 Maps / Sets from the serialised arrays returned by
      // markdownLayoutWorker so container methods receive the types they expect.
      parentChildMap = new Map(
        precomputedLayout.parentChildMap.map(([k, v]) => [k, new Set(v)])
      );
      childParentMap = new Map(precomputedLayout.childParentMap);
      rootNodes = new Set(precomputedLayout.rootNodes);
      internalComponentChildren = new Set(precomputedLayout.internalComponentChildren);
      nodePositions = new Map(
        precomputedLayout.nodes.map((n) => [n.nodeId, n.position])
      );
      nodeScales = new Map(
        precomputedLayout.nodes.map((n) => [n.nodeId, n.scale])
      );
      context = {
        parentChildMap,
        childParentMap,
        rootNodes,
        internalComponentChildren,
        graphNodes: graph.nodes,
        graphConnections: graph.connections,
        basePosition,
        nodePositions,
        nodeScales,
        processedNodes: new Set(),
        // Use the worker-computed ungrouped list so container creation
        // uses the same set of nodes that was positioned as "ungrouped".
        ungroupedComponents: precomputedLayout.ungroupedComponents || [],
      };
    } else {
      // ── Main-thread fallback (original code path) ────────────────────────
      const relationships = this.buildHierarchicalRelationships(graph);
      parentChildMap = relationships.parentChildMap;
      childParentMap = relationships.childParentMap;
      rootNodes = relationships.rootNodes;
      internalComponentChildren = relationships.internalComponentChildren;

      nodePositions = new Map();
      nodeScales = new Map();
      const processedNodes = new Set();

      context = {
        parentChildMap,
        childParentMap,
        rootNodes,
        internalComponentChildren,
        graphNodes: graph.nodes,
        graphConnections: graph.connections,
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
    }

    // Persist hierarchy for the 2D diagram view
    useDiagramStore.getState().setHierarchy({
      parentChildMap,
      childParentMap,
      rootNodes,
      internalComponentChildren,
    });

    // Create 3D objects with batch processing for better performance
    let objectsCreated = 0;
    const nodeEntries = Array.from(nodePositions);

    const DEBUG_OBJECT_HISTOGRAM = true; // toggle off after verification
    if (DEBUG_OBJECT_HISTOGRAM) {
      const positionedTypes = {};
      const unpositionedTypes = {};
      for (const [nodeId, node] of graph.nodes.entries()) {
        const t = (node.type || 'unknown').toLowerCase();
        if (nodePositions.has(nodeId)) {
          positionedTypes[t] = (positionedTypes[t] || 0) + 1;
        } else {
          unpositionedTypes[t] = (unpositionedTypes[t] || 0) + 1;
        }
      }
      console.log('[object-histogram] graph nodes total =', graph.nodes.size);
      console.log('[object-histogram] positioned by type =', positionedTypes);
      console.log('[object-histogram] UNPOSITIONED by type =', unpositionedTypes);
    }

    const OBJECT_BATCH_SIZE = 50;

    // Collect all objects for this diagram before adding to store
    const allObjectsForDiagram = [];

    // Build a lookup map of existing objects by merfolkData.nodeId to avoid re-creating
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

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const batchData = batch
        .map(([nodeId, position]) => {
          const node = graph.nodes.get(nodeId);
          const scale = nodeScales.get(nodeId);
          const objectType = this.getObjectTypeForNode(node);

          if (!objectType || !node) return null;

          const calculateHeaderStyle = (scale, objectType, nodeId) => {
            if (!scale) {
              return { fontSize: 1.5, color: 'black', underline: false };
            }

            const isParent = parentChildMap.has(nodeId) && parentChildMap.get(nodeId).size > 0;

            if (objectType === 'dodecahedron' || isParent) {
              const scaleFactor = Math.max(...scale);
              const uiValue = Math.min(10, Math.max(1, Math.round(1 + scaleFactor * 1.5)));
              const fontSize = uiValue * 0.7;
              return { fontSize: fontSize, color: 'black', underline: false };
            }

            return { fontSize: 1.5, color: 'black', underline: false };
          };

          const headerStyle = calculateHeaderStyle(scale, objectType, nodeId);

          return {
            nodeId,
            type: objectType,
            position,
            extraData: {
              scale,
              headerText: node.name || node.id || 'Node',
              headerStyle: headerStyle,
              color: node.visual?.color,
              opacity: node.visual?.opacity,
              ...(node.properties || {}),
            },
          };
        })
        .filter(Boolean);

      for (const data of batchData) {
        try {
          if (!Array.isArray(data.position) || data.position.length < 3 ||
              !Number.isFinite(data.position[0]) ||
              !Number.isFinite(data.position[1]) ||
              !Number.isFinite(data.position[2])) {
            console.warn('⚠️ Skipping object with invalid position:', data.nodeId, data.position);
            continue;
          }

          if (existingNodeIdMap.has(data.nodeId)) {
            nodeToObjectIdMap.set(data.nodeId, existingNodeIdMap.get(data.nodeId));
            continue;
          }

          const objectId = `merfolk-obj-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const cellCoords = getCellCoordinates(data.position);
          const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

          const objectData = {
            id: objectId,
            type: data.type,
            position: data.position,
            scale: data.extraData.scale || [1, 1, 1],
            color: data.extraData.color || '#4a90e2',
            cellId: cellId,
            createdAt: Date.now(),
            ...(data.type === 'dodecahedron'
              ? {
                  headerText: data.extraData.headerText || '',
                  headerStyle: data.extraData.headerStyle || {
                    fontSize: 1.5, color: 'black', underline: false,
                  },
                  faceColors: {},
                  faceTexts: Array(12).fill('').reduce((acc, _, idx) => {
                    acc[idx] = ''; return acc;
                  }, {}),
                  faceTextStyles: Array(12).fill(null).reduce((acc, _, idx) => {
                    acc[idx] = { fontSize: 0.5, color: 'black', underline: false };
                    return acc;
                  }, {}),
                }
              : data.type === 'cube'
              ? {
                  headerText: data.extraData.headerText || '',
                  faceColors: {},
                  faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5, color: 'black', underline: false,
                  },
                }
              : data.type === 'tetrahedron'
              ? {
                  headerText: data.extraData.headerText || '',
                  faceColors: {},
                  faceTexts: { front: '', back: '', left: '', right: '' },
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5, color: 'black', underline: false,
                  },
                }
              : data.type === 'plane'
              ? {
                  content: data.extraData.headerText || '',
                  textStyle: data.extraData.headerStyle || {
                    fontSize: 1.5, color: 'black', underline: false,
                  },
                }
              : {}),
            merfolkData: {
              nodeId: data.nodeId,
              ...(data.extraData.merfolkData || {}),
            },
          };

          allObjectsForDiagram.push(objectData);

          const objectForSave = {
            id: objectId,
            position: data.position,
            size: data.extraData.scale || [1, 1, 1],
            scale: data.extraData.scale || [1, 1, 1],
            type: data.type,
            color: data.extraData.color || '#4a90e2',
            content: data.extraData.headerText || '',
            createdAt: Date.now(),
            cellId: cellId,
            ...(data.extraData.rotation && { rotation: data.extraData.rotation }),
            ...(data.extraData.headerStyle && { textStyle: data.extraData.headerStyle }),
            ...(data.type === 'dodecahedron' && {
              headerText: data.extraData.headerText || '',
              headerStyle: data.extraData.headerStyle || {
                fontSize: 1.5, color: 'black', underline: false,
              },
              faceColors: {},
              faceTexts: Array(12).fill('').reduce((acc, _, idx) => {
                acc[idx] = ''; return acc;
              }, {}),
              faceTextStyles: Array(12).fill(null).reduce((acc, _, idx) => {
                acc[idx] = { fontSize: 0.5, color: 'black', underline: false };
                return acc;
              }, {}),
            }),
            ...(data.type === 'cube' && {
              headerText: data.extraData.headerText || '',
              faceColors: {},
              faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
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

          allObjectsToSave.push(objectForSave);

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

    await this.createContainerCubesAtPositions(
      containerDimensions,
      graph.nodes,
      allObjectsToSave
    );

    await this.createGroupContainers(context, allObjectsToSave);
    await this.createRootHierarchyContainer(context, allObjectsToSave);

    return objectsCreated;
  },
};
