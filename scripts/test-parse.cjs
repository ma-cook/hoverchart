const { MarkdownProcessor } = require('../node_modules/3d-ast-generator/dist/src/index.js');
const fs = require('fs');

const md = fs.readFileSync('merfolk.md', 'utf8');
const proc = new MarkdownProcessor({ layout: { algorithm: 'none', enableAutoLayout: false } });
const diagrams = proc.processMarkdown(md);
console.log('diagrams:', diagrams.length);
let totalNodes = 0, totalConn = 0, errors = 0;
const types = {};
for (const d of diagrams) {
  if (d.errors && d.errors.length) { errors += d.errors.length; console.log('errors:', d.errors.slice(0, 3)); continue; }
  const g = d.graph;
  totalNodes += g.nodes.size;
  totalConn += g.connections.size;
  for (const n of g.nodes.values()) types[n.type] = (types[n.type] || 0) + 1;
}
console.log('totalNodes:', totalNodes, 'totalConn:', totalConn, 'errors:', errors);
console.log('types:', types);
