import { useObjectsStore } from '../../stores';

export const objectMethods = {
  /**
   * Create 3D objects from processed diagram data
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

    // Create 3D objects with batch processing for better performance
    let objectsCreated = 0;
    const nodeEntries = Array.from(nodePositions);

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

          const calculateHeaderStyle = (scale, objectType) => {
            if (objectType !== 'dodecahedron' || !scale) {
              return { fontSize: 1.5, color: 'black', underline: false };
            }

            const scaleFactor = Math.max(...scale);
            const uiValue = Math.min(10, Math.max(1, Math.round(1 + scaleFactor * 1.5)));
            const fontSize = uiValue * 0.7;

            return { fontSize: fontSize, color: 'black', underline: false };
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

      const { getCellCoordinates, getCellId } = await import(
        '../spatialPartitioning'
      );

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
