/**
 * communitySummarizer.js
 *
 * Rule-based community summary generation from community assignments.
 * Produces compact, structured summaries for LLM system prompt injection.
 *
 * Each summary is ~200-250 chars, fitting 15-20 communities within a 4000-char budget.
 */

const NODE_TYPE_LABELS = {
  component: 'Component',
  function: 'Function',
  hook: 'Hook',
  store: 'Store',
  service: 'Service',
  library: 'Library',
  utility: 'Utility',
  route: 'Route',
  layout: 'Layout',
  context: 'Context',
  provider: 'Provider',
  middleware: 'Middleware',
  model: 'Model',
  api: 'API',
};

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Analyze a single community and extract its characteristics.
 *
 * @param {Set<number>} nodeIndices - Indices of nodes in this community
 * @param {Map<string, number>} nodeIndexMap - nodeId → global index
 * @param {Map<string, object>} nodeDataMap - nodeId → node data (built ONCE by
 *   summarizeCommunities; the old code did allNodes.find() per node, which
 *   was O(N²) across the full run — minutes of frozen tab at 97k nodes)
 * @param {Array} allConnections - Array of connection objects
 * @param {Map<string, Set<string>>} connectionTags - flow path tags
 * @returns {object} Community analysis
 */
function analyzeCommunity(nodeIndices, nodeIndexMap, nodeDataMap, allConnections, connectionTags) {
  const indexToNodeId = new Map();
  for (const [nodeId, idx] of nodeIndexMap) indexToNodeId.set(idx, nodeId);

  const nodeIds = [];
  const nodeTypes = {};
  const nodeNames = {};
  const filePrefixes = new Map();
  let internalConns = 0;
  const externalConns = new Map();
  const flowPaths = new Set();

  for (const idx of nodeIndices) {
    const nodeId = indexToNodeId.get(idx);
    if (!nodeId) continue;
    nodeIds.push(nodeId);

    const nodeData = nodeDataMap.get(nodeId);
    if (nodeData) {
      const type = (nodeData.type || 'unknown').toLowerCase();
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
      nodeNames[nodeId] = nodeData.name || nodeId;

      // Extract file path prefix for grouping
      const props = nodeData.properties || {};
      const filePath = props.codeFilePath || '';
      if (filePath) {
        const parts = filePath.split('/');
        const prefix = parts.length > 2 ? parts.slice(0, 2).join('/') : parts[0];
        filePrefixes.set(prefix, (filePrefixes.get(prefix) || 0) + 1);
      }
    }
  }

  const nodeIndexSet = nodeIndices;

  for (const conn of allConnections) {
    const srcIdx = nodeIndexMap.get(conn.source);
    const tgtIdx = nodeIndexMap.get(conn.target);
    const srcIn = srcIdx !== undefined && nodeIndexSet.has(srcIdx);
    const tgtIn = tgtIdx !== undefined && nodeIndexSet.has(tgtIdx);

    if (srcIn && tgtIn) {
      internalConns++;
    } else if (srcIn || tgtIn) {
      const externalNode = srcIn ? conn.target : conn.source;
      const externalIdx = nodeIndexMap.get(externalNode);
      if (externalIdx !== undefined) {
        externalConns.set(externalIdx, (externalConns.get(externalIdx) || 0) + 1);
      }
    }
  }

  // Collect flow paths that pass through this community
  if (connectionTags) {
    for (const [key, tags] of connectionTags) {
      const [src, tgt] = key.split('|');
      const srcIdx = nodeIndexMap.get(src);
      const tgtIdx = nodeIndexMap.get(tgt);
      if ((srcIdx !== undefined && nodeIndexSet.has(srcIdx)) ||
          (tgtIdx !== undefined && nodeIndexSet.has(tgtIdx))) {
        for (const tag of tags) flowPaths.add(tag);
      }
    }
  }

  // Sort file prefixes by count (most common first)
  const topFiles = [...filePrefixes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([prefix]) => prefix);

  return {
    nodeIds,
    nodeTypes,
    nodeNames,
    internalConns,
    externalConns: [...externalConns.entries()].sort((a, b) => b[1] - a[1]),
    flowPaths: [...flowPaths],
    topFiles,
  };
}

/**
 * Generate a human-readable name for a community based on its contents.
 */
function nameCommunity(analysis) {
  const { nodeTypes, topFiles } = analysis;

  // Try to derive name from dominant file prefix
  if (topFiles.length > 0) {
    const mainPrefix = topFiles[0];
    const parts = mainPrefix.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'src' && lastPart !== 'lib') {
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }
  }

  // Try to derive name from dominant node types
  const typeEntries = Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]);
  if (typeEntries.length > 0) {
    const dominantType = typeEntries[0][0];
    const label = NODE_TYPE_LABELS[dominantType] || dominantType;
    return `${label} Cluster`;
  }

  return `Community`;
}

/**
 * Generate a compact summary string for a community.
 */
