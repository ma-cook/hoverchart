// Run actual hoverchart positioning logic against merfolk.md
import { MarkdownProcessor } from '../src/lib/3d-ast/index.ts';
import fs from 'fs';

// Stub stores so import works
globalThis.window = globalThis.window || {};

const md = fs.readFileSync('merfolk.md', 'utf8');

// Mock the worker engine path: import LayoutEngine
const { LayoutEngine } = await import('../src/services/markdownDiagram/LayoutEngine.js').catch(() => ({}));

let engine;
if (LayoutEngine) {
  engine = new LayoutEngine();
} else {
  // Try direct service
  const proc = new MarkdownProcessor({ layout: { algorithm: 'none', enableAutoLayout: false } });
  const diagrams = proc.processMarkdown(md);
  const graph = diagrams[0].graph;

  // Import methods directly
  const { hierarchyMethods } = await import('../src/services/markdownDiagram/hierarchyMethods.js');
  const { positionMethods } = await import('../src/services/markdownDiagram/positionMethods.js');
  const { scaleMethods } = await import('../src/services/markdownDiagram/scaleMethods.js');

  const eng = {};
  Object.assign(eng, hierarchyMethods, positionMethods, scaleMethods);
  eng.scaleCache = new Map();
  eng.boundingBoxCache = new Map();

  const { parentChildMap, childParentMap, rootNodes, internalComponentChildren } = eng.buildHierarchicalRelationships(graph);
  console.log('rootNodes:', rootNodes.size);
  console.log('childParentMap:', childParentMap.size);
  console.log('internalComponentChildren:', internalComponentChildren.size);

  const nodePositions = new Map();
  const nodeScales = new Map();
  const processedNodes = new Set();

  const context = {
    parentChildMap, childParentMap, rootNodes, internalComponentChildren,
    graphNodes: graph.nodes, graphConnections: graph.connections,
    basePosition: [0, 0, 0], nodePositions, nodeScales, processedNodes,
  };

  const rootArray = Array.from(rootNodes);
  rootArray.forEach((rootId, i) => {
    eng.positionNodeHierarchy(rootId, context, [0, 0, 0], 0, i, rootArray.length);
  });
  console.log('after positionNodeHierarchy:', nodePositions.size);

  eng.positionGroupedNodes(context);
  console.log('after positionGroupedNodes:', nodePositions.size);

  // Stats
  const unposByType = {};
  for (const [id, n] of graph.nodes.entries()) {
    if (!nodePositions.has(id)) {
      unposByType[n.type] = (unposByType[n.type] || 0) + 1;
    }
  }
  console.log('UNPOSITIONED total:', graph.nodes.size - nodePositions.size);
  console.log('unpositioned by type:', unposByType);

  // Identify which are unpositioned
  const examples = [];
  for (const [id, n] of graph.nodes.entries()) {
    if (!nodePositions.has(id)) {
      examples.push({ id, type: n.type, parent: childParentMap.get(id), hasChildren: parentChildMap.has(id) });
      if (examples.length >= 30) break;
    }
  }
  console.log('first 30 unpositioned:', examples);
}
