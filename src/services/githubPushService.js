import { useCodeStore } from '../stores';
import {
  getBranchRef,
  createBranchRef,
  multiFileCommit,
  getFileContents,
} from './githubIssuesService';

export async function pushCodeToGitHub(codeBlocks, owner, repoName, branchName, token) {
  const { selectedRepo, selectedBranch } = useCodeStore.getState();

  const finalOwner = owner || useCodeStore.getState().repoOwner || selectedRepo?.owner?.login;
  const finalRepo = repoName || useCodeStore.getState().repoName || selectedRepo?.name;
  const finalBranch = branchName || selectedBranch || 'main';
  const finalToken = token || useCodeStore.getState().githubToken;

  if (!finalToken || !finalOwner || !finalRepo) {
    return { success: false, pushed: 0, errors: [{ error: 'GitHub not connected or no repo selected' }] };
  }

  useCodeStore.getState().setPushStatus('pushing');

  try {
    const blocks = Array.isArray(codeBlocks) ? codeBlocks : [codeBlocks];

    const files = blocks.map(block => ({
      path: block.filePath,
      content: block.code,
    })).filter(f => f.path && f.content);

    if (files.length === 0) {
      useCodeStore.getState().setPushStatus('error');
      return { success: false, pushed: 0, errors: [{ error: 'No valid files to commit' }] };
    }

    const fileList = files.map(f => f.path).join(', ');
    const message = `Code update: ${fileList}\n\nUpdated via Hoverchart`;

    const result = await multiFileCommit(finalToken, finalOwner, finalRepo, finalBranch, files, message);

    if (result.ok) {
      useCodeStore.getState().setPushStatus('success');
      return { success: true, pushed: files.length, errors: [] };
    } else {
      useCodeStore.getState().setPushStatus('error');
      return { success: false, pushed: 0, errors: [{ error: result.error }] };
    }
  } catch (error) {
    useCodeStore.getState().setPushStatus('error');
    return { success: false, pushed: 0, errors: [{ error: error.message }] };
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
