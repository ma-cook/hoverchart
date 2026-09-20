#!/usr/bin/env node
/**
 * Node scanner verification: bundles backend/src/scanner/runScan.js exactly the
 * way the scanner image will (externalizing the runtime-loaded packages:
 * typescript, web-tree-sitter, tree-sitter-wasms) and exercises the REAL seams
 * in plain Node — tree-sitter WASM parsing + the installed typescript compiler.
 *
 * Run: node scripts/test-node-scanner.mjs
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuildBin = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');

const tmpDir = mkdtempSync(path.join(root, 'backend', '.tmp-scanner-'));
const bundlePath = path.join(tmpDir, 'scanner.mjs');
const bundleUrl = pathToFileURL(bundlePath).href;

const entry = path.join(root, 'backend', 'src', 'scanner', 'runScan.js');
const external = ['typescript', 'web-tree-sitter', 'tree-sitter-wasms'];

await new Promise((resolve, reject) => {
  execFile(
    process.execPath,
    [
      esbuildBin, entry, '--bundle', '--format=esm', '--platform=node',
      ...external.map((p) => `--external:${p}`),
      `--outfile=${bundlePath}`, '--log-level=warning',
    ],
    { cwd: root },
    (err) => (err ? reject(err) : resolve()),
  );
});

const { extractSymbols, tsScan, runTypeScriptAnalysis, runRepositoryScan } = await import(bundleUrl);
rmSync(tmpDir, { recursive: true, force: true });

const ok = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('ok  - ' + msg); }
};

// ── tree-sitter WASM extraction ──────────────────────────────────────────
const pySymbols = await extractSymbols('import os\nimport a.b\n\ndef main():\n    return 42\n\nclass Service:\n    pass\n', 'python');
ok(pySymbols.functions.some((f) => f.name === 'main'), 'python extraction found def main()');
ok(pySymbols.classes.some((c) => c.name === 'Service'), 'python extraction found class Service');
ok(pySymbols.imports.libraries.includes('os'), 'python extraction keeps stdlib import as library (npm deny applies at merge)');
ok(pySymbols.imports.modules.includes('b'), 'python dotted import recorded as module ref');

const goSymbols = await extractSymbols('package main\n\nimport "fmt"\n\ntype Server struct {}\n\nfunc (s *Server) Start() {}\n', 'go');
ok(goSymbols.classes.some((c) => c.name === 'Server'), 'go extraction found type Server');
ok(goSymbols.functions.some((f) => f.name === 'Start'), 'go extraction found method Start');
ok(goSymbols.imports.libraries.includes('fmt'), 'go extraction found fmt import');

// ── Full pipeline through the REAL tsScan + tsAnalyzer seams ─────────────
const files = {
  'package.json': JSON.stringify({ name: 'scanner-smoke', dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' } }),
  'src/App.tsx': "import React from 'react';\nimport { Button } from './components/Button';\n\nexport interface AppProps { title: string }\n\nexport const App: React.FC<AppProps> = ({ title }) => (<Button label={title} />);\n",
  'src/components/Button.tsx': "import React from 'react';\nexport const Button = ({ label }: { label: string }) => (<button>{label}</button>);\n",
  'src/tree_sitter.go': 'package main\nimport "fmt"\ntype Server struct{}\nfunc (s *Server) Start() { fmt.Println("hi") }\n',
};

const structure = Object.keys(files).map((p) => ({
  path: p,
  name: p.split('/').pop(),
  type: p.endsWith('.go') ? 'go' : 'file',
}));

const result = await runRepositoryScan('owner', 'scan-repo', {
  structure,
  fetchFile: async (p) => files[p] ?? null,
  tsScan,
  runTypeScriptAnalysis,
  repoType: null,
});

ok(result && result.markdown.includes('Button'), `scan produced markdown with Button (${(result.markdown || '').length} chars)`);
ok(result && result.markdown.includes('Server'), 'tree-sitter Go struct merged into markdown');
ok(result && result.markdown.includes('fmt') === false, 'stdlib fmt denied from library list in merged output');

// ── TypeScript L2 enrichment via the real compiler ───────────────────────
const tsSources = new Map(Object.entries(files).filter(([p]) => p.endsWith('.tsx')));
const tsResult = await runTypeScriptAnalysis(tsSources, null);
ok(tsResult === null || typeof tsResult === 'object', 'runTypeScriptAnalysis returns a result object (or null when typescript unavailable)');
if (tsResult) {
  ok(typeof tsResult.moduleExports?.size === 'number', `TS moduleExports resolved (${tsResult.moduleExports?.size} files)`);
}

console.log(process.exitCode ? '\nNODE SCANNER TEST FAILED' : '\nNODE SCANNER TEST PASSED');
process.exit(process.exitCode || 0);