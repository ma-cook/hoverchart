/**
 * graphPersistence.js
 *
 * Fallback persistence for the diagramStore graph context. The primary restore
 * path is the markdown hydration effect (fetches latestMarkdownUrl and rebuilds
 * the full graph). This digest covers the cases where no storage URL exists
 * (upload failed, or spaces scanned before the storageUrl fix): it snapshots a
 * compact, JSON-safe version of graphs/hierarchy/communities per space and
 * rehydrates the store on page refresh so the 2D/analysis buttons and the
 * graph/community LLM tools keep working.
 */

import useDiagramStore from '../stores/diagramStore';

const STORAGE_PREFIX = 'diagramDigest_';
const MAX_DIGEST_CHARS = 1000000;

function serializeGraphs(graphs) {
  if (!graphs) return null;
  return graphs.map((g) => ({
    nodes: g?.nodes ? [...g.nodes.entries()] : [],
    connections: g?.connections ? [...g.connections.entries()] : [],
  }));
}

function serializeHierarchy(hierarchy) {
  if (!hierarchy) return null;
  return {
    parentChildMap: hierarchy.parentChildMap ? [...hierarchy.parentChildMap.entries()] : [],
    childParentMap: hierarchy.childParentMap ? [...hierarchy.childParentMap.entries()] : [],
    rootNodes: hierarchy.rootNodes ? [...hierarchy.rootNodes] : [],
    internalComponentChildren: hierarchy.internalComponentChildren ? [...hierarchy.internalComponentChildren] : [],
  };
}

export function saveDiagramDigest(spaceId) {
  if (!spaceId) return;
  try {
    const state = useDiagramStore.getState();
    if (!state.graphs || state.graphs.length === 0) return;

    const digest = {
      v: 1,
      savedAt: Date.now(),
      graphs: serializeGraphs(state.graphs),
      hierarchy: serializeHierarchy(state.hierarchy),
      communities: state.communities || null,
      connectionTags: state.connectionTags
        ? [...state.connectionTags.entries()].map(([key, tags]) => [key, tags instanceof Set ? [...tags] : tags])
        : null,
    };

    const serialized = JSON.stringify(digest);
    if (serialized.length > MAX_DIGEST_CHARS) {
      console.warn(`[graphPersistence] Digest too large (${serialized.length} chars) — skipping persistence`);
      return;
    }

    localStorage.setItem(`${STORAGE_PREFIX}${spaceId}`, serialized);
  } catch (e) {
    console.warn('[graphPersistence] save failed:', e.message);
  }
}

export function loadDiagramDigest(spaceId) {
  if (!spaceId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${spaceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDiagramDigest(spaceId) {
  if (!spaceId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${spaceId}`);
  } catch { /* ignore */ }
}

/**
 * Restore diagramStore from a persisted digest. Returns true if a digest was
 * found and applied. Community detection is re-run afterwards so the community
 * summaries and raw assignments are consistent with the restored graph.
 */
export async function rehydrateFromDigest(spaceId) {
  const digest = loadDiagramDigest(spaceId);
  if (!digest?.graphs) return false;

  try {
    const store = useDiagramStore.getState();
    store.setGraphs(digest.graphs.map((g) => ({
      nodes: new Map(g.nodes),
      connections: new Map(g.connections),
    })));

    if (digest.hierarchy) {
      store.setHierarchy({
        parentChildMap: new Map(digest.hierarchy.parentChildMap),
        childParentMap: new Map(digest.hierarchy.childParentMap),
        rootNodes: new Set(digest.hierarchy.rootNodes),
        internalComponentChildren: new Set(digest.hierarchy.internalComponentChildren),
      });
    }

    if (digest.communities) store.setCommunities(digest.communities);

    if (digest.connectionTags) {
      store.setConnectionTags(new Map(
        digest.connectionTags.map(([key, tags]) => [key, new Set(tags)])
      ));
    }

    const { detectAndStoreCommunities } = await import('./context/communityService');
    await detectAndStoreCommunities();
    return true;
  } catch (e) {
    console.warn('[graphPersistence] rehydrate failed:', e.message);
    return false;
  }
}
