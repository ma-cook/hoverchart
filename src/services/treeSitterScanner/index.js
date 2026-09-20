/**
 * treeSitterScanner/index.js
 *
 * Main-thread glue between the tree-sitter scanner worker and
 * `githubRepoService.generateMerfolkFromRepository()`.
 *
 * `scanWithTreeSitter()` parses a source file with the tree-sitter worker and
 * merges the resulting symbols into the shared scanner state, in the same
 * shape as the legacy regex/Babel scanners (so the rest of the Merfolk
 * emission pipeline is unchanged). The actual merge logic lives in
 * `src/shared/treeSitterMerge.js` so the Node scanner and the in-tab scanner
 * share it byte-for-byte.
 *
 * The Python wrapper `scanPythonWithTreeSitter()` is kept as a thin alias for
 * backwards compatibility with the existing call site.
 */

import { getTreeSitterScannerWorker } from '../../workers/treeSitterScannerWorkerClient.js';
import { mergeTreeSitterSymbols } from '../../shared/treeSitterMerge.js';

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
  moduleImportRelationships
) => {
  if (language === 'python' && (fileName === '__init__' || fileName === 'init')) return;

  const worker = getTreeSitterScannerWorker();
  const symbols = await worker.extractSymbols(source, language);

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