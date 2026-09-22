/**
 * Service for scanning GitHub repositories and generating Merfolk diagram files
 * Handles GitHub OAuth, repository fetching, file analysis, and Merfolk markdown generation
 */
import { api } from '../api-client';
import { scanPythonWithTreeSitter, scanWithTreeSitter } from './treeSitterScanner';
import { runTypeScriptAnalysis } from './typescriptAnalyzer';
import { clearAllCellCaches } from './cellObjectCache';
import { joinChunks } from './context/chunkIndex';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/safeLocalStorage';
import { githubProxyRequest } from './githubApiProxy';
import importPerf from '../utils/importPerf';
import useCodeStore from '../stores/codeStore';
import {
  getTreeSitterLanguage,
  detectRepoType,
  runRepositoryScan,
} from '../shared/scanCore';
// Merge utilities live in src/shared/merfolkMerge.js (a pure, dependency-free
// module) so the backend scanner can produce identical diff-only rescan output.
import { mergeMerfolkMarkdown } from '../shared/merfolkMerge';

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';


// ── Retry / rate-limit helpers ────────────────────────────────────────────

const sleep = (ms, signal) => new Promise((r, reject) => {
  if (signal?.aborted) { reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })); return; }
  const id = setTimeout(r, ms);
  signal?.addEventListener('abort', () => { clearTimeout(id); reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })); }, { once: true });
});

// TEMPORARY PERF STATS (?perf) — network counters for repo-scan baseline runs.
const githubFetchStats = {
  apiRequests: 0,
  cdnRequests: 0,
  rateLimitedResponses: 0,
  rateLimitSleepMs: 0,
  bytesFetched: 0,
};
export const getGithubFetchStats = () => ({ ...githubFetchStats });

/**
 * Wrapper around the server-side GitHub proxy that retries on 429 (rate-limit)
 * and 403 (abuse) with exponential backoff + jitter.  All other errors
 * propagate immediately.
 *
 * `url` may be a full api.github.com URL or a bare path; the query string is
 * split off and re-serialized so the proxy can rebuild the upstream request.
 * The GitHub access token is server-only — nothing here carries it.
 */
async function fetchWithRetry(url, options = {}, retries = 3) {
  const { signal, method: httpMethod, body, query, accept } = options;
  let path = typeof url === 'string' ? url : url;
  let queryPayload = query;

  const qIndex = path.indexOf('?');
  if (qIndex !== -1) {
    queryPayload = queryPayload || path.slice(qIndex + 1);
    path = path.slice(0, qIndex);
  }
  if (path.startsWith(GITHUB_API_BASE)) {
    path = path.slice(GITHUB_API_BASE.length);
  }

  const githubHeaders = {};
  if (accept) githubHeaders.Accept = accept;

  for (let attempt = 1; attempt <= retries; attempt++) {
    if (signal?.aborted) throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
    githubFetchStats.apiRequests += 1;
    const response = await githubProxyRequest(path, {
      method: httpMethod || 'GET',
      query: queryPayload,
      body,
      githubHeaders,
      signal,
    });
    if (response.ok) return response;
    if ((response.status === 429 || response.status === 403) && attempt < retries) {
      const retryAfter = response.headers.get('Retry-After');
      const baseDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay + jitter, 10_000);
      githubFetchStats.rateLimitedResponses += 1;
      githubFetchStats.rateLimitSleepMs += Math.round(delay);
      console.warn(`? GitHub API rate-limited (${response.status}), retrying in ${Math.round(delay)}ms.`);
      await sleep(delay, signal);
      continue;
    }
    if (response.status === 404) return response;
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
}

// One-line snapshot of the network counters for [perf] marks.
const fetchStatsLine = () =>
  `api=${githubFetchStats.apiRequests} cdn=${githubFetchStats.cdnRequests} ` +
  `rateLimited=${githubFetchStats.rateLimitedResponses} sleepMs=${githubFetchStats.rateLimitSleepMs} ` +
  `bytes=${(githubFetchStats.bytesFetched / 1048576).toFixed(1)}MB`;

// When set to a commit SHA, `fetchFileContent` reads files from the
// raw.githubusercontent.com CDN instead of the GitHub Contents API,
// avoiding per-file API rate limits entirely.
let repoRefSha = null;


