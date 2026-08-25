/**
 * communityDetection.js
 *
 * Louvain community detection on the Merfolk graph.
 * Operates on diagramStore.graphs: Array<{ nodes: Map, connections: Map }>
 *
 * Returns Map<nodeId, communityId> with communities indexed from 0.
 *
 * Two drivers share one generator-based core:
 * - detectCommunities(): async + cooperative. Yields to the event loop every
 *   ~2k nodes so a huge scan (97k+ nodes, multi-second run) can never freeze
 *   the main thread — progressive mounting and chunked uploads keep running.
 * - detectCommunitiesSync(): drains the same core without yielding. Kept for
 *   legacy callers in synchronous contexts (e.g. githubRepoService).
 */

const CONNECTION_WEIGHTS = {
  DataFlow: 1.0,
  ControlFlow: 0.5,
  Association: 0.3,
  Inheritance: 0.8,
  composition: 0.8,
  aggregation: 0.6,
  dependency: 0.5,
};

const DEFAULT_OPTIONS = {
  minCommunitySize: 3,
  maxCommunities: 30,
  resolution: 1.0,
  maxIterations: 50,
};

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));
const NODES_BETWEEN_YIELDS = 2048;

/**
 * Build adjacency structures from the merfolk graphs.
 */
function prepareGraph(graphs) {
  const allNodeIds = new Set();
  const edges = [];

  for (const graph of graphs) {
    if (!graph?.nodes || !graph?.connections) continue;
    for (const [id] of graph.nodes) allNodeIds.add(id);
    for (const [, conn] of graph.connections) {
      const src = typeof conn.source === 'string' ? conn.source : conn.source?.nodeId;
      const tgt = typeof conn.target === 'string' ? conn.target : conn.target?.nodeId;
      if (src && tgt && allNodeIds.has(src) && allNodeIds.has(tgt)) {
        const weight = CONNECTION_WEIGHTS[conn.type || conn.connectionType] || 0.5;
        edges.push({ source: src, target: tgt, weight });
      }
    }
  }

  // Build adjacency list
  const nodeIds = Array.from(allNodeIds);
  const nodeIndex = new Map();
  nodeIds.forEach((id, i) => nodeIndex.set(id, i));

  const n = nodeIds.length;
  const adjacency = Array.from({ length: n }, () => new Map());
  let totalWeight = 0;

  for (const edge of edges) {
    const si = nodeIndex.get(edge.source);
    const ti = nodeIndex.get(edge.target);
    if (si === undefined || ti === undefined) continue;
    if (si === ti) continue;

    adjacency[si].set(ti, (adjacency[si].get(ti) || 0) + edge.weight);
    adjacency[ti].set(si, (adjacency[ti].get(si) || 0) + edge.weight);
    totalWeight += edge.weight;
  }

  if (totalWeight === 0) totalWeight = 1;

  return { nodeIds, adjacency, totalWeight };
}

/**
 * Louvain Phase-1 local optimization as a generator. Yields periodically so
 * the cooperative driver can hand control back to the event loop.
 *
 * @returns {Generator<'yield', Map<string, number>, void>}
 */
