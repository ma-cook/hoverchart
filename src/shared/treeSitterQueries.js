/**
 * treeSitterQueries.js
 *
 * Shared, environment-agnostic tree-sitter query strings and the capture→
 * symbol-summary translation used by BOTH the browser worker
 * (src/workers/treeSitterScannerWorker.js) and the Node scanner
 * (backend/src/scanner/tsScanner.js). Kept byte-identical across the two so
 * the per-language symbol extraction can never drift apart.
 *
 * The queries use capture names that map to the language-agnostic symbol
 * categories hoverchart emits as Merfolk:
 *   @class      → class / struct / interface / enum / trait / type alias
 *   @function   → function / method / arrow / lambda
 *   @import.dotted → a `dotted_name`-style node (segments separated by `.`)
 *                    — only Python uses this currently.
 *   @import.path   → a string-literal-style import path (JS/TS/Go/Rust/…).
 */

export const PYTHON_QUERY = `
(class_definition name: (identifier) @class)
(function_definition name: (identifier) @function)
(import_statement (dotted_name) @import.dotted)
(import_statement (aliased_import name: (dotted_name) @import.dotted))
(import_from_statement module_name: (dotted_name) @import.dotted)
(import_from_statement module_name: (relative_import (dotted_name) @import.module))
`;

export const JAVASCRIPT_QUERY = `
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
export const TYPESCRIPT_QUERY = `
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

export const GO_QUERY = `
(function_declaration name: (identifier) @function)
(method_declaration name: (field_identifier) @function)
(type_declaration (type_spec name: (type_identifier) @class))
(import_spec path: (interpreted_string_literal) @import.path)
`;

export const RUST_QUERY = `
(function_item name: (identifier) @function)
(struct_item name: (type_identifier) @class)
(enum_item name: (type_identifier) @class)
(trait_item name: (type_identifier) @class)
(use_declaration argument: (_) @import.path)
`;

export const JAVA_QUERY = `
(class_declaration name: (identifier) @class)
(interface_declaration name: (identifier) @class)
(enum_declaration name: (identifier) @class)
(method_declaration name: (identifier) @function)
(import_declaration (scoped_identifier) @import.path)
(import_declaration (identifier) @import.path)
`;

export const C_QUERY = `
(function_definition declarator: (function_declarator declarator: (identifier) @function))
(struct_specifier name: (type_identifier) @class)
(preproc_include path: (_) @import.path)
`;

export const CPP_QUERY = `
(function_definition declarator: (function_declarator declarator: (identifier) @function))
(function_definition declarator: (function_declarator declarator: (qualified_identifier) @function))
(class_specifier name: (type_identifier) @class)
(struct_specifier name: (type_identifier) @class)
(preproc_include path: (_) @import.path)
`;

export const CSHARP_QUERY = `
(class_declaration name: (identifier) @class)
(interface_declaration name: (identifier) @class)
(struct_declaration name: (identifier) @class)
(enum_declaration name: (identifier) @class)
(method_declaration name: (identifier) @function)
(using_directive (qualified_name) @import.path)
(using_directive (identifier) @import.path)
`;

export const RUBY_QUERY = `
(class name: (constant) @class)
(module name: (constant) @class)
(method name: (identifier) @function)
(singleton_method name: (identifier) @function)
`;

export const PHP_QUERY = `
(class_declaration name: (name) @class)
(interface_declaration name: (name) @class)
(trait_declaration name: (name) @class)
(function_definition name: (name) @function)
(method_declaration name: (name) @function)
(namespace_use_clause (qualified_name) @import.path)
`;

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
 * language-agnostic symbol shape. Capture names (declared in the query string)
 * drive the categorisation, so this function is itself language-agnostic.
 */
export function summariseQueryMatches(query, tree) {
  // Maps keep Set-like dedup semantics while also carrying the 1-based line
  // range of each symbol so per-symbol code can be sliced from the file later.
  const classes   = new Map();
  const functions = new Map();
  const libraries = new Set();
  const modules   = new Set();

  const recordRange = (map, text, cap) => {
    if (!map.has(text)) {
      map.set(text, {
        startLine: cap.node.startPosition.row + 1,
        endLine: cap.node.endPosition.row + 1,
      });
    }
  };

  const matches = query.matches(tree.rootNode);
  for (const m of matches) {
    for (const cap of m.captures) {
      const text = cap.node.text;
      if (!text) continue;

      switch (cap.name) {
        case 'class':
          recordRange(classes, text, cap);
          break;

        case 'function':
          recordRange(functions, text, cap);
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
    classes: [...classes.entries()].map(([name, range]) => ({ name, ...range })),
    functions: [...functions.entries()].map(([name, range]) => ({ name, ...range })),
    imports: {
      libraries: [...libraries],
      modules: [...modules],
    },
    calls: [], // call extraction deferred to a follow-up
  };
}