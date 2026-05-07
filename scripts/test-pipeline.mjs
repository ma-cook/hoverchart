// Simulate the hoverchart layout pipeline against merfolk.md
import { MarkdownProcessor } from '../src/lib/3d-ast/index.ts';
import fs from 'fs';

const md = fs.readFileSync('merfolk.md', 'utf8');
const proc = new MarkdownProcessor({ layout: { algorithm: 'none', enableAutoLayout: false } });
const diagrams = proc.processMarkdown(md);
const graph = diagrams[0].graph;

console.log('total parsed nodes:', graph.nodes.size);
console.log('total parsed connections:', graph.connections.size);

// Replicate hierarchy logic
const NODE_TYPE_COMPONENT = 'component';
const NODE_TYPE_FUNCTION = 'function';
const NODE_TYPE_HOOK = 'hook';
const NODE_TYPE_SERVICE = 'service';
const NODE_TYPE_STORE = 'store';
const NODE_TYPE_LIBRARY = 'library';
const NODE_TYPE_MODULE = 'module';
const NODE_TYPE_CLASS = 'class';
const NODE_TYPE_INTERFACE = 'interface';
const NODE_TYPE_VARIABLE = 'variable';
const NODE_TYPE_CONSTANT = 'constant';
const NODE_TYPE_DATAPATH = 'datapath';

const isCubeChild = (t) => t === NODE_TYPE_FUNCTION || t === NODE_TYPE_CLASS || t === NODE_TYPE_INTERFACE || t === NODE_TYPE_VARIABLE || t === NODE_TYPE_CONSTANT || t === NODE_TYPE_STORE;
const isContainerType = (t) => t === NODE_TYPE_SERVICE || t === NODE_TYPE_MODULE || t === NODE_TYPE_STORE || t === NODE_TYPE_LIBRARY || t === NODE_TYPE_HOOK || t === NODE_TYPE_CLASS || t === NODE_TYPE_INTERFACE;

const parentChildMap = new Map();
const childParentMap = new Map();

const wouldCreateCycle = (start, target) => {
  const visited = new Set();
  const dfs = (n) => { if (n === target) return true; if (visited.has(n)) return false; visited.add(n); const c = parentChildMap.get(n); if (!c) return false; for (const ch of c) if (dfs(ch)) return true; return false; };
  return dfs(start);
};

const addRel = (p, c) => {
  if (!p || !c || p === c) return;
  if (parentChildMap.has(p) && parentChildMap.get(p).has(c)) return;
  if (wouldCreateCycle(c, p)) return;
  if (!parentChildMap.has(p)) parentChildMap.set(p, new Set());
  parentChildMap.get(p).add(c);
  if (!childParentMap.has(c)) childParentMap.set(c, p);
};

const internalComponentChildren = new Set();
const componentConnTypes = new Map();

for (const conn of graph.connections.values()) {
  const sId = conn.source?.nodeId || conn.source;
  const tId = conn.target?.nodeId || conn.target;
  const sN = graph.nodes.get(sId), tN = graph.nodes.get(tId);
  if (!sN || !tN) continue;
  const sT = sN.type, tT = tN.type;
  const cT = conn.type || 'dataflow';
  const isDashed = cT === 'controlflow' || cT === 'dotted';
  let p = null, c = null, isInt = false;
  if (isCubeChild(sT) && tT === NODE_TYPE_COMPONENT) {
    if (isDashed) { p = tId; c = sId; }
  } else if (sT === NODE_TYPE_COMPONENT && isCubeChild(tT)) {
    if (isDashed) { p = sId; c = tId; }
  } else if (isContainerType(sT) && isCubeChild(tT)) {
    p = sId; c = tId;
  } else if (sT === NODE_TYPE_COMPONENT && tT === NODE_TYPE_COMPONENT) {
    isInt = isDashed;
    p = sId; c = tId;
    const k = `${p}->${c}`;
    if (!componentConnTypes.has(k)) componentConnTypes.set(k, new Set());
    componentConnTypes.get(k).add(cT);
    if (isInt) { addRel(p, c); internalComponentChildren.add(c); }
  }
  if (p && c && !isInt) addRel(p, c);
}

componentConnTypes.forEach((types, key) => {
  const [p, c] = key.split('->');
  const hasCF = types.has('controlflow') || types.has('dotted');
  if (hasCF) {
    internalComponentChildren.add(c);
    if (!childParentMap.has(c)) addRel(p, c);
  }
});

