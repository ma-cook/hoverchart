// Smoke test the tree-sitter Python symbol extractor in Node (no DOM/Worker
// runtime). Bundles the worker logic with esbuild so it runs against a real
// WASM grammar without touching Vite.
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';

const require_ = createRequire(import.meta.url);

// ── 1. Inline a Node-shim version of the worker that imports
//      web-tree-sitter directly (no `?url` / `?worker`). ─────────────────
const shim = `
import Parser from 'web-tree-sitter';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require_ = createRequire(import.meta.url);
const runtimeWasmPath = require_.resolve('web-tree-sitter/tree-sitter.wasm');
const pythonWasmPath  = require_.resolve('tree-sitter-wasms/out/tree-sitter-python.wasm');

let inited = false;
async function ensureInit() {
  if (inited) return;
  await Parser.init({
    instantiateWasm: async (info, receive) => {
      const bytes = readFileSync(runtimeWasmPath);
      const result = await WebAssembly.instantiate(bytes, info);
      receive(result.instance, result.module);
      return result.instance.exports;
    },
  });
  inited = true;
}

let parser = null;
async function getParser() {
  if (parser) return parser;
  await ensureInit();
  const lang = await Parser.Language.load(readFileSync(pythonWasmPath));
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

function extractPythonSymbols(tree) {
  const root = tree.rootNode;
  const classes = new Set(), functions = new Set(), libraries = new Set(), modules = new Set();
  const collectIdentifiers = (n) => {
    const parts = [];
    for (let k = 0; k < n.childCount; k++) {
      const c = n.child(k);
      if (c.type === 'identifier') parts.push(c.text);
    }
    return parts;
  };
  const recordDotted = (dn) => {
    if (!dn || dn.type !== 'dotted_name') return;
    const parts = collectIdentifiers(dn);
    if (parts.length === 1) libraries.add(parts[0]);
    else if (parts.length > 1) modules.add(parts[parts.length - 1]);
  };
  for (let i = 0; i < root.childCount; i++) {
    const node = root.child(i);
    if (node.type === 'class_definition') {
      const n = node.childForFieldName('name')?.text;
      if (n) classes.add(n);
    } else if (node.type === 'function_definition') {
      const n = node.childForFieldName('name')?.text;
      if (n) functions.add(n);
    } else if (node.type === 'import_statement') {
      for (let j = 0; j < node.childCount; j++) {
        const c = node.child(j);
        if (c.type === 'dotted_name') recordDotted(c);
        else if (c.type === 'aliased_import') recordDotted(c.childForFieldName('name'));
      }
    } else if (node.type === 'import_from_statement') {
      const m = node.childForFieldName('module_name');
      if (!m) continue;
      if (m.type === 'dotted_name') recordDotted(m);
      else if (m.type === 'relative_import') {
        for (let k = m.childCount - 1; k >= 0; k--) {
          const c = m.child(k);
          if (c.type === 'dotted_name') {
            const parts = collectIdentifiers(c);
            if (parts.length > 0) modules.add(parts[parts.length - 1]);
            break;
          }
        }
      }
    }
  }
  return {
    classes: [...classes],
    functions: [...functions],
    imports: { libraries: [...libraries], modules: [...modules] },
  };
}

export async function run(source) {
  const p = await getParser();
  const tree = p.parse(source);
  const r = extractPythonSymbols(tree);
  tree.delete();
  return r;
}
`;

const tmp = '.';
const inFile = join(tmp, '.tree-sitter-test-shim.mjs');
writeFileSync(inFile, shim);

const outFile = join(tmp, '.tree-sitter-test-shim.bundle.mjs');
await build({
  entryPoints: [inFile],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  external: ['web-tree-sitter', 'fs', 'url'],
  logLevel: 'silent',
});

const { run } = await import(pathToFileURL(outFile).href);

const fixture = `
import os
import numpy as np
from flask import Flask, request
from .models import User
from myapp.utils.helpers import format_name

class UserService:
    def get(self, id):
        return User.find(id)

class _Internal:
    pass

def public_function(x):
    return x + 1

def _private_helper():
    pass

async def fetch_data():
    pass
`;

const result = await run(fixture);
console.log(JSON.stringify(result, null, 2));
