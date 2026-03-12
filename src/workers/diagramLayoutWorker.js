/**
 * diagramLayoutWorker.js
 *
 * Web Worker that computes 2D hierarchical layouts from parsed Merfolk graph
 * data.  Implements a custom layered layout algorithm (Sugiyama-style) with
 * no external dependencies beyond Comlink.
 *
 * Algorithm:
 *   1. Build hierarchy tree (parent → children) from serialised hierarchy data
 *   2. Assign layers via BFS from root nodes
 *   3. Order nodes within each layer to reduce crossings (barycenter heuristic)
 *   4. Assign x/y coordinates with compound-node (container) support
 *   5. Return node positions + edge routes in the shape DiagramOverlay2D expects
 */

import { expose } from 'comlink';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_NODE_WIDTH = 180;
const BASE_NODE_HEIGHT = 44;
const CHAR_WIDTH = 8;
const MIN_NODE_WIDTH = 120;
const MAX_NODE_WIDTH = 280;

const LAYER_SPACING = 50;
const NODE_SPACING = 24;
const CONTAINER_PAD_TOP = 32;
const CONTAINER_PAD = 14;

const CONN_CONTROLFLOW = 'controlflow';
const CONN_DOTTED = 'dotted';
const CONN_DATAFLOW = 'dataflow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estimateNodeSize(name) {
  const labelWidth = Math.max(MIN_NODE_WIDTH, Math.min(name.length * CHAR_WIDTH + 40, MAX_NODE_WIDTH));
  return { width: Math.max(BASE_NODE_WIDTH, labelWidth), height: BASE_NODE_HEIGHT };
}

function isHierarchyConnection(connection, sourceNode, targetNode) {
  const connType = connection.type || CONN_DATAFLOW;
  const isDashed = connType === CONN_CONTROLFLOW || connType === CONN_DOTTED;
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.type === 'component' && targetNode.type === 'component' && isDashed) return true;
  if (sourceNode.type === 'component' && targetNode.type === 'function' && isDashed) return true;
  if (sourceNode.type === 'function' && targetNode.type === 'component' && isDashed) return true;
  if (sourceNode.type === 'service' && targetNode.type === 'function') return true;
  if (sourceNode.type === 'hook' && targetNode.type === 'function') return true;
  if (sourceNode.type === 'function' && targetNode.type === 'function') return true;
  return false;
}

function filterConnections(connections, nodesMap, filter) {
  if (filter === 'all') return connections;
  return connections.filter((conn) => {
    const sourceId = conn.source?.nodeId || conn.source;
    const targetId = conn.target?.nodeId || conn.target;
    const sourceNode = nodesMap.get(sourceId);
    const targetNode = nodesMap.get(targetId);
    const connType = conn.type || CONN_DATAFLOW;
    const isDashed = connType === CONN_CONTROLFLOW || connType === CONN_DOTTED;
    switch (filter) {
      case 'hierarchy-only': return isHierarchyConnection(conn, sourceNode, targetNode);
      case 'data-flow': return connType === CONN_DATAFLOW && !isHierarchyConnection(conn, sourceNode, targetNode);
      case 'control-flow': return isDashed;
      default: return true;
    }
  });
}

// ---------------------------------------------------------------------------
// Node positioning — tree-based layout
// ---------------------------------------------------------------------------

/**
 * Tree-based layout that mirrors the 3D hierarchy:
 *   1. Component tree at top — root components cascade downward via tree edges
 *   2. Non-component groups (hooks, stores, services, libraries) below the tree
 *   3. Only function/non-component children are "contained" inside their parent
 *      container.  Component children (internalComponentChildren) are separate
 *      tree nodes at the next depth level.
 */
