import { createWithEqualityFn } from 'zustand/traditional';

/**
 * Build a nodeId → { codeFilePath, startLine, endLine } index from parsed
 * digram graphs. The code viewer/hasCode gates rely on this so an object can
 * resolve its source even when the object's own merfolkData.codeFilePath was
 * saved empty (e.g. objects created by scans before the parser fix, or symbols
 * the scanner did not emit a codeFilePath block for) — the freshly-parsed graph
 * node still carries the association.
 */
function buildNodeCodeIndex(graphs) {
  if (!graphs) return null;
  const index = new Map();
  for (const g of graphs) {
    if (!g?.nodes) continue;
    for (const [nodeId, node] of g.nodes) {
      const metadata = node?.metadata || {};
      const codeFilePath = metadata.codeFilePath || node?.codeFilePath || '';
      if (codeFilePath) {
        index.set(nodeId, {
          codeFilePath,
          startLine:
            metadata.startLine != null
              ? Number(metadata.startLine)
              : undefined,
          endLine: metadata.endLine != null ? Number(metadata.endLine) : undefined,
        });
      }
    }
  }
  return index.size > 0 ? index : null;
}

const useDiagramStore = createWithEqualityFn((set) => ({
  // Aggregated graph data from all parsed Merfolk diagrams
  // Each entry: { nodes: Map<nodeId, nodeData>, connections: Map<edgeId, connectionData> }
  graphs: null,

  // nodeId → { codeFilePath, startLine, endLine } derived from the current
  // graphs (see buildNodeCodeIndex). Lets objects resolve code associations by
  // their merfolkData.nodeId even when the persisted object lacks a code path.
  nodeCodeIndex: null,

  // Hierarchy relationships from the layout pass
  // { parentChildMap: Map, childParentMap: Map, rootNodes: Set, internalComponentChildren: Set }
  hierarchy: null,

  // Bridges 2D node IDs ↔ 3D object IDs
  nodeToObjectIdMap: null,

  // Flow path tags: Map<"sourceId|targetId", Set<flowPathName>>
  connectionTags: null,

  // Community detection results: Array<{ id, name, nodeCount, nodeIds, nodeTypes, summary, ... }>
  communities: null,

  // Raw community assignments: Map<nodeId, communityId> (set by communityService)
  communityAssignments: null,

  // Cached 2D layout result (populated later by the 2D layout worker)
  layout2D: null,

  // True once graph data is stored and available for 2D rendering
  is2DReady: false,

  // Currently selected node in the 2D view (maps to a 3D objectId via nodeToObjectIdMap)
  selectedNodeId: null,

  // Progress of progressive 3D object mounting — null when idle
  // { total: number, mounted: number }
  renderProgress: null,

  // Progress of progressive connection mounting — null when idle
  // { total: number, mounted: number }
  connectionsProgress: null,

  // LSP enrichment data: { definitions, references, hover, callGraph, moduleExports, errors }
  // Set by the LSP enrichment service after background analysis
  lspMetadata: null,

  // True while LSP enrichment is in progress
  isLspEnriching: false,

  setGraphs(graphs) {
    set({
      graphs,
      is2DReady: !!graphs,
      nodeCodeIndex: buildNodeCodeIndex(graphs),
    });
  },

  setHierarchy(hierarchy) {
    set({ hierarchy });
  },

  setNodeToObjectIdMap(nodeToObjectIdMap) {
    set({ nodeToObjectIdMap });
  },

  setConnectionTags(connectionTags) {
    set({ connectionTags });
  },

  setCommunities(communities) {
    set({ communities });
  },

  setLayout2D(layout2D) {
    set({ layout2D });
  },

  setSelectedNodeId(selectedNodeId) {
    set({ selectedNodeId });
  },

  setRenderProgress(total, mounted) {
    if (total === 0) {
      set({ renderProgress: null });
      return;
    }
    // Clear when fully mounted
    if (mounted >= total) {
      set({ renderProgress: null });
      return;
    }
    set({ renderProgress: { total, mounted } });
  },

  setConnectionsProgress(total, mounted) {
    if (total === 0) {
      set({ connectionsProgress: null });
      return;
    }
    // Clear when fully mounted
    if (mounted >= total) {
      set({ connectionsProgress: null });
      return;
    }
    set({ connectionsProgress: { total, mounted } });
  },

  clearRenderProgress() {
    set({ renderProgress: null });
  },

  clearConnectionsProgress() {
    set({ connectionsProgress: null });
  },

  setLspMetadata(lspMetadata) {
    set({ lspMetadata, isLspEnriching: false });
  },

  setIsLspEnriching(isLspEnriching) {
    set({ isLspEnriching });
  },

  clear() {
    set({
      graphs: null,
      nodeCodeIndex: null,
      hierarchy: null,
      nodeToObjectIdMap: null,
      connectionTags: null,
      communities: null,
      communityAssignments: null,
      layout2D: null,
      is2DReady: false,
      selectedNodeId: null,
      renderProgress: null,
      connectionsProgress: null,
      lspMetadata: null,
      isLspEnriching: false,
    });
  },
}));

export default useDiagramStore;
