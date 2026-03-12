import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useDiagramStore from '../stores/diagramStore';
import useUIOverlayStore from '../stores/uiOverlayStore';
import useObjectsStore from '../stores/objectsStore';
import { getDiagramLayoutWorker } from '../workers/diagramLayoutWorkerClient';
import { customNodeTypes } from './diagram2d/NodeTypes';
import { customEdgeTypes, EdgeMarkerDefs } from './diagram2d/EdgeTypes';

// ---------------------------------------------------------------------------
// Connection layer definitions (checkboxes, not radio)
// ---------------------------------------------------------------------------

const LAYER_DEFS = [
  { key: 'hierarchy', label: 'Hierarchy', types: ['controlflow', 'dotted'] },
  { key: 'dataflow', label: 'Data Flow', types: ['dataflow'] },
  { key: 'association', label: 'Associations', types: ['association'] },
  { key: 'inheritance', label: 'Inheritance', types: ['inheritance'] },
];

const DEFAULT_LAYERS = { hierarchy: true, dataflow: false, association: false, inheritance: false };

// ---------------------------------------------------------------------------
// Helpers: convert layout worker output → React Flow nodes & edges
// ---------------------------------------------------------------------------

function buildReactFlowNodes(nodePositions, hierarchy) {
  const childParentMap = new Map(hierarchy?.childParentMap || []);
  const internalComponentChildren = new Set(hierarchy?.internalComponentChildren || []);
  const posMap = new Map(nodePositions);

  // Compute containment depth so parents are sorted before children.
  // internalComponentChildren are tree nodes (not contained), so depth = 0.
  const depthOf = new Map();
  function getDepth(id) {
    if (depthOf.has(id)) return depthOf.get(id);
    if (internalComponentChildren.has(id)) {
      depthOf.set(id, 0);
      return 0;
    }
    const pid = childParentMap.get(id);
    const d = pid && posMap.has(pid) && !internalComponentChildren.has(id)
      ? getDepth(pid) + 1 : 0;
    depthOf.set(id, d);
    return d;
  }
  for (const [id] of nodePositions) getDepth(id);

  // Sort: lower depth first (parents before children)
  const sorted = [...nodePositions].sort(
    (a, b) => (depthOf.get(a[0]) || 0) - (depthOf.get(b[0]) || 0)
  );

  const nodes = [];
  for (const [nodeId, pos] of sorted) {
    const isCompound = pos.isCompound;
    const parentId = childParentMap.get(nodeId);
    // Only set parentId for containment — NOT for tree children
    const hasParent = parentId && posMap.has(parentId) && !internalComponentChildren.has(nodeId);

    // React Flow expects child positions relative to their parent
    let relX = pos.x;
    let relY = pos.y;
    if (hasParent) {
      const parentPos = posMap.get(parentId);
      relX -= parentPos.x;
      relY -= parentPos.y;
    }

    const node = {
      id: nodeId,
      type: isCompound ? 'merfolkContainer' : 'merfolk',
      position: { x: relX, y: relY },
      data: {
        label: pos.name || nodeId,
        merfolkType: pos.merfolkType || 'function',
      },
      style: isCompound
        ? { width: pos.width, height: pos.height }
        : undefined,
    };

    if (hasParent) {
      node.parentId = parentId;
      node.extent = 'parent';
    }

    nodes.push(node);
  }

  return nodes;
}

function buildReactFlowEdges(edgeRoutes) {
  return edgeRoutes.map(([edgeId, route]) => ({
    id: edgeId,
    source: route.sourceId,
    target: route.targetId,
    type: 'merfolk',
    data: {
      connectionType: route.connectionType,
      flowPaths: route.flowPaths,
      label: route.label,
    },
  }));
}

// ---------------------------------------------------------------------------
// Client-side edge filtering helpers
// ---------------------------------------------------------------------------

/** Return the layer key for a given connection type */
const TYPE_TO_LAYER = new Map();
for (const def of LAYER_DEFS) {
  for (const t of def.types) TYPE_TO_LAYER.set(t, def.key);
}

function layerForType(connectionType) {
  return TYPE_TO_LAYER.get(connectionType) ?? null;
}

/** Filter edges by active layers and optional flow path */
function filterEdges(allEdges, layers, activeFlowPath) {
  return allEdges.filter((edge) => {
    const type = edge.data?.connectionType;
    const layer = layerForType(type);

    // If a flow path is selected, only show edges tagged with it
    if (activeFlowPath) {
      const fps = edge.data?.flowPaths;
      return fps && fps.includes(activeFlowPath);
    }

    // Unknown connection types always pass
    if (!layer) return true;
    return !!layers[layer];
  });
}

