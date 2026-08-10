import { useCodeStore } from '../stores';
import {
  getBranchRef,
  createBranchRef,
  multiFileCommit,
} from './githubIssuesService';
import { fetchFileContent, getGithubToken } from './githubRepoService';
import { hasSearchReplaceMarkers } from './codeExtractor';

export { hasSearchReplaceMarkers };

const SEARCH_BLOCK_REGEX = /<<<<<<<\s*SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>\s*REPLACE/g;

export function parseSearchReplaceBlocks(llmOutput) {
  const blocks = [];
  let match;
  while ((match = SEARCH_BLOCK_REGEX.exec(llmOutput)) !== null) {
    blocks.push({ search: match[1], replace: match[2] });
  }
  return blocks;
}

export function applySearchReplace(existingContent, llmOutput) {
  const blocks = parseSearchReplaceBlocks(llmOutput);

  if (blocks.length === 0) return null;

  // Reconcile line endings: the repo snapshot (csState.repoFileContents / GitHub
  // fetch) can be CRLF while SEARCH blocks are LF-normalized (the read_file
  // pipeline and the harness's synthesized patches strip \r\n). Normalize both
  // sides so a hunk matches regardless of the snapshot's line endings.
  const normalized = existingContent.replace(/\r\n/g, '\n');
  const existingLines = normalized.split('\n').length;
  let result = normalized;
  for (const { search, replace } of blocks) {
    const normSearch = search.replace(/\r\n/g, '\n');
    // Refuse whole-file SEARCH blocks. When the model cannot or will not use the
    // edit tool it sometimes dumps an ENTIRE existing file as the SEARCH side,
    // which this function would otherwise silently splice over the real file,
    // deleting every unrelated line. A SEARCH block covering ~80%+ of the file
    // is a whole-file rewrite, not a targeted edit — reject it so the raw block
    // is kept for review instead of destroying code.
    const searchLines = normSearch.split('\n').length;
    if (existingLines > 0 && searchLines / existingLines >= 0.8) {
      console.warn(`[Push] Refusing whole-file SEARCH block (${searchLines}/${existingLines} lines) — keep to the exact changed lines`);
      return null;
    }
    const idx = result.indexOf(normSearch);
    if (idx === -1) {
      console.warn('[Push] SEARCH block did not match existing content');
      return null;
    }
    result = result.slice(0, idx) + replace + result.slice(idx + normSearch.length);
  }

  // Preserve the original file's line endings: the repo snapshot (and GitHub
  // fetch) can be CRLF while SEARCH/REPLACE hunks are LF-normalized. Emit the
  // applied result in the file's dominant EOL so the pending diff and the pushed
  // blob match the repo instead of showing a spurious full-file rewrite.
  const eol = existingContent.includes('\r\n') ? '\r\n' : '\n';
  if (eol === '\r\n') result = result.replace(/\n/g, '\r\n');
  return result;
}

