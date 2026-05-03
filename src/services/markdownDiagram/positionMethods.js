import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_HANDLER,
  NODE_TYPE_CONTROL,
  NODE_TYPE_HOOK,
  NODE_TYPE_SERVICE,
  NODE_TYPE_STORE,
  NODE_TYPE_DATAPATH,
  NODE_TYPE_CLASS,
  NODE_TYPE_INTERFACE,
  NODE_TYPE_VARIABLE,
  NODE_TYPE_CONSTANT,
  NODE_TYPE_LIBRARY,
  NODE_TYPE_MODULE,
  OBJECT_TYPE_DODECAHEDRON,
  DEFAULT_CONTAINER_SIZE,
  BASE_DODECAHEDRON_RADIUS,
} from './constants.js';

export const positionMethods = {
  /**
   * Calculate position for a node in the hierarchy
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
    parentChildMap,
    internalComponentChildren,
    siblingIds = []
  ) {
    const node = graphNodes.get(nodeId);
    const nodeType = node ? node.type : 'unknown';

    const componentYOffset = 0;

    if (level === 0) {
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

        const spacing = 200;

        return [
          basePosition[0] + (col - (gridSize - 1) / 2) * spacing,
          basePosition[1] + componentYOffset,
          basePosition[2] + (row - (gridSize - 1) / 2) * spacing,
        ];
      }
    } else {
      const isInternalComponent =
        nodeType === 'component' && internalComponentChildren.has(nodeId);

      if (nodeType === 'component' && !isInternalComponent) {
        const baseDodecahedronRadius = 10;

        const componentScale = this.calculateDodecahedronScale(
          nodeId,
          parentChildMap,
          graphNodes,
          internalComponentChildren,
          level
        );
        const actualComponentSize =
          baseDodecahedronRadius * Math.max(...componentScale.nodeScale);

        const externalComponentSiblings = siblingIds.filter((sibId) => {
          const sibNode = graphNodes.get(sibId);
          return sibNode && sibNode.type === 'component' && !internalComponentChildren.has(sibId);
        });

        const componentSiblingIndex = externalComponentSiblings.indexOf(nodeId);
        const componentSiblingCount = externalComponentSiblings.length;

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

        const levelFactor = level <= 2 ? 1.0 : 0.3;
        const baseMinGap = level <= 2 ? 80 : 20;
        const proportionalGap = maxSiblingSize * 0.5 * levelFactor;
        const gapBetweenEdges = Math.max(baseMinGap, proportionalGap);

        const diameterMultiplier = level <= 2 ? 2.0 : 1.5;
        const spacingBetweenComponents = (maxSiblingSize * diameterMultiplier) + gapBetweenEdges;

        let depthOffset = 300;
        if (containerSize && typeof containerSize === 'number') {
          depthOffset = Math.max(300, containerSize * 2.5);
        }

        if (nodeId === 'TextStyleUI' || nodeId === 'ObjectUI' || nodeId === 'TetrahedronFace' || nodeId === 'TextSprite') {
          console.log(`📐 ${nodeId} spacing: maxSiblingSize=${maxSiblingSize.toFixed(1)}, level=${level}, spacing=${spacingBetweenComponents.toFixed(1)}, siblingCount=${componentSiblingCount}, siblingIndex=${componentSiblingIndex}, depthOffset=${depthOffset.toFixed(1)}`);
        }

        if (componentSiblingCount <= 1) {
          const totalSpacing = spacingBetweenComponents;
          const position = [
            parentPosition[0] + totalSpacing,
            parentPosition[1] - depthOffset,
            parentPosition[2],
          ];
          return position;
        } else {
          const gridSize = Math.ceil(Math.sqrt(componentSiblingCount));
          const row = Math.floor(componentSiblingIndex / gridSize);
          const col = componentSiblingIndex % gridSize;

          const offsetX = spacingBetweenComponents * (col + 1);
          const offsetZ = (row * spacingBetweenComponents) - ((gridSize - 1) * spacingBetweenComponents / 2);

          const position = [
            parentPosition[0] + offsetX,
            parentPosition[1] - depthOffset,
            parentPosition[2] + offsetZ,
          ];

          if (nodeId === 'TextStyleUI' || nodeId === 'ObjectUI' || nodeId === 'TetrahedronFace' || nodeId === 'TextSprite') {
            console.log(`📍 ${nodeId} position: [${position.map(p => p.toFixed(1)).join(', ')}], parent: [${parentPosition.map(p => p.toFixed(1)).join(', ')}]`);
          }

          return position;
        }
      } else {
        if (siblingCount === 1) {
          return [...parentPosition];
        } else {
          const gridSize = Math.ceil(Math.pow(siblingCount, 1 / 3));
          const layer = Math.floor(siblingIndex / (gridSize * gridSize));
          const remaining = siblingIndex % (gridSize * gridSize);
          const row = Math.floor(remaining / gridSize);
          const col = remaining % gridSize;

          const spacing = 50;

          return [
            parentPosition[0] + (col - (gridSize - 1) / 2) * spacing,
            parentPosition[1] + (row - (gridSize - 1) / 2) * spacing,
            parentPosition[2] + (layer - (gridSize - 1) / 2) * spacing,
          ];
        }
      }
    }
  },

  /**
   * Get corner positions for small groups (up to 8 objects)
   */
  getCornerPositions(radius) {
    return [
      [-radius, -radius, -radius],
      [radius, -radius, -radius],
      [-radius, radius, -radius],
      [radius, radius, -radius],
      [-radius, -radius, radius],
      [radius, -radius, radius],
      [-radius, radius, radius],
      [radius, radius, radius],
    ];
  },

  /**
   * Process hierarchical node positioning
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

    if (node.type === NODE_TYPE_DATAPATH) {
      return;
    }

    const nodeType = (node.type || '').toLowerCase().trim();
    const isTopLevel = !childParentMap.has(nodeId);

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

    // Top-level STORE/SERVICE/HOOK/MODULE/LIBRARY that have no parent are handled
    // by positionGroupedNodes — skip them here. But if they have a parent (i.e. they
    // are children of a COMPONENT), we must still position them and recurse into
    // their own children.
    const isGroupedType =
      nodeType === NODE_TYPE_SERVICE ||
      nodeType === NODE_TYPE_STORE ||
      nodeType === NODE_TYPE_HOOK ||
      nodeType === NODE_TYPE_LIBRARY ||
      nodeType === NODE_TYPE_MODULE;

    if (isGroupedType && isTopLevel) {
      return;
    }

    if (
      (nodeType === NODE_TYPE_FUNCTION || nodeType === NODE_TYPE_HOOK) &&
      isTopLevel
    ) {
      return;
    }

    const objectType = this.getObjectTypeForNode(node);
    if (!objectType) return;

    let nodeScale = [1, 1, 1];
    let containerSize = DEFAULT_CONTAINER_SIZE;

    if (objectType === OBJECT_TYPE_DODECAHEDRON) {
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

    const parentId = context.childParentMap.get(nodeId);
    let siblingIds = [];
    if (parentId && parentId !== nodeId) {
      const allParentChildren = Array.from(parentChildMap.get(parentId) || new Set());
      siblingIds = allParentChildren.filter((sibId) => {
        const sibNode = graphNodes.get(sibId);
        const isComponent = sibNode && sibNode.type === 'component';
        const hasSameParent = context.childParentMap.get(sibId) === parentId;
        return isComponent && hasSameParent;
      }).sort();

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

    nodePositions.set(nodeId, nodePosition);
    nodeScales.set(nodeId, nodeScale);

    const children = parentChildMap.get(nodeId) || new Set();
    if (children.size > 0) {
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
  },

  /**
   * Resolve collisions between CONTAINER CUBES and grouped-node clusters.
   *
   * Virtual containers are now discovered dynamically from
   * `context.discoveredGroups` (populated by positionGroupedNodes) so any new
   * node type automatically participates in collision resolution.
   */
  resolveCollisions(context) {
    const {
      parentChildMap,
      graphNodes,
      nodePositions,
      internalComponentChildren,
      ungroupedComponents = [],
    } = context;

    // ── helpers ───────────────────────────────────────────────────────────

    const moveComponentTree = (nodeId, offsetX, offsetZ, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const position = nodePositions.get(nodeId);
      if (!position) return;

      nodePositions.set(nodeId, [
        position[0] + offsetX,
        position[1],
        position[2] + offsetZ,
      ]);

      const children = parentChildMap.get(nodeId);
      if (children) {
        for (const childId of children) {
          moveComponentTree(childId, offsetX, offsetZ, visited);
        }
      }
    };

    const getComponentChildren = (nodeId) => {
      const children = parentChildMap.get(nodeId);
      if (!children) return [];

      return Array.from(children).filter((childId) => {
        if (internalComponentChildren && internalComponentChildren.has(childId)) return false;
        const childNode = graphNodes.get(childId);
        return childNode && childNode.type === NODE_TYPE_COMPONENT;
      });
    };

    const checkOverlap = (bbox1, bbox2) => {
      return !(
        bbox1.maxX < bbox2.minX ||
        bbox1.minX > bbox2.maxX ||
        bbox1.maxZ < bbox2.minZ ||
        bbox1.minZ > bbox2.maxZ
      );
    };

    // ── 1. Component-hierarchy containers (unchanged) ─────────────────────

    const containerParents = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      if (node.type !== NODE_TYPE_COMPONENT) continue;
      if (internalComponentChildren && internalComponentChildren.has(nodeId)) continue;
      if (!nodePositions.has(nodeId)) continue;

      if (getComponentChildren(nodeId).length >= 2) {
        containerParents.push(nodeId);
      }
    }

    // ── 2. Build virtual containers from dynamic groups ───────────────────

    const containersByLevel = new Map();

    for (const containerId of containerParents) {
      let level = 0;
      let currentId = containerId;

      while (context.childParentMap.has(currentId)) {
        level++;
        currentId = context.childParentMap.get(currentId);
        if (level > 20) break;
      }

      if (level === 0) {
        if (!containersByLevel.has(level)) containersByLevel.set(level, []);
        containersByLevel.get(level).push(containerId);
      }
    }

    if (!containersByLevel.has(-1)) containersByLevel.set(-1, []);

    if (ungroupedComponents.length > 0) {
      containersByLevel.get(-1).push('__UNGROUPED__');
    }

    // Read dynamically-discovered groups set by positionGroupedNodes
    const discoveredGroups = context.discoveredGroups || new Map();
    for (const [groupKey, nodes] of discoveredGroups) {
      if (nodes.length > 0) {
        containersByLevel.get(-1).push(`__GROUP_${groupKey}__`);
      }
    }

    // ── 3. Build bounding boxes ───────────────────────────────────────────

    const levels = Array.from(containersByLevel.keys()).sort((a, b) => b - a);

    for (const level of levels) {
      const containers = containersByLevel.get(level);
      if (containers.length < 2) continue;

      const containerBBoxes = [];

      for (const containerId of containers) {
        let minX = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxZ = -Infinity;

        let nodeList = null;

        if (containerId === '__UNGROUPED__') {
          nodeList = ungroupedComponents;
        } else if (containerId.startsWith('__GROUP_')) {
          const groupKey = containerId.slice(8, -2); // extract key from __GROUP_xxx__
          nodeList = discoveredGroups.get(groupKey) || [];
        }

        if (nodeList) {
          for (const nodeId of nodeList) {
            const pos = nodePositions.get(nodeId);
            if (!pos) continue;

            const nodeScale = context.nodeScales?.get(nodeId) || [1, 1, 1];
            const nodeSize = BASE_DODECAHEDRON_RADIUS * Math.max(...nodeScale);

            minX = Math.min(minX, pos[0] - nodeSize);
            maxX = Math.max(maxX, pos[0] + nodeSize);
            minZ = Math.min(minZ, pos[2] - nodeSize);
            maxZ = Math.max(maxZ, pos[2] + nodeSize);
          }
        } else {
          const componentChildren = getComponentChildren(containerId);
          if (componentChildren.length < 2) continue;

          for (const childId of componentChildren) {
            const childPos = nodePositions.get(childId);
            if (!childPos) continue;

            const childScale = context.nodeScales?.get(childId) || [1, 1, 1];
            const childSize = BASE_DODECAHEDRON_RADIUS * Math.max(...childScale);

            minX = Math.min(minX, childPos[0] - childSize);
            maxX = Math.max(maxX, childPos[0] + childSize);
            minZ = Math.min(minZ, childPos[2] - childSize);
            maxZ = Math.max(maxZ, childPos[2] + childSize);
          }
        }

        if (minX === Infinity || maxX === -Infinity) continue;

        const padding = 120;
        minX -= padding; maxX += padding;
        minZ -= padding; maxZ += padding;

        containerBBoxes.push({
          nodeId: containerId,
          minX, maxX, minZ, maxZ,
          width: maxX - minX,
          height: maxZ - minZ,
        });
      }

      // ── 4. Pairwise overlap resolution ──────────────────────────────────

      const resolveNodeMove = (bbox, offsetX, offsetZ) => {
        if (bbox.nodeId === '__UNGROUPED__') {
          for (const nId of ungroupedComponents) moveComponentTree(nId, offsetX, offsetZ);
        } else if (bbox.nodeId.startsWith('__GROUP_')) {
          const groupKey = bbox.nodeId.slice(8, -2);
          const nodes = discoveredGroups.get(groupKey) || [];
          for (const nId of nodes) moveComponentTree(nId, offsetX, offsetZ);
        } else {
          moveComponentTree(bbox.nodeId, offsetX, offsetZ);
        }
      };

      for (let i = 0; i < containerBBoxes.length; i++) {
        for (let j = i + 1; j < containerBBoxes.length; j++) {
          const bbox1 = containerBBoxes[i];
          const bbox2 = containerBBoxes[j];

          if (!checkOverlap(bbox1, bbox2)) continue;

          const overlapX =
            Math.min(bbox1.maxX, bbox2.maxX) - Math.max(bbox1.minX, bbox2.minX);
          const overlapZ =
            Math.min(bbox1.maxZ, bbox2.maxZ) - Math.max(bbox1.minZ, bbox2.minZ);

          if (overlapX < 1 && overlapZ < 1) continue;

          const center1X = (bbox1.minX + bbox1.maxX) / 2;
          const center1Z = (bbox1.minZ + bbox1.maxZ) / 2;
          const center2X = (bbox2.minX + bbox2.maxX) / 2;
          const center2Z = (bbox2.minZ + bbox2.maxZ) / 2;

          const minGap = 150;

          if (overlapX < overlapZ) {
            const direction = center2X > center1X ? 1 : -1;
            const requiredDistance = bbox1.width / 2 + bbox2.width / 2 + minGap;
            const moveDistance = requiredDistance - Math.abs(center2X - center1X);

            if (moveDistance > 0) {
              const offsetX = direction * moveDistance;
              resolveNodeMove(bbox2, offsetX, 0);
              bbox2.minX += offsetX;
              bbox2.maxX += offsetX;
            }
          } else {
            const direction = center2Z > center1Z ? 1 : -1;
            const requiredDistance = bbox1.height / 2 + bbox2.height / 2 + minGap;
            const moveDistance = requiredDistance - Math.abs(center2Z - center1Z);

            if (moveDistance > 0) {
              const offsetZ = direction * moveDistance;
              resolveNodeMove(bbox2, 0, offsetZ);
              bbox2.minZ += offsetZ;
              bbox2.maxZ += offsetZ;
            }
          }
        }
      }
    }
  },

  /**
   * Calculate the bounding box and dimensions of the root hierarchy container
   */
  calculateRootHierarchyContainerBounds(
    context,
    graphNodes,
    childParentMap,
    nodePositions,
    nodeScales,
    rootNodes
  ) {
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

    const includableTypes = new Set([
      NODE_TYPE_COMPONENT,
      NODE_TYPE_FUNCTION,
      NODE_TYPE_HOOK,
      NODE_TYPE_CLASS,
      NODE_TYPE_INTERFACE,
      NODE_TYPE_VARIABLE,
      NODE_TYPE_CONSTANT,
      NODE_TYPE_STORE,
      NODE_TYPE_SERVICE,
      NODE_TYPE_MODULE,
      NODE_TYPE_LIBRARY,
    ]);

    for (const [nodeId, position] of nodePositions.entries()) {
      if (!position) continue;
      if (nodesInChildContainers.has(nodeId)) continue;

      const node = graphNodes.get(nodeId);
      if (!node) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      if (includableTypes.has(nodeType)) {
        const parentId = childParentMap.get(nodeId);
        if (nodeType === NODE_TYPE_COMPONENT) {
          if (reachableFromRootModules.has(nodeId)) {
            hierarchyNodes.push(nodeId);
          }
        } else if (parentId && reachableFromRootModules.has(parentId)) {
          hierarchyNodes.push(nodeId);
        }
      }
    }

    if (hierarchyNodes.length === 0) {
      console.log('⚠️ No hierarchy nodes found for container bounds calculation');
      const firstRootId = Array.from(rootNodes)[0];
      const firstRootPos = nodePositions.get(firstRootId);
      const fallbackY = firstRootPos ? firstRootPos[1] : context.basePosition[1];
      return {
        centerX: 0, centerY: fallbackY, centerZ: 0,
        width: 100, height: 100, depth: 100,
        minX: -50, maxX: 50,
        minY: fallbackY - 50, maxY: fallbackY + 50,
        minZ: -50, maxZ: 50
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

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

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ,
      minX, maxX, minY, maxY, minZ, maxZ
    };
  },

  /**
   * Position grouped nodes (utilities, services, stores, hooks, workers, etc.)
   * in square grids arranged around the root component hierarchy.
   *
   * Groups are discovered dynamically from the node types present in the graph
   * rather than being hard-coded, so any new folder / node type automatically
   * gets its own positioned group and container.
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

    // ── 1. Dynamic group discovery ────────────────────────────────────────
    const groupedByType = new Map(); // groupKey → [nodeId, …]
    const ungroupedComponents = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      // Skip nodes that are children of another node
      if (childParentMap.has(nodeId)) continue;

      const nodeType = (node.type || '').toLowerCase().trim();

      // Components are handled by hierarchy or collected as ungrouped
      if (nodeType === NODE_TYPE_COMPONENT) {
        if (
          nodeId !== 'MainEntry' &&
          !(internalComponentChildren && internalComponentChildren.has(nodeId)) &&
          !nodePositions.has(nodeId)
        ) {
          ungroupedComponents.push(nodeId);
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

    // ── 2. Unified scale calculation for all grouped nodes ────────────────
    const calculateNodeScaleFromChildren = (nodeId) => {
      const children = context.parentChildMap.get(nodeId) || new Set();
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
        nodeScales.set(nodeId, [scaleFactor, scaleFactor, scaleFactor]);
      } else {
        nodeScales.set(nodeId, [1, 1, 1]);
      }
    };

    for (const [, nodes] of groupedByType) {
      nodes.forEach(calculateNodeScaleFromChildren);
    }

    // ── 3. Layout helpers ─────────────────────────────────────────────────
    const calculateGroupSpacing = (nodes) => {
      let maxScale = 1;
      nodes.forEach((nodeId) => {
        const scale = nodeScales.get(nodeId);
        if (scale) {
          const nodeScale = Math.max(...scale);
          maxScale = Math.max(maxScale, nodeScale);
        }
      });
      const nodeHalfSize = maxScale * 5;
      const gap = 40;
      return Math.max(100, nodeHalfSize * 2 + gap);
    };

    const calculateGroupBounds = (nodes) => {
      if (nodes.length === 0) return { width: 0, height: 0, depth: 0 };

      const nodeSpacing = calculateGroupSpacing(nodes);
      const gridSize = Math.ceil(Math.sqrt(nodes.length));

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      nodes.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = col * nodeSpacing;
        const z = row * nodeSpacing;

        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const node = graphNodes.get(nodeId);
        const nType = node ? (node.type || '').toLowerCase().trim() : '';
        const nodeHalfSize = nType === NODE_TYPE_COMPONENT
          ? Math.max(...scale) * 10
          : Math.max(...scale) * 5;

        minX = Math.min(minX, x - nodeHalfSize);
        maxX = Math.max(maxX, x + nodeHalfSize);
        minY = Math.min(minY, -nodeHalfSize);
        maxY = Math.max(maxY, nodeHalfSize);
        minZ = Math.min(minZ, z - nodeHalfSize);
        maxZ = Math.max(maxZ, z + nodeHalfSize);
      });

      const padding = 15;
      return {
        width: (maxX - minX) + padding * 2,
        height: (maxY - minY) + padding * 2,
        depth: (maxZ - minZ) + padding * 2,
      };
    };

    const positionGroup = (nodes, xOffset, yOffset, zOffset) => {
      if (nodes.length === 0) return;
      const nodeSpacing = calculateGroupSpacing(nodes);
      const gridSize = Math.ceil(Math.sqrt(nodes.length));
      const numRows = Math.ceil(nodes.length / gridSize);

      // Center the grid around the offset point so (xOffset, zOffset)
      // is the group's centre, not its top-left corner.
      const gridWidth = (gridSize - 1) * nodeSpacing;
      const gridDepth = (numRows - 1) * nodeSpacing;
      const startX = xOffset - gridWidth / 2;
      const startZ = zOffset - gridDepth / 2;

      nodes.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const position = [
          basePosition[0] + startX + col * nodeSpacing,
          basePosition[1] + yOffset,
          basePosition[2] + startZ + row * nodeSpacing,
        ];
        nodePositions.set(nodeId, position);
        if (!nodeScales.has(nodeId)) {
          nodeScales.set(nodeId, [1, 1, 1]);
        }
      });
    };

    // ── 4. Root hierarchy bounds ──────────────────────────────────────────
    const rootHierarchyBounds = this.calculateRootHierarchyContainerBounds(
      context,
      graphNodes,
      childParentMap,
      nodePositions,
      nodeScales,
      rootNodes
    );

    const groupContainerYOffset = rootHierarchyBounds.centerY - basePosition[1];
    const ungroupedYOffset = groupContainerYOffset + 200;
    const edgeSpacing = 100;

    // ── 5. Position discovered groups in a circle around root hierarchy ───
    const groupEntries = Array.from(groupedByType.entries())
      .filter(([, nodes]) => nodes.length > 0)
      .sort(([a], [b]) => a.localeCompare(b)); // deterministic ordering

    if (groupEntries.length > 0) {
      const rootWidth = rootHierarchyBounds.maxX - rootHierarchyBounds.minX;
      const rootDepth = rootHierarchyBounds.maxZ - rootHierarchyBounds.minZ;
      const rootRadius = Math.max(rootWidth, rootDepth) / 2;
      const rootCenterXOffset = rootHierarchyBounds.centerX - basePosition[0];
      const rootCenterZOffset = rootHierarchyBounds.centerZ - basePosition[2];

      const angleStep = (2 * Math.PI) / groupEntries.length;

      // Pre-compute the bounding radius of each group
      const groupRadii = groupEntries.map(([, nodes]) => {
        const bounds = calculateGroupBounds(nodes);
        return Math.max(bounds.width, bounds.depth) / 2;
      });

      const maxGroupRadius = Math.max(...groupRadii, 0);
      const minGapBetweenGroups = 100;

      // Calculate the minimum circle radius so that:
      //  a) every group clears the root hierarchy
      //  b) adjacent groups on the circle don't overlap
      let minPlacementRadius = rootRadius + edgeSpacing + maxGroupRadius;

      if (groupEntries.length >= 2) {
        // For each pair of adjacent groups (including wrap-around),
        // 2R·sin(Δθ/2) must be ≥ r_i + r_{i+1} + gap
        const sinHalfAngle = Math.sin(angleStep / 2);
        if (sinHalfAngle > 0.001) {
          for (let i = 0; i < groupEntries.length; i++) {
            const j = (i + 1) % groupEntries.length;
            const requiredSeparation =
              groupRadii[i] + groupRadii[j] + minGapBetweenGroups;
            const requiredR = requiredSeparation / (2 * sinHalfAngle);
            minPlacementRadius = Math.max(minPlacementRadius, requiredR);
          }
        }
      }

      groupEntries.forEach(([, nodes], index) => {
        // Start from left side (−π) and distribute evenly
        const angle = -Math.PI + index * angleStep;
        const xOffset =
          Math.cos(angle) * minPlacementRadius + rootCenterXOffset;
        const zOffset =
          Math.sin(angle) * minPlacementRadius + rootCenterZOffset;

        positionGroup(nodes, xOffset, groupContainerYOffset, zOffset);
      });
    }

    // Store discovered groups on context so resolveCollisions can use them
    context.discoveredGroups = groupedByType;

    // ── 6. Ungrouped components ───────────────────────────────────────────
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

    if (ungroupedComponents.length > 0) {
      const gridSize = Math.ceil(Math.sqrt(ungroupedComponents.length));
      const baseSpacing = 80;

      ungroupedComponents.forEach((nodeId, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const scaleFactor = Math.max(...scale);
        const nodeSpacing = baseSpacing * scaleFactor;

        const position = [
          basePosition[0] + col * nodeSpacing,
          basePosition[1] + ungroupedYOffset,
          basePosition[2] + 50 + row * nodeSpacing,
        ];
        nodePositions.set(nodeId, position);
      });
    }

    // ── 7. Position children of ungrouped components ──────────────────────
    ungroupedComponents.forEach((componentId) => {
      const children = context.parentChildMap.get(componentId) || new Set();
      if (children.size > 0) {
        const componentPosition = nodePositions.get(componentId);

        const scaleResult = this.calculateDodecahedronScale(
          componentId,
          context.parentChildMap,
          graphNodes,
          context?.internalComponentChildren || new Set(),
          0
        );
        const containerSize = scaleResult.containerSize;

        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          if (
            childType === NODE_TYPE_FUNCTION ||
            (childType === NODE_TYPE_COMPONENT &&
              context.internalComponentChildren &&
              context.internalComponentChildren.has(childId))
          ) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              componentPosition,
              containerSize,
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

    // ── 8. Position children of ALL grouped nodes (unified) ───────────────
    for (const [, nodes] of groupedByType) {
      nodes.forEach((groupNodeId) => {
        const children = context.parentChildMap.get(groupNodeId) || new Set();
        if (children.size === 0) return;

        const parentPosition = nodePositions.get(groupNodeId);
        const childArray = Array.from(children).sort();

        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          // Position any non-component, non-datapath child inside its parent.
          // Also position internal component children.
          if (
            childType !== NODE_TYPE_COMPONENT &&
            childType !== NODE_TYPE_DATAPATH
          ) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              parentPosition,
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
      });
    }
  },
};
