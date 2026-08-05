import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_SERVICE,
  NODE_TYPE_DATAPATH,
  BASE_DODECAHEDRON_RADIUS,
  getGroupDisplayName,
  getGroupColor,
} from './constants.js';
import { useObjectsStore, useSpatialManagerStore } from '../../stores';
import { getCellCoordinates, getCellId } from '../spatialPartitioning';
import { addToAllCellObjects } from '../cellObjectCache';

export const containerMethods = {
  /**
   * Create container cubes around grouped nodes.
   *
   * Groups are discovered dynamically by scanning the node types present in
   * the graph.  This means new folders / node types (e.g. workers, middleware)
   * automatically receive containers without any code changes.
   */
  async createGroupContainers(context, allObjectsToSave) {
    const {
      graphNodes,
      childParentMap,
      nodePositions,
      nodeScales,
    } = context;

    // ── Compute which components are in the main hierarchy ──────────────
    // Root component nodes that are NOT reachable from entry-point components
    // (App, AppShell, main, index, etc.) are "orphaned" — they have 3D positions
    // from positionNodeHierarchy (as rootNodes) but no enclosing container.
    // We collect them into the "Unused Components" grey container below.
    const hierarchyComponents = new Set();
    const ROOT_ENTRY_NAMES = ['main', 'index', 'firebase', 'App'];
    const actualRootNodes = Array.from(context.rootNodes || []).filter(
      (nodeId) => ROOT_ENTRY_NAMES.includes(nodeId) || nodeId.endsWith('_root')
    );
    const markHierarchyReachable = (nodeId) => {
      if (hierarchyComponents.has(nodeId)) return;
      const n = graphNodes.get(nodeId);
      if (!n) return;
      if ((n.type || '').toLowerCase().trim() === NODE_TYPE_COMPONENT) {
        hierarchyComponents.add(nodeId);
      }
      const children = context.parentChildMap?.get(nodeId) || new Set();
      children.forEach((childId) => markHierarchyReachable(childId));
    };
    actualRootNodes.forEach((nodeId) => markHierarchyReachable(nodeId));

    // ── Dynamic group discovery ──────────────────────────────────────────
    const groupedByType = new Map(); // groupKey → [nodeId, …]
    const ungroupedComponents = [];

    // Use the pre-computed ungrouped list from positionMethods.js when available
    // so that the same set of components drives both positioning AND container
    // creation — preventing Y-position mismatches.
    if (context.ungroupedComponents) {
      ungroupedComponents.push(...context.ungroupedComponents);
    }

    // Always scan the graph to discover groups for folder-based containers
    // (hooks, stores, services, workers, shaders, etc.).  Previously this was
    // inside the else-branch of the ungrouped-components check — when the
    // pre-computed list was present the group discovery was skipped entirely.
    for (const [nodeId, node] of graphNodes.entries()) {
      if (childParentMap.has(nodeId)) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      // Components go into either the hierarchy or the "ungrouped" bucket
      if (nodeType === NODE_TYPE_COMPONENT && nodeId !== 'MainEntry') {
        if (
          context.internalComponentChildren &&
          context.internalComponentChildren.has(nodeId)
        ) {
          continue;
        }
        // Only collect ungrouped components when not already pre-computed
        if (!context.ungroupedComponents) {
          const hasChildren = (context.parentChildMap?.get(nodeId)?.size ?? 0) > 0;
          if (!nodePositions.has(nodeId) || (!hierarchyComponents.has(nodeId) && !hasChildren)) {
            ungroupedComponents.push(nodeId);
          }
        }
        continue;
      }

      // Datapaths don't produce 3D objects
      if (nodeType === NODE_TYPE_DATAPATH) continue;

      // Determine group key — preserve backend/worker/shader splitting
      let groupKey = nodeType;
      if (nodeType === NODE_TYPE_SERVICE && nodeId.startsWith('backend_')) {
        groupKey = 'backend';
      } else if (nodeType === NODE_TYPE_FUNCTION && nodeId.startsWith('worker_')) {
        groupKey = 'worker';
      } else if (nodeType === NODE_TYPE_FUNCTION && nodeId.startsWith('shader_')) {
        groupKey = 'shader';
      }

      if (!groupedByType.has(groupKey)) {
        groupedByType.set(groupKey, []);
      }
      groupedByType.get(groupKey).push(nodeId);
    }

    // ── Container creation helper (unchanged logic) ──────────────────────
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
        headerText: '',
        faceColors: {},
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        textStyle: { fontSize: 1.0, color: 'black', underline: false },
        merfolkData: {
          isContainer: true,
          nonInteractive: true,
          groupType: groupName,
          groupLabel: `${groupName}`,
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
        content: `${groupName}`,
        createdAt: Date.now(),
        cellId: cellId,
        headerText: '',
        faceColors: {},
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        merfolkData: {
          isContainer: true,
          nonInteractive: true,
          groupType: groupName,
          groupLabel: `${groupName}`,
          nodeCount: nodes.length,
        },
      };

      allObjectsToSave.push(containerForSave);
    };

    // ── Build set of group types that already have containers in the store ─
    // This prevents duplicate containers when rescan calls createObjectsFromDiagram
    // on top of an already-populated space.
    const existingGroupTypes = new Set();
    const existingObjectsSnapshot = useObjectsStore.getState().objects;
    for (const obj of existingObjectsSnapshot) {
      if (obj.merfolkData?.isContainer && obj.merfolkData?.groupType) {
        existingGroupTypes.add(obj.merfolkData.groupType);
      }
    }

    // ── Create containers dynamically for each discovered group ─────────
    const sortedGroups = Array.from(groupedByType.entries())
      .filter(([, nodes]) => nodes.length > 0)
      .sort(([a], [b]) => a.localeCompare(b)); // deterministic ordering

    sortedGroups.forEach(([groupKey, nodes], index) => {
      const displayName = getGroupDisplayName(groupKey);
      if (existingGroupTypes.has(displayName)) return; // already exists — skip
      const color = getGroupColor(index);
      createContainerForGroup(nodes, displayName, color);
    });

    // Unused components always get the grey container
    if (!existingGroupTypes.has('Unused Components')) {
      createContainerForGroup(ungroupedComponents, 'Unused Components', '#757575');
    }

    if (containerCubes.length > 0) {
      this.hydrateContainerCubes(containerCubes);
    }
  },

  /**
   * Push created container cubes into the store — capped to loaded cells, and
   * cached in allCellObjects so navigation hydrates them before the bulk
   * import finishes persisting them.  Mirrors the objectMethods store cap.
   */
  hydrateContainerCubes(containerCubes) {
    if (!containerCubes || containerCubes.length === 0) return;

    // Cache ALL created containers (loaded + unloaded) in allCellObjects.
    const byCell = new Map();
    for (const cube of containerCubes) {
      if (cube.cellId) {
        let cellObjs = byCell.get(cube.cellId);
        if (!cellObjs) { cellObjs = []; byCell.set(cube.cellId, cellObjs); }
        cellObjs.push(cube);
      }
    }
    for (const [cellId, objects] of byCell) {
      addToAllCellObjects(cellId, objects);
    }

    // Only hydrate containers whose cell is currently loaded.  Distant
    // containers stay in the cache + allObjectsToSave and hydrate when the
    // user navigates to their cell.  Mounting every container during a scan
    // is what left the render-progress bar stuck below 100%.
    const loadedCellIds = useSpatialManagerStore.getState().loadedCells;
    const storeCubes =
      loadedCellIds && loadedCellIds.size > 0
        ? containerCubes.filter((cube) => cube.cellId && loadedCellIds.has(cube.cellId))
        : containerCubes;
    if (storeCubes.length === 0) return;

    const currentObjects = useObjectsStore.getState().objects;
    const knownIds = new Set(currentObjects.map((o) => o.id));
    const newCubes = storeCubes.filter((c) => !knownIds.has(c.id));
    if (newCubes.length === 0) return;

    useObjectsStore.getState().setObjects([...currentObjects, ...newCubes]);
  },

  /**
   * Create container for root-level component hierarchy
   */
  async createRootHierarchyContainer(context, allObjectsToSave) {
    // Skip if a Component Hierarchy container already exists in the store.
    // This prevents duplicates when rescan runs createObjectsFromDiagram on
    // a space that already has a full diagram.
    const existingObjectsForHierarchy = useObjectsStore.getState().objects;
    const hierarchyContainerExists = existingObjectsForHierarchy.some(
      (obj) => obj.merfolkData?.isContainer && obj.merfolkData?.groupType === 'Component Hierarchy'
    );
    if (hierarchyContainerExists) return;

    const { graphNodes, _childParentMap, nodePositions, nodeScales, rootNodes } =
      context;

    const hierarchyNodes = [];

    const reachableFromRootModules = new Set();
    const rootModuleNames = ['main', 'index', 'firebase', 'App'];
    const actualRootModules = Array.from(rootNodes).filter((nodeId) => {
      return rootModuleNames.includes(nodeId) || nodeId.endsWith('_root');
    });

    const markReachable = (nodeId) => {
      if (reachableFromRootModules.has(nodeId)) return;
      const node = graphNodes.get(nodeId);
      if (!node) return;
      if (node.type !== NODE_TYPE_DATAPATH) {
        reachableFromRootModules.add(nodeId);
      }
      const children = context.parentChildMap.get(nodeId) || new Set();
      children.forEach((childId) => markReachable(childId));
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    for (const [nodeId, position] of nodePositions.entries()) {
      if (!position) continue;

      const node = graphNodes.get(nodeId);
      if (!node) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      if (nodeType === NODE_TYPE_COMPONENT && reachableFromRootModules.has(nodeId)) {
        hierarchyNodes.push(nodeId);
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
      headerText: '',
      faceColors: {},
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      textStyle: { fontSize: 1.0, color: 'black', underline: false },
      merfolkData: {
        isContainer: true,
        nonInteractive: true,
        groupType: 'Component Hierarchy',
        groupLabel: 'Component Hierarchy',
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
      content: 'Component Hierarchy',
      createdAt: Date.now(),
      cellId: cellId,
      headerText: '',
      faceColors: {},
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      merfolkData: {
        isContainer: true,
        nonInteractive: true,
        groupType: 'Component Hierarchy',
        groupLabel: 'Component Hierarchy',
        nodeCount: hierarchyNodes.length,
      },
    };

    allObjectsToSave.push(containerForSave);

    this.hydrateContainerCubes([containerCube]);
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

    // Only COMPONENT-type parents get a per-parent "child container".
    // Services, hooks, stores, libraries, modules, etc. are visually grouped
    // by their group-level container (created in createGroupContainers), so
    // they do NOT need a second per-parent container around their children.
    const containerEligibleTypes = new Set([
      NODE_TYPE_COMPONENT,
    ]);

    for (const [parentNodeId, children] of parentChildMap.entries()) {
      const parentNode = graphNodes.get(parentNodeId);
      if (!parentNode || !containerEligibleTypes.has(parentNode.type)) continue;

      // Size the container to enclose only COMPONENT children. Including
      // non-component descendants (hooks, functions, libraries, modules) was
      // causing component containers to balloon out and overlap unrelated
      // group containers.
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

      let validChildFound = false;
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
        validChildFound = true;
      });

      // If none of the children had a valid position the bounds are still at
      // Infinity/ -Infinity, which would produce NaN positions — skip.
      if (!validChildFound) continue;

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
      headerText: '',
      faceColors: {},
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      textStyle: { fontSize: 1.0, color: 'black', underline: false },
      merfolkData: {
        isContainer: true,
        nonInteractive: true,
        groupLabel: headerText,
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
    const containerCubes = [];

    // Build set of parentNodeIds that already have a container so we don't
    // create duplicates during rescan.
    const existingParentNodeIds = new Set();
    const existingObjectsForContainers = useObjectsStore.getState().objects;
    for (const obj of existingObjectsForContainers) {
      if (obj.merfolkData?.isContainer && obj.merfolkData?.parentNodeId) {
        existingParentNodeIds.add(obj.merfolkData.parentNodeId);
      }
    }

    for (const [parentNodeId, containerInfo] of containerDimensions.entries()) {
      if (existingParentNodeIds.has(parentNodeId)) continue; // already exists — skip
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
        headerText: '',
        faceColors: {},
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        textStyle: { fontSize: 1.0, color: 'black', underline: false },
        merfolkData: {
          isContainer: true,
          nonInteractive: true,
          parentNodeId: parentNodeId,
          groupLabel: `${parentNode.name || parentNode.id}`,
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
        content: `${parentNode.name || parentNode.id}`,
        createdAt: Date.now(),
        cellId: cellId,
        headerText: '',
        faceColors: {},
        faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
        merfolkData: {
          isContainer: true,
          nonInteractive: true,
          parentNodeId: parentNodeId,
          groupLabel: `${parentNode.name || parentNode.id}`,
          childCount: childCount,
        },
      };

      allObjectsToSave.push(containerForSave);
    }

    if (containerCubes.length > 0) {
      this.hydrateContainerCubes(containerCubes);
    }
  },
};
