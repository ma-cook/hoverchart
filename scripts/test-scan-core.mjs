#!/usr/bin/env node
/**
 * Parity smoke test for the shared scan core (src/shared/scanCore.js).
 *
 * Bundles the core with esbuild (the same way the server-side scanner will
 * consume it — the extension-less Vite-style imports in the shared graph are
 * resolved at bundle time) and runs a scan with mocked deps in plain Node,
 * proving the core is browser-agnostic.
 *
 * Run: node scripts/test-scan-core.mjs
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuildBin = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');
const scanCore = path.join(root, 'src', 'shared', 'scanCore.js');

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'scan-core-test-'));
const bundlePath = path.join(tmpDir, 'scanCore.bundle.mjs');
const bundleUrl = pathToFileURL(bundlePath).href;

await new Promise((resolve, reject) => {
  execFile(
    process.execPath,
    [esbuildBin, scanCore, '--bundle', '--format=esm', '--platform=node', `--outfile=${bundlePath}`, '--log-level=warning'],
    { cwd: root },
    (err, stdout, stderr) => (err ? reject(err) : resolve()),
  );
});

const {
  runRepositoryScan,
  detectRepoType,
  generateMerfolkMarkdown,
  getTreeSitterLanguage,
  TREE_SITTER_EXTENSIONS,
} = await import(bundleUrl);

rmSync(tmpDir, { recursive: true, force: true });

const ok = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('ok  - ' + msg); }
};

ok(typeof runRepositoryScan === 'function', 'runRepositoryScan is exported');
ok(typeof detectRepoType === 'function', 'detectRepoType is exported');
ok(typeof generateMerfolkMarkdown === 'function', 'generateMerfolkMarkdown is exported');
ok(typeof getTreeSitterLanguage === 'function', 'getTreeSitterLanguage is exported');
ok(Array.isArray(TREE_SITTER_EXTENSIONS) && TREE_SITTER_EXTENSIONS.length > 0, 'TREE_SITTER_EXTENSIONS is exported');
ok(getTreeSitterLanguage('main.go') === 'go', 'getTreeSitterLanguage resolves .go');

const files = {
  'package.json': JSON.stringify({ name: 'smoke', dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' } }),
  'src/index.js': "import React from 'react';\nimport { App } from './App';\nexport const root = App;\n",
  'src/App.jsx': "import { Button } from './components/Button';\nexport const App = () => (<div><Button label=\"hi\">Hi</Button></div>);\n",
  'src/components/Button.jsx': "export const Button = ({ label, children }) => (<button>{label}{children}</button>);\n",
};
const fetchFile = async (p) => (p in files ? files[p] : null);
const structure = Object.keys(files).map((p) => ({ path: p, name: p.split('/').pop(), type: p.endsWith('.py') ? 'python' : 'file' }));

const repoType = await detectRepoType(structure, fetchFile);
ok(repoType === 'react', `detectRepoType(structure, fetchFile) => ${repoType}`);

const result = await runRepositoryScan('smoke-owner', 'smoke-repo', {
  structure,
  fetchFile,
  tsScan: async () => {},
  runTypeScriptAnalysis: async () => null,
  onProgress: () => {},
});
ok(result && typeof result.markdown === 'string' && result.markdown.includes('App'), `react scan produced markdown (${result.markdown.length} chars)`);

const pythonStructure = [
  { path: 'main.py', name: 'main.py', type: 'python' },
  { path: 'app/models.py', name: 'models.py', type: 'python' },
];
const pyFiles = { 'main.py': 'def main():\n    print("hi")\n', 'app/models.py': 'class Model:\n    pass\n' };
let pyTsScanCalls = 0;
const throwingTsScan = async () => { pyTsScanCalls++; throw new Error('wasm unavailable (expected in test)'); };
const pyResult = await runRepositoryScan('po', 'py-repo', {
  structure: pythonStructure,
  fetchFile: async (p) => pyFiles[p] ?? null,
  tsScan: throwingTsScan,
  runTypeScriptAnalysis: async () => null,
});
ok(pyTsScanCalls === 2, `python path called tsScan once per python file (${pyTsScanCalls})`);
ok(pyResult && pyResult.markdown.includes('main'), 'python regex fallback produced a scanned function node');

console.log(process.exitCode ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED');
process.exit(process.exitCode || 0);