export async function pushCodeToGitHub(codeBlocks, owner, repoName, branchName, token, commitMessage) {
  const { selectedRepo, selectedBranch } = useCodeStore.getState();

  const finalOwner = owner || useCodeStore.getState().repoOwner || selectedRepo?.owner?.login;
  const finalRepo = repoName || useCodeStore.getState().repoName || selectedRepo?.name;
  const finalBranch = branchName || selectedBranch || 'main';
  const finalToken = token || useCodeStore.getState().githubToken || getGithubToken();

  if (!finalToken || !finalOwner || !finalRepo) {
    return { success: false, pushed: 0, errors: [{ error: 'GitHub not connected or no repo selected' }], merged: {} };
  }

  useCodeStore.getState().setPushStatus('pushing');

  try {
    const blocks = Array.isArray(codeBlocks) ? codeBlocks : [codeBlocks];
    const files = [];
    const merged = {};
    const skipped = [];

    for (const block of blocks) {
      if (!block.filePath || !block.code) continue;

      let existingContent = await fetchFileContent(finalOwner, finalRepo, block.filePath, finalToken);

      if (!existingContent) {
        const cs = useCodeStore.getState();
        if (cs.repoFileContents && cs.repoFileContents[block.filePath]) {
          existingContent = cs.repoFileContents[block.filePath];
        }
      }

      const isKnownFile = existingContent !== null;

      // Full-content blocks arrive with SEARCH/REPLACE already applied by the
      // code-gen pipeline (SpaceChat), so trust the proposed file as-is.
      if (block.fullContent) {
        if (!existingContent) {
          skipped.push({ path: block.filePath, error: 'File not found in repo — cannot apply full content' });
          continue;
        }
        files.push({ path: block.filePath, content: block.code });
        merged[block.filePath] = block.code;
        continue;
      }

      if (isKnownFile && !hasSearchReplaceMarkers(block.code)) {
        skipped.push({
          path: block.filePath,
          error: `Existing file "${block.filePath}" must use SEARCH/REPLACE markers — outputting the full file will lose code. Use <<<<<<< SEARCH / >>>>>>> REPLACE markers with the exact existing code.`,
        });
        continue;
      }

      if (hasSearchReplaceMarkers(block.code)) {
        if (!existingContent) {
          skipped.push({ path: block.filePath, error: 'File not found in repo — cannot apply SEARCH/REPLACE' });
          continue;
        }
        const result = applySearchReplace(existingContent, block.code);
        if (result) {
          files.push({ path: block.filePath, content: result });
          merged[block.filePath] = result;
          continue;
        }
        skipped.push({
          path: block.filePath,
          error: `SEARCH/REPLACE did not match existing content for ${block.filePath} — refusing to overwrite`,
        });
        continue;
      } else {
        files.push({ path: block.filePath, content: block.code });
        merged[block.filePath] = block.code;
      }
    }

    if (files.length === 0) {
      useCodeStore.getState().setPushStatus('error');
      const errMsg = skipped.length > 0 ? skipped.map(s => `${s.path}: ${s.error}`).join('; ') : 'No valid files to commit';
      return { success: false, pushed: 0, errors: [{ error: errMsg }], merged: {} };
    }

    const fileList = files.map(f => f.path).join(', ');
    const message = commitMessage
      ? `${commitMessage}\n\n${fileList}\nGenerated via Hoverchart`
      : `Code update: ${fileList}\n\nUpdated via Hoverchart`;

    const result = await multiFileCommit(finalToken, finalOwner, finalRepo, finalBranch, files, message);

    if (result.ok) {
      useCodeStore.getState().setPushStatus('success');
      return { success: true, pushed: files.length, errors: skipped, merged };
    } else {
      useCodeStore.getState().setPushStatus('error');
      return { success: false, pushed: 0, errors: [{ error: result.error }, ...skipped], merged: {} };
    }
  } catch (error) {
    useCodeStore.getState().setPushStatus('error');
    return { success: false, pushed: 0, errors: [{ error: error.message }], merged: {} };
  }
}

export async function connectRepo(token, repo) {
  useCodeStore.getState().setGithubToken(token);
  useCodeStore.getState().setSelectedRepo(repo);
  useCodeStore.getState().setGithubConnected(true);

  const owner = repo.owner?.login;
  const name = repo.name;

  const mainRef = await getBranchRef(token, owner, name, 'main');
  if (mainRef.ok) {
    useCodeStore.getState().setRepoOwner(owner);
    useCodeStore.getState().setRepoName(name);
    useCodeStore.getState().setSelectedBranch('main');
    return { ok: true, data: mainRef.data };
  }

  const defaultBranch = repo.default_branch || 'master';
  const fallbackRef = await getBranchRef(token, owner, name, defaultBranch);
  if (fallbackRef.ok) {
    useCodeStore.getState().setRepoOwner(owner);
    useCodeStore.getState().setRepoName(name);
    useCodeStore.getState().setSelectedBranch(defaultBranch);
    return { ok: true, data: fallbackRef.data };
  }

  return { ok: false, error: 'Could not find any branch in repository' };
}

export async function listBranches(token, owner, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    return { ok: false, data: null, error: `${response.status}: ${response.statusText}` };
  }

  const data = await response.json();
  return { ok: true, data: data.map(b => b.name), error: null };
}

export async function switchBranch(token, owner, repo, branch) {
  const ref = await getBranchRef(token, owner, repo, branch);
  if (!ref.ok) {
    return { ok: false, error: ref.error || 'Branch not found' };
  }

  useCodeStore.getState().setSelectedBranch(branch);
  return { ok: true, data: ref.data };
}

export async function createNewBranch(token, owner, repo, newBranch, sourceBranch = 'main') {
  const sourceRef = await getBranchRef(token, owner, repo, sourceBranch);
  if (!sourceRef.ok) {
    return { ok: false, error: `Source branch '${sourceBranch}' not found: ${sourceRef.error}` };
  }

  const sha = sourceRef.data.object.sha;
  const result = await createBranchRef(token, owner, repo, newBranch, sha);
  if (result.ok) {
    useCodeStore.getState().setSelectedBranch(newBranch);
    return { ok: true, data: result.data };
  }
  return result;
}
