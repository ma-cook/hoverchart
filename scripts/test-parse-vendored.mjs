// Test vendored Merfolk parser at src/lib/3d-ast/ using esbuild on-the-fly.
// Compares parse output against merfolk.md baseline.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

const outDir = mkdtempSync(join(tmpdir(), 'vendor-3dast-'));
const outFile = join(outDir, 'index.mjs');

await build({
  entryPoints: ['src/lib/3d-ast/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  logLevel: 'silent',
});

const { MarkdownProcessor } = await import(pathToFileURL(outFile).href);

const md = readFileSync('merfolk.md', 'utf8');
const proc = new MarkdownProcessor({ layout: { algorithm: 'none', enableAutoLayout: false } });
const diagrams = proc.processMarkdown(md);
console.log('diagrams:', diagrams.length);
let totalNodes = 0,
  totalConn = 0,
  errors = 0,
  warnings = 0;
const types = {};
for (const d of diagrams) {
  if (d.errors && d.errors.length) {
    errors += d.errors.length;
    console.log('errors:', d.errors.slice(0, 3));
    continue;
  }
  warnings += (d.warnings || []).length;
  const g = d.graph;
  totalNodes += g.nodes.size;
  totalConn += g.connections.size;
  for (const n of g.nodes.values()) types[n.type] = (types[n.type] || 0) + 1;
}
console.log('totalNodes:', totalNodes, 'totalConn:', totalConn, 'errors:', errors, 'warnings:', warnings);
console.log('types:', types);
