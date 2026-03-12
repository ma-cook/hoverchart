import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
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
// Style config per connection type
// ---------------------------------------------------------------------------

function getEdgeStyle(connectionType, flowPaths) {
  // If the edge belongs to a flow path, colour by the first flow path name
  if (flowPaths && flowPaths.length > 0) {
    return {
      stroke: flowPathColor(flowPaths[0]),
      strokeWidth: 2,
      strokeDasharray: undefined,
    };
  }

  switch (connectionType) {
    case 'controlflow':
    case 'dotted':
      return { stroke: '#7b1fa2', strokeWidth: 1.5, strokeDasharray: '6 3' };
    case 'association':
      return { stroke: '#9e9e9e', strokeWidth: 1.5, strokeDasharray: undefined };
    case 'inheritance':
      return { stroke: '#424242', strokeWidth: 3, strokeDasharray: undefined };
    case 'dataflow':
    default:
      return { stroke: '#546e7a', strokeWidth: 1.5, strokeDasharray: undefined };
  }
}

function getMarkerEnd(connectionType) {
  switch (connectionType) {
    case 'association':
      return undefined; // no arrow
    case 'inheritance':
      return 'url(#inheritance-marker)';
    default:
      return 'url(#arrow-marker)';
  }
}

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
  const flowPaths = data?.flowPaths || [];
  const edgeStyle = getEdgeStyle(connectionType, flowPaths);
  const label = data?.label || '';

  // Use smooth step (orthogonal-ish) path for consistency with ELK orthogonal routing
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...edgeStyle,
          opacity: selected ? 1 : 0.7,
          transition: 'opacity 0.15s ease',
          ...propStyle,
        }}
        markerEnd={getMarkerEnd(connectionType)}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
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
            }}
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