/**
 * Exchange GitHub OAuth code for a server-stored connection.
 * @param {string} code - The OAuth code from GitHub redirect
 * @returns {Promise<Object>} - { status: 'connected', github_login }
 */
export const exchangeGithubCode = async (code) => {
  try {
    const redirectUri = window.location.origin + window.location.pathname;
    const result = await api.post('/api/auth/github/token', { code, redirect_uri: redirectUri });
    return result;
  } catch (error) {
    console.error('Error exchanging GitHub code:', error);
    throw error;
  }
};

/**
 * Fetch user's repositories from GitHub (via the server proxy)
 * @param {string} _token - Kept for call-site compatibility; never used.
 * @returns {Promise<Array>} - Array of repository objects
 */
export const fetchRepositories = async (_token) => {
  const perPage = 100;
  let page = 1;
  let allRepos = [];

  try {
    while (true) {
      const response = await fetchWithRetry('/user/repos', {
        query: { per_page: perPage, page },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }
      const repos = await response.json();
      if (repos.length === 0) break;
      allRepos = allRepos.concat(repos);
      if (repos.length < perPage) break;
      page++;
    }

    return allRepos;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
};

/**
 * Fetch file content from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} filePath - Path to the file
 * @param {string} _token - Kept for call-site compatibility; never used.
 * @returns {Promise<string|null>} - File content or null if failed
 */
export const fetchFileContent = async (owner, repoName, filePath, _token, ref) => {
  const fetchTimeout = (ms) => {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), ms);
    return { signal: c.signal, clear: () => clearTimeout(id) };
  };

  // When a ref SHA is pinned, fetch from the raw CDN (0 rate-limit cost).
  // Falls back to the Contents API if the CDN fails.
  const targetRef = ref || repoRefSha;
  if (targetRef) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/${targetRef}/${filePath}`;
    const rawT = fetchTimeout(30_000);
    try {
      const res = await fetch(rawUrl, { signal: rawT.signal });
      rawT.clear();
      if (res.ok) {
        const text = await res.text();
        githubFetchStats.cdnRequests += 1;
        githubFetchStats.bytesFetched += text.length;
        return text;
      }
    } catch {
      rawT.clear();
      // network error — fall through to API
    }
  }

  const apiT = fetchTimeout(30_000);
  try {
    const response = await fetchWithRetry(
      `/repos/${owner}/${repoName}/contents/${filePath}`,
      {
        accept: 'application/vnd.github.v3.raw', // Get raw content directly
        signal: apiT.signal,
      }
    );
    apiT.clear();

    if (!response.ok) {
      if (response.status === 404) return null; // file not found
      console.warn(`⚠️  GitHub API error for ${filePath}: ${response.status}`);
      return null;
    }

    // Get the raw text content
    const apiText = await response.text();
    githubFetchStats.bytesFetched += apiText.length;
    return apiText;
  } catch (error) {
    apiT.clear();
    if (error.name === 'AbortError') {
      console.warn(`⏱️  Timeout fetching ${filePath} after 30s`);
      return null;
    }
    console.warn(`⚠️  Error fetching ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Fetch the latest commit SHA for the default branch of a repository
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} _token - Kept for call-site compatibility; never used.
 * @returns {Promise<string>} - The latest commit SHA
 */
