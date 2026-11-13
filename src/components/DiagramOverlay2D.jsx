import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useDiagramStore from '../stores/diagramStore';
import useUIOverlayStore from '../stores/uiOverlayStore';
import useObjectsStore from '../stores/objectsStore';
import useCodeStore from '../stores/codeStore';
import { getDiagramLayoutWorker } from '../workers/diagramLayoutWorkerClient';
import { buildC4Model, getC4View, C4_LEVELS } from '../services/c4/c4Model';
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

// The C4 projection replaces hierarchy edges with semantic relationships,
// so show architecture and code edges by default.
const DEFAULT_LAYERS = { hierarchy: false, dataflow: true, association: true, inheritance: true };

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

// Refit the viewport whenever a new C4 level has been laid out. React Flow's
// `fitView` prop only applies to the initial mount, not subsequent layouts.
function FitViewOnLayout({ version }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 200 });
    });
    return () => cancelAnimationFrame(frame);
  }, [version, fitView]);

  return null;
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
  person: '#5e35b1',
  system: '#1e88e5',
  container: '#00838f',
  component: '#1976d2',
  module: '#6d4c41',
  function: '#388e3c',
  store: '#7b1fa2',
  service: '#e65100',
  hook: '#00796b',
  library: '#757575',
  external: '#546e7a',
  interface: '#0277bd',
  class: '#ad1457',
  endpoint: '#ef6c00',
  datapath: '#ff8f00',
  variable: '#689f38',
  constant: '#f9a825',
};

// Pre-computed entries array — avoids Object.entries() allocation per render
const MINIMAP_COLOR_ENTRIES = Object.entries(MINIMAP_COLORS);

// Pre-compute legend swatch styles for each type
const LEGEND_SWATCH_STYLES = {};
for (const [type, color] of MINIMAP_COLOR_ENTRIES) {
  LEGEND_SWATCH_STYLES[type] = { width: '10px', height: '10px', borderRadius: '2px', background: color };
}

function minimapNodeColor(node) {
  return MINIMAP_COLORS[node.data?.merfolkType] || '#9e9e9e';
}

// ---------------------------------------------------------------------------
// PERF: Stable object references for ReactFlow props — prevents unnecessary
// internal reconciliation on every render.
// ---------------------------------------------------------------------------

const PRO_OPTIONS = { hideAttribution: true };

const OVERLAY_STYLE = { position: 'fixed', inset: 0, zIndex: 100, background: 'var(--canvas-bg)', contain: 'strict' };

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

