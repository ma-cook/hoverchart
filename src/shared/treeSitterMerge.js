/**
 * treeSitterMerge.js
 *
 * Shared merge glue between a tree-sitter symbol extraction (browser worker or
 * Node scanner) and the Merfolk scan state — the exact same code runs in the
 * browser (`src/services/treeSitterScanner/index.js`) and in the Node scanner
 * (`backend/src/scanner/tsScanner.js`) so per-language symbol handling can
 * never drift apart.
 *
 * Consumes the language-agnostic symbol shape produced by
 * `summariseQueryMatches()` in ./treeSitterQueries.js and merges it into the
 * shared `elements` / `foundItems` / `fileFunctions` / relationship maps in
 * the same way the legacy regex/Babel scanners do, so the rest of the Merfolk
 * emission pipeline is unchanged.
 */

import { sanitizeNodeId } from './scanCore';

/**
 * Built-in / runtime-bundled modules that should NOT be emitted as libraries
 * (they would clutter the diagram). Per-language deny-lists.
 */
export const STDLIB_DENY = {
  python: new Set([
    'os', 'sys', 're', 'json', 'time', 'datetime', 'collections', 'typing',
    'pathlib', 'logging', 'subprocess', 'threading', 'asyncio', 'functools',
    'itertools', 'math', 'random', 'io', 'copy', 'enum', 'string',
    'tempfile', 'shutil', 'glob', 'csv', 'urllib', 'http', 'socket',
    'hashlib', 'base64', 'pickle', 'struct', 'argparse', 'unittest',
  ]),
  go: new Set([
    'fmt', 'os', 'io', 'net', 'http', 'time', 'context', 'sync', 'errors',
    'strings', 'strconv', 'bytes', 'bufio', 'log', 'math', 'sort', 'regexp',
    'encoding', 'crypto', 'database', 'reflect', 'runtime',
  ]),
  java: new Set(['java', 'javax']),
  c: new Set([]),
  cpp: new Set([]),
};

const isPrivate = (name) => name.startsWith('_') && !name.startsWith('__');
const isDunder  = (name) => name.startsWith('__') && name.endsWith('__');

/**
 * Record the 1-based line range of a symbol on its file container entry so
 * downstream markdown emission / code-view can slice the symbol's own code.
 * Keyed by the raw symbol name (matches how getFilePath() looks up members).
 */
const setSymbolRange = (fileFunctions, fileName, rawName, { startLine, endLine }) => {
  if (!startLine || !endLine) return;
  const info = fileFunctions.get(fileName);
  if (!info) return;
  if (!info.ranges) info.ranges = new Map();
  info.ranges.set(rawName, { startLine, endLine });
};

/**
 * Resolve the container "type" used for grouping a file's symbols, based on
 * folder-convention flags from `analyzeFile()`. General enough across
 * languages — folder names like `services/`, `models/`, `workers/` mean the
 * same thing in Python, JS, Go, etc.
 */
function resolveContainerType(fileContext, hasClasses) {
  let containerType = 'utility';
  if (fileContext.isBackend || fileContext.isController || fileContext.isView) containerType = 'backend';
  else if (fileContext.isService) containerType = 'service';
  else if (fileContext.isModel) containerType = 'service';
  else if (fileContext.isStore) containerType = 'store';
  else if (fileContext.isMiddleware) containerType = 'service';
  else if (fileContext.isSerializer) containerType = 'service';
  else if (fileContext.isTask) containerType = 'worker';
  else if (fileContext.isWorker) containerType = 'worker';
  else if (fileContext.isMigration) containerType = 'utility';
  else if (fileContext.isConfig) containerType = 'utility';
  else if (fileContext.isUtil) containerType = 'utility';

  if (containerType === 'utility' && hasClasses) {
    containerType = 'service';
  }
  return containerType;
}

/**
 * Merge a tree-sitter `{ classes, functions, imports, calls }` symbol summary
 * into the shared scanner state. Language-agnostic.
 *
 * @param {object} args
 * @param {string} args.language       - Language key registered in the worker
 * @param {string} args.fileName       - Bare file name (no extension)
 * @param {string} args.filePath       - Repo-relative file path
 * @param {object} args.fileContext    - Flags from analyzeFile()
 * @param {object} args.elements       - Shared elements bag
 * @param {object} args.foundItems     - Shared dedup sets
 * @param {Map}    args.fileFunctions
 * @param {Map}    args.moduleImportRelationships
 */
export function mergeTreeSitterSymbols({
  language,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  symbols,
}) {
  const containerType = resolveContainerType(fileContext, symbols.classes.length > 0);
  const denyLibs = STDLIB_DENY[language] || new Set();

  const ensureContainer = () => {
    if (!fileFunctions.has(fileName)) {
      fileFunctions.set(fileName, { type: containerType, functions: new Set(), filePath });
    }
  };

  const importedNames = new Set();

  // ── Imports ────────────────────────────────────────────────────────────
  for (const lib of symbols.imports.libraries) {
    const cleaned = lib.replace(/\.h$/, ''); // strip C/C++ header suffix
    if (!cleaned || denyLibs.has(cleaned)) continue;
    importedNames.add(cleaned);
    if (!elements.imports.libraries.includes(cleaned)) {
      elements.imports.libraries.push(cleaned);
    }
  }

  for (const mod of symbols.imports.modules) {
    if (!mod || mod === fileName) continue;
    const sanitised = sanitizeNodeId(mod);
    if (!moduleImportRelationships.has(fileName)) {
      moduleImportRelationships.set(fileName, new Set());
    }
    moduleImportRelationships.get(fileName).add(sanitised);
  }

  // ── Classes ────────────────────────────────────────────────────────────
  for (const className of symbols.classes) {
    if (isPrivate(className?.name)) continue;
    const id = sanitizeNodeId(className.name);
    ensureContainer();
    fileFunctions.get(fileName).functions.add(id);
    if (className.startLine) setSymbolRange(fileFunctions, fileName, className.name, className);
    if (containerType === 'backend' || containerType === 'service') {
      if (!foundItems.services.has(id)) {
        foundItems.services.add(id);
        elements.services.push(id);
      }
    } else {
      if (!foundItems.utilities.has(id)) {
        foundItems.utilities.add(id);
        elements.utilities.push(id);
      }
    }
  }

  // ── Functions ──────────────────────────────────────────────────────────
  for (const funcName of symbols.functions) {
    if (isPrivate(funcName?.name) || isDunder(funcName?.name)) continue;
    if (importedNames.has(funcName.name)) continue;
    const id = sanitizeNodeId(funcName.name);
    ensureContainer();
    fileFunctions.get(fileName).functions.add(id);
    if (funcName.startLine) setSymbolRange(fileFunctions, fileName, funcName.name, funcName);
    if (!foundItems.utilities.has(id)) {
      foundItems.utilities.add(id);
      elements.utilities.push(id);
    }
  }

  // Python entry-point files always need a container (matches regex path).
  if (
    language === 'python' &&
    (filePath.endsWith('manage.py') ||
      filePath.endsWith('wsgi.py') ||
      filePath.endsWith('asgi.py'))
  ) {
    ensureContainer();
  }
}