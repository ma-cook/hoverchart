import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react';

// ---------------------------------------------------------------------------
// Flow-path colour palette (deterministic per flow-path name)
// ---------------------------------------------------------------------------

const FLOW_PATH_COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800',
  '#ff5722', '#795548',
];

function flowPathColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return FLOW_PATH_COLORS[Math.abs(hash) % FLOW_PATH_COLORS.length];
}

// ---------------------------------------------------------------------------
// PERF: Pre-computed style objects — avoids allocations on every edge render
// ---------------------------------------------------------------------------

const EDGE_STYLES = {
  controlflow: { stroke: '#7b1fa2', strokeWidth: 1.5, strokeDasharray: '6 3' },
  dotted:      { stroke: '#7b1fa2', strokeWidth: 1.5, strokeDasharray: '6 3' },
  association:  { stroke: '#9e9e9e', strokeWidth: 1.5, strokeDasharray: undefined },
  inheritance:  { stroke: '#424242', strokeWidth: 3, strokeDasharray: undefined },
  dataflow:     { stroke: '#546e7a', strokeWidth: 1.5, strokeDasharray: undefined },
};
const DEFAULT_EDGE_STYLE = EDGE_STYLES.dataflow;

// Cache flow-path edge styles by color to avoid re-creating per render
const flowPathStyleCache = new Map();

function getEdgeStyle(connectionType, flowPaths) {
  if (flowPaths && flowPaths.length > 0) {
    const color = flowPathColor(flowPaths[0]);
    let cached = flowPathStyleCache.get(color);
    if (!cached) {
      cached = { stroke: color, strokeWidth: 2, strokeDasharray: undefined };
      flowPathStyleCache.set(color, cached);
    }
    return cached;
  }
  return EDGE_STYLES[connectionType] || DEFAULT_EDGE_STYLE;
}

const MARKER_ARROW = 'url(#arrow-marker)';
const MARKER_INHERIT = 'url(#inheritance-marker)';

function getMarkerEnd(connectionType) {
  switch (connectionType) {
    case 'association':
      return undefined;
    case 'inheritance':
      return MARKER_INHERIT;
    default:
      return MARKER_ARROW;
  }
}

// PERF: Label base styles are injected as a CSS rule so each edge label only
// needs a tiny inline `transform` — no object spread per render.
const LABEL_CSS_CLASS = 'merfolk-edge-label';
if (typeof document !== 'undefined') {
  const tag = document.createElement('style');
  tag.textContent = `.${LABEL_CSS_CLASS}{position:absolute;pointer-events:all;background:#fff;border:1px solid #ccc;border-radius:3px;padding:2px 6px;font-size:10px;color:#333;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}`;
  document.head.appendChild(tag);
}

// ---------------------------------------------------------------------------
// Custom edge component
// ---------------------------------------------------------------------------

// PERF: Pre-build selected/unselected variants for each edge style to avoid
// allocations in the render path.  The cache key is the style object reference
// (stable from getEdgeStyle) so this is bounded by the number of unique styles.
const selectedStyleCache = new WeakMap();
const unselectedStyleCache = new WeakMap();

function getSelectedStyle(base) {
  let s = selectedStyleCache.get(base);
  if (!s) { s = { ...base, opacity: 1 }; selectedStyleCache.set(base, s); }
  return s;
}
function getUnselectedStyle(base) {
  let s = unselectedStyleCache.get(base);
  if (!s) { s = { ...base, opacity: 0.7 }; unselectedStyleCache.set(base, s); }
  return s;
}

function MerfolkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const connectionType = data?.connectionType || 'dataflow';
  const flowPaths = data?.flowPaths;
  const edgeStyle = getEdgeStyle(connectionType, flowPaths);
  const label = data?.label || '';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Zero-allocation style lookup — returns a cached frozen object
  const mergedStyle = selected ? getSelectedStyle(edgeStyle) : getUnselectedStyle(edgeStyle);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={mergedStyle}
        markerEnd={getMarkerEnd(connectionType)}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`react-flow__edge-label ${LABEL_CSS_CLASS}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// SVG marker definitions — rendered once inside the ReactFlow SVG
// ---------------------------------------------------------------------------

export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="arrow-marker"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#546e7a" />
        </marker>
        <marker
          id="inheritance-marker"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#424242" />
        </marker>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const MerfolkEdgeMemo = memo(MerfolkEdge);

export const customEdgeTypes = {
  merfolk: MerfolkEdgeMemo,
};

export { FLOW_PATH_COLORS, flowPathColor };
