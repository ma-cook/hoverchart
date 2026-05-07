import { useMemo, useState, useCallback } from 'react';
import { useDiagramStore } from '../stores';
import useObjectsStore from '../stores/objectsStore';
import './RepoAnalysisOverlay.css';

// Friendly labels and ordering for node types
const TYPE_LABELS = {
  component: 'Components',
  function: 'Functions',
  hook: 'Hooks',
  store: 'Stores',
  service: 'Services',
  library: 'Libraries',
  utility: 'Utilities',
  module: 'Modules',
  class: 'Classes',
  interface: 'Interfaces',
  variable: 'Variables',
  constant: 'Constants',
  datapath: 'Data Paths',
  handler: 'Handlers',
  control: 'Controls',
  state: 'State',
  data: 'Data',
};

const TYPE_ORDER = [
  'component', 'function', 'hook', 'store', 'service',
  'library', 'utility', 'module', 'class', 'interface',
  'variable', 'constant', 'datapath', 'handler', 'control', 'state', 'data',
];

const TYPE_ICON = {
  component: '◆',
  function: '▣',
  hook: '◉',
  store: '▤',
  service: '▲',
  library: '▢',
  utility: '▢',
  module: '▣',
  class: '◆',
  interface: '◇',
  variable: '·',
  constant: '·',
  datapath: '→',
  handler: '▣',
  control: '▣',
  state: '·',
  data: '·',
};

// ── Grouped-view constants ──────────────────────────────────────────────────
const GROUP_DISPLAY_NAMES = {
  component: 'Component Hierarchy',
  ungrouped: 'Unused Components',
  function: 'Functions',
  hook: 'Hooks',
  store: 'Stores',
  service: 'Services',
  backend: 'Backend Services',
  library: 'Libraries',
  utility: 'Utilities',
  module: 'Modules',
  class: 'Classes',
  interface: 'Interfaces',
  variable: 'Variables',
  constant: 'Constants',
  worker: 'Workers',
  shader: 'Shaders',
};

const GROUP_ORDER = [
  'component', 'hook', 'store', 'service', 'backend',
  'function', 'worker', 'shader', 'library', 'utility',
  'module', 'class', 'interface', 'variable', 'constant', 'ungrouped',
];

const ROOT_ENTRY_NAMES = ['main', 'index', 'firebase', 'App'];

/**
 * Recursive tree row.  Renders one node and its children (if expanded).
 */