export const fetchLatestCommitSha = async (owner, repoName, _token) => {
  const response = await fetchWithRetry(`/repos/${owner}/${repoName}/commits`, {
    query: { per_page: 1 },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error fetching latest commit: ${response.status}`);
  }
  const commits = await response.json();
  if (!commits.length) {
    throw new Error('Repository has no commits');
  }
  return commits[0].sha;
};

/**
 * Fetch the list of changed files between two commits using the GitHub Compare API
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} baseSha - Base commit SHA
 * @param {string} headSha - Head commit SHA
 * @param {string} _token - Kept for call-site compatibility; never used.
 * @returns {Promise<Array>} - Array of changed file objects { filename, status, path, name, type }
 */
export const fetchChangedFiles = async (owner, repoName, baseSha, headSha, _token) => {
  const response = await fetchWithRetry(`/repos/${owner}/${repoName}/compare/${baseSha}...${headSha}`);
  if (!response.ok) {
    throw new Error(`GitHub API error comparing commits: ${response.status}`);
  }
  const comparison = await response.json();
  return (comparison.files || []).map(f => ({
    filename: f.filename,
    status: f.status, // 'added', 'modified', 'removed', 'renamed'
    path: f.filename,
    name: f.filename.split('/').pop(),
  }));
};

/**
 * Determine the file type from a file path based on extension
 * @param {string} filePath - File path
 * @returns {string|null} - 'file' for JS/TS, 'python' for .py, 'vue' for .vue, 'shader' for shader files, or null
 */
const getFileTypeFromPath = (filePath) => {
  const name = filePath.split('/').pop();
  if (name.endsWith('.d.ts')) return null;
  if (/\.(jsx?|tsx?)$/.test(name)) return 'file';
  if (/\.py$/.test(name)) return 'python';
  if (/\.vue$/.test(name)) return 'vue';
  if (/\.(glsl|wgsl|hlsl|vert|frag|comp)$/.test(name)) return 'shader';
  const tsLang = getTreeSitterLanguage(name);
  if (tsLang) return tsLang;
  return null;
};

/**
 * Fetch repository structure using the Git Trees API.
 * A single recursive call replaces sequential Contents API directory walking.
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} _token - Kept for call-site compatibility; never used.
 * @returns {Promise<Array>} - Array of file objects with path, name, type
 */
export const fetchRepositoryStructure = async (owner, repoName, _token) => {
  try {
    const commitSha = await fetchLatestCommitSha(owner, repoName);

    const commitResponse = await fetchWithRetry(`/repos/${owner}/${repoName}/git/commits/${commitSha}`);
    if (!commitResponse.ok) {
      throw new Error(`GitHub API error fetching commit: ${commitResponse.status}`);
    }
    const commitData = await commitResponse.json();
    const treeSha = commitData.tree.sha;

    const treeResponse = await fetchWithRetry(`/repos/${owner}/${repoName}/git/trees/${treeSha}`, {
      query: { recursive: 1 },
    });
    if (!treeResponse.ok) {
      throw new Error(`GitHub API error fetching tree: ${treeResponse.status}`);
    }
    const treeData = await treeResponse.json();

    const structure = [];
    const items = treeData.tree || [];

    for (const item of items) {
      if (item.type === 'blob') {
        const fileType = getFileTypeFromPath(item.path);
        if (fileType) {
          structure.push({
            path: item.path,
            name: item.path.split('/').pop(),
            type: fileType,
          });
        }
      }
    }

    if (treeData.truncated) {
      console.warn('Repository tree was truncated (>100k items), fetching sub-trees...');
      const dirs = items.filter(i => i.type === 'tree');
      // Fetch sub-trees concurrently instead of sequentially.
      const subTreeResults = await Promise.all(
        dirs.map(async (dir) => {
          const subResponse = await fetchWithRetry(`/repos/${owner}/${repoName}/git/trees/${dir.sha}`, {
            query: { recursive: 1 },
          });
          if (!subResponse.ok) return [];
          const subData = await subResponse.json();
          return (subData.tree || [])
            .filter(subItem => subItem.type === 'blob' && getFileTypeFromPath(subItem.path))
            .map(subItem => ({
              path: subItem.path,
              name: subItem.path.split('/').pop(),
              type: getFileTypeFromPath(subItem.path),
            }));
        })
      );
      for (const subItems of subTreeResults) structure.push(...subItems);
    }

    return structure;
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    return [];
  }
};





/**
 * GitHub token accessors.
 *
 * The GitHub access token is server-only — it is stored encrypted on the
 * backend and never returned to the browser. `getGithubToken` therefore always
 * returns null; it exists so existing call sites keep compiling. Connection
 * state is tracked via the `github_login` marker (best-effort) and, authoritatively,
 * via GET /api/github/status (see refreshGithubConnection).
 * @returns {null} - The token is never available in the browser
 */
export const getGithubToken = () => {
  return null;
};

/**
 * @param {string} _token - Deprecated; no longer stored in the browser.
 */
export const setGithubToken = (_token) => {
  // No-op for compatibility. Tokens are stored server-side only.
};

/**
 * Optimistic connected-state marker (a presence flag, NOT a credential).
 * @param {string} login - GitHub login to record
 */
export const getGithubLogin = () => {
  return safeGetItem('github_login') || null;
};

export const setGithubLogin = (login) => {
  if (login) {
    safeSetItem('github_login', login);
    useCodeStore.getState().setGithubConnected(true);
  } else {
    safeRemoveItem('github_login');
    useCodeStore.getState().setGithubConnected(false);
  }
};

/**
 * Check if user is authenticated with GitHub
 * @returns {boolean} - True if authenticated
 */
export const isGithubAuthenticated = () => {
  return !!getGithubLogin();
};

/**
 * Authoritative connection check against the backend. Syncs the optimistic
 * marker/store with the server-stored token record.
 * @returns {Promise<boolean>} - True if the server holds a token for this user
 */
export const refreshGithubConnection = async () => {
  try {
    const status = await api.get('/api/github/status');
    const connected = !!(status && status.connected);
    if (connected) {
      setGithubLogin(status.github_login || null);
      useCodeStore.getState().setGithubConnected(true);
    } else {
      safeRemoveItem('github_login');
      useCodeStore.getState().setGithubConnected(false);
    }
    return connected;
  } catch (error) {
    console.warn('Failed to check GitHub connection:', error.message);
    return false;
  }
};

/**
 * Disconnect GitHub: revoke + delete the server-stored token.
 * @returns {Promise<boolean>} - True on success
 */
export const disconnectGithub = async () => {
  try {
    await api.delete('/api/auth/github/token');
    setGithubLogin(null);
    useCodeStore.getState().setGithubConnected(false);
    return true;
  } catch (error) {
    console.error('Failed to disconnect GitHub:', error.message);
    return false;
  }
};

/**
 * Get GitHub OAuth URL for login
 * Preserves the current page's query parameters (e.g. spaceId) via the
 * OAuth `state` parameter so the user is returned to the same context.
 * @returns {string} - GitHub OAuth URL
 */
export const getGithubOAuthUrl = () => {
  const clientId = 'Ov23liLYzf9WoYPLBNat';
  const redirectUri = window.location.origin + window.location.pathname;

  // Encode current query params (minus any leftover OAuth params) into `state`
  // so we can restore them after the redirect.
  // Include a _source=github marker so handleGithubCallback can distinguish
  // GitHub OAuth redirects from the login app's auth redirects.
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.delete('code');
  currentParams.delete('state');
  currentParams.set('_source', 'github');
  const statePayload = currentParams.toString();

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(statePayload)}`;
  return url;
};

/**
 * Handle GitHub OAuth callback
 * Exchanges code for a server-stored connection (the token never reaches the
 * browser) and records the connected state.
 * @returns {Promise<Object|null>} - Connection result or null
 */
export const handleGithubCallback = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) {
    return null;
  }

  // Only process if this redirect came from GitHub OAuth (has state with _source=github).
  // Without this check we'd consume ?code= params from the login app's auth redirect.
  const state = params.get('state');
  if (!state || !new URLSearchParams(state).has('_source')) {
    return null;
  }

  // Restore original query params from the OAuth `state` parameter
  const restoredParams = new URLSearchParams(state);
  restoredParams.delete('_source'); // Remove internal marker
  for (const [key, value] of restoredParams) {
    if (!params.has(key)) {
      params.set(key, value);
    }
  }

  try {
    const result = await exchangeGithubCode(code);
    if (!result || result.status !== 'connected') {
      throw new Error('GitHub connection was not established on the server');
    }
    setGithubToken(null);
    setGithubLogin(result.github_login || '');

    // Clean up OAuth params but keep restored params (e.g. spaceId)
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    // Restore params from state into the URL
    const successParams = new URLSearchParams(state);
    successParams.delete('_source');
    for (const [key, value] of successParams) {
      newUrl.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', newUrl);

    return result;
  } catch (error) {
    console.error('GitHub OAuth flow failed:', error);
    // Clean up the URL even on failure, but keep original params
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    const failParams = new URLSearchParams(state);
    failParams.delete('_source');
    for (const [key, value] of failParams) {
      newUrl.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', newUrl);
    return null;
  }
};

/**
 * Scan a repository and generate a Merfolk diagram
 * @param {Object} repo - Repository object from GitHub API
 * @param {Function} onCreateObject - Callback to create 3D objects
 * @param {Object} user - User object
 * @param {string} currentSpaceId - Current space ID
 * @param {Function} uploadMarkdownToStorage - Function to upload markdown
 * @param {Object} markdownDiagramService - Markdown diagram service instance
 * @param {Function} onProgress - Optional callback for progress updates (progress: 0-100, stage: string)
 * @returns {Promise<Object>} - Result object with success, objectsCreated, connectionsCreated
 */
export const scanRepositoryAndGenerateDiagram = async (
  repo,
  onCreateObject,
  user,
  currentSpaceId,
  uploadMarkdownToStorage,
  markdownDiagramService,
  onProgress = null
) => {
  try {
    // Reset the per-scan flag that tracks whether the memory-pressure warning fired
    window._memoryPressureHigh = false;

    // Drop cached objects from any previous scan. `allCellObjects` is the
    // persistent fallback used to hydrate cells on load; without clearing it
    // every scan would accumulate the full object set of every previous
    // repository, growing unboundedly across rescans.  It gets repopulated
    // with the current scan's objects as they are created.
    clearAllCellCaches();

    // Capture the commit SHA before scanning so rescans can compare later
    if (onProgress) onProgress(5, 'Recording commit...');
    const commitSha = await fetchLatestCommitSha(repo.owner.login, repo.name);

    // Pin a commit ref so `fetchFileContent` uses the raw CDN instead of the
    // GitHub Contents API, avoiding per-file rate limits.
    repoRefSha = commitSha;

    // Report progress: Fetching repository structure
    if (onProgress) onProgress(10, 'Fetching repository structure...');
    
    // Generate Merfolk markdown from entire repository
    const { markdown: merfolkMarkdown, contentIndex, fileSizes, importGraph, fileIndexByPath, importIndexByFile, repoFileContents } = await generateMerfolkFromRepository(repo.owner.login, repo.name, { onProgress });
    
    if (onProgress) onProgress(40, 'Analyzing code and generating diagram...');

    // Upload the generated markdown to Firebase Storage
    let storageUrl = null;
    if (user?.uid && currentSpaceId) {
      if (onProgress) onProgress(50, 'Uploading diagram to storage...');
      try {
        storageUrl = await uploadMarkdownToStorage(
          merfolkMarkdown,
          user.uid,
          currentSpaceId,
          `${repo.name}-diagram.md`
        );
      } catch (uploadError) {
        console.error('Failed to upload markdown to storage:', uploadError);
        // Continue with processing even if upload fails
      }
    }
    
    if (onProgress) onProgress(60, 'Processing markdown...');
    importPerf.mark(`scan: complete, handing off to processMarkdownFile (${fetchStatsLine()})`);

    // Create a File from the markdown for processing
    const markdownBlob = new Blob([merfolkMarkdown], {
      type: 'text/markdown',
    });
    const markdownFile = new File([markdownBlob], `${repo.name}-diagram.md`, {
      type: 'text/markdown',
    });
    
    if (onProgress) onProgress(70, 'Creating 3D objects...');

    // Use the markdown processing service to handle the upload and creation
    const result = await markdownDiagramService.processMarkdownFile(
      markdownFile,
      onCreateObject,
      currentSpaceId,
      user
    );

    // NOTE: community detection is NOT run here - processMarkdownFile
    // already awaits detectAndStoreCommunities() internally, and a second
    // full pass doubled a very long silent phase on huge diagrams.

    // ── LSP enrichment (async, non-blocking) ────────────────────────────
    // Connect to the LSP service and enrich the diagram with accurate
    // definitions, references, and type metadata. This runs after the
    // initial diagram is shown so the user sees results immediately.
    try {
      const { getLspClient } = await import('./lsp/lspClient.js');
      const { enrichDiagramWithLsp } = await import('./lsp/enrichmentService.js');
      const lspUrl = import.meta.env.VITE_LSP_URL;
      if (lspUrl) {
        const lspClient = getLspClient(lspUrl);
        const store = (await import('../stores/diagramStore.js')).default;
        store.getState().setIsLspEnriching(true);

        // Build file list from the content store (populated by generateMerfolkFromRepository)
        const { getContentStore } = await import('./context/contentStore.js');
        const { getBase64Store } = await import('./context/base64Store.js');
        const cs = getContentStore();
        const b64 = getBase64Store();
        const lspFiles = [];
        for (const [_entryId, entry] of cs.entries) {
          if (!entry || !entry.sourcePath) continue;
          const chunks = b64.getChunks(entry.chunks.map(c => c.id));
          const content = joinChunks(chunks);
          if (content) lspFiles.push({ path: entry.sourcePath, content });
        }

        if (lspFiles.length > 0) {
          console.log(`[scanRepository] Starting LSP enrichment for ${lspFiles.length} files...`);
          // Don't await — run in background so the diagram is shown immediately
          enrichDiagramWithLsp(lspClient, lspFiles, {}, (progress) => {
            console.log(`[scanRepository] LSP enrichment: ${progress.stage} (${progress.progress}%)`);
          }).catch(err => {
            console.warn('[scanRepository] LSP enrichment failed (non-fatal):', err.message);
            store.getState().setIsLspEnriching(false);
          });
        }
      }
    } catch (lspErr) {
      console.warn('[scanRepository] LSP enrichment setup failed (non-fatal):', lspErr.message);
    }
    
    if (onProgress) onProgress(90, 'Finalizing diagram...');

    if (!result.success) {
      throw new Error('Diagram generated but no 3D objects were created. Check Merfolk syntax.');
    }
    
    if (onProgress) onProgress(100, 'Complete!');

    // Return the result instead of showing alert
    return {
      success: true,
      objectsCreated: result.objectsCreated,
      connectionsCreated: result.connectionsCreated,
      storageUrl,
      markdown: merfolkMarkdown,
      contentIndex,
      fileSizes,
      importGraph,
      fileIndexByPath,
      importIndexByFile,
      repoFileContents,
      commitSha,
    };
  } catch (error) {
    console.error('Error generating diagram from repository:', error);
    throw error;
  }
};

// ─── Rescan / Incremental Update Helpers ───────────────────────────────────

export { mergeMerfolkMarkdown } from '../shared/merfolkMerge';

/**
 * Rescan a repository for changes since the last known commit.
 * Uses the GitHub Compare API to fetch only changed files, generates merfolk
 * entries for them, and merges the result into the existing diagram markdown.
 *
 * @param {Object} repo - Repository object (must have repo.owner.login and repo.name)
 * @param {string} lastCommitSha - The commit SHA recorded during the previous scan
 * @param {string|null} existingMarkdown - The existing merfolk markdown (if available)
 * @param {Function} onProgress - Progress callback (progress: 0-100, stage: string)
 * @returns {Promise<Object>} - { noChanges, commitSha, mergedMarkdown, newMarkdown, changedFileCount, addedFiles, modifiedFiles, removedFiles }
 */
export const rescanRepositoryForChanges = async (
  repo,
  lastCommitSha,
  existingMarkdown,
  onProgress = null,
) => {
  const owner = repo.owner.login;
  const repoName = repo.name;

  // 1. Fetch the latest commit SHA
  if (onProgress) onProgress(5, 'Checking for new commits...');
  const currentSha = await fetchLatestCommitSha(owner, repoName);

  if (currentSha === lastCommitSha) {
    return { noChanges: true, commitSha: currentSha };
  }

  // Re-pin the module-level commit ref to the NEW commit BEFORE fetching any
  // file contents. fetchFileContent falls back to this ref when callers don't
  // pass one explicitly (refreshRepoWorkingCopies, read_file, quick_look, ...),
  // so leaving it at the pre-rescan SHA made every read/edit re-anchor to the
  // OLD commit while search (indexed from the rescan's contents) held the new
  // one — the "line numbers don't match my reads" staleness bug.
  repoRefSha = currentSha;

  // 2. Get the list of changed files via Compare API
  if (onProgress) onProgress(15, 'Fetching changes...');
  const changedFiles = await fetchChangedFiles(owner, repoName, lastCommitSha, currentSha);

  // Categorise
  const addedFiles = changedFiles.filter(f => f.status === 'added');
  const modifiedFiles = changedFiles.filter(f => f.status === 'modified' || f.status === 'renamed');
  const removedFiles = changedFiles.filter(f => f.status === 'removed');

  // 3. Keep only supported source files (added + modified)
  const sourceFiles = [...addedFiles, ...modifiedFiles]
    .map(f => {
      const type = getFileTypeFromPath(f.filename);
      return type ? { path: f.filename, name: f.name, type } : null;
    })
    .filter(Boolean);

  if (sourceFiles.length === 0) {
    return {
      noChanges: true,
      commitSha: currentSha,
      message: `No supported source files changed (${changedFiles.length} file(s) changed total)`,
    };
  }

  // 4. Detect repo type from the FULL file list in the existing markdown to
  //    avoid misdetection from only a handful of changed files.  We fetch
  //    package.json once (a single lightweight API call) rather than the
  //    entire repo structure.
  if (onProgress) onProgress(20, 'Detecting project type...');
  const detectedRepoType = await detectRepoType(sourceFiles, (filePath) => fetchFileContent(owner, repoName, filePath));

  // 5. Generate merfolk from only the changed files
  if (onProgress) onProgress(25, `Analyzing ${sourceFiles.length} changed file(s)...`);
  const { markdown: newMerfolkMarkdown, contentIndex: newContentIndex, fileSizes: newFileSizes, importGraph: newImportGraph, repoFileContents: newRepoFileContents } = await generateMerfolkFromRepository(owner, repoName, {
    preFilteredFiles: sourceFiles,
    repoType: detectedRepoType,
    onProgress,
  });

  // 6. Merge into existing markdown (or use the new markdown as-is)
  let mergedMarkdown;
  if (existingMarkdown) {
    mergedMarkdown = mergeMerfolkMarkdown(existingMarkdown, newMerfolkMarkdown);
  } else {
    mergedMarkdown = newMerfolkMarkdown;
  }

  return {
    noChanges: false,
    commitSha: currentSha,
    mergedMarkdown,
    newMerfolk: newMerfolkMarkdown,
    contentIndex: newContentIndex,
    fileSizes: newFileSizes,
    importGraph: newImportGraph,
    repoFileContents: newRepoFileContents || {},
    changedFileCount: sourceFiles.length,
    addedFiles: addedFiles.length,
    modifiedFiles: modifiedFiles.length,
    removedFiles: removedFiles.length,
  };
};

/**
 * In-tab entry point: drives the shared, browser-agnostic scan core
 * (src/shared/scanCore.js) with browser-specific adapters — the server proxy
 * for file fetches, the comlink-wrapped tree-sitter worker, and the CDN-blob
 * TypeScript analyzer. The core itself contains no browser references, so the
 * server-side scanner injects the same seam in Node.
 */
const createBrowserScanDeps = (owner, repoName) => ({
  // (relativePath, ref?) => Promise<string|null> — raw CDN via fetchFileContent.
  fetchFile: (filePath, ref) => fetchFileContent(owner, repoName, filePath, undefined, ref),
  // Mirrors the in-tab tree-sitter dispatch (python has a regex fallback in the
  // core; other languages are best-effort). Mutates the shared ctx collections.
  tsScan: async ({
    language,
    source,
    fileName,
    filePath,
    fileContext,
    elements,
    foundItems,
    fileFunctions,
    moduleImportRelationships,
    functionCallRelationships,
  }) => {
    if (language === 'python') {
      return scanPythonWithTreeSitter(
        source, fileName, filePath, fileContext, elements, foundItems,
        fileFunctions, moduleImportRelationships, functionCallRelationships,
      );
    }
    return scanWithTreeSitter(
      language, source, fileName, filePath, fileContext, elements, foundItems,
      fileFunctions, moduleImportRelationships, functionCallRelationships,
    );
  },
  runTypeScriptAnalysis,
});

/**
 * Generate Merfolk markdown from an entire repository (in-tab path).
 * Delegates to the shared scan core, which both the browser and the server
 * import — guaranteeing the two scan paths can never drift apart.
 */
export const generateMerfolkFromRepository = async (owner, repoName, options = {}) => {
  const legacyOptions = { ...options };
  const deps = createBrowserScanDeps(owner, repoName);

  // Structure is fetched by the wrapper (the core no longer knows how to reach
  // GitHub); preFilteredFiles keeps the rescan fast path working.
  let structure;
  if (legacyOptions.preFilteredFiles) {
    structure = legacyOptions.preFilteredFiles;
  } else {
    structure = await fetchRepositoryStructure(owner, repoName);
  }

  return runRepositoryScan(owner, repoName, {
    ...legacyOptions,
    structure,
    ...deps,
  });
};

