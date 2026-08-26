/**
 * communityService.js
 *
 * Orchestrates community detection and summary generation.
 * Reads from diagramStore, writes community summaries back to diagramStore.
 *
 * Called after graph population (post-scan or post-hydrate).
 */

import useDiagramStore from '../../stores/diagramStore';
import importPerf from '../../utils/importPerf';
import { detectCommunities } from './communityDetection';
import { summarizeCommunities } from './communitySummarizer';

const MIN_NODES_FOR_COMMUNITIES = 50;

/**
 * Detect communities in the current diagram and store summaries.
 * Skips if graph is too small or not loaded.
 *
 * @returns {Array<object>|null} Community summaries, or null if skipped
 */
export async function detectAndStoreCommunities() {
  const store = useDiagramStore.getState();
  const graphs = store.graphs;

  if (!graphs || graphs.length === 0) return null;

  // Count total nodes
  let totalNodes = 0;
  for (const graph of graphs) {
    if (graph?.nodes) totalNodes += graph.nodes.size;
  }

  if (totalNodes < MIN_NODES_FOR_COMMUNITIES) {
    console.log(`[CommunityService] Skipping — only ${totalNodes} nodes (min: ${MIN_NODES_FOR_COMMUNITIES})`);
    return null;
  }

  const startTime = performance.now();

  importPerf.mark(`community: starting detection (${totalNodes} nodes)`);

  // Detect communities (async — yields periodically to keep the UI responsive)
  const assignments = await detectCommunities(graphs);

  importPerf.mark(`community: detection done in ${Math.round(performance.now() - startTime)}ms`);

  // Generate summaries (async/cooperative — see communitySummarizer)
  const t1 = performance.now();
  const connectionTags = store.connectionTags;
  const summaries = await summarizeCommunities(graphs, assignments, connectionTags);
  importPerf.mark(`community: summaries done in ${Math.round(performance.now() - t1)}ms`);

  // Store in diagramStore
  store.setCommunities(summaries);

  // Also store the raw assignments for graph query tools
  store.communityAssignments = assignments;

  const elapsed = (performance.now() - startTime).toFixed(1);
  console.log(`[CommunityService] Detected ${summaries.length} communities from ${totalNodes} nodes in ${elapsed}ms`);

  return summaries;
}
