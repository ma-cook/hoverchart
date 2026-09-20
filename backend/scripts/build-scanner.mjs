import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '..');
const entry = path.join(backend, 'src', 'scanner', 'serviceApp.js');
const outfile = path.join(backend, 'dist', 'scanner.mjs');

// The scanner bundle inlines the shared frontend scan core (src/shared/scanCore
// and friends). CJS server-dependencies (express/pg/storage) and the WASM /
// compiler / parser packages are externalized and resolved from the image's
// node_modules — inherent CJS patterns (depd et al.) cannot be faithfully
// converted to an ESM bundle, and all of them ship in the runtime image via
// `npm ci --omit=dev`. @babel/parser is external too: its import sits in
// src/shared/scanCore.js, which esbuild resolves from the FE file's directory
// (up toward the repo root, where no node_modules exists in the image).
await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: 'linked',
  minify: false,
  external: [
    'express',
    'pg',
    '@google-cloud/storage',
    'typescript',
    'web-tree-sitter',
    'tree-sitter-wasms',
    '@babel/parser',
  ],
  logLevel: 'info',
});

console.log(`Scanner bundle written to ${outfile}`);
console.log('Runtime node_modules (typescript, web-tree-sitter, tree-sitter-wasms) are resolved from the image at startup.');