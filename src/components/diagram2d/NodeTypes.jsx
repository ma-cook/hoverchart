import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Color / shape config per Merfolk node type
// ---------------------------------------------------------------------------

const TYPE_STYLES = {
  component: {
    background: '#e3f2fd',
    border: '2px solid #1976d2',
    color: '#0d47a1',
    badgeColor: '#1976d2',
    borderRadius: '8px',
    label: 'Component',
  },
  function: {
    background: '#e8f5e9',
    border: '2px solid #388e3c',
    color: '#1b5e20',
    badgeColor: '#388e3c',
    borderRadius: '3px',
    label: 'Function',
  },
  store: {
    background: '#f3e5f5',
    border: '3px double #7b1fa2',
    color: '#4a148c',
    badgeColor: '#7b1fa2',
    borderRadius: '3px',
    label: 'Store',
  },
  service: {
    background: '#fff3e0',
    border: '2px solid #e65100',
    color: '#bf360c',
    badgeColor: '#e65100',
    borderRadius: '3px',
    label: 'Service',
  },
  hook: {
    background: '#e0f2f1',
    border: '2px solid #00796b',
    color: '#004d40',
    badgeColor: '#00796b',
    borderRadius: '3px',
    label: 'Hook',
  },
  library: {
    background: '#fafafa',
    border: '2px dashed #757575',
    color: '#424242',
    badgeColor: '#757575',
    borderRadius: '3px',
    label: 'Library',
  },
  datapath: {
    background: '#fff8e1',
    border: '2px solid #ff8f00',
    color: '#e65100',
    badgeColor: '#ff8f00',
    borderRadius: '20px',
    label: 'Datapath',
  },
};

const DEFAULT_STYLE = {
  background: '#f5f5f5',
  border: '2px solid #9e9e9e',
  color: '#424242',
  badgeColor: '#9e9e9e',
  borderRadius: '3px',
  label: 'Node',
};

// ---------------------------------------------------------------------------
// PERF: Pre-computed style objects per node type — avoids creating new objects
// on every render.  With hundreds of nodes this eliminates thousands of
// short-lived allocations per frame.
// ---------------------------------------------------------------------------

const HIDDEN_HANDLE_STYLE = { opacity: 0 };

const BOX_SHADOW_SELECTED = '0 0 0 2px #1976d2, 0 2px 8px rgba(0,0,0,0.15)';
const BOX_SHADOW_DEFAULT = '0 1px 3px rgba(0,0,0,0.08)';

/** Build the three static style objects for a given type config */
function buildNodeStyles(cfg) {
  return {
    wrapper: {
      background: cfg.background,
      border: cfg.border,
      borderRadius: cfg.borderRadius,
      padding: '6px 14px',
      minWidth: '100px',
      textAlign: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: '11px',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s ease',
    },
    badge: {
      position: 'absolute',
      top: '-8px',
      left: '8px',
      background: cfg.badgeColor,
      color: '#fff',
      fontSize: '8px',
      fontWeight: 600,
      padding: '1px 5px',
      borderRadius: '3px',
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
      lineHeight: '14px',
    },
    name: {
      color: cfg.color,
      fontWeight: 600,
      fontSize: '12px',
      marginTop: '2px',
      wordBreak: 'break-word',
      lineHeight: '1.25',
    },
  };
}

function buildContainerStyles(cfg) {
  return {
    outer: {
      width: '100%',
      height: '100%',
      background: `${cfg.background}44`,
      border: `1px solid ${cfg.badgeColor}66`,
      borderRadius: cfg.borderRadius,
      position: 'relative',
    },
    header: {
      position: 'absolute',
      top: '3px',
      left: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    badge: {
      background: cfg.badgeColor,
      color: '#fff',
      fontSize: '8px',
      fontWeight: 600,
      padding: '1px 5px',
      borderRadius: '3px',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      lineHeight: '14px',
    },
    label: {
      color: cfg.color,
      fontWeight: 600,
      fontSize: '11px',
    },
  };
}

// Pre-compute for every known type + the default.
// PERF: Both selected and unselected wrapper variants are frozen at module load
// so the render path is zero-allocation.
const PRECOMPUTED_NODE = {};
const PRECOMPUTED_CONTAINER = {};

function buildPrecomputedNode(cfg) {
  const styles = buildNodeStyles(cfg);
  return {
    ...styles,
    wrapperSelected: { ...styles.wrapper, boxShadow: BOX_SHADOW_SELECTED },
    wrapperDefault: { ...styles.wrapper, boxShadow: BOX_SHADOW_DEFAULT },
  };
}

for (const [type, cfg] of Object.entries(TYPE_STYLES)) {
  PRECOMPUTED_NODE[type] = buildPrecomputedNode(cfg);
  PRECOMPUTED_CONTAINER[type] = buildContainerStyles(cfg);
}
const DEFAULT_NODE_STYLES = buildPrecomputedNode(DEFAULT_STYLE);
const DEFAULT_CONTAINER_STYLES = buildContainerStyles(DEFAULT_STYLE);

// ---------------------------------------------------------------------------
// Shared node renderer
// ---------------------------------------------------------------------------

function MerfolkNode({ data, selected }) {
  const merfolkType = data.merfolkType || 'function';
  const cfg = TYPE_STYLES[merfolkType] || DEFAULT_STYLE;
  const styles = PRECOMPUTED_NODE[merfolkType] || DEFAULT_NODE_STYLES;

  return (
    <>
      <Handle type="target" position={Position.Top} style={HIDDEN_HANDLE_STYLE} />
      <div style={selected ? styles.wrapperSelected : styles.wrapperDefault}>
        <div style={styles.badge}>{cfg.label}</div>
        <div style={styles.name}>{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} style={HIDDEN_HANDLE_STYLE} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Container (compound / group) node
// ---------------------------------------------------------------------------

function ContainerNode({ data }) {
  const merfolkType = data.merfolkType || 'component';
  const cfg = TYPE_STYLES[merfolkType] || DEFAULT_STYLE;
  const styles = PRECOMPUTED_CONTAINER[merfolkType] || DEFAULT_CONTAINER_STYLES;

  return (
    <div style={styles.outer}>
      <Handle type="target" position={Position.Top} style={HIDDEN_HANDLE_STYLE} />
      <div style={styles.header}>
        <span style={styles.badge}>{cfg.label}</span>
        <span style={styles.label}>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={HIDDEN_HANDLE_STYLE} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exports — keyed by React Flow node `type` string
// ---------------------------------------------------------------------------

export const MerfolkNodeMemo = memo(MerfolkNode);
export const ContainerNodeMemo = memo(ContainerNode);

export const customNodeTypes = {
  merfolk: MerfolkNodeMemo,
  merfolkContainer: ContainerNodeMemo,
};

export { TYPE_STYLES, DEFAULT_STYLE };
