/**
 * tsScanner.js
 *
 * Node implementation of the `tsScan` seam that `runRepositoryScan`
 * (src/shared/scanCore.js) injects. Uses `web-tree-sitter` + the
 * `tree-sitter-wasms` grammar files shipped in the scanner image — the same
 * grammars the in-tab worker uses — and reuses the byte-identical shared
 * query strings (src/shared/treeSitterQueries.js) and merge logic
 * (src/shared/treeSitterMerge.js) so per-language symbol extraction can
 * never drift from the browser path.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

import {
  PYTHON_QUERY, JAVASCRIPT_QUERY, TYPESCRIPT_QUERY,
  GO_QUERY, RUST_QUERY, JAVA_QUERY, C_QUERY, CPP_QUERY,
  CSHARP_QUERY, RUBY_QUERY, PHP_QUERY,
  summariseQueryMatches,
} from '../../../src/shared/treeSitterQueries.js';

import { mergeTreeSitterSymbols } from '../../../src/shared/treeSitterMerge.js';
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// WASM resolution
// ---------------------------------------------------------------------------

const GRAMMAR_FILES = {
  python:     'tree-sitter-python.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  tsx:        'tree-sitter-tsx.wasm',
  go:         'tree-sitter-go.wasm',
  rust:       'tree-sitter-rust.wasm',
  java:       'tree-sitter-java.wasm',
  c:          'tree-sitter-c.wasm',
  cpp:        'tree-sitter-cpp.wasm',
  csharp:     'tree-sitter-c_sharp.wasm',
  ruby:       'tree-sitter-ruby.wasm',
  php:        'tree-sitter-php.wasm',
};

const RUNTIME_WASM_FILE = 'tree-sitter.wasm'; // inside the web-tree-sitter package

let _cacheHit = 0;
let _cacheMiss = 0;
let _runtimeWasmPath = null;
let _parserModule = null;

/**
 * Resolve a package file (grammar or runtime wasm) that may live in the
 * backend's own node_modules OR (during local dev) the workspace root's
 * node_modules. Returns an absolute file path.
 */
function resolvePackageFile(pkg, relPath) {
  try {
    return require.resolve(`${pkg}/${relPath}`);
  } catch {
    // Walk up from this file's directory to the workspace root.
    let dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    while (dir && dir !== path.dirname(dir)) {
      const candidate = path.join(dir, 'node_modules', pkg, relPath);
      if (require('node:fs').existsSync(candidate)) return candidate;
      dir = path.dirname(dir);
    }
    throw new Error(`Cannot resolve ${pkg}/${relPath} (is the package installed?)`);
  }
}

const resolveGrammarWasm = (language) => resolvePackageFile('tree-sitter-wasms', `out/${GRAMMAR_FILES[language]}`);
const resolveRuntimeWasm = () => resolvePackageFile('web-tree-sitter', RUNTIME_WASM_FILE);

async function getParserModule() {
  if (_parserModule) return _parserModule;
  try {
    const mod = await import('web-tree-sitter');
    _parserModule = mod.default || mod;
  } catch {
    const webTsPath = resolvePackageFile('web-tree-sitter', 'dist/tree-sitter.js');
    _parserModule = require(webTsPath);
  }
  return _parserModule;
}

// ---------------------------------------------------------------------------
// Caching (module-level, mirroring the browser worker)
// ---------------------------------------------------------------------------

const _languageCache = new Map(); // name → Parser.Language
const _queryCache = new Map();    // name → Parser.Query
const _parserCache = new Map();   // name → Parser

async function ensureInit() {
  if (!_runtimeWasmPath) _runtimeWasmPath = resolveRuntimeWasm();
  const Parser = await getParserModule();
  if (!Parser._hoverchartInit) {
    await Parser.init({ locateFile: () => _runtimeWasmPath });
    Parser._hoverchartInit = true;
  }
  return Parser;
}

async function getLanguage(name) {
  if (_languageCache.has(name)) return _languageCache.get(name);
  if (!GRAMMAR_FILES[name]) throw new Error(`tree-sitter: no grammar registered for "${name}"`);
  const Parser = await ensureInit();
  const lang = await Parser.Language.load(resolveGrammarWasm(name));
  _languageCache.set(name, lang);
  return lang;
}

async function getQuery(name) {
  if (_queryCache.has(name)) return _queryCache.get(name);
  const lang = await getLanguage(name);
  const query = lang.query(QUERIES[name]);
  _queryCache.set(name, query);
  return query;
}

async function getParser(name) {
  if (_parserCache.has(name)) return _parserCache.get(name);
  const Parser = await ensureInit();
  const parser = new Parser();
  parser.setLanguage(await getLanguage(name));
  _parserCache.set(name, parser);
  return parser;
}

const QUERIES = {
  python: PYTHON_QUERY,
  javascript: JAVASCRIPT_QUERY,
  typescript: TYPESCRIPT_QUERY,
  tsx: TYPESCRIPT_QUERY,
  go: GO_QUERY,
  rust: RUST_QUERY,
  java: JAVA_QUERY,
  c: C_QUERY,
  cpp: CPP_QUERY,
  csharp: CSHARP_QUERY,
  ruby: RUBY_QUERY,
  php: PHP_QUERY,
};

/** Extraction counter for heartbeat/diagnostics. */
const getCacheStats = () => ({ hits: _cacheHit, misses: _cacheMiss, languages: _languageCache.size });

/**
 * Parse `source` with the grammar registered under `language` and return the
 * language-agnostic `{ classes, functions, imports, calls }` summary — the
 * exact same shape the browser worker produces.
 */
export async function extractSymbols(source, language) {
  if (_languageCache.has(language)) _cacheHit += 1;
  else _cacheMiss += 1;
  const parser = await getParser(language);
  const query = await getQuery(language);
  const tree = parser.parse(source);
  try {
    return summariseQueryMatches(query, tree);
  } finally {
    tree.delete();
  }
}

/** The `tsScan` seam implementation passed into `runRepositoryScan`. Mirrors
 * `scanWithTreeSitter` in src/services/treeSitterScanner/index.js — parses
 * with tree-sitter and merges the symbols into the shared scan state. Python
 * keeps the wrappers so the core's regex fallback still applies on WASM
 * failure (captured in the core, not here).
 */
export const tsScan = async ({
  language,
  source,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  _functionCallRelationships,
}) => {
  if (language === 'python' && (fileName === '__init__' || fileName === 'init')) return;

  const symbols = await extractSymbols(source, language);

  mergeTreeSitterSymbols({
    language,
    fileName,
    filePath,
    fileContext,
    elements,
    foundItems,
    fileFunctions,
    moduleImportRelationships,
    symbols,
  });
};

export default { extractSymbols, tsScan, getCacheStats };