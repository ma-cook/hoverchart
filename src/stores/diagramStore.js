import { createWithEqualityFn } from 'zustand/traditional';

const useDiagramStore = createWithEqualityFn((set) => ({
  // Aggregated graph data from all parsed Merfolk diagrams
  // Each entry: { nodes: Map<nodeId, nodeData>, connections: Map<edgeId, connectionData> }
  graphs: null,

  // Hierarchy relationships from the layout pass
  // { parentChildMap: Map, childParentMap: Map, rootNodes: Set, internalComponentChildren: Set }
  hierarchy: null,

  // Bridges 2D node IDs ↔ 3D object IDs
  nodeToObjectIdMap: null,

  // Flow path tags: Map<"sourceId|targetId", Set<flowPathName>>
  connectionTags: null,

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

  setGraphs(graphs) {
    set({ graphs, is2DReady: !!graphs });
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

  clear() {
    set({
      graphs: null,
      hierarchy: null,
      nodeToObjectIdMap: null,
      connectionTags: null,
      layout2D: null,
      is2DReady: false,
      selectedNodeId: null,
      renderProgress: null,
      connectionsProgress: null,
    });
  },
}));

export default useDiagramStore;
