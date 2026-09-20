/**
 * treeSitterScannerWorker.js
 *
 * Generic, query-driven, multi-language source-code scanner backed by
 * `web-tree-sitter` (WASM). Runs in a dedicated Web Worker so the heavy WASM
 * runtime + grammar bytes never block the main thread during a repo scan.
 *
 * How extraction works:
 *   • For each registered language we ship a WASM grammar URL and a tree-sitter
 *     query string with capture names that map to the language-agnostic symbol
 *     categories hoverchart emits as Merfolk:
 *       @class      → class / struct / interface / enum / trait / type alias
 *       @function   → function / method / arrow / lambda
 *       @import.dotted → a `dotted_name`-style node (segments separated by `.`)
 *                        — only Python uses this currently.
 *       @import.path   → a string-literal-style import path (JS/TS/Go/Rust/…).
 *   • The worker compiles the query lazily once per language, runs it against
 *     each source file, and returns a `{ classes, functions, imports, calls }`
 *     summary the main-thread glue can merge into the existing scan state.
 *
 * Adding a new language is now: register a wasm URL + a query string. No
 * traversal code needed.
 */

import { expose } from 'comlink';
import Parser from 'web-tree-sitter';
import wasmRuntimeUrl from 'web-tree-sitter/tree-sitter.wasm?url';

import pythonWasm from 'tree-sitter-wasms/out/tree-sitter-python.wasm?url';
import jsWasm from 'tree-sitter-wasms/out/tree-sitter-javascript.wasm?url';
import tsWasm from 'tree-sitter-wasms/out/tree-sitter-typescript.wasm?url';
import tsxWasm from 'tree-sitter-wasms/out/tree-sitter-tsx.wasm?url';
import goWasm from 'tree-sitter-wasms/out/tree-sitter-go.wasm?url';
import rustWasm from 'tree-sitter-wasms/out/tree-sitter-rust.wasm?url';
import javaWasm from 'tree-sitter-wasms/out/tree-sitter-java.wasm?url';
import cWasm from 'tree-sitter-wasms/out/tree-sitter-c.wasm?url';
import cppWasm from 'tree-sitter-wasms/out/tree-sitter-cpp.wasm?url';
import csharpWasm from 'tree-sitter-wasms/out/tree-sitter-c_sharp.wasm?url';
import rubyWasm from 'tree-sitter-wasms/out/tree-sitter-ruby.wasm?url';
import phpWasm from 'tree-sitter-wasms/out/tree-sitter-php.wasm?url';

import {
  PYTHON_QUERY,
  JAVASCRIPT_QUERY,
  TYPESCRIPT_QUERY,
  GO_QUERY,
  RUST_QUERY,
  JAVA_QUERY,
  C_QUERY,
  CPP_QUERY,
  CSHARP_QUERY,
  RUBY_QUERY,
  PHP_QUERY,
  summariseQueryMatches,
} from '../shared/treeSitterQueries';

// ---------------------------------------------------------------------------
// Language registry
// ---------------------------------------------------------------------------

const LANGUAGES = {
  python:     { wasm: pythonWasm,  query: PYTHON_QUERY },
  javascript: { wasm: jsWasm,      query: JAVASCRIPT_QUERY },
  typescript: { wasm: tsWasm,      query: TYPESCRIPT_QUERY },
  tsx:        { wasm: tsxWasm,     query: TYPESCRIPT_QUERY },
  go:         { wasm: goWasm,      query: GO_QUERY },
  rust:       { wasm: rustWasm,    query: RUST_QUERY },
  java:       { wasm: javaWasm,    query: JAVA_QUERY },
  c:          { wasm: cWasm,       query: C_QUERY },
  cpp:        { wasm: cppWasm,     query: CPP_QUERY },
  csharp:     { wasm: csharpWasm,  query: CSHARP_QUERY },
  ruby:       { wasm: rubyWasm,    query: RUBY_QUERY },
  php:        { wasm: phpWasm,     query: PHP_QUERY },
};

// ---------------------------------------------------------------------------
// Initialisation + caching
// ---------------------------------------------------------------------------

let _initPromise = null;
const _languageCache = new Map(); // name → Parser.Language
const _queryCache    = new Map(); // name → Parser.Query
const _parserCache   = new Map(); // name → Parser

function ensureInit() {
  if (!_initPromise) {
    _initPromise = Parser.init({ locateFile: () => wasmRuntimeUrl });
  }
  return _initPromise;
}

async function getLanguage(name) {
  if (_languageCache.has(name)) return _languageCache.get(name);
  const entry = LANGUAGES[name];
  if (!entry) throw new Error(`tree-sitter: no grammar registered for "${name}"`);
  const lang = await Parser.Language.load(entry.wasm);
  _languageCache.set(name, lang);
  return lang;
}

async function getQuery(name) {
  if (_queryCache.has(name)) return _queryCache.get(name);
  const lang = await getLanguage(name);
  const q = lang.query(LANGUAGES[name].query);
  _queryCache.set(name, q);
  return q;
}

async function getParser(name) {
  if (_parserCache.has(name)) return _parserCache.get(name);
  await ensureInit();
  const parser = new Parser();
  parser.setLanguage(await getLanguage(name));
  _parserCache.set(name, parser);
  return parser;
}

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------

const workerApi = {
  /**
   * Parse `source` with the grammar registered under `language` and return a
   * language-agnostic `{ classes, functions, imports, calls }` summary.
   */
  async extractSymbols(source, language) {
    if (!LANGUAGES[language]) {
      throw new Error(`tree-sitter: no grammar registered for "${language}"`);
    }
    const parser = await getParser(language);
    const query = await getQuery(language);
    const tree = parser.parse(source);
    try {
      return summariseQueryMatches(query, tree);
    } finally {
      tree.delete();
    }
  },

  /** List of currently-supported languages (extension-agnostic). */
  supportedLanguages() {
    return Object.keys(LANGUAGES);
  },
};

expose(workerApi);
