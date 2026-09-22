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

import { runRepositoryScan, detectRepoType } from '../../../src/shared/scanCore.js';
import { mergeMerfolkMarkdown } from '../../../src/shared/merfolkMerge.js';
import { GithubClient, DiffTooLargeError, classifyFileType } from './githubClient.js';
import { tsScan } from './tsScanner.js';
import { runTypeScriptAnalysis } from './tsAnalyzer.js';

const clamp = (pct) => Math.max(0, Math.min(100, Math.round(pct)));

const SOURCE_KINDS = new Set(['added', 'modified', 'renamed', 'changed']);
const SCANNABLE_TYPES = new Set(['file', 'python', 'vue', 'shader']);

/**
 * Categorize a Compare-API diff entry into a scannable source file (or null).
 * Renames are scanned under their new path; the old path is reported for
 * informational purposes only (the merfolk format does not embed per-file
 * sections, so stale-node pruning is not possible — matching the in-tab
 * rescan behaviour).
 */
const toScannableChange = (entry) => {
  const type = classifyFileType(entry.filename);
  if (!type || !SCANNABLE_TYPES.has(type)) return null;
  return {
    path: entry.filename,
    name: entry.filename.split('/').pop(),
    type,
    status: entry.status,
    previous_filename: entry.previous_filename ?? null,
  };
};

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
    commitSha: client.headSha,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Diff-only rescan between a previously scanned commit and the current head.
 *
 * Uses the GitHub Compare API to fetch only the changed files, generates
 * merfolk entries for them, and merges the result into the existing diagram
 * markdown (same pure merge the in-tab rescan performs). Escalating to a full
 * scan is the CALLER's responsibility: this throws `DiffTooLargeError` when the
 * diff is un-computable (>250 commits / LIBSAIL) or when no existing markdown
 * exists to merge into.
 *
 * @returns {Promise<object>} `{ noChanges, commitSha, changedFileCount,
 *   addedFiles, modifiedFiles, removedFiles, markdown, newMarkdown, ... }`
 */
export async function runBackgroundRescan({
  token,
  owner,
  repo,
  ref = null,
  baseCommitSha,
  existingMarkdown,
  onProgress = null,
}) {
  if (!token) throw new Error('runBackgroundRescan: token required');
  if (!owner || !repo) throw new Error('runBackgroundRescan: owner and repo required');
  if (!baseCommitSha) throw new Error('runBackgroundRescan: baseCommitSha required');

  const client = new GithubClient({ token, owner, repo, ref });
  const emit = onProgress || ((pct, msg) => console.log(`[rescan ${owner}/${repo}] ${clamp(pct)}% ${msg}`));

  emit(2, 'Resolving current head commit...');
  const headSha = await client.latestCommitSha();

  if (headSha === baseCommitSha) {
    return { noChanges: true, commitSha: headSha, changedFileCount: 0, addedFiles: [], modifiedFiles: [], removedFiles: [] };
  }

  if (!existingMarkdown) {
    throw new DiffTooLargeError('No existing markdown to merge into — full scan required');
  }

  emit(5, `Comparing ${baseCommitSha.slice(0, 8)}...${headSha.slice(0, 8)} (git compare API)...`);
  const changedFiles = await client.compare(baseCommitSha, headSha);
  const removedFiles = changedFiles.filter((f) => f.status === 'removed').map((f) => f.filename);
  const scannableChanges = changedFiles
    .filter((f) => SOURCE_KINDS.has(f.status))
    .map(toScannableChange)
    .filter(Boolean);

  if (scannableChanges.length === 0) {
    return {
      noChanges: true,
      commitSha: headSha,
      changedFileCount: changedFiles.length,
      addedFiles: [],
      modifiedFiles: scannableChanges.length ? [] : [],
      removedFiles,
    };
  }

  emit(10, `Diff of ${scannableChanges.length} changed source file(s) found`);

  const fetchFile = async (filePath, fileRef) => client.fetchFile(filePath, fileRef || headSha);
  const repoType = await detectRepoType(scannableChanges, fetchFile);
  emit(12, `Repo type: ${repoType}`);

  const result = await runRepositoryScan(owner, repo, {
    preFilteredFiles: scannableChanges,
    repoType,
    fetchFile,
    tsScan,
    runTypeScriptAnalysis,
    onProgress: emit,
  });

  emit(90, 'Merging rescan additions into existing diagram...');
  const mergedMarkdown = mergeMerfolkMarkdown(existingMarkdown, result.markdown);

  return {
    ...result,
    markdown: mergedMarkdown,
    newMarkdown: result.markdown,
    noChanges: false,
    commitSha: headSha,
    changedFileCount: changedFiles.length,
    addedFiles: scannableChanges.filter((c) => c.status === 'added').map((c) => c.path),
    modifiedFiles: scannableChanges.filter((c) => SOURCE_KINDS.has(c.status) && c.status !== 'added').map((c) => c.path),
    removedFiles,
    scannedAt: new Date().toISOString(),
  };
}

export { GithubClient, DiffTooLargeError, classifyFileType } from './githubClient.js';
export { runTypeScriptAnalysis } from './tsAnalyzer.js';
export { tsScan, extractSymbols } from './tsScanner.js';
export { runRepositoryScan } from '../../../src/shared/scanCore.js';