const rootNodes = new Set();
for (const id of graph.nodes.keys()) if (!childParentMap.has(id)) rootNodes.add(id);

console.log('rootNodes:', rootNodes.size);
console.log('childParentMap (nodes that have parent):', childParentMap.size);
console.log('internalComponentChildren:', internalComponentChildren.size);

// Simulate positioning
const nodePositions = new Map();
const processedNodes = new Set();

const positionNode = (id, level = 0) => {
  if (processedNodes.has(id)) return;
  const n = graph.nodes.get(id);
  if (!n) return;
  processedNodes.add(id);
  const t = n.type;
  if (t === NODE_TYPE_DATAPATH) return;
  const isTop = !childParentMap.has(id);
  if (internalComponentChildren.has(id) && isTop) return;
  const isGrouped = t === NODE_TYPE_SERVICE || t === NODE_TYPE_STORE || t === NODE_TYPE_HOOK || t === NODE_TYPE_LIBRARY || t === NODE_TYPE_MODULE;
  if (isGrouped && isTop) return;
  if ((t === NODE_TYPE_FUNCTION || t === NODE_TYPE_HOOK) && isTop) return;
  nodePositions.set(id, [0, 0, 0]);
  const children = parentChildMap.get(id) || new Set();
  for (const ch of children) positionNode(ch, level + 1);
};

for (const r of rootNodes) positionNode(r);

console.log('after positionNodeHierarchy: positioned =', nodePositions.size);

// positionGroupedNodes: position top-level non-component non-datapath
const groupedByType = new Map();
const ungroupedComponents = [];
for (const [id, n] of graph.nodes.entries()) {
  if (childParentMap.has(id)) continue;
  const t = n.type;
  if (t === NODE_TYPE_COMPONENT) {
    if (id !== 'MainEntry' && !internalComponentChildren.has(id) && !nodePositions.has(id)) {
      ungroupedComponents.push(id);
    }
    continue;
  }
  if (t === NODE_TYPE_DATAPATH) continue;
  let key = t;
  if (t === NODE_TYPE_SERVICE && id.startsWith('backend_')) key = 'backend';
  else if (t === NODE_TYPE_FUNCTION && id.startsWith('worker_')) key = 'worker';
  else if (t === NODE_TYPE_FUNCTION && id.startsWith('shader_')) key = 'shader';
  if (!groupedByType.has(key)) groupedByType.set(key, []);
  groupedByType.get(key).push(id);
}

for (const [, nodes] of groupedByType) {
  for (const id of nodes) nodePositions.set(id, [0, 0, 0]);
}
for (const id of ungroupedComponents) nodePositions.set(id, [0, 0, 0]);

console.log('after positionGroupedNodes (top-level placed): positioned =', nodePositions.size);
console.log('ungroupedComponents:', ungroupedComponents.length);
console.log('groupedByType keys:', Array.from(groupedByType.keys()), 'sizes:', Array.from(groupedByType.values()).map(v => v.length));

// step 8: position children of grouped nodes
for (const [, nodes] of groupedByType) {
  for (const gn of nodes) {
    const ch = parentChildMap.get(gn) || new Set();
    for (const c of ch) {
      const cn = graph.nodes.get(c);
      if (!cn) continue;
      if (cn.type !== NODE_TYPE_COMPONENT && cn.type !== NODE_TYPE_DATAPATH) {
        nodePositions.set(c, [0, 0, 0]);
      }
    }
  }
}

// step 7: ungrouped component children
for (const cid of ungroupedComponents) {
  const ch = parentChildMap.get(cid) || new Set();
  for (const c of ch) {
    const cn = graph.nodes.get(c);
    if (!cn) continue;
    if (cn.type === NODE_TYPE_FUNCTION || (cn.type === NODE_TYPE_COMPONENT && internalComponentChildren.has(c))) {
      nodePositions.set(c, [0, 0, 0]);
    }
  }
}

console.log('after step 7+8: positioned =', nodePositions.size);
console.log('UNPOSITIONED =', graph.nodes.size - nodePositions.size);

// Show what's missing
const unpositioned = [];
const unposByType = {};
for (const [id, n] of graph.nodes.entries()) {
  if (!nodePositions.has(id)) {
    unpositioned.push({id, type: n.type, parent: childParentMap.get(id)});
    unposByType[n.type] = (unposByType[n.type] || 0) + 1;
  }
}
console.log('unpositioned by type:', unposByType);
console.log('first 30 unpositioned:', unpositioned.slice(0, 30));
