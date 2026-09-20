import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/services/githubRepoService.js', import.meta.url), 'utf8');
const lines = src.split('\n');

const anchor = (n, expectedPrefix) => {
  const actual = lines[n - 1] || '';
  if (!actual.startsWith(expectedPrefix)) {
    throw new Error(`Anchor mismatch at line ${n}: expected "${expectedPrefix}" got "${actual.slice(0, 80)}"`);
  }
};

// Verify anchors against the ORIGINAL file (1-based)
anchor(23, '/**');
anchor(37, '];');
anchor(121, 'const getTreeSitterLanguage');
anchor(126, '};');
anchor(378, '/**');
anchor(702, '};');
anchor(704, '/**');
anchor(1518, '};');
anchor(1520, '/**');
anchor(1526, 'export const generateMerfolkFromRepository');
anchor(4031, '};');
anchor(4033, '/**');
anchor(5624, '};');

const cut = (start, end) => {
  const chunk = lines.slice(start - 1, end);
  lines.splice(start - 1, end - start + 1);
  return chunk.join('\n');
};

// Cut bottom-up so earlier cuts never shift later coordinates.
const R5 = cut(4033, 5624); // generateMerfolkMarkdown
const R4 = cut(1520, 4031); // generateMerfolkFromRepository
const R3 = cut(704, 1518);  // sanitizeNodeId docstring + three traversals
const R2 = cut(378, 702);   // analyzeFile + containsJSX + detectRepoType
const R1 = cut(121, 126);   // getTreeSitterLanguage
const R0 = cut(23, 37);     // TREE_SITTER_EXTENSIONS (+ docstring)

const reduced = lines.join('\n');

const scanCoreHeader = `/**
 * scanCore.js
 *
 * Shared, browser-agnostic repository-scan pipeline used by BOTH the in-tab
 * scanner (src/services/githubRepoService.js) and the server-side background
 * scanner (backend/src/scanner/*). Kept byte-identical across the two so the
 * two scan paths can never drift apart.
 *
 * The core is pure: it has no fetch, localStorage, window, worker, or
 * import.meta references. Everything environment-specific is injected via the
 * \`options\` object passed to runRepositoryScan:
 *
 *  - structure:       the repository file list (browser: via proxy; server: GitHub API)
 *  - fetchFile:       (relativePath, ref?) => Promise<string|null> file body
 *  - tsScan:          ({ language, source, fileName, filePath, fileContext,
 *                      elements, foundItems, fileFunctions,
 *                      moduleImportRelationships, functionCallRelationships })
 *                      => Promise<void> — tree-sitter scan (browser: comlink
 *                      worker; server: worker_threads tsWorker). Mutates the
 *                      ctx collections in place, matching the in-tab behavior.
 *  - runTypeScriptAnalysis: (files, tsconfigContent) => Promise<Object|null>
 *  - preFilteredFiles: optional already-changed file list (rescan path)
 *
 * NOTE: \`fetchStatsLine\` is stubbed below — the underlying browser network
 * counters live in githubRepoService.js and are not part of the shared core.
 */
import { parse } from '@babel/parser';
import { createModuleResolver, resolveBarrelChains } from '../services/moduleResolver';
import importPerf from '../utils/importPerf';
import { reportMemoryPressureOnce } from '../utils/memoryMonitor';

const fetchStatsLine = () => '';

`;

writeFileSync(new URL('../src/shared/scanCore.js', import.meta.url),
  scanCoreHeader + [R0, R1, R2, R3, R4, R5].join('\n\n') + '\n');

writeFileSync(new URL('../src/services/githubRepoService.js', import.meta.url), reduced + '\n');

const coreLines = scanCoreHeader.split('\n').length + [R0, R1, R2, R3, R4, R5].join('\n\n').split('\n').length;
console.log('Extraction complete.');
console.log('scanCore.js lines:', coreLines);
console.log('githubRepoService.js lines:', reduced.split('\n').length);