const SELECTED_NODE_STYLE = { marginTop: '6px', fontSize: '11px', color: '#1976d2', fontStyle: 'italic' };
const DIVIDER_STYLE = { borderTop: '1px solid #e0e0e0', margin: '8px 0' };
const SECTION_HEADER_STYLE = { fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const CHECKBOX_STYLE = { marginRight: '6px' };
const LEGEND_PANEL_STYLE = { display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '460px' };
const LEGEND_ITEM_STYLE = { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' };
const LEGEND_TEXT_STYLE = { textTransform: 'capitalize', color: '#555' };

const C4_STEPPER_STYLE = { display: 'flex', gap: '4px', marginBottom: '8px' };
const C4_STEP_STYLE = {
  flex: 1,
  padding: '4px 0',
  borderRadius: '4px',
  border: '1px solid var(--panel-border)',
  background: 'var(--panel-bg)',
  color: 'var(--panel-text)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
};
const C4_STEP_CURRENT_STYLE = {
  background: '#1976d2',
  borderColor: '#1976d2',
  color: '#fff',
  cursor: 'default',
};
const C4_STEP_DISABLED_STYLE = {
  opacity: 0.4,
  cursor: 'not-allowed',
};
const C4_FOCUS_STYLE = {
  fontSize: '11px',
  color: 'var(--panel-text-muted)',
  marginBottom: '6px',
  lineHeight: 1.4,
};
const C4_EMPTY_STYLE = {
  fontSize: '11px',
  color: '#b26a00',
  background: '#fff8e1',
  border: '1px solid #ffe0a3',
  borderRadius: '4px',
  padding: '6px 8px',
  marginBottom: '6px',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DiagramOverlay2D() {
  const graphs = useDiagramStore((s) => s.graphs);
  const hierarchy = useDiagramStore((s) => s.hierarchy);
  const connectionTags = useDiagramStore((s) => s.connectionTags);
  const setLayout2D = useDiagramStore((s) => s.setLayout2D);
  const nodeToObjectIdMap = useDiagramStore((s) => s.nodeToObjectIdMap);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const c4Stack = useDiagramStore((s) => s.c4Stack);
  const pushC4Focus = useDiagramStore((s) => s.pushC4Focus);
  const truncateC4Focus = useDiagramStore((s) => s.truncateC4Focus);
  const repoName = useCodeStore((s) => s.repoName);
  const fileIndexByPath = useCodeStore((s) => s.fileIndexByPath);
  const setViewMode = useUIOverlayStore((s) => s.setViewMode);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [allEdges, setAllEdges] = useState([]); // unfiltered edges from worker
  const [layoutVersion, setLayoutVersion] = useState(0);
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

  // ---- Build the C4 model once, then project the focused view ----
  const c4Model = useMemo(
    () => buildC4Model({ graphs, hierarchy, repoName, fileIndexByPath }),
    [graphs, hierarchy, repoName, fileIndexByPath]
  );

  const c4View = useMemo(
    () => getC4View(c4Model, c4Stack),
    [c4Model, c4Stack]
  );

  const c4ViewInvalid = !!c4View?.invalid;

  // If a rescan removed the focused node, fall back to the nearest valid level.
  useEffect(() => {
    if (!c4ViewInvalid || !c4Model) return;
    let nextLength = c4Stack.length;
    while (nextLength > 0) {
      nextLength -= 1;
      if (!getC4View(c4Model, c4Stack.slice(0, nextLength)).invalid) break;
    }
    truncateC4Focus(nextLength);
  }, [c4ViewInvalid, c4Model, c4Stack, truncateC4Focus]);

  // ---- Serialise the focused C4 view as a flat layout for the worker ----
  const serialisedViewData = useMemo(() => {
    if (!c4View) return null;
    const allNodes = c4View.nodes.map((node) => [
      node.id,
      { id: node.id, name: node.label, type: node.type },
    ]);
    const allConnections = c4View.connections.map((connection) => ({
      id: connection.id,
      source: { nodeId: connection.sourceId },
      target: { nodeId: connection.targetId },
      type: connection.type,
      label: connection.label || '',
      flowPaths: connection.flowPaths || [],
    }));
    return {
      allNodes,
      allConnections,
      hierarchy: {
        parentChildMap: [],
        childParentMap: [],
        rootNodes: allNodes.map(([id]) => id),
        internalComponentChildren: [],
      },
    };
  }, [c4View]);

  // ---- Run layout for the active C4 level ----
  useEffect(() => {
    if (!serialisedViewData) return;
    let cancelled = false;
    setIsLayouting(true);
    setLayoutError(null);

    (async () => {
      try {
        const worker = getDiagramLayoutWorker();
        const result = await worker.computeLayout(
          serialisedViewData.allNodes,
          serialisedViewData.allConnections,
          serialisedViewData.hierarchy,
          { filter: 'all' }
        );
        if (cancelled) return;

        setLayout2D(result);

        const rfNodes = buildReactFlowNodes(result.nodePositions, serialisedViewData.hierarchy);
        const rfEdges = buildReactFlowEdges(result.edgeRoutes);

        setNodes(rfNodes);
        setAllEdges(rfEdges);
        setLayoutVersion((version) => version + 1);
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
  }, [serialisedViewData, setLayout2D, setNodes]);

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

  // ---- Node click → drill into containers, select leaves ----
  const handleNodeClick = useCallback((_event, node) => {
    if (c4View?.drillable?.has(node.id)) {
      const nextFocus = c4View.nextFocusById.get(node.id);
      if (nextFocus) {
        pushC4Focus(nextFocus);
        setSelectedNodeId(null);
        return;
      }
    }
    if (c4View?.syntheticIds?.has(node.id)) return;
    setSelectedNodeId(node.id);
  }, [c4View, pushC4Focus, setSelectedNodeId]);

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
        edgesFocusable={false}
        edgesReconnectable={false}
        nodesFocusable={false}
        elementsSelectable={true}
        autoPanOnNodeDrag={false}
        autoPanOnConnect={false}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        zoomActivationKeyCode={null}
      >
        <FitViewOnLayout version={layoutVersion} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={1}
          zoomable
          pannable
          style={MINIMAP_STYLE}
          inversePan
        />

        {/* Filter panel + back-to-3D button */}
        <Panel position="top-right">
          <div style={panelStyle}>
            <button onClick={handleBackTo3D} style={backButtonStyle}>
              ← Back to 3D
            </button>

            <div style={DIVIDER_STYLE} />

            <div style={SECTION_HEADER_STYLE}>
              {c4View.levelInfo.title}
            </div>

            <div style={C4_STEPPER_STYLE}>
              {C4_LEVELS.map((level) => {
                const isCurrent = level.level === c4View.level;
                const isVisited = level.level <= c4View.level;
                return (
                  <button
                    key={level.level}
                    type="button"
                    disabled={!isVisited || isCurrent}
                    onClick={() => truncateC4Focus(level.level - 1)}
                    style={{
                      ...C4_STEP_STYLE,
                      ...(isCurrent ? C4_STEP_CURRENT_STYLE : null),
                      ...(!isVisited ? C4_STEP_DISABLED_STYLE : null),
                    }}
                    title={level.description}
                  >
                    {level.short}
                  </button>
                );
              })}
            </div>

            {c4View.focusLabels.length > 0 && (
              <div style={C4_FOCUS_STYLE}>
                {c4View.focusLabels.join(' › ')}
              </div>
            )}

            {c4View.emptyMessage && (
              <div style={C4_EMPTY_STYLE}>
                {c4View.emptyMessage}
              </div>
            )}

            {selectedNodeId && (
              <div style={SELECTED_NODE_STYLE}>
                Selected: {selectedNodeId}
              </div>
            )}

            <div style={DIVIDER_STYLE} />

            <div style={SECTION_HEADER_STYLE}>
              Connection Layers
            </div>

            {LAYER_DEFS.map(({ key, label }) => (
              <label key={key} style={filterLabelStyle}>
                <input
                  type="checkbox"
                  checked={!!layers[key]}
                  onChange={toggleLayerHandlers[key]}
                  style={CHECKBOX_STYLE}
                />
                {label}
              </label>
            ))}

            {/* Flow path dropdown */}
            {flowPathNames.length > 0 && (
              <>
                <div style={DIVIDER_STYLE} />
                <div style={SECTION_HEADER_STYLE}>
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
          <div style={{ ...panelStyle, ...LEGEND_PANEL_STYLE }}>
            {MINIMAP_COLOR_ENTRIES.map(([type]) => (
              <div key={type} style={LEGEND_ITEM_STYLE}>
                <div style={LEGEND_SWATCH_STYLES[type]} />
                <span style={LEGEND_TEXT_STYLE}>{type}</span>
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
  background: 'var(--panel-bg)',
  color: 'var(--panel-text)',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 12px var(--panel-shadow)',
  fontSize: '13px',
};

const backButtonStyle = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid var(--panel-border)',
  background: 'var(--panel-bg)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--panel-text)',
  transition: 'background 0.15s ease',
};

const filterLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 0',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'var(--panel-text-muted)',
};

const selectStyle = {
  width: '100%',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid var(--panel-border)',
  fontSize: '12px',
  color: 'var(--panel-text)',
  background: 'var(--panel-bg)',
  cursor: 'pointer',
};

export default memo(DiagramOverlay2D);