function formatSummary(communityId, name, analysis) {
  const { nodeIds, nodeTypes, internalConns, externalConns, flowPaths, topFiles } = analysis;
  const nodeCount = nodeIds.length;

  const parts = [];
  parts.push(`[community:${communityId}] "${name}" (${nodeCount} nodes)`);

  // Node type breakdown
  const typeBreakdown = Object.entries(nodeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t, c]) => `${c} ${NODE_TYPE_LABELS[t] || t}`)
    .join(', ');
  if (typeBreakdown) parts.push(`Types: ${typeBreakdown}`);

  // Key nodes (top 5 by name)
  const keyNodes = nodeIds
    .filter(id => analysis.nodeNames[id])
    .slice(0, 5)
    .map(id => analysis.nodeNames[id]);
  if (keyNodes.length > 0) parts.push(`Key: ${keyNodes.join(', ')}`);

  // Connections
  if (internalConns > 0) parts.push(`Internal links: ${internalConns}`);
  if (externalConns.length > 0) {
    const targets = externalConns.slice(0, 3).map(([, c]) => c);
    parts.push(`External links: ${targets.reduce((a, b) => a + b, 0)} to ${externalConns.length} other communities`);
  }

  // Flow paths
  if (flowPaths.length > 0) {
    parts.push(`Flow: ${flowPaths.slice(0, 3).join(', ')}`);
  }

  // File paths
  if (topFiles.length > 0) {
    parts.push(`Files: ${topFiles.join(', ')}/*`);
  }

  return parts.join('\n');
}

/**
 * Generate summaries for all detected communities.
 *
 * PERF: async + cooperative — yields between communities and during the
 * merge passes so a 97k-node graph can't stall rendering. The heavy lifting
 * is now linear: nodeDataMap replaces the old per-node allNodes.find() scan
 * (O(N²) → O(N)).
 *
 * @param {Array<{ nodes: Map, connections: Map }>} graphs - from diagramStore
 * @param {Map<string, number>} communityAssignments - nodeId → communityId
 * @param {Map<string, Set<string>>} [connectionTags] - flow path tags
 * @returns {Promise<Array<object>>} Community summaries, sorted by size descending
 */
export async function summarizeCommunities(graphs, communityAssignments, connectionTags) {
  if (!communityAssignments || communityAssignments.size === 0) return [];

  // Merge all nodes and build indexes (one pass)
  const allConnections = [];
  const nodeIndexMap = new Map();
  const nodeDataMap = new Map();
  let globalIdx = 0;
  let merged = 0;

  for (const graph of graphs) {
    if (!graph?.nodes) continue;
    for (const [nodeId, nodeData] of graph.nodes) {
      if (!nodeIndexMap.has(nodeId)) {
        nodeIndexMap.set(nodeId, globalIdx++);
        nodeDataMap.set(nodeId, nodeData);
        if (++merged % 8192 === 0) await yieldToBrowser();
      }
    }
    if (graph?.connections) {
      for (const [, conn] of graph.connections) {
        const src = typeof conn.source === 'string' ? conn.source : conn.source?.nodeId;
        const tgt = typeof conn.target === 'string' ? conn.target : conn.target?.nodeId;
        if (src && tgt) {
          allConnections.push({ source: src, target: tgt, type: conn.type || conn.connectionType });
        }
      }
    }
    await yieldToBrowser();
  }

  // Group nodes by community
  const communities = new Map();
  for (const [nodeId, commId] of communityAssignments) {
    if (!communities.has(commId)) communities.set(commId, new Set());
    const idx = nodeIndexMap.get(nodeId);
    if (idx !== undefined) communities.get(commId).add(idx);
  }

  // Analyze and format each community
  const summaries = [];
  for (const [commId, nodeIndices] of communities) {
    // Yield between communities — each pass touches every connection once,
    // so large community sets still add up on huge graphs.
    await yieldToBrowser();
    const analysis = analyzeCommunity(nodeIndices, nodeIndexMap, nodeDataMap, allConnections, connectionTags);
    const name = nameCommunity(analysis);
    const summary = formatSummary(commId, name, analysis);

    summaries.push({
      id: commId,
      name,
      nodeCount: nodeIndices.size,
      nodeIds: analysis.nodeIds,
      nodeTypes: analysis.nodeTypes,
      internalConnections: analysis.internalConns,
      externalConnections: analysis.externalConns.map(([targetId, count]) => ({
        target: targetId,
        count,
        targetName: null,
      })),
      flowPaths: analysis.flowPaths,
      files: analysis.topFiles,
      summary,
    });
  }

  // Sort by node count descending (largest communities first)
  summaries.sort((a, b) => b.nodeCount - a.nodeCount);

  // Cross-reference external connection target names
  const idToSummary = new Map(summaries.map(s => [s.id, s]));
  for (const s of summaries) {
    for (const ext of s.externalConnections) {
      const target = idToSummary.get(ext.target);
      if (target) ext.targetName = target.name;
    }
  }

  return summaries;
}
