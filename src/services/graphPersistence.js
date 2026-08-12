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
const MAX_DIGEST_CHARS = 4800000;

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipString(str) {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipString(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

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

export async function saveDiagramDigest(spaceId) {
  if (!spaceId) return;
  try {
    const state = useDiagramStore.getState();
    if (!state.graphs || state.graphs.length === 0) return;

    const digest = {
      v: 2,
      savedAt: Date.now(),
      graphs: serializeGraphs(state.graphs),
      hierarchy: serializeHierarchy(state.hierarchy),
      communities: state.communities || null,
      connectionTags: state.connectionTags
        ? [...state.connectionTags.entries()].map(([key, tags]) => [key, tags instanceof Set ? [...tags] : tags])
        : null,
      nodeToObjectIdMap: state.nodeToObjectIdMap
        ? [...state.nodeToObjectIdMap.entries()]
        : null,
    };

    const serialized = JSON.stringify(digest);
    if (serialized.length > MAX_DIGEST_CHARS) {
      if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') {
        console.warn(`[graphPersistence] Digest too large (${serialized.length} chars) — skipping persistence (compression unavailable)`);
        return;
      }
      const compressed = bytesToBase64(await gzipString(serialized));
      const stored = JSON.stringify({ c: 1, s: compressed });
      if (stored.length > MAX_DIGEST_CHARS) {
        console.warn(`[graphPersistence] Digest too large even compressed (${serialized.length} chars -> ${stored.length} chars) — skipping persistence. The 2D/analysis buttons will NOT restore after a page refresh for this space.`);
        return;
      }
      localStorage.setItem(`${STORAGE_PREFIX}${spaceId}`, stored);
      console.log(`[graphPersistence] Saved compressed digest: ${serialized.length} chars -> ${stored.length} chars`);
      return;
    }

    localStorage.setItem(`${STORAGE_PREFIX}${spaceId}`, serialized);
  } catch (e) {
    console.warn('[graphPersistence] save failed:', e.message);
  }
}

export async function loadDiagramDigest(spaceId) {
  if (!spaceId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${spaceId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.c === 1) {
      return JSON.parse(await gunzipString(base64ToBytes(parsed.s)));
    }
    return parsed;
  } catch (e) {
    console.warn('[graphPersistence] load failed:', e.message);
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
  const digest = await loadDiagramDigest(spaceId);
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

    if (digest.nodeToObjectIdMap) {
      store.setNodeToObjectIdMap(new Map(digest.nodeToObjectIdMap));
    }

    const { detectAndStoreCommunities } = await import('./context/communityService');
    await detectAndStoreCommunities();
    return true;
  } catch (e) {
    console.warn('[graphPersistence] rehydrate failed:', e.message);
    return false;
  }
}