function layoutNodes(nodesEntries, connections, hierarchy, filter) {
  const nodesMap = new Map(nodesEntries);
  const parentChildMap = new Map(
    (hierarchy.parentChildMap || []).map(([k, v]) => [k, new Set(v)])
  );
  const childParentMap = new Map(hierarchy.childParentMap || []);
  const internalCompChildren = new Set(hierarchy.internalComponentChildren || []);
  const nodeIdSet = new Set(nodesMap.keys());

  // ------------------------------------------------------------------
  // 1. Classify children: tree vs contained
  //    Tree children = internalComponentChildren (component inside component)
  //    Contained children = everything else (functions inside compound nodes)
  // ------------------------------------------------------------------
  const treeChildrenOf = new Map();      // parent → Set<childId>
  const containedChildrenOf = new Map(); // parent → Set<childId>

  for (const [parentId, children] of parentChildMap) {
    if (!nodeIdSet.has(parentId)) continue;
    for (const childId of children) {
      if (!nodeIdSet.has(childId)) continue;
      if (internalCompChildren.has(childId)) {
        if (!treeChildrenOf.has(parentId)) treeChildrenOf.set(parentId, new Set());
        treeChildrenOf.get(parentId).add(childId);
      } else {
        if (!containedChildrenOf.has(parentId)) containedChildrenOf.set(parentId, new Set());
        containedChildrenOf.get(parentId).add(childId);
      }
    }
  }

  // ------------------------------------------------------------------
  // 2. Identify tree roots vs standalone groups
  // ------------------------------------------------------------------
  const treeRoots = [];
  const TYPE_ORDER = ['hook', 'store', 'service', 'library', 'datapath', 'function'];
  const standaloneByType = new Map();
  for (const t of TYPE_ORDER) standaloneByType.set(t, []);

  for (const id of nodeIdSet) {
    // Skip contained children (positioned inside their parent)
    if (childParentMap.has(id) && !internalCompChildren.has(id)) continue;
    // Skip tree children (positioned by tree traversal from their parent)
    if (internalCompChildren.has(id)) continue;
    // This is a root-level node
    const type = nodesMap.get(id)?.type || 'function';
    if (type === 'component') {
      treeRoots.push(id);
    } else {
      const bucket = standaloneByType.get(type);
      if (bucket) bucket.push(id);
      else {
        if (!standaloneByType.has('_other')) standaloneByType.set('_other', []);
        standaloneByType.get('_other').push(id);
      }
    }
  }

  // ------------------------------------------------------------------
  // 3. Compute node sizes (bottom-up)
  //    Compound nodes size based on *contained* children only (not tree children)
  // ------------------------------------------------------------------
  const sizeOf = new Map();

  function computeSize(nodeId) {
    if (sizeOf.has(nodeId)) return sizeOf.get(nodeId);
    const name = nodesMap.get(nodeId)?.name || nodeId;
    const contained = containedChildrenOf.get(nodeId);

    if (!contained || contained.size === 0) {
      const s = estimateNodeSize(name);
      sizeOf.set(nodeId, s);
      return s;
    }

    const childIds = Array.from(contained).filter((c) => nodeIdSet.has(c));
    for (const cId of childIds) computeSize(cId);

    // Arrange contained children in a grid
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(childIds.length))));
    let totalHeight = CONTAINER_PAD_TOP;
    let maxRowWidth = 0;

    for (let i = 0; i < childIds.length; i += cols) {
      const chunk = childIds.slice(i, i + cols);
      let rw = 0, rh = 0;
      for (const cId of chunk) {
        const cs = sizeOf.get(cId);
        rw += cs.width + NODE_SPACING;
        if (cs.height > rh) rh = cs.height;
      }
      rw -= NODE_SPACING;
      if (rw > maxRowWidth) maxRowWidth = rw;
      totalHeight += rh + LAYER_SPACING;
    }
    totalHeight = totalHeight - LAYER_SPACING + CONTAINER_PAD;

    const width = Math.max(estimateNodeSize(name).width, maxRowWidth + CONTAINER_PAD * 2);
    const height = Math.max(BASE_NODE_HEIGHT + CONTAINER_PAD_TOP, totalHeight);
    sizeOf.set(nodeId, { width, height });
    return { width, height };
  }

  for (const id of nodeIdSet) computeSize(id);

  // ------------------------------------------------------------------
  // 4. Compute subtree widths for tree layout
  // ------------------------------------------------------------------
  const subtreeWidthOf = new Map();

  function computeSubtreeWidth(id) {
    if (subtreeWidthOf.has(id)) return subtreeWidthOf.get(id);
    const ownWidth = (sizeOf.get(id) || { width: BASE_NODE_WIDTH }).width;
    const treeChildren = treeChildrenOf.get(id);
    if (!treeChildren || treeChildren.size === 0) {
      subtreeWidthOf.set(id, ownWidth);
      return ownWidth;
    }
    let totalChildWidth = 0;
    for (const child of treeChildren) {
      if (!nodeIdSet.has(child)) continue;
      totalChildWidth += computeSubtreeWidth(child) + NODE_SPACING;
    }
    totalChildWidth = Math.max(0, totalChildWidth - NODE_SPACING);
    const w = Math.max(ownWidth, totalChildWidth);
    subtreeWidthOf.set(id, w);
    return w;
  }

  for (const id of treeRoots) computeSubtreeWidth(id);

  // ------------------------------------------------------------------
  // 5. Position tree nodes (top-down, children centered under parent)
  // ------------------------------------------------------------------
  const posOf = new Map();

  function positionTree(id, x, y) {
    const subW = subtreeWidthOf.get(id) || BASE_NODE_WIDTH;
    const ownW = (sizeOf.get(id) || { width: BASE_NODE_WIDTH }).width;
    const ownH = (sizeOf.get(id) || { height: BASE_NODE_HEIGHT }).height;
    posOf.set(id, { x: x + (subW - ownW) / 2, y });

    const tc = treeChildrenOf.get(id);
    if (!tc || tc.size === 0) return;

    const childY = y + ownH + LAYER_SPACING;
    let childX = x;
    for (const child of tc) {
      if (!nodeIdSet.has(child)) continue;
      const childSubW = subtreeWidthOf.get(child) || BASE_NODE_WIDTH;
      positionTree(child, childX, childY);
      childX += childSubW + NODE_SPACING;
    }
  }

  let treeX = 0;
  for (const root of treeRoots) {
    positionTree(root, treeX, 0);
    treeX += (subtreeWidthOf.get(root) || BASE_NODE_WIDTH) + NODE_SPACING * 2;
  }

  // Find tree bounding box
  let treeBottom = 0;
  let treeRight = 0;
  for (const [id, pos] of posOf) {
    const s = sizeOf.get(id) || { width: BASE_NODE_WIDTH, height: BASE_NODE_HEIGHT };
    if (pos.y + s.height > treeBottom) treeBottom = pos.y + s.height;
    if (pos.x + s.width > treeRight) treeRight = pos.x + s.width;
  }

  // ------------------------------------------------------------------
  // 6. Position standalone groups below the tree
  // ------------------------------------------------------------------
  const MAX_GROUP_ROW = 6;
  let currentY = treeBottom + LAYER_SPACING * 2;

  for (const type of [...TYPE_ORDER, '_other']) {
    const ids = standaloneByType.get(type);
    if (!ids || ids.length === 0) continue;

    for (let i = 0; i < ids.length; i += MAX_GROUP_ROW) {
      const row = ids.slice(i, i + MAX_GROUP_ROW);
      let totalRowWidth = 0;
      let maxHeight = 0;
      for (const id of row) {
        const sz = sizeOf.get(id) || { width: BASE_NODE_WIDTH, height: BASE_NODE_HEIGHT };
        totalRowWidth += sz.width + NODE_SPACING;
        if (sz.height > maxHeight) maxHeight = sz.height;
      }
      totalRowWidth -= NODE_SPACING;

      // Center under the tree area
      let cx = Math.max(0, (treeRight - totalRowWidth) / 2);
      for (const id of row) {
        posOf.set(id, { x: cx, y: currentY });
        const sz = sizeOf.get(id) || { width: BASE_NODE_WIDTH };
        cx += sz.width + NODE_SPACING;
      }
      currentY += maxHeight + LAYER_SPACING;
    }
  }

  // ------------------------------------------------------------------
  // 7. Position contained children inside their parents
  // ------------------------------------------------------------------
  function positionContained(parentId) {
    const contained = containedChildrenOf.get(parentId);
    if (!contained || contained.size === 0) return;
    const parentPos = posOf.get(parentId);
    if (!parentPos) return;
    const parentSize = sizeOf.get(parentId);
    const childIds = Array.from(contained).filter((c) => nodeIdSet.has(c));
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(childIds.length))));
    const innerWidth = parentSize.width - CONTAINER_PAD * 2;

    let cy = parentPos.y + CONTAINER_PAD_TOP;
    for (let i = 0; i < childIds.length; i += cols) {
      const chunk = childIds.slice(i, i + cols);
      let totalRowWidth = 0;
      let maxRowHeight = 0;
      for (const cId of chunk) {
        const cs = sizeOf.get(cId) || { width: BASE_NODE_WIDTH, height: BASE_NODE_HEIGHT };
        totalRowWidth += cs.width + NODE_SPACING;
        if (cs.height > maxRowHeight) maxRowHeight = cs.height;
      }
      totalRowWidth -= NODE_SPACING;

      let cx = parentPos.x + CONTAINER_PAD + Math.max(0, (innerWidth - totalRowWidth) / 2);
      for (const cId of chunk) {
        posOf.set(cId, { x: cx, y: cy });
        cx += (sizeOf.get(cId) || { width: BASE_NODE_WIDTH }).width + NODE_SPACING;
        positionContained(cId);
      }
      cy += maxRowHeight + LAYER_SPACING;
    }
  }

  for (const id of nodeIdSet) {
    if (posOf.has(id) && containedChildrenOf.has(id)) {
      positionContained(id);
    }
  }

  // ------------------------------------------------------------------
  // 8. Normalize positions (shift so min x=0, y=0)
  // ------------------------------------------------------------------
  let minX = Infinity, minY = Infinity;
  for (const [, pos] of posOf) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
  }
  if (isFinite(minX) && isFinite(minY)) {
    for (const [, pos] of posOf) {
      pos.x -= minX;
      pos.y -= minY;
    }
  }

  // ------------------------------------------------------------------
  // 9. Build result
  // ------------------------------------------------------------------
  const result = new Map();
  for (const id of nodeIdSet) {
    const nodeData = nodesMap.get(id);
    const pos = posOf.get(id) || { x: 0, y: 0 };
    const size = sizeOf.get(id) || { width: BASE_NODE_WIDTH, height: BASE_NODE_HEIGHT };
    const contained = containedChildrenOf.get(id);
    result.set(id, {
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
      merfolkType: nodeData?.type || 'function',
      name: nodeData?.name || id,
      isCompound: !!(contained && contained.size > 0),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Edge routing
// ---------------------------------------------------------------------------

function layoutEdges(nodePositions, connections, nodesMap, nodeIdSet, filter) {
  const filteredConns = filterConnections(connections, nodesMap, filter);
  const routes = [];
  let idx = 0;

  for (const conn of filteredConns) {
    const sourceId = conn.source?.nodeId || conn.source;
    const targetId = conn.target?.nodeId || conn.target;
    if (!nodeIdSet.has(sourceId) || !nodeIdSet.has(targetId) || sourceId === targetId) continue;

    const src = nodePositions.get(sourceId);
    const tgt = nodePositions.get(targetId);
    if (!src || !tgt) continue;

    const srcCX = src.x + src.width / 2;
    const tgtCX = tgt.x + tgt.width / 2;

    // Source bottom-center → target top-center, with optional midpoint
    const points = [
      { x: srcCX, y: src.y + src.height },
      { x: tgtCX, y: tgt.y },
    ];

    // Add a midpoint for orthogonal-ish routing when nodes aren't vertically aligned
    if (Math.abs(srcCX - tgtCX) > 10) {
      const midY = (src.y + src.height + tgt.y) / 2;
      points.splice(1, 0,
        { x: srcCX, y: midY },
        { x: tgtCX, y: midY }
      );
    }

    routes.push([
      `e${idx++}`,
      {
        points,
        connectionType: conn.type || CONN_DATAFLOW,
        flowPaths: conn.flowPaths || [],
        label: conn.label || '',
        sourceId,
        targetId,
      },
    ]);
  }

  return routes;
}

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------

const workerApi = {
  /**
   * Compute a 2D hierarchical layout from Merfolk graph data.
   *
   * @param {Array<[string, object]>} nodesEntries - Serialised nodes Map entries
   * @param {Array<object>} connections - Array of connection objects
   * @param {object} hierarchy - Serialised hierarchy
   * @param {object} [options] - Layout options
   * @param {string} [options.filter='all'] - Connection filter mode
   * @returns {Promise<{ nodePositions: Array, edgeRoutes: Array }>}
   */
  async computeLayout(nodesEntries, connections, hierarchy, options = {}) {
    const filter = options.filter || 'all';
    const nodesMap = new Map(nodesEntries);
    const nodeIdSet = new Set(nodesMap.keys());

    const nodePositions = layoutNodes(nodesEntries, connections, hierarchy, filter);
    const edgeRoutes = layoutEdges(nodePositions, connections, nodesMap, nodeIdSet, filter);

    return {
      nodePositions: Array.from(nodePositions.entries()),
      edgeRoutes,
    };
  },
};

expose(workerApi);
