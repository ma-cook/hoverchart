export const C4_LEVELS = [
  { level: 1, key: 'context', title: 'Context', short: 'C1', description: 'System context' },
  { level: 2, key: 'container', title: 'Containers', short: 'C2', description: 'Containers' },
  { level: 3, key: 'component', title: 'Components', short: 'C3', description: 'Components' },
  { level: 4, key: 'code', title: 'Code', short: 'C4', description: 'Code' },
];

const C1_ONLY_TYPES = new Set(['person', 'system', 'external', 'boundary']);
const CODE_TYPES = new Set([
  'function',
  'class',
  'interface',
  'variable',
  'constant',
  'handler',
  'control',
  'state',
  'data',
]);
const HELPER_LABELS = new Set([
  'internal function',
  'event handler',
  'render helper',
  'update helper',
  'getter function',
  'setter function',
  'calculation helper',
  'boolean check',
  'debounced helper',
]);
const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'net',
  'os',
  'path',
  'process',
  'querystring',
  'readline',
  'stream',
  'tls',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]);
const SHARED_DIRS = new Set([
  '__tests__',
  'assets',
  'common',
  'build',
  'config',
  'coverage',
  'dist',
  'docs',
  'helpers',
  'lib',
  'libs',
  'public',
  'scripts',
  'shared',
  'test',
  'tests',
  'types',
  'utils',
  'util',
]);

function normalizeType(value) {
  return String(value || '')
    .toLowerCase()
    .trim();
}

