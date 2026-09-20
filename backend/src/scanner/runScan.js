/**
 * runScan.js
 *
 * Entry point for the Node background scanner. Wires the shared scan core
 * (src/shared/scanCore.js) to environment-specific adapters:
 *   - structure + file fetch      → GithubClient (server-side token)
 *   - tree-sitter symbol parsing  → tsScanner (web-tree-sitter + shared queries)
 *   - TypeScript L2 enrichment    → tsAnalyzer (installed `typescript` package)
 *
 * Used by the scanner job worker / queue consumer. The result is the same
 * `{ markdown, contentIndex, fileSizes, importGraph, ... }` shape the in-tab
 * scanner produces, because both paths run the identical shared core.
 */

import { runRepositoryScan } from '../../../src/shared/scanCore.js';
import { GithubClient } from './githubClient.js';
import { tsScan } from './tsScanner.js';
import { runTypeScriptAnalysis } from './tsAnalyzer.js';

const clamp = (pct) => Math.max(0, Math.min(100, Math.round(pct)));

/**
 * @param {object} opts
 * @param {string} opts.token - Server-side GitHub access token
 * @param {string} opts.owner - Repository owner
 * @param {string} opts.repo  - Repository name
 * @param {string} [opts.ref] - Ref (branch/SHA) to scan; defaults to default branch
 * @param {string} [opts.repoType] - Optional pre-detected repo type (rescan path)
 * @param {(pct:number,msg:string)=>void} [opts.onProgress] - Progress callback
 */
export async function runBackgroundScan({ token, owner, repo, ref = null, repoType = null, onProgress = null }) {
  if (!token) throw new Error('runBackgroundScan: token required');
  if (!owner || !repo) throw new Error('runBackgroundScan: owner and repo required');

  const client = new GithubClient({ token, owner, repo, ref });

  const emit = onProgress || ((pct, msg) => console.log(`[scan ${owner}/${repo}] ${clamp(pct)}% ${msg}`));

  emit(1, 'Fetching repository structure (git trees API)...');
  const structure = await client.fetchStructure();
  emit(8, `Repository structure: ${structure.length} files`);

  const result = await runRepositoryScan(owner, repo, {
    structure,
    fetchFile: async (filePath, fileRef) => client.fetchFile(filePath, fileRef),
    tsScan,
    runTypeScriptAnalysis,
    repoType,
    onProgress: emit,
  });

  return {
    ...result,
    structure,
    scannedAt: new Date().toISOString(),
  };
}

export { GithubClient } from './githubClient.js';
export { runTypeScriptAnalysis } from './tsAnalyzer.js';
export { tsScan, extractSymbols } from './tsScanner.js';
export { runRepositoryScan } from '../../../src/shared/scanCore.js';