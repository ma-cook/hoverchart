// Smoke test the new query-driven, multi-language tree-sitter scanner in
// Node. Bundles a shim that mirrors the worker's logic (Parser.init +
// Language.load + lang.query() + capture summarisation) and runs it against
// fixture sources for every registered language.
import { build } from 'esbuild';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const shim = `
import Parser from 'web-tree-sitter';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require_ = createRequire(import.meta.url);

// Mirror the worker's per-language registry — but resolve wasm paths via
// node_modules instead of Vite's ?url import.
const wasmFor = (name) =>
  require_.resolve('tree-sitter-wasms/out/tree-sitter-' + name + '.wasm');

const runtimeWasmPath = require_.resolve('web-tree-sitter/tree-sitter.wasm');

const QUERIES = {
  python: \`
(class_definition name: (identifier) @class)
(function_definition name: (identifier) @function)
(import_statement (dotted_name) @import.dotted)
(import_statement (aliased_import name: (dotted_name) @import.dotted))
(import_from_statement module_name: (dotted_name) @import.dotted)
(import_from_statement module_name: (relative_import (dotted_name) @import.module))
\`,
  javascript: \`
(class_declaration name: (identifier) @class)
(function_declaration name: (identifier) @function)
(method_definition name: (property_identifier) @function)
(variable_declarator name: (identifier) @function value: (arrow_function))
(variable_declarator name: (identifier) @function value: (function_expression))
(import_statement source: (string) @import.path)
\`,
  go: \`
(function_declaration name: (identifier) @function)
(method_declaration name: (field_identifier) @function)
(type_declaration (type_spec name: (type_identifier) @class))
(import_spec path: (interpreted_string_literal) @import.path)
\`,
  rust: \`
(function_item name: (identifier) @function)
(struct_item name: (type_identifier) @class)
(enum_item name: (type_identifier) @class)
(trait_item name: (type_identifier) @class)
(use_declaration argument: (_) @import.path)
\`,
  java: \`
(class_declaration name: (identifier) @class)
(interface_declaration name: (identifier) @class)
(method_declaration name: (identifier) @function)
(import_declaration (scoped_identifier) @import.path)
(import_declaration (identifier) @import.path)
\`,
};

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

const _langs = new Map();
const _queries = new Map();
const _parsers = new Map();

async function getLang(name) {
  if (_langs.has(name)) return _langs.get(name);
  await ensureInit();
  const lang = await Parser.Language.load(readFileSync(wasmFor(name)));
  _langs.set(name, lang);
  return lang;
}
async function getQuery(name) {
  if (_queries.has(name)) return _queries.get(name);
  const lang = await getLang(name);
  const q = lang.query(QUERIES[name]);
  _queries.set(name, q);
  return q;
}
async function getParser(name) {
  if (_parsers.has(name)) return _parsers.get(name);
  const lang = await getLang(name); // ensures init first
  const p = new Parser();
  p.setLanguage(lang);
  _parsers.set(name, p);
  return p;
}

const stripPathQuotes = (raw) => raw.replace(/^[\\\`'"<]|[\\\`'">;]$/g, '').trim();

function collectDotted(node) {
  const parts = [];
  for (let k = 0; k < node.childCount; k++) {
    const c = node.child(k);
    if (c.type === 'identifier') parts.push(c.text);
  }
  return parts;
}

function summarise(query, tree) {
  const classes = new Set(), functions = new Set(), libraries = new Set(), modules = new Set();
  for (const m of query.matches(tree.rootNode)) {
    for (const cap of m.captures) {
      const text = cap.node.text;
      if (!text) continue;
      switch (cap.name) {
        case 'class': classes.add(text); break;
        case 'function': functions.add(text); break;
        case 'import.dotted': {
          const parts = collectDotted(cap.node);
          if (parts.length === 1) libraries.add(parts[0]);
          else if (parts.length > 1) modules.add(parts[parts.length - 1]);
          break;
        }
        case 'import.module': {
          const parts = collectDotted(cap.node);
          if (parts.length > 0) modules.add(parts[parts.length - 1]);
          break;
        }
        case 'import.path': {
          const cleaned = stripPathQuotes(text);
          if (!cleaned) break;
          const segs = cleaned.split(/\\/|\\.|::|:|\\\\/).map(s => s.trim()).filter(Boolean);
          if (segs.length === 1) libraries.add(segs[0]);
          else if (segs.length > 1) {
            libraries.add(segs[0]);
            modules.add(segs[segs.length - 1]);
          }
          break;
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

export async function extract(language, source) {
  const p = await getParser(language);
  const q = await getQuery(language);
  const tree = p.parse(source);
  try { return summarise(q, tree); }
  finally { tree.delete(); }
}
`;

const inFile = '.tree-sitter-test-shim.mjs';
const outFile = '.tree-sitter-test-shim.bundle.mjs';
writeFileSync(inFile, shim);

await build({
  entryPoints: [inFile],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  external: ['web-tree-sitter', 'fs', 'module'],
  logLevel: 'silent',
});

const { extract } = await import(pathToFileURL(outFile).href);

const FIXTURES = {
  python: `
import os
import numpy as np
from flask import Flask
from .models import User
class UserService:
    def get(self, id): return id
def public_function(): pass
`,
  javascript: `
import React from 'react';
import { useState } from 'react';
import path from 'node:path';
class Foo { method() {} }
function bar() {}
const baz = () => 1;
`,
  go: `
package main
import "fmt"
import "net/http"
type User struct { Name string }
func Handler(w http.ResponseWriter, r *http.Request) {}
func main() { fmt.Println("hi") }
`,
  rust: `
use std::collections::HashMap;
use serde::Serialize;
struct User { name: String }
enum Status { Ok, Err }
trait Greet { fn hello(&self); }
fn main() {}
`,
  java: `
package com.example.app;
import java.util.List;
import com.example.utils.Helper;
public class UserService {
  public void get(int id) {}
}
interface Greet { void hello(); }
`,
};

const expectAtLeast = {
  python:     { classes: ['UserService'], functions: ['public_function'], libraries: ['numpy', 'flask'], modules: ['models'] },
  javascript: { classes: ['Foo'], functions: ['bar', 'baz', 'method'], libraries: ['react', 'node'], modules: [] },
  go:         { classes: ['User'], functions: ['Handler', 'main'], libraries: ['fmt', 'net'], modules: [] },
  rust:       { classes: ['User', 'Status', 'Greet'], functions: ['main'], libraries: ['std', 'serde'], modules: [] },
  java:       { classes: ['UserService', 'Greet'], functions: ['get'], libraries: ['java', 'com'], modules: [] },
};

let allOk = true;
for (const [lang, source] of Object.entries(FIXTURES)) {
  const r = await extract(lang, source);
  const want = expectAtLeast[lang];
  const missing = {};
  for (const k of ['classes', 'functions']) {
    const m = want[k].filter((x) => !r[k].includes(x));
    if (m.length) missing[k] = m;
  }
  for (const k of ['libraries', 'modules']) {
    const m = want[k].filter((x) => !r.imports[k].includes(x));
    if (m.length) missing['imports.' + k] = m;
  }
  const ok = Object.keys(missing).length === 0;
  if (!ok) allOk = false;
  console.log(`── ${lang} ${ok ? '✅' : '❌'}`);
  console.log(JSON.stringify(r, null, 2));
  if (!ok) console.log('  MISSING:', missing);
}

console.log(allOk ? '\nAll language extractors passed.' : '\nSome extractors failed.');
process.exit(allOk ? 0 : 1);
