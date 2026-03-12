import { memo, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
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

// Static label style — only `transform` is dynamic
const LABEL_BASE_STYLE = {
  position: 'absolute',
  pointerEvents: 'all',
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '3px',
  padding: '2px 6px',
  fontSize: '10px',
  color: '#333',
  whiteSpace: 'nowrap',
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

// ---------------------------------------------------------------------------
// Custom edge component
// ---------------------------------------------------------------------------

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
  style: propStyle,
}) {
  const connectionType = data?.connectionType || 'dataflow';
  const flowPaths = data?.flowPaths;
  const edgeStyle = getEdgeStyle(connectionType, flowPaths);
  const label = data?.label || '';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  // Merge pre-computed edge style with dynamic opacity; only spread propStyle
  // when it's actually provided (rare) to keep the common path allocation-free.
  const mergedStyle = useMemo(() => {
    const base = {
      ...edgeStyle,
      opacity: selected ? 1 : 0.7,
    };
    return propStyle ? { ...base, ...propStyle } : base;
  }, [edgeStyle, selected, propStyle]);

  const labelStyle = label
    ? { ...LABEL_BASE_STYLE, transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }
    : null;

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
          <div style={labelStyle}>
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
