import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_HANDLER,
  NODE_TYPE_CONTROL,
  NODE_TYPE_HOOK,
  NODE_TYPE_SERVICE,
  NODE_TYPE_STORE,
  NODE_TYPE_LIBRARY,
  NODE_TYPE_UTILITY,
  NODE_TYPE_DATAPATH,
  NODE_TYPE_MODULE,
  NODE_TYPE_CLASS,
  NODE_TYPE_INTERFACE,
  NODE_TYPE_VARIABLE,
  NODE_TYPE_CONSTANT,
  OBJECT_TYPE_CUBE,
  OBJECT_TYPE_DODECAHEDRON,
  OBJECT_TYPE_TETRAHEDRON,
} from './constants.js';

export const hierarchyMethods = {
  /**
   * Filter children by cube-type nodes (function, handler, control)
   */
  filterCubeChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        (childNode.type === NODE_TYPE_FUNCTION ||
          childNode.type === NODE_TYPE_HANDLER ||
          childNode.type === NODE_TYPE_CONTROL ||
          childNode.type === NODE_TYPE_HOOK ||
          childNode.type === NODE_TYPE_CLASS ||
          childNode.type === NODE_TYPE_INTERFACE ||
          childNode.type === NODE_TYPE_VARIABLE ||
          childNode.type === NODE_TYPE_CONSTANT)
      );
    });
  },

  /**
   * Filter children by component-type nodes
   */
  filterComponentChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return childNode && childNode.type === NODE_TYPE_COMPONENT;
    });
  },

  /**
   * Build hierarchical relationships from connections
   * @param {Object} graph - The graph object from the processed diagram
   * @returns {Object} - Object containing parentChildMap, childParentMap, rootNodes, internalComponentChildren
   */
  buildHierarchicalRelationships(graph) {
    const parentChildMap = new Map(); // parent -> Set of children
    const childParentMap = new Map(); // child -> parent
    const rootNodes = new Set(); // nodes with no parents
    const internalComponentChildren = new Set(); // component children that are INTERNAL (nested inside parent)
    const componentConnectionTypes = new Map(); // Track connection types between components: 'parent->child' -> Set of types

    if (graph.connections && graph.connections.size > 0) {
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

      const warnedCycles = new Set();

      const addParentChildRelation = (parentId, childId) => {
        if (!parentId || !childId) return;
        if (parentId === childId) return;

        // Skip if this relationship already exists
        if (parentChildMap.has(parentId) && parentChildMap.get(parentId).has(childId)) return;

        if (wouldCreateCycle(childId, parentId)) {
          const key = `${parentId}->${childId}`;
          if (!warnedCycles.has(key)) {
            warnedCycles.add(key);
            console.warn(`⚠️ Skipping cycle-creating relationship: ${parentId} → ${childId} (would orphan both from root)`);
          }
          return;
        }

        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, new Set());
        }
        parentChildMap.get(parentId).add(childId);

        if (!childParentMap.has(childId)) {
          childParentMap.set(childId, parentId);
        }
      };

      Array.from(graph.connections.values()).forEach((connection) => {
        const sourceId = connection.source?.nodeId || connection.source;
        const targetId = connection.target?.nodeId || connection.target;

        const sourceNode = graph.nodes.get(sourceId);
        const targetNode = graph.nodes.get(targetId);

        let parentId = null,
          childId = null;
        let isInternalComponent = false;

        if (sourceNode && targetNode) {
          // Helper: is this a "cube-child" type (function-like nodes that nest inside containers)
          const isCubeChild = (type) =>
            type === NODE_TYPE_FUNCTION || type === NODE_TYPE_CLASS ||
            type === NODE_TYPE_INTERFACE || type === NODE_TYPE_VARIABLE ||
            type === NODE_TYPE_CONSTANT;

          if (
            isCubeChild(sourceNode.type) &&
            targetNode.type === NODE_TYPE_COMPONENT
          ) {
            const connectionType = connection.type || 'dataflow';
            const isDashed = connectionType === 'controlflow' || connectionType === 'dotted';
            if (isDashed) {
              parentId = targetId;
              childId = sourceId;
            }
          } else if (
            sourceNode.type === NODE_TYPE_COMPONENT &&
            isCubeChild(targetNode.type)
          ) {
            const connectionType = connection.type || 'dataflow';
            const isDashed = connectionType === 'controlflow' || connectionType === 'dotted';
            if (isDashed) {
              parentId = sourceId;
              childId = targetId;
            }
          } else if (
            (sourceNode.type === NODE_TYPE_SERVICE || sourceNode.type === NODE_TYPE_MODULE) &&
            isCubeChild(targetNode.type)
          ) {
            parentId = sourceId;
            childId = targetId;
          } else if (
            sourceNode.type === NODE_TYPE_HOOK &&
            isCubeChild(targetNode.type)
          ) {
            parentId = sourceId;
            childId = targetId;
          } else if (
            // Store and Library nodes can also act as file-level containers
            // emitted by the repo scanner — e.g. `cubeStore[[Store: cubeStore]]`
            // or a library cube — and the scanner emits dashed `-.->`
            // "contains" arrows from those containers to their internal
            // functions/classes (`cubeStore -.-> getCubeSelector`). Without
            // this branch those children are treated as root nodes and
            // appear as ungrouped orphans next to the store cube.
            (sourceNode.type === NODE_TYPE_STORE ||
              sourceNode.type === NODE_TYPE_LIBRARY) &&
            isCubeChild(targetNode.type)
          ) {
            parentId = sourceId;
            childId = targetId;
          } else if (
            isCubeChild(sourceNode.type) &&
            isCubeChild(targetNode.type)
          ) {
            parentId = sourceId;
            childId = targetId;
          } else if (
            sourceNode.type === NODE_TYPE_COMPONENT &&
            targetNode.type === NODE_TYPE_COMPONENT
          ) {
            const connectionType = connection.type || 'dataflow';
            isInternalComponent =
              connectionType === 'controlflow' || connectionType === 'dotted';

            parentId = sourceId;
            childId = targetId;

            const connectionKey = `${parentId}->${childId}`;
            if (!componentConnectionTypes.has(connectionKey)) {
              componentConnectionTypes.set(connectionKey, new Set());
            }
            componentConnectionTypes.get(connectionKey).add(connectionType);

            if (isInternalComponent) {
              addParentChildRelation(parentId, childId);
              internalComponentChildren.add(childId);
            }
          }
        }

        if (parentId && childId && !isInternalComponent) {
          addParentChildRelation(parentId, childId);
        }
      });

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
        }
      });
    }

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
  },

  /**
   * Determine the 3D object type based on node type
   * @param {Object} node - The node from the graph
   * @returns {string} - The 3D object type
   */
  getObjectTypeForNode(node) {
    const nodeType = (node.type || '').toLowerCase().trim();

    switch (nodeType) {
      case NODE_TYPE_COMPONENT:
        return OBJECT_TYPE_DODECAHEDRON;
      case NODE_TYPE_SERVICE:
      case NODE_TYPE_MODULE:
        return OBJECT_TYPE_TETRAHEDRON;
      case NODE_TYPE_DATAPATH:
        return null;
      case NODE_TYPE_FUNCTION:
      case NODE_TYPE_STORE:
      case NODE_TYPE_LIBRARY:
      case NODE_TYPE_UTILITY:
      case NODE_TYPE_HOOK:
      case NODE_TYPE_CLASS:
      case NODE_TYPE_INTERFACE:
      case NODE_TYPE_VARIABLE:
      case NODE_TYPE_CONSTANT:
        return OBJECT_TYPE_CUBE;
      default:
        console.warn(
          `⚠️ Unknown node type '${nodeType}' for '${node.id}' - defaulting to cube`
        );
        return OBJECT_TYPE_CUBE;
    }
  },
};
