/**
 * graphQuery.js
 *
 * Graph-query functions that read from diagramStore and objectsStore.
 * Operates on the raw Map-based data structure (not Graph class instances).
 * All functions enforce a 2000-char budget per result.
 */

import useDiagramStore from '../../stores/diagramStore';
import useObjectsStore from '../../stores/objectsStore';

const RESULT_BUDGET = 2000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGraphData() {
  const diagrams = useDiagramStore.getState();
  const objects = useObjectsStore.getState().objects || [];
  return { diagrams, objects };
}

function buildFilePathMap(objects) {
  const map = new Map();
  for (const obj of objects) {
    const nodeId = obj.merfolkData?.nodeId;
    if (nodeId) {
      map.set(nodeId, {
        filePath: obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '',
        displayName: obj.headerText || nodeId,
        nodeType: obj.merfolkData?.nodeType || obj.type || '',
      });
    }
  }
  return map;
}

function mergeAllNodes(diagrams) {
  const nodes = new Map();
  for (const g of diagrams.graphs || []) {
    if (g.nodes) for (const [id, data] of g.nodes) nodes.set(id, data);
  }
  return nodes;
}

function mergeAllConnections(diagrams) {
  const connections = [];
  for (const g of diagrams.graphs || []) {
    if (g.connections) {
      for (const [, conn] of g.connections) {
        connections.push(conn);
      }
    }
  }
  return connections;
}

function truncate(text, budget) {
  if (text.length <= budget) return text;
  return text.slice(0, budget - 30) + '\n... (truncated)';
}

// ── Core query functions ─────────────────────────────────────────────────────

/**
 * Get full details about a node: type, name, file path, all connections,
 * parent, children, and flow paths.
 */
