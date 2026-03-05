import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_HANDLER,
  NODE_TYPE_CONTROL,
  NODE_TYPE_HOOK,
  NODE_TYPE_SERVICE,
  NODE_TYPE_STORE,
  NODE_TYPE_DATAPATH,
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

    if (
      nodeType === NODE_TYPE_SERVICE ||
      nodeType === NODE_TYPE_STORE
    ) {
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
   * Resolve collisions between CONTAINER CUBES only (not individual components)
   */
  resolveCollisions(context) {
    const {
      parentChildMap,
      graphNodes,
      nodePositions,
      internalComponentChildren,
      ungroupedComponents = [],
    } = context;

    const moveComponentTree = (nodeId, offsetX, offsetZ, visited = new Set()) => {
      if (visited.has(nodeId)) {
        console.warn(`⚠️  Circular reference detected for ${nodeId}, skipping`);
        return;
      }
      visited.add(nodeId);

      const position = nodePositions.get(nodeId);
      if (!position) return;

      const newPos = [
        position[0] + offsetX,
        position[1],
        position[2] + offsetZ,
      ];
      nodePositions.set(nodeId, newPos);

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
        if (internalComponentChildren && internalComponentChildren.has(childId)) {
          return false;
        }
        const childNode = graphNodes.get(childId);
        return (
          childNode &&
          childNode.type === NODE_TYPE_COMPONENT
        );
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

    const containerParents = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      if (node.type !== NODE_TYPE_COMPONENT) continue;
      if (internalComponentChildren && internalComponentChildren.has(nodeId)) continue;
      if (!nodePositions.has(nodeId)) continue;

      const componentChildren = getComponentChildren(nodeId);

      if (componentChildren.length >= 2) {
        containerParents.push(nodeId);
      }
    }

    if (containerParents.length < 2) {
      return;
    }

    const containersByLevel = new Map();

    for (const containerId of containerParents) {
      const childParentMap = context.childParentMap;

      let level = 0;
      let currentId = containerId;

      while (childParentMap.has(currentId)) {
        level++;
        currentId = childParentMap.get(currentId);
        if (level > 20) break;
      }

      if (level === 0) {
        if (!containersByLevel.has(level)) {
          containersByLevel.set(level, []);
        }
        containersByLevel.get(level).push(containerId);
      }
    }

    if (!containersByLevel.has(-1)) {
      containersByLevel.set(-1, []);
    }

    if (ungroupedComponents.length > 0) {
      containersByLevel.get(-1).push('__UNGROUPED__');
    }

    const utilityNodes = [];
    const hookNodes = [];
    const serviceNodes = [];
    const storeNodes = [];
    const backendCollisionNodes = [];

    for (const [nodeId, node] of graphNodes.entries()) {
      const childParentMap = context.childParentMap;
      if (childParentMap.has(nodeId)) continue;

      const nodeType = (node.type || '').toLowerCase().trim();
      if (nodeType === NODE_TYPE_FUNCTION) {
        utilityNodes.push(nodeId);
      } else if (nodeType === NODE_TYPE_HOOK) {
        hookNodes.push(nodeId);
      } else if (nodeType === NODE_TYPE_SERVICE) {
        if (nodeId.startsWith('backend_')) {
          backendCollisionNodes.push(nodeId);
        } else {
          serviceNodes.push(nodeId);
        }
      } else if (nodeType === NODE_TYPE_STORE) {
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
        } else if (containerId === '__UTILITIES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) &&
                node.type === NODE_TYPE_FUNCTION) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__HOOKS__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) &&
                node.type === NODE_TYPE_HOOK) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__SERVICES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) &&
                node.type === NODE_TYPE_SERVICE) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__STORES__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) &&
                node.type === NODE_TYPE_STORE) {
              nodeList.push(nodeId);
            }
          }
        } else if (containerId === '__BACKEND__') {
          nodeList = [];
          for (const [nodeId, node] of graphNodes.entries()) {
            if (!context.childParentMap.has(nodeId) &&
                node.type === NODE_TYPE_SERVICE &&
                nodeId.startsWith('backend_')) {
              nodeList.push(nodeId);
            }
          }
        }

        if (nodeList) {
          for (const nodeId of nodeList) {
            const pos = nodePositions.get(nodeId);
            if (!pos) continue;

            const nodeScale = context.nodeScales?.get(nodeId) || [1, 1, 1];
            const nodeSize = BASE_DODECAHEDRON_RADIUS * Math.max(...nodeScale);

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
          const componentChildren = getComponentChildren(containerId);
          if (componentChildren.length < 2) continue;

          for (const childId of componentChildren) {
            const childPos = nodePositions.get(childId);
            if (!childPos) continue;

            const childScale = context.nodeScales?.get(childId) || [1, 1, 1];
            const childSize = BASE_DODECAHEDRON_RADIUS * Math.max(...childScale);

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

        if (minX === Infinity || maxX === -Infinity) continue;

        const padding = 120;
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

      for (let i = 0; i < containerBBoxes.length; i++) {
        for (let j = i + 1; j < containerBBoxes.length; j++) {
          const bbox1 = containerBBoxes[i];
          const bbox2 = containerBBoxes[j];

          if (checkOverlap(bbox1, bbox2)) {
            const overlapX =
              Math.min(bbox1.maxX, bbox2.maxX) -
              Math.max(bbox1.minX, bbox2.minX);
            const overlapZ =
              Math.min(bbox1.maxZ, bbox2.maxZ) -
              Math.max(bbox1.minZ, bbox2.minZ);

            if (overlapX < 1 && overlapZ < 1) {
              continue;
            }

            const center1X = (bbox1.minX + bbox1.maxX) / 2;
            const center1Z = (bbox1.minZ + bbox1.maxZ) / 2;
            const center2X = (bbox2.minX + bbox2.maxX) / 2;
            const center2Z = (bbox2.minZ + bbox2.maxZ) / 2;

            if (overlapX < overlapZ) {
              const direction = center2X > center1X ? 1 : -1;
              const halfWidth1 = bbox1.width / 2;
              const halfWidth2 = bbox2.width / 2;
              const minGap = 150;
              const requiredDistance = halfWidth1 + halfWidth2 + minGap;
              const currentDistance = Math.abs(center2X - center1X);
              const moveDistance = requiredDistance - currentDistance;

              if (moveDistance > 0) {
                const offsetX = direction * moveDistance;

                const virtualContainerMap = {
                  '__UNGROUPED__': ungroupedComponents,
                  '__UTILITIES__': [],
                  '__HOOKS__': [],
                  '__SERVICES__': [],
                  '__STORES__': [],
                  '__BACKEND__': []
                };

                if (bbox2.nodeId.startsWith('__')) {
                  for (const [nodeId, node] of graphNodes.entries()) {
                    if (context.childParentMap.has(nodeId)) continue;
                    const nodeType = (node.type || '').toLowerCase().trim();
                    if (bbox2.nodeId === '__UTILITIES__' && nodeType === NODE_TYPE_FUNCTION) {
                      virtualContainerMap['__UTILITIES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__HOOKS__' && nodeType === NODE_TYPE_HOOK) {
                      virtualContainerMap['__HOOKS__'].push(nodeId);
                    } else if (bbox2.nodeId === '__SERVICES__' && nodeType === NODE_TYPE_SERVICE && !nodeId.startsWith('backend_')) {
                      virtualContainerMap['__SERVICES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__STORES__' && nodeType === NODE_TYPE_STORE) {
                      virtualContainerMap['__STORES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__BACKEND__' && nodeType === NODE_TYPE_SERVICE && nodeId.startsWith('backend_')) {
                      virtualContainerMap['__BACKEND__'].push(nodeId);
                    }
                  }
                }

                if (virtualContainerMap[bbox2.nodeId]) {
                  for (const nodeId of virtualContainerMap[bbox2.nodeId]) {
                    moveComponentTree(nodeId, offsetX, 0);
                  }
                } else {
                  moveComponentTree(bbox2.nodeId, offsetX, 0);
                }

                bbox2.minX += offsetX;
                bbox2.maxX += offsetX;
              }
            } else {
              const direction = center2Z > center1Z ? 1 : -1;
              const halfDepth1 = bbox1.height / 2;
              const halfDepth2 = bbox2.height / 2;
              const minGap = 150;
              const requiredDistance = halfDepth1 + halfDepth2 + minGap;
              const currentDistance = Math.abs(center2Z - center1Z);
              const moveDistance = requiredDistance - currentDistance;

              if (moveDistance > 0) {
                const offsetZ = direction * moveDistance;

                const virtualContainerMap = {
                  '__UNGROUPED__': ungroupedComponents,
                  '__UTILITIES__': [],
                  '__HOOKS__': [],
                  '__SERVICES__': [],
                  '__STORES__': [],
                  '__BACKEND__': []
                };

                if (bbox2.nodeId.startsWith('__')) {
                  for (const [nodeId, node] of graphNodes.entries()) {
                    if (context.childParentMap.has(nodeId)) continue;
                    const nodeType = (node.type || '').toLowerCase().trim();
                    if (bbox2.nodeId === '__UTILITIES__' && nodeType === NODE_TYPE_FUNCTION) {
                      virtualContainerMap['__UTILITIES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__HOOKS__' && nodeType === NODE_TYPE_HOOK) {
                      virtualContainerMap['__HOOKS__'].push(nodeId);
                    } else if (bbox2.nodeId === '__SERVICES__' && nodeType === NODE_TYPE_SERVICE && !nodeId.startsWith('backend_')) {
                      virtualContainerMap['__SERVICES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__STORES__' && nodeType === NODE_TYPE_STORE) {
                      virtualContainerMap['__STORES__'].push(nodeId);
                    } else if (bbox2.nodeId === '__BACKEND__' && nodeType === NODE_TYPE_SERVICE && nodeId.startsWith('backend_')) {
                      virtualContainerMap['__BACKEND__'].push(nodeId);
                    }
                  }
                }

                if (virtualContainerMap[bbox2.nodeId]) {
                  for (const nodeId of virtualContainerMap[bbox2.nodeId]) {
                    moveComponentTree(nodeId, 0, offsetZ);
                  }
                } else {
                  moveComponentTree(bbox2.nodeId, 0, offsetZ);
                }

                bbox2.minZ += offsetZ;
                bbox2.maxZ += offsetZ;
              }
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
   * Position utility modules, services, and stores in grouped square grids
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

    const utilityNodes = [];
    const serviceNodes = [];
    const storeNodes = [];
    const hookNodes = [];
    const backendNodes = [];
    const ungroupedComponents = [];

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
      }
    }

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

      if (context.graphConnections) {
        Array.from(context.graphConnections.values()).forEach((connection) => {
          if (connection.source === nodeId && connection.target) {
            const targetNode = graphNodes.get(connection.target);
            if (targetNode && targetNode.type === NODE_TYPE_COMPONENT) {
              markReachable(connection.target);
            }
          }
        });
      }
    };

    actualRootModules.forEach((rootModuleId) => {
      markReachable(rootModuleId);
    });

    for (const nodeId of graphNodes.keys()) {
      const node = graphNodes.get(nodeId);
      const nodeType = (node.type || '').toLowerCase().trim();

      if (
        nodeType === NODE_TYPE_COMPONENT &&
        nodeId !== 'MainEntry'
      ) {
        if (
          context.internalComponentChildren &&
          context.internalComponentChildren.has(nodeId)
        ) {
          continue;
        }

        if (!nodePositions.has(nodeId)) {
          ungroupedComponents.push(nodeId);
        }
      }
    }

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

        const x = col * nodeSpacing;
        const z = row * nodeSpacing;

        const scale = nodeScales.get(nodeId) || [1, 1, 1];
        const node = graphNodes.get(nodeId);
        const nodeType = node ? (node.type || '').toLowerCase().trim() : '';

        let nodeHalfSize;
        if (nodeType === NODE_TYPE_COMPONENT) {
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

      const padding = 15;
      return {
        width: (maxX - minX) + padding * 2,
        height: (maxY - minY) + padding * 2,
        depth: (maxZ - minZ) + padding * 2
      };
    };

    const positionGroup = (nodes, xOffset, yOffset, zOffset) => {
      if (nodes.length === 0) return;

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
        if (!nodeScales.has(nodeId)) {
          nodeScales.set(nodeId, [1, 1, 1]);
        }
      });
    };

    utilityNodes.forEach((utilityId) => {
      const children = context.parentChildMap.get(utilityId) || new Set();
      if (children.size > 0) {
        const childCount = children.size;
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));
        const childCubeSize = 10;
        const spacing = 50;
        const requiredSpace = (gridSize3D - 1) * spacing + childCubeSize * 2;
        const baseCubeSize = 20;
        const generousPadding = Math.max(30, childCount * 8);
        const totalRequiredSize = requiredSpace + generousPadding * 2;
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3);
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);
        nodeScales.set(utilityId, [scaleFactor, scaleFactor, scaleFactor]);
      } else {
        nodeScales.set(utilityId, [1, 1, 1]);
      }
    });

    serviceNodes.forEach((serviceId) => {
      const children = context.parentChildMap.get(serviceId) || new Set();
      if (children.size > 0) {
        const childCount = children.size;
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));
        const childTetrahedronSize = 10;
        const spacing = 50;
        const requiredSpace = (gridSize3D - 1) * spacing + childTetrahedronSize * 2;
        const baseCubeSize = 20;
        const generousPadding = Math.max(30, childCount * 8);
        const totalRequiredSize = requiredSpace + generousPadding * 2;
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3);
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);
        nodeScales.set(serviceId, [scaleFactor, scaleFactor, scaleFactor]);
      } else {
        nodeScales.set(serviceId, [1, 1, 1]);
      }
    });

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

    hookNodes.forEach((hookId) => {
      const children = context.parentChildMap.get(hookId) || new Set();
      if (children.size > 0) {
        const childCount = children.size;
        const gridSize3D = Math.ceil(Math.pow(childCount, 1 / 3));
        const childCubeSize = 10;
        const spacing = 50;
        const requiredSpace = (gridSize3D - 1) * spacing + childCubeSize * 2;
        const baseCubeSize = 20;
        const generousPadding = Math.max(30, childCount * 8);
        const totalRequiredSize = requiredSpace + generousPadding * 2;
        const minScaleFactor = Math.max(1.5, 1 + childCount * 0.3);
        const calculatedScaleFactor = totalRequiredSize / baseCubeSize;
        const scaleFactor = Math.max(minScaleFactor, calculatedScaleFactor);
        nodeScales.set(hookId, [scaleFactor, scaleFactor, scaleFactor]);
      } else {
        nodeScales.set(hookId, [1, 1, 1]);
      }
    });

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

    const utilityBounds = calculateGroupBounds(utilityNodes);
    const hookBounds = calculateGroupBounds(hookNodes);
    const serviceBounds = calculateGroupBounds(serviceNodes);
    const storeBounds = calculateGroupBounds(storeNodes);
    const backendBounds = calculateGroupBounds(backendNodes);

    const rootLeftEdge = rootHierarchyBounds.minX;
    const rootRightEdge = rootHierarchyBounds.maxX;
    const rootFrontEdge = rootHierarchyBounds.maxZ;
    const rootBackEdge = rootHierarchyBounds.minZ;

    const utilityXOffset = rootLeftEdge - edgeSpacing - utilityBounds.width - basePosition[0];
    positionGroup(utilityNodes, utilityXOffset, groupContainerYOffset, 0);

    const backendXOffset = utilityXOffset - edgeSpacing - backendBounds.width;
    positionGroup(backendNodes, backendXOffset, groupContainerYOffset, 0);

    const hookXOffset = rootRightEdge + edgeSpacing - basePosition[0];
    positionGroup(hookNodes, hookXOffset, groupContainerYOffset, 0);

    const serviceZOffset = rootFrontEdge + edgeSpacing - basePosition[2];
    positionGroup(serviceNodes, 0, groupContainerYOffset, serviceZOffset);

    const storeZOffset = rootBackEdge - edgeSpacing - storeBounds.depth - basePosition[2];
    positionGroup(storeNodes, 0, groupContainerYOffset, storeZOffset);

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
          basePosition[0] + 0 + col * nodeSpacing,
          basePosition[1] + ungroupedYOffset,
          basePosition[2] + 50 + row * nodeSpacing,
        ];

        nodePositions.set(nodeId, position);
      });
    }

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

    utilityNodes.forEach((utilityId) => {
      const children = context.parentChildMap.get(utilityId) || new Set();
      if (children.size > 0) {
        const utilityPosition = nodePositions.get(utilityId);

        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          if (childType === NODE_TYPE_FUNCTION) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              utilityPosition,
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

    serviceNodes.forEach((serviceId) => {
      const children = context.parentChildMap.get(serviceId) || new Set();
      if (children.size > 0) {
        const servicePosition = nodePositions.get(serviceId);

        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          if (childType === NODE_TYPE_FUNCTION) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              servicePosition,
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
            childType === NODE_TYPE_FUNCTION ||
            childType === NODE_TYPE_SERVICE
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

    hookNodes.forEach((hookId) => {
      const children = context.parentChildMap.get(hookId) || new Set();
      if (children.size > 0) {
        const hookPosition = nodePositions.get(hookId);

        const childArray = Array.from(children).sort();
        childArray.forEach((childId, index) => {
          const childNode = graphNodes.get(childId);
          if (!childNode) return;

          const childType = (childNode.type || '').toLowerCase().trim();

          if (
            childType === NODE_TYPE_FUNCTION ||
            childType === NODE_TYPE_HOOK
          ) {
            const childPosition = this.calculateNodePosition(
              childId,
              basePosition,
              1,
              index,
              childArray.length,
              hookPosition,
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
  },
};
