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

// ---------------------------------------------------------------------------
// Per-language tree-sitter queries
// ---------------------------------------------------------------------------

const PYTHON_QUERY = `
(class_definition name: (identifier) @class)
(function_definition name: (identifier) @function)
(import_statement (dotted_name) @import.dotted)
(import_statement (aliased_import name: (dotted_name) @import.dotted))
(import_from_statement module_name: (dotted_name) @import.dotted)
(import_from_statement module_name: (relative_import (dotted_name) @import.module))
`;

const JAVASCRIPT_QUERY = `
(class_declaration name: (identifier) @class)
(function_declaration name: (identifier) @function)
(method_definition name: (property_identifier) @function)
(variable_declarator name: (identifier) @function value: (arrow_function))
(variable_declarator name: (identifier) @function value: (function_expression))
(import_statement source: (string) @import.path)
(call_expression
  function: (identifier) @_require
  arguments: (arguments (string) @import.path)
  (#eq? @_require "require"))
`;

// TypeScript: same as JS plus interface/type-alias/enum.
const TYPESCRIPT_QUERY = `
(class_declaration name: (type_identifier) @class)
(interface_declaration name: (type_identifier) @class)
(type_alias_declaration name: (type_identifier) @class)
(enum_declaration name: (identifier) @class)
(function_declaration name: (identifier) @function)
(method_definition name: (property_identifier) @function)
(method_signature name: (property_identifier) @function)
(variable_declarator name: (identifier) @function value: (arrow_function))
(variable_declarator name: (identifier) @function value: (function_expression))
(import_statement source: (string) @import.path)
`;

const GO_QUERY = `
(function_declaration name: (identifier) @function)
(method_declaration name: (field_identifier) @function)
(type_declaration (type_spec name: (type_identifier) @class))
(import_spec path: (interpreted_string_literal) @import.path)
`;

const RUST_QUERY = `
(function_item name: (identifier) @function)
(struct_item name: (type_identifier) @class)
(enum_item name: (type_identifier) @class)
(trait_item name: (type_identifier) @class)
(use_declaration argument: (_) @import.path)
`;

const JAVA_QUERY = `
(class_declaration name: (identifier) @class)
(interface_declaration name: (identifier) @class)
(enum_declaration name: (identifier) @class)
(method_declaration name: (identifier) @function)
(import_declaration (scoped_identifier) @import.path)
(import_declaration (identifier) @import.path)
`;

const C_QUERY = `
(function_definition declarator: (function_declarator declarator: (identifier) @function))
(struct_specifier name: (type_identifier) @class)
(preproc_include path: (_) @import.path)
`;

const CPP_QUERY = `
(function_definition declarator: (function_declarator declarator: (identifier) @function))
(function_definition declarator: (function_declarator declarator: (qualified_identifier) @function))
(class_specifier name: (type_identifier) @class)
(struct_specifier name: (type_identifier) @class)
(preproc_include path: (_) @import.path)
`;

const CSHARP_QUERY = `
(class_declaration name: (identifier) @class)
(interface_declaration name: (identifier) @class)
(struct_declaration name: (identifier) @class)
(enum_declaration name: (identifier) @class)
(method_declaration name: (identifier) @function)
(using_directive (qualified_name) @import.path)
(using_directive (identifier) @import.path)
`;

const RUBY_QUERY = `
(class name: (constant) @class)
(module name: (constant) @class)
(method name: (identifier) @function)
(singleton_method name: (identifier) @function)
`;

const PHP_QUERY = `
(class_declaration name: (name) @class)
(interface_declaration name: (name) @class)
(trait_declaration name: (name) @class)
(function_definition name: (name) @function)
(method_declaration name: (name) @function)
(namespace_use_clause (qualified_name) @import.path)
`;

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
// Generic capture → symbol-summary translation
// ---------------------------------------------------------------------------

const stripPathQuotes = (raw) => raw.replace(/^[`'"<]|[`'">;]$/g, '').trim();

/**
 * Walk a `dotted_name` node and collect identifier segments. Used for Python
 * imports where multi-segment paths (`a.b.c`) record the *last* segment as a
 * cross-file module reference and single-segment paths (`numpy`) record as a
 * library.
 */
function collectDottedSegments(node) {
  const parts = [];
  for (let k = 0; k < node.childCount; k++) {
    const c = node.child(k);
    if (c.type === 'identifier') parts.push(c.text);
  }
  return parts;
}

/**
 * Run the registered query against `tree` and translate raw captures into the
 * language-agnostic symbol shape. Capture names (declared in the per-language
 * query strings above) drive the categorisation, so this function is itself
 * language-agnostic.
 */
function summariseQueryMatches(query, tree) {
  const classes   = new Set();
  const functions = new Set();
  const libraries = new Set();
  const modules   = new Set();

  const matches = query.matches(tree.rootNode);
  for (const m of matches) {
    for (const cap of m.captures) {
      const text = cap.node.text;
      if (!text) continue;

      switch (cap.name) {
        case 'class':
          classes.add(text);
          break;

        case 'function':
          functions.add(text);
          break;

        case 'import.dotted': {
          // Python `dotted_name` node — split into segments.
          const parts = collectDottedSegments(cap.node);
          if (parts.length === 1) libraries.add(parts[0]);
          else if (parts.length > 1) modules.add(parts[parts.length - 1]);
          break;
        }

        case 'import.module': {
          // Forced module-reference (e.g. Python relative imports `from .x import …`).
          // Always recorded as a cross-file module, never as a library.
          const parts = collectDottedSegments(cap.node);
          if (parts.length > 0) modules.add(parts[parts.length - 1]);
          break;
        }

        case 'import.path': {
          // Generic import path: string literal, scoped identifier, etc.
          const cleaned = stripPathQuotes(text);
          if (!cleaned) break;

          // Split on path / namespace separators used across languages:
          //   /  →  JS, Go, C/C++ headers
          //   .  →  Java, C#
          //   :: →  Rust, C++ qualified
          //   :  →  Node `node:path` style URI scheme
          //   \\ →  PHP namespaces
          const segments = cleaned
            .split(/\/|\.|::|:|\\/)
            .map((s) => s.trim())
            .filter(Boolean);

          if (segments.length === 0) break;
          if (segments.length === 1) {
            libraries.add(segments[0]);
          } else {
            // Treat first segment as the originating library
            // (e.g. `react` in `react/jsx-runtime`, `numpy` in `numpy.linalg`)
            libraries.add(segments[0]);
            // …and the final segment as a likely module/file reference, so the
            // existing cross-file relationship building can pick it up.
            modules.add(segments[segments.length - 1]);
          }
          break;
        }

        default:
          // Unknown capture — ignore (keeps queries forward-compatible).
          break;
      }
    }
  }

  return {
    classes: [...classes],
    functions: [...functions],
    imports: {
      libraries: [...libraries],
      modules: [...modules],
    },
    calls: [], // call extraction deferred to a follow-up
  };
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