function* louvainCore(nodeIds, adjacency, totalWeight, opts) {
  const n = nodeIds.length;

  // Initialize: each node in its own community
  const community = nodeIds.map((_, i) => i);
  const communityNodes = new Map();
  for (let i = 0; i < n; i++) {
    communityNodes.set(i, new Set([i]));
  }

  // Node degrees (sum of edge weights)
  const degree = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (const [, w] of adjacency[i]) degree[i] += w;
  }

  // Community internal weights
  const communityInternalWeight = new Array(n).fill(0);
  const communityTotalDegree = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    communityTotalDegree[i] = degree[i];
  }
  for (let i = 0; i < n; i++) {
    for (const [j, w] of adjacency[i]) {
      if (community[i] === community[j]) {
        communityInternalWeight[community[i]] += w;
      }
    }
  }

  const resolution = opts.resolution;

  // Phase 1: Local optimization
  // Reused across nodes to avoid allocating a Map per node per iteration
  // (that was ~100k short-lived Maps per sweep at 97k nodes → GC storms).
  const neighborWeights = new Map();
  let nodesSinceYield = 0;

  for (let iter = 0; iter < opts.maxIterations; iter++) {
    let improved = false;

    for (let i = 0; i < n; i++) {
      if (++nodesSinceYield >= NODES_BETWEEN_YIELDS) {
        nodesSinceYield = 0;
        yield 'yield';
      }

      const currentComm = community[i];
      const ki = degree[i];

      // Compute weights to neighboring communities
      neighborWeights.clear();
      for (const [j, w] of adjacency[i]) {
        const nc = community[j];
        neighborWeights.set(nc, (neighborWeights.get(nc) || 0) + w);
      }

      // Remove node from its community (allocation-free internal-weight scan)
      let internalWeight = 0;
      for (const [j, w] of adjacency[i]) {
        if (community[j] === currentComm) internalWeight += w;
      }
      communityInternalWeight[currentComm] -= internalWeight;
      communityNodes.get(currentComm).delete(i);
      communityTotalDegree[currentComm] -= ki;

      // Find best community to move to
      let bestComm = currentComm;
      let bestGain = 0;

      for (const [comm, weightToComm] of neighborWeights) {
        const sigmaTot = communityTotalDegree[comm];
        const ki_in = weightToComm;

        // Modularity gain: (ki_in / totalWeight) - resolution * (ki * sigmaTot) / (2 * totalWeight^2)
        const gain = (ki_in / totalWeight) - resolution * (ki * sigmaTot) / (2 * totalWeight * totalWeight);

        if (gain > bestGain) {
          bestGain = gain;
          bestComm = comm;
        }
      }

      // Move node to best community
      community[i] = bestComm;
      communityNodes.get(bestComm).add(i);
      communityTotalDegree[bestComm] += ki;

      // Update internal weight
      for (const [j, w] of adjacency[i]) {
        if (community[j] === bestComm) {
          communityInternalWeight[bestComm] += w;
        }
      }

      if (bestComm !== currentComm) improved = true;
    }

    if (!improved) break;
    // Let rendering/pump frames run between sweeps on large graphs.
    yield 'yield';
  }

  // Reindex communities to 0..k-1
  const communityMap = new Map();
  let nextId = 0;
  for (let i = 0; i < n; i++) {
    if (!communityMap.has(community[i])) {
      communityMap.set(community[i], nextId++);
    }
  }

  const result = new Map();
  for (let i = 0; i < n; i++) {
    result.set(nodeIds[i], communityMap.get(community[i]));
  }

  return result;
}

function normalizeOptions(options = {}) {
  return { ...DEFAULT_OPTIONS, ...options };
}

/**
 * Detect communities in the Merfolk graph using Louvain algorithm
 * (cooperative version — see module docs).
 *
 * @param {Array<{ nodes: Map<string, object>, connections: Map<string, object> }>} graphs
 * @param {object} [options]
 * @returns {Promise<Map<string, number>>} nodeId → communityId (0-indexed)
 */
export async function detectCommunities(graphs, options = {}) {
  const opts = normalizeOptions(options);

  const prepared = prepareGraph(graphs);
  if (prepared.nodeIds.length === 0) return new Map();
  if (prepared.nodeIds.length < opts.minCommunitySize) {
    const single = new Map();
    let i = 0;
    for (const id of prepared.nodeIds) single.set(id, i++);
    return single;
  }

  const it = louvainCore(prepared.nodeIds, prepared.adjacency, prepared.totalWeight, opts);
  let step = it.next();
  while (!step.done) {
    await yieldToBrowser();
    step = it.next();
  }
  return step.value;
}

/**
 * Synchronous variant — same algorithm, no yielding. Only for callers that
 * cannot await (kept behaviour-compatible with the pre-cooperative API).
 *
 * @param {Array<{ nodes: Map<string, object>, connections: Map<string, object> }>} graphs
 * @param {object} [options]
 * @returns {Map<string, number>} nodeId → communityId (0-indexed)
 */
export function detectCommunitiesSync(graphs, options = {}) {
  const opts = normalizeOptions(options);

  const prepared = prepareGraph(graphs);
  if (prepared.nodeIds.length === 0) return new Map();
  if (prepared.nodeIds.length < opts.minCommunitySize) {
    const single = new Map();
    let i = 0;
    for (const id of prepared.nodeIds) single.set(id, i++);
    return single;
  }

  const it = louvainCore(prepared.nodeIds, prepared.adjacency, prepared.totalWeight, opts);
  let step = it.next();
  while (!step.done) step = it.next();
  return step.value;
}
