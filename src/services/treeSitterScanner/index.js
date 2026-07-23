/**
 * treeSitterScanner/index.js
 *
 * Main-thread glue between the tree-sitter scanner worker and
 * `githubRepoService.generateMerfolkFromRepository()`.
 *
 * `scanWithTreeSitter()` parses a source file with the tree-sitter worker and
 * merges the resulting symbols into the shared scanner state, in the same
 * shape as the legacy regex/Babel scanners (so the rest of the Merfolk
 * emission pipeline is unchanged).
 *
 * The Python wrapper `scanPythonWithTreeSitter()` is kept as a thin alias for
 * backwards compatibility with the existing call site.
 */

import { getTreeSitterScannerWorker } from '../../workers/treeSitterScannerWorkerClient.js';

/** Sanitize a string for use as a Merfolk node ID. */
const sanitizeNodeId = (name) => {
  let safe = name.replace(/[-. ]+/g, '_');
  if (/^\d/.test(safe)) safe = `_${safe}`;
  return safe;
};

/**
 * Built-in / runtime-bundled modules that should NOT be emitted as libraries
 * (they would clutter the diagram). Per-language deny-lists.
 */
const STDLIB_DENY = {
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
 * Parse a source file with the tree-sitter worker and merge the resulting
 * symbols into the shared scanner state. Language-agnostic.
 *
 * @param {string} language     - Language key registered in the worker
 * @param {string} source       - File contents
 * @param {string} fileName     - Bare file name (no extension)
 * @param {string} filePath     - Repo-relative file path
 * @param {object} fileContext  - Flags from analyzeFile()
 * @param {object} elements     - Shared elements bag
 * @param {object} foundItems   - Shared dedup sets
 * @param {Map}    fileFunctions
 * @param {Map}    moduleImportRelationships
 * @param {Map}    _functionCallRelationships - reserved for future call extraction
 */
export const scanWithTreeSitter = async (
  language,
  source,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  _functionCallRelationships
) => {
  if (language === 'python' && (fileName === '__init__' || fileName === 'init')) return;

  const worker = getTreeSitterScannerWorker();
  const symbols = await worker.extractSymbols(source, language);

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
    if (isPrivate(className)) continue;
    const id = sanitizeNodeId(className);
    ensureContainer();
    fileFunctions.get(fileName).functions.add(id);
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
    if (isPrivate(funcName) || isDunder(funcName)) continue;
    if (importedNames.has(funcName)) continue;
    const id = sanitizeNodeId(funcName);
    ensureContainer();
    fileFunctions.get(fileName).functions.add(id);
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
};

/** Backwards-compatible Python alias used by the existing call site. */
export const scanPythonWithTreeSitter = (
  source,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  functionCallRelationships
) =>
  scanWithTreeSitter(
    'python',
    source,
    fileName,
    filePath,
    fileContext,
    elements,
    foundItems,
    fileFunctions,
    moduleImportRelationships,
    functionCallRelationships
  );