export function getNodeInfo(nodeId) {
  const { diagrams, objects } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const nodes = mergeAllNodes(diagrams);
  const node = nodes.get(nodeId);
  if (!node) {
    return `Node "${nodeId}" not found in diagram. Try search_code("${nodeId}") or list_files("") to find it in the file tree.`;
  }

  const filePathMap = buildFilePathMap(objects);
  const info = filePathMap.get(nodeId) || {};
  const hierarchy = diagrams.hierarchy;

  const lines = [];
  lines.push(`[${node.type || 'unknown'}:${node.name || nodeId}]`);
  if (info.filePath) {
    lines.push(`File: ${info.filePath}`);
    lines.push(`→ Use read_file("${info.filePath}") to see the full content.`);
  }

  const allConnections = mergeAllConnections(diagrams);
  const incoming = allConnections.filter(c => c.target === nodeId);
  const outgoing = allConnections.filter(c => c.source === nodeId);

  if (incoming.length > 0) {
    lines.push('Incoming:');
    for (const c of incoming) {
      const label = c.label ? ` ("${c.label}")` : '';
      const type = c.type ? ` [${c.type}]` : '';
      lines.push(`  ${c.source}${type}${label} --> ${nodeId}`);
    }
  }

  if (outgoing.length > 0) {
    lines.push('Outgoing:');
    for (const c of outgoing) {
      const label = c.label ? ` ("${c.label}")` : '';
      const type = c.type ? ` [${c.type}]` : '';
      lines.push(`  ${nodeId} --> ${c.target}${type}${label}`);
    }
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    lines.push('Connections: none');
  }

  if (hierarchy) {
    const children = hierarchy.parentChildMap?.get(nodeId);
    if (children && children.size > 0) {
      lines.push(`Children: ${Array.from(children).join(', ')}`);
    }
    const parent = hierarchy.childParentMap?.get(nodeId);
    if (parent) {
      lines.push(`Parent: ${parent}`);
    }
  }

  const connTags = diagrams.connectionTags;
  if (connTags) {
    const flowPaths = [];
    for (const [key, tags] of connTags) {
      const [src, tgt] = key.split('|');
      if (src === nodeId || tgt === nodeId) {
        for (const tag of tags) {
          if (!flowPaths.includes(tag)) flowPaths.push(tag);
        }
      }
    }
    if (flowPaths.length > 0) {
      lines.push(`Flow paths: ${flowPaths.join(', ')}`);
    }
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Get upstream or downstream dependencies for a node.
 * direction: 'upstream' (who depends on me), 'downstream' (what I depend on), or 'both' (default)
 */
export function getDependencies(nodeId, direction = 'both') {
  const { diagrams, objects } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const allConnections = mergeAllConnections(diagrams);
  const filePathMap = buildFilePathMap(objects);

  const incoming = allConnections.filter(c => c.target === nodeId);
  const outgoing = allConnections.filter(c => c.source === nodeId);

  const lines = [];

  if (direction === 'upstream' || direction === 'both') {
    lines.push('Upstream (depend on this node):');
    if (incoming.length === 0) {
      lines.push('  (none)');
    } else {
      for (const c of incoming) {
        const info = filePathMap.get(c.source) || {};
        const label = c.label ? ` ("${c.label}")` : '';
        const type = c.type ? ` [${c.type}]` : '';
        const file = info.filePath ? ` → ${info.filePath}` : '';
        lines.push(`  ${c.source}${type}${label}${file}`);
      }
    }
  }

  if (direction === 'downstream' || direction === 'both') {
    lines.push('Downstream (this node depends on):');
    if (outgoing.length === 0) {
      lines.push('  (none)');
    } else {
      for (const c of outgoing) {
        const info = filePathMap.get(c.target) || {};
        const label = c.label ? ` ("${c.label}")` : '';
        const type = c.type ? ` [${c.type}]` : '';
        const file = info.filePath ? ` → ${info.filePath}` : '';
        lines.push(`  ${c.target}${type}${label}${file}`);
      }
    }
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Find the shortest path between two nodes using BFS.
 */
export function findPath(source, target) {
  const { diagrams } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const nodes = mergeAllNodes(diagrams);
  if (!nodes.has(source)) return `Source node "${source}" not found in diagram`;
  if (!nodes.has(target)) return `Target node "${target}" not found in diagram`;
  if (source === target) return `Path: ${source} (same node, 0 hops)`;

  const allConnections = mergeAllConnections(diagrams);

  const adj = new Map();
  for (const [id] of nodes) adj.set(id, []);
  for (const c of allConnections) {
    if (adj.has(c.source)) adj.get(c.source).push(c);
  }

  const visited = new Set([source]);
  const queue = [[source, []]];

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    const edges = adj.get(current) || [];

    for (const edge of edges) {
      if (edge.target === target) {
        const fullPath = [...path, { from: current, to: target, label: edge.label, type: edge.type }];
        const lines = [`Path: ${fullPath.length} hop(s)`];
        for (let i = 0; i < fullPath.length; i++) {
          const step = fullPath[i];
          const label = step.label ? ` ("${step.label}")` : '';
          const type = step.type ? ` [${step.type}]` : '';
          lines.push(`  ${i + 1}. ${step.from} --> ${step.to}${type}${label}`);
        }
        return truncate(lines.join('\n'), RESULT_BUDGET);
      }

      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push([edge.target, [...path, { from: current, to: edge.target, label: edge.label, type: edge.type }]]);
      }
    }
  }

  return `No path found from "${source}" to "${target}"`;
}

/**
 * Get all nodes and connections within N hops of a given node (BFS).
 */
export function getNeighborhood(nodeId, maxHops = 2) {
  const { diagrams, objects } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const nodes = mergeAllNodes(diagrams);
  if (!nodes.has(nodeId)) return `Node "${nodeId}" not found in diagram`;

  const allConnections = mergeAllConnections(diagrams);
  const filePathMap = buildFilePathMap(objects);

  const adj = new Map();
  for (const [id] of nodes) adj.set(id, []);
  for (const c of allConnections) {
    if (adj.has(c.source)) adj.get(c.source).push(c);
  }

  const visited = new Map([[nodeId, 0]]);
  const queue = [nodeId];
  const resultNodes = [nodeId];
  const resultEdges = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentHop = visited.get(current);
    if (currentHop >= maxHops) continue;

    for (const edge of (adj.get(current) || [])) {
      const edgeKey = `${edge.source}->${edge.target}`;
      if (!resultEdges.some(e => e.key === edgeKey)) {
        resultEdges.push({ key: edgeKey, source: edge.source, target: edge.target, label: edge.label, type: edge.type });
      }
      if (!visited.has(edge.target)) {
        visited.set(edge.target, currentHop + 1);
        resultNodes.push(edge.target);
        queue.push(edge.target);
      }
    }
  }

  const lines = [`Neighborhood of "${nodeId}" (${maxHops} hops):`];
  lines.push(`Nodes (${resultNodes.length}):`);
  for (const nid of resultNodes) {
    const info = filePathMap.get(nid) || {};
    const type = info.nodeType || (nodes.get(nid)?.type) || '';
    const file = info.filePath ? ` → ${info.filePath}` : '';
    lines.push(`  [${type}:${info.displayName || nid}]${file}`);
  }
  if (resultEdges.length > 0) {
    lines.push(`Connections (${resultEdges.length}):`);
    for (const e of resultEdges) {
      const label = e.label ? ` ("${e.label}")` : '';
      const type = e.type ? ` [${e.type}]` : '';
      lines.push(`  ${e.source} --> ${e.target}${type}${label}`);
    }
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Search nodes by name, type, or label. Returns matching nodes with file paths.
 */
export function searchNodes(query) {
  const { diagrams, objects } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const q = (query || '').toLowerCase();
  if (!q) return 'search_nodes requires a query';

  const nodes = mergeAllNodes(diagrams);
  const filePathMap = buildFilePathMap(objects);
  const matches = [];

  for (const [id, node] of nodes) {
    const name = (node.name || id).toLowerCase();
    const type = (node.type || '').toLowerCase();
    if (name.includes(q) || type.includes(q) || id.toLowerCase().includes(q)) {
      const info = filePathMap.get(id) || {};
      const file = info.filePath ? ` → ${info.filePath}` : '';
      matches.push(`[${node.type || 'unknown'}:${node.name || id}]${file}`);
      if (matches.length >= 20) break;
    }
  }

  if (matches.length === 0) return `No nodes matching "${query}". Try search_code("${query}") or list_files("") to browse the file tree.`;
  return truncate(matches.join('\n') + '\n\n→ Use read_file("path") to see the full content of any file listed above.', RESULT_BUDGET);
}

/**
 * Get a compact graph summary for the system prompt.
 * Shows node counts, root nodes, key connections, and type distribution.
 */
export function getGraphSummary() {
  const { diagrams } = getGraphData();
  if (!diagrams.graphs || diagrams.graphs.length === 0) {
    return '(no diagram loaded)';
  }

  const nodes = mergeAllNodes(diagrams);
  const allConnections = mergeAllConnections(diagrams);
  const hierarchy = diagrams.hierarchy;

  const typeCounts = {};
  for (const [, node] of nodes) {
    const t = node.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const lines = [];
  lines.push(`Nodes: ${nodes.size}, Connections: ${allConnections.length}`);
  lines.push(`Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}(${c})`).join(', ')}`);

  if (hierarchy?.rootNodes && hierarchy.rootNodes.size > 0) {
    const roots = Array.from(hierarchy.rootNodes).slice(0, 10);
    lines.push(`Roots: ${roots.join(', ')}`);
  }

  if (allConnections.length > 0) {
    const keyConns = allConnections.slice(0, 8).map(c => {
      const label = c.label ? `:"${c.label}"` : '';
      return `${c.source}-->${c.target}${label}`;
    });
    lines.push(`Key connections: ${keyConns.join('; ')}`);
  }

  const connTags = diagrams.connectionTags;
  if (connTags && connTags.size > 0) {
    const flowPathNames = new Set();
    for (const [, tags] of connTags) {
      for (const tag of tags) flowPathNames.add(tag);
    }
    if (flowPathNames.size > 0) {
      lines.push(`Flow paths: ${Array.from(flowPathNames).join(', ')}`);
    }
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}
