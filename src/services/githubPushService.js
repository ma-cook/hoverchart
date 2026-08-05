import { useCodeStore } from '../stores';
import {
  getBranchRef,
  createBranchRef,
  multiFileCommit,
} from './githubIssuesService';
import { fetchFileContent, getGithubToken } from './githubRepoService';
import { hasSearchReplaceMarkers } from './codeExtractor';

const SEARCH_BLOCK_REGEX = /<<<<<<<\s*SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>\s*REPLACE/g;

export function applySearchReplace(existingContent, llmOutput) {
  const blocks = [];
  let match;
  while ((match = SEARCH_BLOCK_REGEX.exec(llmOutput)) !== null) {
    blocks.push({ search: match[1], replace: match[2] });
  }

  if (blocks.length === 0) return null;

  let result = existingContent;
  for (const { search, replace } of blocks) {
    const idx = result.indexOf(search);
    if (idx === -1) {
      console.warn('[Push] SEARCH block did not match existing content');
      return null;
    }
    result = result.slice(0, idx) + replace + result.slice(idx + search.length);
  }
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
