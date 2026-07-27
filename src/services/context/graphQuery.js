/**
 * graphQuery.js
 *
 * Graph-query functions that read from diagramStore and objectsStore.
 * Operates on the raw Map-based data structure (not Graph class instances).
 * All functions enforce a 2000-char budget per result.
 */

import useDiagramStore from '../../stores/diagramStore';
import useObjectsStore from '../../stores/objectsStore';
import useCodeStore from '../../stores/codeStore';

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

  // Enrich with content index info (exports, imports, css classes)
  if (info.filePath) {
    const fileName = info.filePath.split('/').pop()?.replace(/\.(jsx?|tsx?|js|ts|py|vue|css|scss|html|json|yaml|yml|md)$/, '') || '';
    const codeStore = useCodeStore.getState();

    // Use indexed lookup (O(1)) instead of string split + scan (O(n))
    const fileEntry = codeStore.fileIndexByPath?.get(info.filePath) || codeStore.fileIndexByPath?.get(fileName + '.') || null;
    if (fileEntry) {
      if (fileEntry.exports?.size > 0) lines.push(`Exports: ${[...fileEntry.exports].join(', ')}`);
      if (fileEntry.functions?.size > 0) lines.push(`Functions: ${[...fileEntry.functions].join(', ')}`);
      if (fileEntry.cssClasses?.size > 0) lines.push(`CSS classes: ${[...fileEntry.cssClasses].join(', ')}`);
    }

    // Use indexed lookup for import graph
    const imports = codeStore.importIndexByFile?.get(info.filePath) || codeStore.importIndexByFile?.get(fileName + '.') || null;
    if (imports?.size > 0) {
      lines.push(`Imports: ${[...imports].join(', ')}`);
    }
  }

  // Enrich with LSP metadata (definitions, references, types, call graph)
  if (info.filePath) {
    const lspMetadata = useDiagramStore.getState().lspMetadata;
    if (lspMetadata) {
      const filePathBase = info.filePath.split('/').pop()?.replace(/\.(tsx?|jsx?|py|go)$/, '') || '';

      const defs = lspMetadata.definitions.filter(d =>
        d.sourceFile?.includes(filePathBase) || d.sourceFile === info.filePath
      );
      if (defs.length > 0) {
        const defLines = defs.slice(0, 8).map(d =>
          `  ${d.importName} → ${d.targetFile}:${d.targetLine || '?'}${d.isTypeOnly ? ' (type)' : ''}`
        );
        lines.push(`LSP Definitions (${defs.length}):`);
        lines.push(defLines.join('\n'));
      }

      const refs = lspMetadata.references.filter(r =>
        r.sourceFile?.includes(filePathBase) || r.sourceFile === info.filePath
      );
      if (refs.length > 0) {
        const refLines = refs.slice(0, 8).map(r => {
          const consumers = (r.referencedBy || []).slice(0, 5).map(ref => ref.file?.split('/').pop() || '?').join(', ');
          return `  ${r.symbolName} ← [${consumers || '??'}]`;
        });
        lines.push(`LSP References (${refs.length}):`);
        lines.push(refLines.join('\n'));
      }

      const hoverEntries = lspMetadata.hover.filter(h =>
        h.file?.includes(filePathBase) || h.file === info.filePath
      );
      if (hoverEntries.length > 0) {
        const hoverLines = hoverEntries.slice(0, 8).map(h =>
          `  ${h.symbol}: ${h.type?.slice(0, 80) || '?'}`
        );
        lines.push(`LSP Types (${hoverEntries.length}):`);
        lines.push(hoverLines.join('\n'));
      }

      const calls = (lspMetadata.callGraph || []).filter(c =>
        c.callerFile?.includes(filePathBase) || c.callerFile === info.filePath
      );
      if (calls.length > 0) {
        const callLines = calls.slice(0, 8).map(c =>
          `  ${c.callerName}() → ${c.calleeName} (${c.calleeFile?.split('/').pop() || '?'})`
        );
        lines.push(`LSP Call Graph (${calls.length}):`);
        lines.push(callLines.join('\n'));
      }
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

// ── LSP query functions ──────────────────────────────────────────────────────

function getLspData() {
  return useDiagramStore.getState().lspMetadata;
}

/**
 * Search LSP definitions by import name or file path.
 * Shows where imports resolve to across the codebase.
 */
export function getLspDefinition(query) {
  const lsp = getLspData();
  if (!lsp) return 'No LSP metadata available. LSP enrichment may still be in progress or not configured (set VITE_LSP_URL).';

  const q = (query || '').toLowerCase();
  if (!q) return 'get_lsp_definition requires a query parameter (import name or file name).';

  const defs = lsp.definitions.filter(d =>
    (d.importName || '').toLowerCase().includes(q) ||
    (d.sourceFile || '').toLowerCase().includes(q) ||
    (d.targetFile || '').toLowerCase().includes(q) ||
    (d.targetSymbol || '').toLowerCase().includes(q)
  );

  if (defs.length === 0) return `No LSP definitions matching "${query}". Try searching by import name (e.g. "useAuth") or file name (e.g. "Button").`;

  const lines = [`Found ${defs.length} definition(s) matching "${query}":`];
  for (const d of defs.slice(0, 10)) {
    const src = d.sourceFile?.split('/').pop() || '?';
    const tgt = d.targetFile?.split('/').pop() || '?';
    const type = d.isTypeOnly ? ' (type)' : '';
    const sym = d.targetSymbol ? `.${d.targetSymbol}` : '';
    lines.push(`  ${src}: "${d.importName}" → ${tgt}:${d.targetLine || '?'}${sym}${type}`);
  }
  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Search LSP references for a symbol name.
 * Shows which files reference a given symbol.
 */
export function getLspReferences(query) {
  const lsp = getLspData();
  if (!lsp) return 'No LSP metadata available. LSP enrichment may still be in progress or not configured (set VITE_LSP_URL).';

  const q = (query || '').toLowerCase();
  if (!q) return 'get_lsp_references requires a query parameter (symbol name or file name).';

  const refs = lsp.references.filter(r =>
    (r.symbolName || '').toLowerCase().includes(q) ||
    (r.sourceFile || '').toLowerCase().includes(q)
  );

  if (refs.length === 0) return `No LSP references matching "${query}".`;

  const lines = [`Found ${refs.length} reference(s) matching "${query}":`];
  for (const r of refs.slice(0, 10)) {
    const src = r.sourceFile?.split('/').pop() || '?';
    const consumers = (r.referencedBy || []).map(ref => {
      const file = ref.file?.split('/').pop() || '?';
      return `${file}:${ref.line || '?'}`;
    });
    lines.push(`  ${r.symbolName} in ${src} ← [${consumers.join(', ')}]`);
  }
  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Search LSP hover/type info for symbols.
 * Returns type signatures and documentation.
 */
export function getLspTypeInfo(query) {
  const lsp = getLspData();
  if (!lsp) return 'No LSP metadata available. LSP enrichment may still be in progress or not configured (set VITE_LSP_URL).';

  const q = (query || '').toLowerCase();
  if (!q) return 'get_lsp_type_info requires a query parameter (symbol name).';

  const entries = lsp.hover.filter(h =>
    (h.symbol || '').toLowerCase().includes(q) ||
    (h.file || '').toLowerCase().includes(q) ||
    (h.type || '').toLowerCase().includes(q)
  );

  if (entries.length === 0) return `No type info matching "${query}".`;

  const lines = [`Found ${entries.length} type entry(ies) matching "${query}":`];
  for (const h of entries.slice(0, 10)) {
    const file = h.file?.split('/').pop() || '?';
    const doc = h.documentation ? `\n    ${h.documentation.slice(0, 100)}` : '';
    lines.push(`  ${h.symbol}: ${h.type || '?'} (${file}:${h.line || '?'})${doc}`);
  }
  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Get call graph data for a function or file.
 * Shows callers and callees.
 */
export function getLspCallGraph(query) {
  const lsp = getLspData();
  if (!lsp) return 'No LSP metadata available. LSP enrichment may still be in progress or not configured (set VITE_LSP_URL).';

  const q = (query || '').toLowerCase();
  if (!q) return 'get_lsp_call_graph requires a query parameter (function name or file name).';

  const calls = (lsp.callGraph || []).filter(c =>
    (c.callerName || '').toLowerCase().includes(q) ||
    (c.calleeName || '').toLowerCase().includes(q) ||
    (c.callerFile || '').toLowerCase().includes(q) ||
    (c.calleeFile || '').toLowerCase().includes(q)
  );

  if (calls.length === 0) return `No call graph entries matching "${query}".`;

  const lines = [`Found ${calls.length} call(s) matching "${query}":`];
  for (const c of calls.slice(0, 15)) {
    const caller = c.callerFile?.split('/').pop() || '?';
    const callee = c.calleeFile?.split('/').pop() || '?';
    lines.push(`  ${caller}:${c.callerName}() → ${callee}:${c.calleeName}():${c.calleeLine || '?'}`);
  }
  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Get an overview of available LSP data (counts, languages, status).
 */
export function getLspOverview() {
  const lsp = getLspData();
  if (!lsp) return 'No LSP metadata available. LSP enrichment may still be in progress or not configured (set VITE_LSP_URL).';

  const lines = ['LSP Metadata Overview:'];
  lines.push(`  Definitions: ${(lsp.definitions || []).length}`);
  lines.push(`  References: ${(lsp.references || []).length}`);
  lines.push(`  Type entries: ${(lsp.hover || []).length}`);
  lines.push(`  Call graph: ${(lsp.callGraph || []).length}`);
  lines.push(`  Module exports: ${(lsp.moduleExports || []).length}`);
  if (lsp.errors && lsp.errors.length > 0) {
    lines.push(`  Errors: ${lsp.errors.length}`);
  }
  lines.push('\nUse get_lsp_definition, get_lsp_references, get_lsp_type_info, or get_lsp_call_graph to query specifics.');
  return truncate(lines.join('\n'), RESULT_BUDGET);
}

// ── Community query functions ─────────────────────────────────────────────────

function getCommunityData() {
  const diagrams = useDiagramStore.getState();
  const communities = diagrams?.communities || [];
  return communities;
}

/**
 * Get full details about a community: summary, node types, connections, flow paths.
 */
export function getCommunityInfo(communityId) {
  const communities = getCommunityData();
  if (communities.length === 0) return 'No communities detected. The graph may be too small (< 50 nodes) for community detection.';

  const community = communities.find(c => c.id === communityId);
  if (!community) {
    const available = communities.slice(0, 10).map(c => `[${c.id}] "${c.name}" (${c.nodeCount} nodes)`).join('\n');
    return `Community ${communityId} not found. Available communities:\n${available}\n\nUse get_community_info(id) with one of the IDs above.`;
  }

  const lines = [];
  lines.push(community.summary);

  // External connections with target names
  if (community.externalConnections && community.externalConnections.length > 0) {
    lines.push('\nConnections to other communities:');
    for (const ext of community.externalConnections.slice(0, 5)) {
      const targetName = ext.targetName || `community:${ext.target}`;
      lines.push(`  → ${targetName} (${ext.count} links)`);
    }
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * List all nodes in a community with their types and file paths.
 */
export function getCommunityNodes(communityId) {
  const communities = getCommunityData();
  if (communities.length === 0) return 'No communities detected.';

  const community = communities.find(c => c.id === communityId);
  if (!community) return `Community ${communityId} not found. Use search_communities(query) to find communities.`;

  const objects = useObjectsStore.getState().objects || [];
  const filePathMap = new Map();
  for (const obj of objects) {
    const nodeId = obj.merfolkData?.nodeId;
    if (nodeId) {
      filePathMap.set(nodeId, {
        filePath: obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '',
        displayName: obj.headerText || nodeId,
      });
    }
  }

  const lines = [`Community ${communityId} "${community.name}" — ${community.nodeCount} nodes:\n`];

  // Group by type
  const byType = {};
  for (const nodeId of community.nodeIds) {
    const info = filePathMap.get(nodeId) || {};
    const file = info.filePath ? ` → ${info.filePath}` : '';
    const name = info.displayName || nodeId;

    // Determine type from node data
    const diagrams = useDiagramStore.getState();
    let nodeType = 'unknown';
    if (diagrams?.graphs) {
      for (const graph of diagrams.graphs) {
        const nodeData = graph.nodes?.get(nodeId);
        if (nodeData) {
          nodeType = (nodeData.type || 'unknown').toLowerCase();
          break;
        }
      }
    }

    if (!byType[nodeType]) byType[nodeType] = [];
    byType[nodeType].push(`  ${name}${file}`);
  }

  for (const [type, nodes] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`[${type}] (${nodes.length}):`);
    for (const nodeLine of nodes.slice(0, 15)) {
      lines.push(nodeLine);
    }
    if (nodes.length > 15) lines.push(`  ... and ${nodes.length - 15} more`);
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
}

/**
 * Search communities by keyword (name, node types, file paths).
 */
export function searchCommunities(query) {
  const communities = getCommunityData();
  if (communities.length === 0) return 'No communities detected.';

  const q = (query || '').toLowerCase();
  if (!q) return 'search_communities requires a query parameter.';

  const matches = [];
  for (const community of communities) {
    const nameMatch = community.name.toLowerCase().includes(q);
    const summaryMatch = (community.summary || '').toLowerCase().includes(q);
    const fileMatch = (community.files || []).some(f => f.toLowerCase().includes(q));
    const typeMatch = Object.keys(community.nodeTypes || {}).some(t => t.toLowerCase().includes(q));

    if (nameMatch || summaryMatch || fileMatch || typeMatch) {
      matches.push(community);
    }
  }

  if (matches.length === 0) {
    return `No communities matching "${query}". Try broader terms like "auth", "api", "store", "hook", or use get_community_info(id) with a specific community ID.`;
  }

  const lines = [`Found ${matches.length} matching communities:\n`];
  for (const c of matches.slice(0, 10)) {
    lines.push(`[community:${c.id}] "${c.name}" (${c.nodeCount} nodes)`);
    lines.push(`  ${c.summary.split('\n').slice(0, 2).join(' | ')}`);
    lines.push('');
  }

  return truncate(lines.join('\n'), RESULT_BUDGET);
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