function nodePath(node) {
  const raw =
    node?.metadata?.codeFilePath ||
    node?.metadata?.filePath ||
    node?.codeFilePath ||
    '';
  return typeof raw === 'string'
    ? raw.replace(/\\/g, '/').replace(/^\.?\//, '')
    : '';
}

function nodeLabel(node, id) {
  return node?.name || node?.metadata?.label || id;
}

function slugify(value) {
  return (
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

function packageRoot(name) {
  const clean = String(name || '')
    .replace(/\\/g, '/')
    .replace(/^node:/, '')
    .trim();
  if (!clean || clean.startsWith('.') || clean.startsWith('/')) return '';
  if (clean.startsWith('@')) {
    const [scope, pkg] = clean.split('/');
    return pkg ? `${scope}/${pkg}` : clean;
  }
  return clean.split('/')[0];
}

function looksLikePackage(name) {
  if (!name) return false;
  if (NODE_BUILTINS.has(name)) return false;
  if (name.startsWith('@')) return /^@[a-z0-9._-]+\/[a-z0-9._-]+$/.test(name);
  if (/\.(js|jsx|ts|tsx|vue|py|go|rs|java|rb|php|css|scss)$/i.test(name)) return false;
  return /^[a-z0-9][a-z0-9._-]*$/.test(name);
}

function prettifyContainerLabel(raw) {
  const value = String(raw || '').trim();
  if (!value) return 'Application';
  if (
    value === 'Web Application' ||
    value === 'Backend API' ||
    value === 'Background Workers' ||
    value === 'Data Store' ||
    value === 'Shared' ||
    value === 'Application'
  ) {
    return value;
  }
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function containerForPath(path, node) {
  const explicit = node?.metadata?.c4Container;
  if (typeof explicit === 'string' && explicit.trim()) {
    return prettifyContainerLabel(explicit);
  }

  if (!path) {
    const type = normalizeType(node?.type);
    if (type === 'component' || type === 'hook' || type === 'store') {
      return 'Web Application';
    }
    if (type === 'service') return 'Backend API';
    return 'Shared';
  }

  const parts = path.split('/').filter(Boolean);
  const first = (parts[0] || '').toLowerCase();
  if (first.startsWith('.')) return 'Shared';
  if (parts.length <= 1) {
    const type = normalizeType(node?.type);
    if (type === 'service') return 'Backend API';
    if (type === 'component' || type === 'hook' || type === 'store') {
      return 'Web Application';
    }
    return 'Shared';
  }
  if (/^(?:src\/)?(?:pages|app)\/api\//.test(path)) return 'Backend API';

  if (
    (first === 'apps' ||
      first === 'packages' ||
      first === 'libs' ||
      first === 'tools') &&
    parts[1]
  ) {
    return prettifyContainerLabel(parts[1]);
  }
  if (first === 'backend' || first === 'server') return 'Backend API';
  if (first === 'api' || first === 'endpoints') return 'Backend API';
  if (
    first === 'controllers' ||
    first === 'handlers' ||
    first === 'middleware' ||
    first === 'serializers' ||
    first === 'schemas'
  ) {
    return 'Backend API';
  }
  if (first === 'views' || first === 'templates') return 'Web Application';
  if (
    first === 'worker' ||
    first === 'workers' ||
    first === 'functions' ||
    first === 'jobs' ||
    first === 'queues' ||
    first === 'tasks' ||
    first === 'celery'
  ) {
    return 'Background Workers';
  }
  if (
    first === 'prisma' ||
    first === 'migrations' ||
    first === 'db' ||
    first === 'database' ||
    first === 'schema' ||
    first === 'models'
  ) {
    return 'Data Store';
  }
  if (
    first === 'src' ||
    first === 'frontend' ||
    first === 'client' ||
    first === 'web' ||
    first === 'app' ||
    first === 'pages' ||
    first === 'components'
  ) {
    return 'Web Application';
  }
  if (SHARED_DIRS.has(first)) return 'Shared';
  return prettifyContainerLabel(first);
}

function hasHierarchyChildren(id, parentChildMap, node) {
  if (parentChildMap instanceof Map) {
    const children = parentChildMap.get(id);
    if (children && children.size > 0) return true;
    return false;
  }
  return Array.isArray(node?.children) && node.children.length > 0;
}

function nearestCandidateAncestor(id, candidates, childParentMap, containerId, nodeContainer) {
  let current = childParentMap instanceof Map ? childParentMap.get(id) : null;
  const seen = new Set();
  while (current && !seen.has(current)) {
    if (candidates.has(current) && nodeContainer.get(current) === containerId) {
      return current;
    }
    seen.add(current);
    current = childParentMap instanceof Map ? childParentMap.get(current) : null;
  }
  return null;
}

function collectCodeDescendants(
  rootId,
  parentChildMap,
  nodeMeta,
  candidateIds,
  seen
) {
  const result = [];
  const children =
    parentChildMap instanceof Map ? parentChildMap.get(rootId) : null;
  if (!(children instanceof Set)) return result;

  for (const childId of children) {
    if (seen.has(childId)) continue;
    seen.add(childId);

    const meta = nodeMeta.get(childId);
    if (!meta || meta.c1Only || candidateIds.has(childId)) continue;

    const isFileContainer =
      meta.hasChildren && (meta.type === 'function' || meta.type === 'module');
    if (CODE_TYPES.has(meta.type) && !isFileContainer) {
      result.push(childId);
    } else {
      result.push(
        ...collectCodeDescendants(
          childId,
          parentChildMap,
          nodeMeta,
          candidateIds,
          seen
        )
      );
    }
  }

  return result;
}

function flattenGraphs(graphs) {
  const nodes = new Map();
  const rawConnections = [];
  const usedConnectionIds = new Set();

  for (const graph of graphs || []) {
    if (graph?.nodes instanceof Map) {
      for (const [id, node] of graph.nodes) nodes.set(id, node);
    }

    const connections = graph?.connections;
    if (!(connections instanceof Map)) continue;

    for (const [mapKey, connection] of connections) {
      if (!connection) continue;
      const sourceId = connection.source?.nodeId || connection.source;
      const targetId = connection.target?.nodeId || connection.target;
      if (!sourceId || !targetId) continue;

      const baseId =
        connection.id ||
        (typeof mapKey === 'string' ? mapKey : '') ||
        `conn-${rawConnections.length}`;
      let id = baseId;
      if (usedConnectionIds.has(id)) {
        id = `${baseId}-${rawConnections.length}`;
      }
      usedConnectionIds.add(id);

      rawConnections.push({
        id,
        sourceId,
        targetId,
        type: normalizeType(connection.type) || 'dataflow',
        label:
          typeof connection.label === 'string' ? connection.label : '',
        flowPaths: Array.isArray(connection.flowPaths)
          ? [...connection.flowPaths]
          : [],
      });
    }
  }

  return { nodes, rawConnections };
}

function isContainmentConnection(connection, childParentMap) {
  const label = String(connection.label || '').toLowerCase().trim();
  if (
    label === 'contains' ||
    label.startsWith('contains ') ||
    label === 'internal' ||
    label.startsWith('internal ')
  ) {
    return true;
  }

  if (!(childParentMap instanceof Map)) return false;
  const sourceParent = childParentMap.get(connection.sourceId);
  const targetParent = childParentMap.get(connection.targetId);
  if (
    sourceParent === connection.targetId ||
    targetParent === connection.sourceId
  ) {
    return (
      connection.type === 'controlflow' ||
      connection.type === 'dotted' ||
      label.includes('contain') ||
      label.startsWith('internal')
    );
  }
  return false;
}

function collectInternalNames(nodes, fileIndexByPath) {
  const names = new Set();

  for (const [id, node] of nodes) {
    const type = normalizeType(node?.type);
    if (type !== 'library') {
      names.add(id);
      names.add(nodeLabel(node, id));
    }
  }

  const entries =
    fileIndexByPath instanceof Map
      ? fileIndexByPath.entries()
      : Object.entries(fileIndexByPath || {});

  for (const [path, info] of entries) {
    const filename = path.split('/').pop() || path;
    names.add(filename.replace(/\.[^.]+$/, ''));
    for (const key of ['exports', 'functions', 'htmlElements', 'cssClasses', 'jsxRefs']) {
      const value = info?.[key];
      if (value instanceof Set || Array.isArray(value)) {
        for (const item of value) names.add(item);
      }
    }
  }

  return names;
}

function getExternalPackages(nodes, internalNames) {
  const packages = new Map();
  const externalNodeIds = new Set();

  for (const [id, node] of nodes) {
    const type = normalizeType(node?.type);
    const path = nodePath(node);
    const metadata = node?.metadata || {};
    const explicit =
      metadata.c4External === true ||
      metadata.c4External === 'true' ||
      metadata.c4Kind === 'external';

    if (path) continue;
    if (type !== 'library' && type !== 'service' && !explicit) continue;
    if (type === 'library' && !explicit) {
      const label = nodeLabel(node, id);
      if (internalNames.has(label) || internalNames.has(id)) continue;
    }

    const label = nodeLabel(node, id);
    const root = packageRoot(label);
    if (!root) continue;
    if (!explicit && !looksLikePackage(root)) continue;

    externalNodeIds.add(id);
    if (!packages.has(root)) {
      packages.set(root, {
        id: `c4:external:${slugify(root)}`,
        label: root,
        type: 'external',
        synthetic: true,
      });
    }
  }

  return {
    packages: [...packages.values()].sort((a, b) => a.label.localeCompare(b.label)),
    nodeIds: externalNodeIds,
  };
}

export function buildC4Model({
  graphs,
  hierarchy,
  repoName,
  fileIndexByPath,
} = {}) {
  if (!graphs || graphs.length === 0) return null;

  const { nodes, rawConnections } = flattenGraphs(graphs);
  if (nodes.size === 0) return null;

  const parentChildMap =
    hierarchy?.parentChildMap instanceof Map
      ? hierarchy.parentChildMap
      : new Map();
  const childParentMap =
    hierarchy?.childParentMap instanceof Map
      ? hierarchy.childParentMap
      : new Map();

  const internalNames = collectInternalNames(nodes, fileIndexByPath);
  const externalInfo = getExternalPackages(nodes, internalNames);
  const externals = externalInfo.packages;
  const externalNodeIds = externalInfo.nodeIds;

  const nodeMeta = new Map();
  const nodeContainer = new Map();
  const containers = new Map();
  const nodesByPath = new Map();

  for (const [id, node] of nodes) {
    if (externalNodeIds.has(id)) continue;

    const type = normalizeType(node?.type);
    const path = nodePath(node);
    if (type === 'library' && !path) continue;

    const label = nodeLabel(node, id);
    const isC1Only = C1_ONLY_TYPES.has(type);

    if (isC1Only) {
      nodeMeta.set(id, {
        id,
        label,
        type,
        displayType: type,
        path,
        containerId: null,
        hasChildren: false,
        c1Only: true,
      });
      continue;
    }

    const containerLabel = containerForPath(path, node);
    const containerId = `c4:container:${slugify(containerLabel)}`;
    nodeContainer.set(id, containerId);

    if (!containers.has(containerId)) {
      containers.set(containerId, {
        id: containerId,
        label: containerLabel,
        nodeIds: new Set(),
        componentIds: new Set(),
      });
    }
    containers.get(containerId).nodeIds.add(id);

    if (path) {
      if (!nodesByPath.has(path)) nodesByPath.set(path, []);
      nodesByPath.get(path).push(id);
    }

    nodeMeta.set(id, {
      id,
      label,
      type,
      displayType: type,
      path,
      containerId,
      hasChildren: hasHierarchyChildren(id, parentChildMap, node),
      c1Only: false,
    });
  }

  const candidateIds = new Set();
  for (const [id, meta] of nodeMeta) {
    if (meta.c1Only) continue;
    const type = meta.type;
    if (CODE_TYPES.has(type)) {
      if ((type === 'function' || type === 'class') && meta.hasChildren) {
        candidateIds.add(id);
      }
      continue;
    }
    if (type === 'component' || type === 'module') {
      candidateIds.add(id);
      continue;
    }
    if (
      type === 'service' ||
      type === 'store' ||
      type === 'hook' ||
      type === 'library'
    ) {
      candidateIds.add(id);
    }
  }

  // A file-container function nested inside a component is an implementation
  // detail; let the component be the C3 drill target instead.
  const suppressedCandidates = new Set();
  for (const id of candidateIds) {
    const meta = nodeMeta.get(id);
    if (!meta || meta.type !== 'function' || !meta.hasChildren) continue;

    let parentId = childParentMap.get(id);
    while (parentId) {
      if (
        candidateIds.has(parentId) &&
        nodeMeta.get(parentId)?.type === 'component'
      ) {
        suppressedCandidates.add(id);
        break;
      }
      parentId = childParentMap.get(parentId);
    }
  }
  for (const id of suppressedCandidates) candidateIds.delete(id);

  const candidatesByPath = new Map();
  for (const id of candidateIds) {
    const meta = nodeMeta.get(id);
    if (!meta?.path) continue;
    const key = `${meta.containerId}|${meta.path}`;
    if (!candidatesByPath.has(key)) candidatesByPath.set(key, []);
    candidatesByPath.get(key).push(id);
  }

  const finalCandidates = new Set();

  for (const ids of candidatesByPath.values()) {
    const components = ids.filter(
      (id) => nodeMeta.get(id)?.type === 'component'
    );
    if (components.length > 0) {
      for (const id of components) finalCandidates.add(id);
      continue;
    }

    const sorted = [...ids].sort((a, b) => {
      const aMeta = nodeMeta.get(a);
      const bMeta = nodeMeta.get(b);
      return Number(bMeta?.hasChildren) - Number(aMeta?.hasChildren);
    });
    const seenLabels = new Set();
    for (const id of sorted) {
      const meta = nodeMeta.get(id);
      if (!meta) continue;
      if (seenLabels.has(meta.label) && !meta.hasChildren) continue;
      seenLabels.add(meta.label);
      finalCandidates.add(id);
    }
  }

  for (const id of candidateIds) {
    const meta = nodeMeta.get(id);
    if (!meta?.path) finalCandidates.add(id);
  }

  const finalCandidatesByPath = new Map();
  for (const id of finalCandidates) {
    const meta = nodeMeta.get(id);
    if (!meta) continue;
    if (meta.path) {
      const key = `${meta.containerId}|${meta.path}`;
      if (!finalCandidatesByPath.has(key)) finalCandidatesByPath.set(key, []);
      finalCandidatesByPath.get(key).push(id);
    }
    if (meta.type === 'function' && meta.hasChildren) {
      meta.displayType = 'module';
    }
    const container = containers.get(meta.containerId);
    if (container) container.componentIds.add(id);
  }

  const ownershipByContainer = new Map();
  for (const containerId of containers.keys()) {
    ownershipByContainer.set(containerId, new Map());
  }

  for (const id of finalCandidates) {
    const meta = nodeMeta.get(id);
    if (!meta) continue;
    const ownership = ownershipByContainer.get(meta.containerId);
    if (ownership) ownership.set(id, id);
  }

  for (const [id, meta] of nodeMeta) {
    if (meta.c1Only || finalCandidates.has(id)) continue;
    const ownership = ownershipByContainer.get(meta.containerId);
    if (!ownership) continue;

    const ancestor = nearestCandidateAncestor(
      id,
      finalCandidates,
      childParentMap,
      meta.containerId,
      nodeContainer
    );
    if (ancestor) {
      ownership.set(id, ancestor);
      continue;
    }

    if (meta.path) {
      const key = `${meta.containerId}|${meta.path}`;
      const pathCandidates = finalCandidatesByPath.get(key) || [];
      if (pathCandidates.length === 1) {
        ownership.set(id, pathCandidates[0]);
      }
    }
  }

  const connections = rawConnections.filter(
    (connection) => !isContainmentConnection(connection, childParentMap)
  );

  const helperTargets = new Map();
  for (const connection of connections) {
    const label = String(connection.label || '').toLowerCase().trim();
    if (!HELPER_LABELS.has(label) && !label.includes('helper') && !label.includes('handler')) {
      continue;
    }
    if (!helperTargets.has(connection.sourceId)) {
      helperTargets.set(connection.sourceId, new Set());
    }
    helperTargets.get(connection.sourceId).add(connection.targetId);
  }

  const codeChildren = new Map();
  for (const componentId of finalCandidates) {
    const meta = nodeMeta.get(componentId);
    if (!meta) continue;

    const children = new Set();
    const seenDescendants = new Set();
    const hierarchyChildren = parentChildMap.get(componentId);
    if (hierarchyChildren instanceof Set) {
      for (const childId of hierarchyChildren) {
        if (seenDescendants.has(childId)) continue;
        seenDescendants.add(childId);

        const childMeta = nodeMeta.get(childId);
        if (!childMeta || childMeta.c1Only || finalCandidates.has(childId)) {
          continue;
        }
        const childIsFileContainer =
          childMeta.hasChildren &&
          (childMeta.type === 'function' || childMeta.type === 'module');
        if (CODE_TYPES.has(childMeta.type) && !childIsFileContainer) {
          children.add(childId);
        } else {
          const descendants = collectCodeDescendants(
            childId,
            parentChildMap,
            nodeMeta,
            finalCandidates,
            seenDescendants
          );
          for (const descendantId of descendants) children.add(descendantId);
        }
      }
    }

    const helpers = helperTargets.get(componentId);
    if (helpers) for (const childId of helpers) children.add(childId);

    const pathCandidates = meta.path
      ? finalCandidatesByPath.get(`${meta.containerId}|${meta.path}`) || []
      : [];
    if (meta.path && pathCandidates.length === 1) {
      for (const siblingId of nodesByPath.get(meta.path) || []) {
        const siblingMeta = nodeMeta.get(siblingId);
        if (
          siblingMeta &&
          !finalCandidates.has(siblingId) &&
          CODE_TYPES.has(siblingMeta.type) &&
          !(
            siblingMeta.hasChildren &&
            (siblingMeta.type === 'function' || siblingMeta.type === 'module')
          )
        ) {
          children.add(siblingId);
        }
      }
    }

    const code = new Set();
    for (const childId of children) {
      const childMeta = nodeMeta.get(childId);
      if (!childMeta || childMeta.c1Only) continue;
      if (childId === componentId || finalCandidates.has(childId)) continue;
      if (!CODE_TYPES.has(childMeta.type)) continue;
      code.add(childId);
      const ownership = ownershipByContainer.get(meta.containerId);
      if (ownership) ownership.set(childId, componentId);
    }

    codeChildren.set(componentId, code);
  }

  const systemLabel = repoName || 'Application';
  const personNodes = [];
  const hasPersonNode = [...nodes.values()].some(
    (node) => normalizeType(node?.type) === 'person'
  );

  for (const [id, node] of nodes) {
    if (normalizeType(node?.type) !== 'person') continue;
    const meta = nodeMeta.get(id);
    personNodes.push({
      id,
      label: meta?.label || nodeLabel(node, id),
      type: 'person',
      synthetic: false,
    });
  }

  if (!hasPersonNode) {
    personNodes.push({
      id: 'c4:person:user',
      label: 'User',
      type: 'person',
      synthetic: true,
    });
  }

  const system = {
    id: 'c4:system',
    label: systemLabel,
    type: 'system',
    synthetic: true,
  };

  const c1Nodes = [...personNodes, system, ...externals];
  const c1Edges = [];
  for (const person of personNodes) {
    c1Edges.push({
      id: `c4e-c1-person-${person.id}`,
      sourceId: person.id,
      targetId: system.id,
      type: 'association',
      label: 'uses',
      flowPaths: [],
    });
  }
  for (const external of externals) {
    c1Edges.push({
      id: `c4e-c1-external-${external.id}`,
      sourceId: system.id,
      targetId: external.id,
      type: 'association',
      label: 'depends on',
      flowPaths: [],
    });
  }

  return {
    system,
    personNodes,
    externals,
    containers,
    nodeMeta,
    nodeContainer,
    codeChildren,
    ownershipByContainer,
    connections,
    c1Nodes,
    c1Edges,
  };
}

function normalizeEdgeType(type) {
  const value = normalizeType(type) || 'dataflow';
  if (value === 'controlflow' || value === 'dotted') return 'dataflow';
  return value;
}

function aggregateEdges(sourceEdges, level) {
  const grouped = new Map();

  for (const connection of sourceEdges) {
    if (!connection || connection.sourceId === connection.targetId) continue;
    const type = normalizeEdgeType(connection.type);
    const key = `${connection.sourceId}|${connection.targetId}|${type}`;
    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        sourceId: connection.sourceId,
        targetId: connection.targetId,
        type,
        labels: new Set(),
        flowPaths: new Set(),
        count: 0,
      };
      grouped.set(key, entry);
    }
    entry.count += 1;
    if (connection.label) entry.labels.add(connection.label);
    for (const flowPath of connection.flowPaths || []) {
      entry.flowPaths.add(flowPath);
    }
  }

  return [...grouped.values()].map((entry, index) => {
    const labels = [...entry.labels];
    let label = labels.slice(0, 2).join(', ');
    if (!label) {
      label = level === 2 ? 'depends on' : level === 3 ? 'uses' : 'calls';
    } else if (entry.count > 1) {
      label = level === 2 ? `${entry.count} dependencies` : `${label} (${entry.count})`;
    }

    return {
      id: `c4e-l${level}-${index}`,
      sourceId: entry.sourceId,
      targetId: entry.targetId,
      type: entry.type,
      label,
      flowPaths: [...entry.flowPaths],
    };
  });
}

function projectContainerEdges(model, containerIds) {
  const projected = [];

  for (const connection of model.connections) {
    const sourceId = model.nodeContainer.get(connection.sourceId);
    const targetId = model.nodeContainer.get(connection.targetId);
    if (!sourceId || !targetId || sourceId === targetId) continue;
    if (!containerIds.has(sourceId) || !containerIds.has(targetId)) continue;
    projected.push({ ...connection, sourceId, targetId });
  }

  return aggregateEdges(projected, 2);
}

function projectComponentEdges(model, containerId, componentIds) {
  const ownership = model.ownershipByContainer.get(containerId);
  if (!ownership) return [];

  const projected = [];
  for (const connection of model.connections) {
    const sourceId = ownership.get(connection.sourceId);
    const targetId = ownership.get(connection.targetId);
    if (!sourceId || !targetId || sourceId === targetId) continue;
    if (!componentIds.has(sourceId) || !componentIds.has(targetId)) continue;
    projected.push({ ...connection, sourceId, targetId });
  }

  return aggregateEdges(projected, 3);
}

function projectCodeEdges(model, codeIds) {
  const projected = [];
  for (const connection of model.connections) {
    if (!codeIds.has(connection.sourceId) || !codeIds.has(connection.targetId)) {
      continue;
    }
    projected.push(connection);
  }
  return aggregateEdges(projected, 4);
}

function viewNode(id, label, type, synthetic = false) {
  return {
    id,
    label: label || id,
    type: type || 'component',
    synthetic,
  };
}

export function getC4View(model, stack = []) {
  const safeStack = (Array.isArray(stack) ? stack : [])
    .filter((entry) => entry && entry.id)
    .slice(0, 3);
  const level = Math.min(4, safeStack.length + 1);
  const levelInfo = C4_LEVELS[level - 1];
  const base = {
    level,
    levelInfo,
    breadcrumb: C4_LEVELS.slice(0, level),
    stack: safeStack,
    focusLabels: safeStack.map((entry) => entry.label),
    nodes: [],
    connections: [],
    drillable: new Set(),
    nextFocusById: new Map(),
    syntheticIds: new Set(),
    emptyMessage: '',
    invalid: false,
  };

  if (!model) {
    return { ...base, emptyMessage: 'No diagram data available.' };
  }

  if (level === 1) {
    const nodes = model.c1Nodes;
    const drillable = new Set([model.system.id]);
    const nextFocusById = new Map([
      [model.system.id, { id: model.system.id, label: model.system.label }],
    ]);
    return {
      ...base,
      nodes,
      connections: model.c1Edges,
      drillable,
      nextFocusById,
      syntheticIds: new Set(
        nodes.filter((node) => node.synthetic).map((node) => node.id)
      ),
    };
  }

  if (level === 2) {
    const containers = [...model.containers.values()]
      .filter((container) => container.nodeIds.size > 0)
      .sort((a, b) => a.label.localeCompare(b.label));
    const nodes = containers.map((container) =>
      viewNode(container.id, container.label, 'container', true)
    );
    const containerIds = new Set(containers.map((container) => container.id));
    const drillable = new Set(
      containers
        .filter(
          (container) =>
            container.componentIds.size > 0 ||
            [...container.nodeIds].some((id) =>
              CODE_TYPES.has(model.nodeMeta.get(id)?.type)
            )
        )
        .map((container) => container.id)
    );
    const nextFocusById = new Map(
      containers.map((container) => [
        container.id,
        { id: container.id, label: container.label },
      ])
    );

    return {
      ...base,
      nodes,
      connections: projectContainerEdges(model, containerIds),
      drillable,
      nextFocusById,
      syntheticIds: new Set(nodes.map((node) => node.id)),
      emptyMessage: nodes.length
        ? ''
        : 'No containers were identified for this repository.',
    };
  }

  if (level === 3) {
    const containerId = safeStack[1]?.id;
    const container = containerId ? model.containers.get(containerId) : null;
    if (!container) {
      return {
        ...base,
        invalid: true,
        emptyMessage: 'This container is no longer available.',
      };
    }

    let componentIds = [...container.componentIds].filter((id) =>
      model.nodeMeta.has(id)
    );
    let fallback = false;
    if (componentIds.length === 0) {
      fallback = true;
      componentIds = [...container.nodeIds]
        .filter((id) => CODE_TYPES.has(model.nodeMeta.get(id)?.type))
        .slice(0, 100);
    }

    const nodes = componentIds.map((id) => {
      const meta = model.nodeMeta.get(id);
      return viewNode(id, meta?.label || id, meta?.displayType || 'component');
    });
    const componentIdSet = new Set(componentIds);
    const drillable = new Set(
      componentIds.filter(
        (id) =>
          !fallback && (model.codeChildren.get(id)?.size || 0) > 0
      )
    );
    const nextFocusById = new Map(
      componentIds
        .filter((id) => drillable.has(id))
        .map((id) => [
          id,
          { id, label: model.nodeMeta.get(id)?.label || id },
        ])
    );

    return {
      ...base,
      nodes,
      connections: fallback
        ? []
        : projectComponentEdges(model, container.id, componentIdSet),
      drillable,
      nextFocusById,
      emptyMessage: nodes.length
        ? ''
        : 'No components were identified for this container.',
    };
  }

  const componentId = safeStack[2]?.id;
  const codeIds = componentId ? model.codeChildren.get(componentId) : null;
  if (!codeIds) {
    return {
      ...base,
      invalid: true,
      emptyMessage: 'This component is no longer available.',
    };
  }

  const nodes = [...codeIds].map((id) => {
    const meta = model.nodeMeta.get(id);
    return viewNode(id, meta?.label || id, meta?.type || 'function');
  });

  return {
    ...base,
    nodes,
    connections: projectCodeEdges(model, codeIds),
    emptyMessage: nodes.length
      ? ''
      : 'No code-level symbols are associated with this component.',
  };
}
