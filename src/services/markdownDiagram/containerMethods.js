import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_HOOK,
  NODE_TYPE_SERVICE,
  NODE_TYPE_STORE,
  BASE_DODECAHEDRON_RADIUS,
} from './constants.js';

export const containerMethods = {
  /**
   * Create container cubes around grouped nodes (utilities, services, stores, hooks)
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

    const { useObjectsStore } = await import('../../stores');
    const { getCellCoordinates, getCellId } = await import(
      '../spatialPartitioning'
    );

    const utilityNodes = [];
    const serviceNodes = [];
    const storeNodes = [];
    const hookNodes = [];
    const backendNodes = [];
    const ungroupedComponents = [];

    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type === NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    for (const [nodeId, node] of graphNodes.entries()) {
      if (childParentMap.has(nodeId)) {
        continue;
      }

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === NODE_TYPE_FUNCTION) {
        utilityNodes.push(nodeId);
      } else if (nodeType === NODE_TYPE_HOOK) {
        hookNodes.push(nodeId);
      } else if (nodeType === NODE_TYPE_SERVICE) {
        if (nodeId.startsWith('backend_')) {
          backendNodes.push(nodeId);
        } else {
          serviceNodes.push(nodeId);
        }
      } else if (nodeType === NODE_TYPE_STORE) {
        storeNodes.push(nodeId);
      } else if (
        nodeType === NODE_TYPE_COMPONENT &&
        nodeId !== 'MainEntry'
      ) {
        if (
          context.internalComponentChildren &&
          context.internalComponentChildren.has(nodeId)
        ) {
          console.log(
            `   ⏭️ Skipping ${nodeId} (internal component - positioned inside parent) [SECOND LOOP]`
          );
          continue;
        }

        if (!nodePositions.has(nodeId)) {
          ungroupedComponents.push(nodeId);
        }
      }
    }

    const containerCubes = [];

    const createContainerForGroup = (nodes, groupName, color) => {
      if (nodes.length === 0) {
        return;
      }

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      nodes.forEach((nodeId) => {
        const pos = nodePositions.get(nodeId);
        if (!pos) {
          console.log(`   ⚠️  No position found for node: ${nodeId}`);
          return;
        }

        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const node = graphNodes.get(nodeId);
        const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

        let nodeHalfSize;
        if (nodeType === NODE_TYPE_COMPONENT) {
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

      const padding = 15;
      minX -= padding; maxX += padding;
      minY -= padding; maxY += padding;
      minZ -= padding; maxZ += padding;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      const width = maxX - minX;
      const height = maxY - minY;
      const depth = maxZ - minZ;

      const containerScale = [width / 10, height / 10, depth / 10];
      const containerPosition = [centerX, centerY, centerZ];

      if (!Number.isFinite(containerPosition[0]) ||
          !Number.isFinite(containerPosition[1]) ||
          !Number.isFinite(containerPosition[2])) {
        console.warn('⚠️ Skipping group container with invalid position:', groupName, containerPosition);
        return;
      }

      const containerId = `group-container-${groupName}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const cellCoords = getCellCoordinates(containerPosition);
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

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
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        textStyle: { fontSize: 1.0, color: 'black', underline: false },
        merfolkData: {
          isContainer: true,
          groupType: groupName,
          nodeCount: nodes.length,
        },
      };

      containerCubes.push(containerCube);

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
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        merfolkData: {
          isContainer: true,
          groupType: groupName,
          nodeCount: nodes.length,
        },
      };

      allObjectsToSave.push(containerForSave);
    };

    createContainerForGroup(utilityNodes, 'Utility Modules', '#4CAF50');
    createContainerForGroup(hookNodes, 'Hooks', '#2196F3');
    createContainerForGroup(serviceNodes, 'Services', '#FF9800');
    createContainerForGroup(storeNodes, 'Stores', '#9C27B0');
    createContainerForGroup(backendNodes, 'Backend', '#F44336');
    createContainerForGroup(ungroupedComponents, 'Ungrouped Components', '#757575');

    if (containerCubes.length > 0) {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore.getState().setObjects([...currentObjects, ...containerCubes]);
    }
  },

  /**
   * Create container for root-level component hierarchy
   */
  async createRootHierarchyContainer(context, allObjectsToSave) {
    const { graphNodes, childParentMap, nodePositions, nodeScales, rootNodes } =
      context;

    const { useObjectsStore } = await import('../../stores');
    const { getCellCoordinates, getCellId } = await import(
      '../spatialPartitioning'
    );

    const hierarchyNodes = [];

    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId);
    });

    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type === NODE_TYPE_COMPONENT) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    const componentsWithChildContainers = new Set();
    for (const [parentNodeId, children] of context.parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (!parentNode || parentNode.type !== NODE_TYPE_COMPONENT) {
        continue;
      }

      const componentChildren = Array.from(children).filter((childId) => {
        const childNode = graphNodes.get(childId);
        return childNode && childNode.type === NODE_TYPE_COMPONENT;
      });

      if (componentChildren.length >= 2) {
        componentsWithChildContainers.add(parentNodeId);
      }
    }

    const nodesInChildContainers = new Set();
    const markDescendantsInChildContainers = (nodeId) => {
      if (nodesInChildContainers.has(nodeId)) return;
      nodesInChildContainers.add(nodeId);

      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    };

    componentsWithChildContainers.forEach((componentId) => {
      const children = context.parentChildMap.get(componentId) || new Set();
      children.forEach((childId) => {
        markDescendantsInChildContainers(childId);
      });
    });

    for (const [nodeId, position] of nodePositions.entries()) {
      if (!position) continue;
      if (nodesInChildContainers.has(nodeId)) continue;

      const node = graphNodes.get(nodeId);
      if (!node) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === NODE_TYPE_COMPONENT) {
        if (reachableFromRootModules.has(nodeId)) {
          hierarchyNodes.push(nodeId);
        }
      } else if (nodeType === NODE_TYPE_FUNCTION) {
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

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    hierarchyNodes.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;

      const scale = nodeScales.get(nodeId) || [1, 1, 1];
      const node = graphNodes.get(nodeId);
      const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

      let nodeSize = 5;
      if (nodeType === NODE_TYPE_COMPONENT) {
        nodeSize = Math.max(...scale) * 10;
      }

      minX = Math.min(minX, pos[0] - nodeSize);
      maxX = Math.max(maxX, pos[0] + nodeSize);
      minY = Math.min(minY, pos[1] - nodeSize);
      maxY = Math.max(maxY, pos[1] + nodeSize);
      minZ = Math.min(minZ, pos[2] - nodeSize);
      maxZ = Math.max(maxZ, pos[2] + nodeSize);
    });

    const padding = 15;
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;
    minZ -= padding; maxZ += padding;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    const containerScale = [width / 10, height / 10, depth / 10];
    const containerPosition = [centerX, centerY, centerZ];

    if (!Number.isFinite(containerPosition[0]) ||
        !Number.isFinite(containerPosition[1]) ||
        !Number.isFinite(containerPosition[2])) {
      console.warn('⚠️ Skipping Component Hierarchy container with invalid position:', containerPosition);
      return null;
    }

    const containerId = `group-container-Component Hierarchy-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const cellCoords = getCellCoordinates(containerPosition);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

    const containerCube = {
      id: containerId,
      type: 'cube',
      position: [...containerPosition],
      scale: [...containerScale],
      color: '#e0e0e0',
      lineWidth: 2,
      cellId: cellId,
      createdAt: Date.now(),
      headerText: 'Component Hierarchy Group',
      faceColors: {},
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      textStyle: { fontSize: 1.0, color: 'black', underline: false },
      merfolkData: {
        isContainer: true,
        groupType: 'Component Hierarchy',
        nodeCount: hierarchyNodes.length,
      },
    };

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
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      merfolkData: {
        isContainer: true,
        groupType: 'Component Hierarchy',
        nodeCount: hierarchyNodes.length,
      },
    };

    allObjectsToSave.push(containerForSave);

    const currentObjects = useObjectsStore.getState().objects;
    useObjectsStore.getState().setObjects([...currentObjects, containerCube]);
  },

  /**
   * Adjust child component positions to be placed below their parent containers
   */
  async adjustChildPositionsForContainers(
    parentChildMap,
    graphNodes,
    nodePositions,
    containerDimensions
  ) {
    const containerSpacing = 30;
    const nodesWithContainers = new Set(containerDimensions.keys());

    for (const [
      parentNodeId,
      parentContainerInfo,
    ] of containerDimensions.entries()) {
      const children = parentChildMap.get(parentNodeId);
      if (!children) continue;

      const childrenWithContainers = Array.from(children).filter((childId) => {
        return nodesWithContainers.has(childId);
      });

      if (childrenWithContainers.length === 0) continue;

      childrenWithContainers.forEach((childNodeId) => {
        const childContainerInfo = containerDimensions.get(childNodeId);
        if (!childContainerInfo) return;

        const parentBottomY = parentContainerInfo.bottomY;
        const childContainerTopY =
          childContainerInfo.position[1] + childContainerInfo.height / 2;
        const targetChildTopY = parentBottomY - containerSpacing;
        const yOffset = targetChildTopY - childContainerTopY;

        const visited = new Set();

        const adjustNodeAndDescendants = (nodeId, offset) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);

          const pos = nodePositions.get(nodeId);
          if (pos) {
            nodePositions.set(nodeId, [pos[0], pos[1] + offset, pos[2]]);
          }

          if (containerDimensions.has(nodeId)) {
            const containerInfo = containerDimensions.get(nodeId);
            containerInfo.position[1] += offset;
            containerInfo.bottomY += offset;
          }

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

    const { useObjectsStore } = await import('../../stores');
    const objectsStore = useObjectsStore.getState();
    const updatedObjects = objectsStore.objects.map((obj) => {
      if (obj.merfolkData?.nodeId) {
        const newPos = nodePositions.get(obj.merfolkData.nodeId);
        if (newPos) {
          return { ...obj, position: [...newPos] };
        }
      }
      return obj;
    });

    objectsStore.setObjects(updatedObjects);
  },

  /**
   * Calculate container dimensions for child component groupings
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

    for (const [parentNodeId, children] of parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (!parentNode || parentNode.type !== NODE_TYPE_COMPONENT) continue;

      const componentChildren = this.filterComponentChildren(children, graphNodes);

      const externalComponentChildren = componentChildren.filter(
        (childId) => !internalComponentChildren.has(childId)
      );

      const hierarchicalChildren = externalComponentChildren.filter((childId) => {
        const hierarchicalParent = childParentMap.get(childId);
        return hierarchicalParent === parentNodeId;
      });

      if (hierarchicalChildren.length > 0) {
        const parentLabel = parentNode?.name || parentNodeId;
        const childLabels = hierarchicalChildren.map(id => {
          const node = graphNodes.get(id);
          return node?.name || id;
        });
        console.log(`📦 Group under "${parentLabel}": [${childLabels.join(', ')}] (${hierarchicalChildren.length} children)`);
      }

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      hierarchicalChildren.forEach((childId) => {
        const childPos = nodePositions.get(childId);
        const childScale = nodeScales.get(childId);

        if (!childPos || !childScale) return;

        const childSize =
          BASE_DODECAHEDRON_RADIUS * Math.max(...childScale);

        minX = Math.min(minX, childPos[0] - childSize);
        maxX = Math.max(maxX, childPos[0] + childSize);
        minY = Math.min(minY, childPos[1] - childSize);
        maxY = Math.max(maxY, childPos[1] + childSize);
        minZ = Math.min(minZ, childPos[2] - childSize);
        maxZ = Math.max(maxZ, childPos[2] + childSize);
      });

      const padding = 20;
      minX -= padding; maxX += padding;
      minY -= padding; maxY += padding;
      minZ -= padding; maxZ += padding;

      const width = maxX - minX;
      const height = maxY - minY;
      const depth = maxZ - minZ;

      const containerScale = [width / 10, height / 10, depth / 10];
      const containerPosition = [
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
      ];

      containerDimensions.set(parentNodeId, {
        position: containerPosition,
        scale: containerScale,
        width: width,
        height: height,
        depth: depth,
        bottomY: minY,
        childCount: hierarchicalChildren.length,
      });
    }

    return containerDimensions;
  },

  /**
   * Helper: Calculate bounding box for a set of nodes
   */
  calculateBoundingBox(nodeIds, nodePositions, nodeScales, nodeSize, padding) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    nodeIds.forEach((nodeId) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;

      let size = nodeSize;

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

    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;
    minZ -= padding; maxZ += padding;

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    return {
      minX, maxX, minY, maxY, minZ, maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
      width, height, depth,
      scale: [width / 10, height / 10, depth / 10],
      position: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    };
  },

  /**
   * Helper: Create a container cube object
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
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      textStyle: { fontSize: 1.0, color: 'black', underline: false },
      merfolkData: {
        isContainer: true,
        ...merfolkData,
      },
    };
  },

  /**
   * Create container cube objects at their calculated positions
   */
  async createContainerCubesAtPositions(
    containerDimensions,
    graphNodes,
    allObjectsToSave
  ) {
    const { useObjectsStore } = await import('../../stores');
    const { getCellCoordinates, getCellId } = await import(
      '../spatialPartitioning'
    );

    const containerCubes = [];

    for (const [parentNodeId, containerInfo] of containerDimensions.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (!parentNode) continue;

      const { position, scale, childCount } = containerInfo;

      if (!Array.isArray(position) || position.length < 3 ||
          !Number.isFinite(position[0]) ||
          !Number.isFinite(position[1]) ||
          !Number.isFinite(position[2])) {
        console.warn('⚠️ Skipping container with invalid position:', parentNodeId, position);
        continue;
      }

      const containerId = `container-${parentNodeId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const cellCoords = getCellCoordinates(position);
      const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

      const containerCube = {
        id: containerId,
        type: 'cube',
        position: [...position],
        scale: [...scale],
        color: '#e0e0e0',
        lineWidth: 2,
        cellId: cellId,
        createdAt: Date.now(),
        headerText: `${parentNode.name || parentNode.id} Group`,
        faceColors: {},
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        textStyle: { fontSize: 1.0, color: 'black', underline: false },
        merfolkData: {
          isContainer: true,
          parentNodeId: parentNodeId,
          childCount: childCount,
        },
      };

      containerCubes.push(containerCube);

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
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        merfolkData: {
          isContainer: true,
          parentNodeId: parentNodeId,
          childCount: childCount,
        },
      };

      allObjectsToSave.push(containerForSave);
    }

    if (containerCubes.length > 0) {
      const currentObjects = useObjectsStore.getState().objects;
      useObjectsStore.getState().setObjects([...currentObjects, ...containerCubes]);
    }
  },
};