const TreeRow = ({ nodeId, nodes, parentChildMap, depth, expanded, toggle }) => {
  const node = nodes.get(nodeId);
  if (!node) return null;
  const children = parentChildMap.get(nodeId);
  const hasChildren = children && children.size > 0;
  const isOpen = expanded.has(nodeId);
  const type = (node.type || 'unknown').toLowerCase();
  const label = node.name || nodeId;

  return (
    <>
      <div
        className={`repo-analysis-row ${hasChildren ? 'has-children' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={hasChildren ? () => toggle(nodeId) : undefined}
      >
        <span className="repo-analysis-caret">
          {hasChildren ? (isOpen ? '▾' : '▸') : ''}
        </span>
        <span className={`repo-analysis-icon type-${type}`}>
          {TYPE_ICON[type] || '·'}
        </span>
        <span className="repo-analysis-label">{label}</span>
        <span className="repo-analysis-type-tag">{type}</span>
        {hasChildren && (
          <span className="repo-analysis-count">{children.size}</span>
        )}
      </div>
      {isOpen && hasChildren && (
        <>
          {Array.from(children).map((childId) => (
            <TreeRow
              key={childId}
              nodeId={childId}
              nodes={nodes}
              parentChildMap={parentChildMap}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </>
      )}
    </>
  );
};

/**
 * Grouped view — organises root-level nodes into type-based collapsible sections.
 */
const GroupedView = ({ allNodes, hierarchy, filter, expanded, toggle }) => {
  const [groupExpanded, setGroupExpanded] = useState(() => new Set(['component']));

  const toggleGroup = useCallback((key) => {
    setGroupExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const { groups, groupedParentChildMap } = useMemo(() => {
    const pcm = hierarchy?.parentChildMap || new Map();
    const cpm = hierarchy?.childParentMap || new Map();
    const rootNodes = hierarchy?.rootNodes || new Set();

    // Determine which components are reachable from known entry-point roots
    const hierarchyComponents = new Set();
    const actualRoots = Array.from(rootNodes).filter(
      (id) => ROOT_ENTRY_NAMES.includes(id) || id.endsWith('_root')
    );
    const markReachable = (id) => {
      if (hierarchyComponents.has(id)) return;
      const n = allNodes.get(id);
      if (!n) return;
      if ((n.type || '').toLowerCase() === 'component') hierarchyComponents.add(id);
      (pcm.get(id) || new Set()).forEach(markReachable);
    };
    actualRoots.forEach(markReachable);

    // Group only root-level nodes (no parent)
    const groupMap = new Map();
    for (const [nodeId, node] of allNodes) {
      if (cpm.has(nodeId)) continue;
      const type = (node.type || '').toLowerCase();
      let groupKey;
      if (type === 'component') {
        // A component is "in hierarchy" if it's reachable from an entry-point
        // root OR if it has children of its own (it parents other components,
        // so it's clearly part of the active component tree even if the scanner
        // didn't emit an explicit root connection for it).
        const hasChildren = (pcm.get(nodeId)?.size ?? 0) > 0;
        groupKey = (hierarchyComponents.has(nodeId) || hasChildren) ? 'component' : 'ungrouped';
      } else if (type === 'function') {
        if (nodeId.startsWith('worker_')) groupKey = 'worker';
        else if (nodeId.startsWith('shader_')) groupKey = 'shader';
        else groupKey = 'function';
      } else if (type === 'service') {
        groupKey = nodeId.startsWith('backend_') ? 'backend' : 'service';
      } else {
        groupKey = type || 'unknown';
      }
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey).push(nodeId);
    }

    // Sort nodes within each group by display name
    for (const nodes of groupMap.values()) {
      nodes.sort((a, b) => {
        const na = allNodes.get(a)?.name || a;
        const nb = allNodes.get(b)?.name || b;
        return na.localeCompare(nb);
      });
    }

    return { groups: groupMap, groupedParentChildMap: pcm };
  }, [allNodes, hierarchy]);

  const q = filter.trim().toLowerCase();

  const orderedGroupKeys = [
    ...GROUP_ORDER.filter((k) => groups.has(k)),
    ...Array.from(groups.keys()).filter((k) => !GROUP_ORDER.includes(k)).sort(),
  ];

  if (allNodes.size === 0) {
    return (
      <div className="repo-analysis-empty">
        No diagram data available. Scan a repository first.
      </div>
    );
  }

  return (
    <>
      {orderedGroupKeys.map((groupKey) => {
        const nodes = groups.get(groupKey) || [];
        const filtered = q
          ? nodes.filter((id) => {
              const n = allNodes.get(id);
              return (n?.name || id).toLowerCase().includes(q);
            })
          : nodes;
        if (filtered.length === 0) return null;

        const isOpen = groupExpanded.has(groupKey);
        const displayName = GROUP_DISPLAY_NAMES[groupKey] || groupKey;

        return (
          <div key={groupKey} className="repo-analysis-group">
            <div
              className="repo-analysis-group-header"
              onClick={() => toggleGroup(groupKey)}
            >
              <span className="repo-analysis-caret">{isOpen ? '▾' : '▸'}</span>
              <span className="repo-analysis-group-name">{displayName}</span>
              <span className="repo-analysis-count">{filtered.length}</span>
            </div>
            {isOpen && (
              <div className="repo-analysis-group-body">
                {filtered.map((id) => (
                  <TreeRow
                    key={id}
                    nodeId={id}
                    nodes={allNodes}
                    parentChildMap={groupedParentChildMap}
                    depth={0}
                    expanded={expanded}
                    toggle={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const RepoAnalysisOverlay = ({ open, onClose, repoName }) => {
  const graphs = useDiagramStore((s) => s.graphs);
  const hierarchy = useDiagramStore((s) => s.hierarchy);
  const totalObjects = useObjectsStore((s) => s.objects.length);

  const [expanded, setExpanded] = useState(() => new Set());
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'grouped'

  const toggle = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Build a single combined nodes map from all graphs
  const { allNodes, typeCounts, totalConnections } = useMemo(() => {
    const all = new Map();
    const counts = {};
    let conns = 0;
    if (Array.isArray(graphs)) {
      for (const g of graphs) {
        if (g?.nodes) {
          for (const [id, data] of g.nodes) {
            if (!all.has(id)) all.set(id, data);
          }
        }
        if (g?.connections) conns += g.connections.size;
      }
    }
    for (const node of all.values()) {
      const t = (node.type || 'unknown').toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    }
    return { allNodes: all, typeCounts: counts, totalConnections: conns };
  }, [graphs]);

  // Determine roots / parentChildMap to render the tree
  const { rootIds, parentChildMap } = useMemo(() => {
    const pcm = hierarchy?.parentChildMap || new Map();
    const cpm = hierarchy?.childParentMap || new Map();
    const roots = [];
    for (const id of allNodes.keys()) {
      if (!cpm.has(id)) roots.push(id);
    }
    // Sort roots: components first, then by name
    roots.sort((a, b) => {
      const na = allNodes.get(a);
      const nb = allNodes.get(b);
      const ta = (na?.type || '').toLowerCase();
      const tb = (nb?.type || '').toLowerCase();
      const aHasKids = pcm.get(a)?.size > 0 ? 0 : 1;
      const bHasKids = pcm.get(b)?.size > 0 ? 0 : 1;
      if (aHasKids !== bHasKids) return aHasKids - bHasKids;
      if (ta !== tb) return ta.localeCompare(tb);
      return (na?.name || a).localeCompare(nb?.name || b);
    });
    return { rootIds: roots, parentChildMap: pcm };
  }, [allNodes, hierarchy]);

  // Apply name filter — keep ancestors of matched nodes
  const visibleRoots = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rootIds;
    const matchedAncestors = new Set();
    const ancestorOf = (id) => {
      let cur = id;
      while (cur) {
        matchedAncestors.add(cur);
        cur = hierarchy?.childParentMap?.get(cur);
      }
    };
    for (const [id, node] of allNodes) {
      if ((node.name || id).toLowerCase().includes(q)) ancestorOf(id);
    }
    return rootIds.filter((id) => matchedAncestors.has(id));
  }, [filter, rootIds, allNodes, hierarchy]);

  const expandAll = useCallback(() => {
    const ids = new Set();
    for (const [pid, kids] of parentChildMap) {
      if (kids && kids.size > 0) ids.add(pid);
    }
    setExpanded(ids);
  }, [parentChildMap]);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  if (!open) return null;

  const orderedTypes = TYPE_ORDER.filter((t) => typeCounts[t]);
  const otherTypes = Object.keys(typeCounts).filter((t) => !TYPE_ORDER.includes(t));

  return (
    <div className="repo-analysis-backdrop" onClick={onClose}>
      <div
        className="repo-analysis-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Repository analysis"
      >
        <div className="repo-analysis-header">
          <div>
            <div className="repo-analysis-title">Repository Analysis</div>
            {repoName && <div className="repo-analysis-subtitle">{repoName}</div>}
          </div>
          <button
            className="repo-analysis-close"
            onClick={onClose}
            aria-label="Close analysis"
          >
            ✕
          </button>
        </div>

        <div className="repo-analysis-stats">
          <div className="repo-analysis-stat">
            <div className="repo-analysis-stat-value">{totalObjects}</div>
            <div className="repo-analysis-stat-label">3D Objects</div>
          </div>
          <div className="repo-analysis-stat">
            <div className="repo-analysis-stat-value">{allNodes.size}</div>
            <div className="repo-analysis-stat-label">Diagram Nodes</div>
          </div>
          <div className="repo-analysis-stat">
            <div className="repo-analysis-stat-value">{totalConnections}</div>
            <div className="repo-analysis-stat-label">Connections</div>
          </div>
          {[...orderedTypes, ...otherTypes].map((t) => (
            <div className="repo-analysis-stat" key={t}>
              <div className="repo-analysis-stat-value">{typeCounts[t]}</div>
              <div className="repo-analysis-stat-label">
                {TYPE_LABELS[t] || t}
              </div>
            </div>
          ))}
        </div>

        <div className="repo-analysis-toolbar">
          <input
            type="text"
            className="repo-analysis-search"
            placeholder="Filter by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            className={`repo-analysis-toolbtn${viewMode === 'grouped' ? ' active' : ''}`}
            onClick={() => setViewMode((v) => (v === 'tree' ? 'grouped' : 'tree'))}
            title="Switch between tree view and grouped view"
          >
            {viewMode === 'tree' ? 'Group view' : 'Tree view'}
          </button>
          <button className="repo-analysis-toolbtn" onClick={expandAll}>
            Expand all
          </button>
          <button className="repo-analysis-toolbtn" onClick={collapseAll}>
            Collapse all
          </button>
        </div>

        <div className="repo-analysis-tree">
          {viewMode === 'grouped' ? (
            <GroupedView
              allNodes={allNodes}
              hierarchy={hierarchy}
              filter={filter}
              expanded={expanded}
              toggle={toggle}
            />
          ) : visibleRoots.length === 0 ? (
            <div className="repo-analysis-empty">
              {allNodes.size === 0
                ? 'No diagram data available. Scan a repository first.'
                : 'No nodes match the filter.'}
            </div>
          ) : (
            visibleRoots.map((id) => (
              <TreeRow
                key={id}
                nodeId={id}
                nodes={allNodes}
                parentChildMap={parentChildMap}
                depth={0}
                expanded={expanded}
                toggle={toggle}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoAnalysisOverlay;