// ---------------------------------------------------------------------------
// MiniMap node color
// ---------------------------------------------------------------------------

const MINIMAP_COLORS = {
  component: '#1976d2',
  function: '#388e3c',
  store: '#7b1fa2',
  service: '#e65100',
  hook: '#00796b',
  library: '#757575',
  datapath: '#ff8f00',
};

// Pre-computed entries array — avoids Object.entries() allocation per render
const MINIMAP_COLOR_ENTRIES = Object.entries(MINIMAP_COLORS);

function minimapNodeColor(node) {
  return MINIMAP_COLORS[node.data?.merfolkType] || '#9e9e9e';
}

// ---------------------------------------------------------------------------
// PERF: Stable object references for ReactFlow props — prevents unnecessary
// internal reconciliation on every render.
// ---------------------------------------------------------------------------

const PRO_OPTIONS = { hideAttribution: true };

const OVERLAY_STYLE = { position: 'fixed', inset: 0, zIndex: 100, background: '#f8f8f8' };

const LOADING_OVERLAY_STYLE = {
  position: 'absolute', inset: 0, zIndex: 110,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(248,248,248,0.85)',
};

const ERROR_STYLE = {
  position: 'absolute', top: '60px', left: '50%',
  transform: 'translateX(-50%)', zIndex: 120,
  background: '#ffebee', color: '#c62828',
  padding: '8px 16px', borderRadius: '6px',
  fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const NO_DATA_OVERLAY_STYLE = {
  position: 'fixed', inset: 0, zIndex: 100,
  background: '#f8f8f8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: '12px',
};

const MINIMAP_STYLE = { border: '1px solid #ccc' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiagramOverlay2D() {
  const graphs = useDiagramStore((s) => s.graphs);
  const hierarchy = useDiagramStore((s) => s.hierarchy);
  const connectionTags = useDiagramStore((s) => s.connectionTags);
  const setLayout2D = useDiagramStore((s) => s.setLayout2D);
  const nodeToObjectIdMap = useDiagramStore((s) => s.nodeToObjectIdMap);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const setViewMode = useUIOverlayStore((s) => s.setViewMode);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [allEdges, setAllEdges] = useState([]); // unfiltered edges from worker
  const [isLayouting, setIsLayouting] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [activeFlowPath, setActiveFlowPath] = useState('');
  const [layoutError, setLayoutError] = useState(null);

  // ---- Extract unique flow path names from connectionTags ----
  const flowPathNames = useMemo(() => {
    if (!connectionTags) return [];
    const names = new Set();
    for (const tagSet of connectionTags.values()) {
      for (const name of tagSet) names.add(name);
    }
    return Array.from(names).sort();
  }, [connectionTags]);

  // ---- Serialise graph data for the worker ----
  const serialisedGraphData = useMemo(() => {
    if (!graphs || graphs.length === 0) return null;
    const allNodes = [];
    const allConnections = [];
    for (const graph of graphs) {
      if (graph.nodes) {
        for (const [id, data] of graph.nodes) allNodes.push([id, data]);
      }
      if (graph.connections) {
        for (const [, conn] of graph.connections) allConnections.push(conn);
      }
    }
    return { allNodes, allConnections };
  }, [graphs]);

  // ---- Serialise hierarchy for the worker ----
  const serialisedHierarchy = useMemo(() => {
    if (!hierarchy) return { parentChildMap: [], childParentMap: [], rootNodes: [], internalComponentChildren: [] };
    return {
      parentChildMap: hierarchy.parentChildMap
        ? Array.from(hierarchy.parentChildMap.entries()).map(([k, v]) => [k, Array.from(v)])
        : [],
      childParentMap: hierarchy.childParentMap
        ? Array.from(hierarchy.childParentMap.entries())
        : [],
      rootNodes: hierarchy.rootNodes ? Array.from(hierarchy.rootNodes) : [],
      internalComponentChildren: hierarchy.internalComponentChildren
        ? Array.from(hierarchy.internalComponentChildren)
        : [],
    };
  }, [hierarchy]);

  // ---- Run layout once with ALL connections ----
  useEffect(() => {
    if (!serialisedGraphData) return;
    let cancelled = false;
    setIsLayouting(true);
    setLayoutError(null);

    (async () => {
      try {
        const worker = getDiagramLayoutWorker();
        const result = await worker.computeLayout(
          serialisedGraphData.allNodes,
          serialisedGraphData.allConnections,
          serialisedHierarchy,
          { filter: 'all' }
        );
        if (cancelled) return;

        setLayout2D(result);

        const rfNodes = buildReactFlowNodes(result.nodePositions, serialisedHierarchy);
        const rfEdges = buildReactFlowEdges(result.edgeRoutes);

        setNodes(rfNodes);
        setAllEdges(rfEdges);
      } catch (err) {
        if (!cancelled) {
          console.error('[DiagramOverlay2D] Layout failed:', err);
          setLayoutError(err.message || 'Layout computation failed');
        }
      } finally {
        if (!cancelled) setIsLayouting(false);
      }
    })();

    return () => { cancelled = true; };
  }, [serialisedGraphData, serialisedHierarchy, setLayout2D, setNodes]);

  // ---- Derive filtered edges via useMemo (avoids extra render from useEffect+setState) ----
  const filteredEdges = useMemo(
    () => filterEdges(allEdges, layers, activeFlowPath),
    [allEdges, layers, activeFlowPath]
  );

  // ---- Toggle a layer checkbox ----
  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Memoized per-key handlers to avoid inline closure allocation per render
  const toggleLayerHandlers = useMemo(() => {
    const map = {};
    LAYER_DEFS.forEach(({ key }) => { map[key] = () => toggleLayer(key); });
    return map;
  }, [toggleLayer]);

  // ---- Node click → selection ----
  const handleNodeClick = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // ---- Back to 3D with selection sync ----
  const handleBackTo3D = useCallback(() => {
    if (selectedNodeId && nodeToObjectIdMap) {
      const objectId = nodeToObjectIdMap.get(selectedNodeId);
      if (objectId) {
        // Select the 3D object
        useObjectsStore.getState().setSelectedId(objectId);

        // Fly camera to the object's position
        const objects = useObjectsStore.getState().objects;
        const obj = objects.find((o) => o.id === objectId);
        if (obj?.position && window.cameraRef?.setTarget) {
          window.cameraRef.setTarget(obj.position);
        }
      }
    }
    setViewMode('3d');
  }, [selectedNodeId, nodeToObjectIdMap, setViewMode]);

  // ---- No data state ----
  if (!graphs || graphs.length === 0) {
    return (
      <div style={NO_DATA_OVERLAY_STYLE}>
        <div style={{ fontSize: '16px', color: '#666' }}>
          No diagram data available.
        </div>
        <div style={{ fontSize: '13px', color: '#999' }}>
          Scan a GitHub repository or upload a Merfolk markdown file first.
        </div>
        <button onClick={handleBackTo3D} style={backButtonStyle}>
          Back to 3D
        </button>
      </div>
    );
  }

  return (
    <div style={OVERLAY_STYLE}>
      <EdgeMarkerDefs />

      {isLayouting && (
        <div style={LOADING_OVERLAY_STYLE}>
          <div style={{ textAlign: 'center' }}>
            <div className="objects-loading-spinner" />
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
              Computing 2D layout…
            </div>
          </div>
        </div>
      )}

      {layoutError && (
        <div style={ERROR_STYLE}>
          Layout error: {layoutError}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={filteredEdges}
        nodeTypes={customNodeTypes}
        edgeTypes={customEdgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onlyRenderVisibleElements
        fitView
        minZoom={0.05}
        maxZoom={2}
        proOptions={PRO_OPTIONS}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#ddd" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={1}
          zoomable
          pannable
          style={MINIMAP_STYLE}
        />

        {/* Filter panel + back-to-3D button */}
        <Panel position="top-right">
          <div style={panelStyle}>
            <button onClick={handleBackTo3D} style={backButtonStyle}>
              ← Back to 3D
            </button>

            {selectedNodeId && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#1976d2', fontStyle: 'italic' }}>
                Selected: {selectedNodeId}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />

            <div style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Connection Layers
            </div>

            {LAYER_DEFS.map(({ key, label }) => (
              <label key={key} style={filterLabelStyle}>
                <input
                  type="checkbox"
                  checked={!!layers[key]}
                  onChange={toggleLayerHandlers[key]}
                  style={{ marginRight: '6px' }}
                />
                {label}
              </label>
            ))}

            {/* Flow path dropdown */}
            {flowPathNames.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Flow Paths
                </div>
                <select
                  value={activeFlowPath}
                  onChange={(e) => setActiveFlowPath(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All (use layers above)</option>
                  {flowPathNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left">
          <div style={{ ...panelStyle, display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '460px' }}>
            {MINIMAP_COLOR_ENTRIES.map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                <span style={{ textTransform: 'capitalize', color: '#555' }}>{type}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const panelStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  fontSize: '13px',
};

const backButtonStyle = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  color: '#333',
  transition: 'background 0.15s ease',
};

const filterLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 0',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#444',
};

const selectStyle = {
  width: '100%',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '12px',
  color: '#333',
  background: '#fff',
  cursor: 'pointer',
};
