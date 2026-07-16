const GITHUB_API = 'https://api.github.com';

function enc(s) {
  return encodeURIComponent(s);
}

async function githubFetch(token, url, options = {}) {
  const response = await fetch(`${GITHUB_API}${url}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    return { ok: false, data: null, error: `${response.status}: ${error}`, status: response.status };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, data, error: null, status: response.status };
}

export async function createIssue(token, owner, repo, { title, body }) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  });
}

export async function assignCopilotToIssue(token, owner, repo, issueNumber) {
  return githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/issues/${issueNumber}/assignees`,
    {
      method: 'POST',
      body: JSON.stringify({ assignees: ['copilot'] }),
    }
  );
}

export async function getIssue(token, owner, repo, issueNumber) {
  return githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/issues/${issueNumber}`
  );
}

export async function findPullRequestForIssue(token, owner, repo, issueNumber) {
  const result = await githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/pulls?state=open&per_page=100`
  );

  if (!result.ok) return result;

  const issueRef = `#${issueNumber}`;
  const pr = result.data.find(
    (p) =>
      (p.body && p.body.includes(issueRef)) ||
      (p.title && p.title.includes(issueRef)) ||
      (p.body && p.body.toLowerCase().includes(`closes ${issueRef}`)) ||
      (p.body && p.body.toLowerCase().includes(`fixes ${issueRef}`)) ||
      (p.body && p.body.toLowerCase().includes(`resolves ${issueRef}`))
  );

  return { ok: true, data: pr || null, error: null };
}

export async function approvePullRequest(token, owner, repo, prNumber) {
  return githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify({ event: 'APPROVE' }),
    }
  );
}

export async function mergePullRequest(token, owner, repo, prNumber) {
  return githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}/merge`,
    {
      method: 'PUT',
      body: JSON.stringify({ merge_method: 'squash' }),
    }
  );
}

export async function getPullRequest(token, owner, repo, prNumber) {
  return githubFetch(
    token,
    `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}`
  );
}

export async function getRepoInfo(token, owner, repo) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}`);
}

export async function getBranchRef(token, owner, repo, branch) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/ref/heads/${enc(branch)}`);
}

export async function createBranchRef(token, owner, repo, branch, sha) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}

export async function deleteBranchRef(token, owner, repo, branch) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/refs/heads/${enc(branch)}`, {
    method: 'DELETE',
  });
}

export async function getFileContents(token, owner, repo, path, branch) {
  const query = branch ? `?ref=${enc(branch)}` : '';
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/contents/${path}${query}`);
}

export async function getRepoTree(token, owner, repo, branch) {
  const ref = branch || 'main';
  const refResult = await githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/ref/heads/${enc(ref)}`);
  if (!refResult.ok) return refResult;

  const commitSha = refResult.data?.object?.sha;
  if (!commitSha) return { ok: false, data: null, error: 'Could not resolve branch to commit SHA' };

  const commitResult = await githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/commits/${commitSha}`);
  if (!commitResult.ok) return commitResult;

  const treeSha = commitResult.data?.tree?.sha;
  if (!treeSha) return { ok: false, data: null, error: 'Could not resolve commit to tree SHA' };

  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/trees/${treeSha}?recursive=1`);
}

export async function createFileOnBranch(token, owner, repo, path, content, branch, message, sha) {
  const payload = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  };
  if (sha) payload.sha = sha;
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createTree(token, owner, repo, baseTreeSha, files) {
  const tree = files.map(f => ({
    path: f.path,
    mode: '100644',
    type: 'blob',
    content: f.content,
  }));

  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
}

export async function createCommit(token, owner, repo, message, treeSha, parentCommitSha) {
  const payload = {
    message,
    tree: treeSha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };

  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/commits`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRef(token, owner, repo, refName, commitSha) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/refs/heads/${enc(refName)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha, force: false }),
  });
}

export async function multiFileCommit(token, owner, repo, branch, files, message) {
  const refResult = await githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/ref/heads/${enc(branch)}`);
  if (!refResult.ok) return { ok: false, error: `Could not resolve branch: ${refResult.error}` };

  const commitSha = refResult.data.object.sha;

  const commitResult = await githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/commits/${commitSha}`);
  if (!commitResult.ok) return { ok: false, error: `Could not get commit: ${commitResult.error}` };

  const baseTreeSha = commitResult.data.tree.sha;

  const treeResult = await createTree(token, owner, repo, baseTreeSha, files);
  if (!treeResult.ok) return { ok: false, error: `Could not create tree: ${treeResult.error}` };

  const newCommitResult = await createCommit(token, owner, repo, message, treeResult.data.sha, commitSha);
  if (!newCommitResult.ok) return { ok: false, error: `Could not create commit: ${newCommitResult.error}` };

  const updateResult = await updateRef(token, owner, repo, branch, newCommitResult.data.sha);
  if (!updateResult.ok) return { ok: false, error: `Could not update ref: ${updateResult.error}` };

  return { ok: true, data: { sha: newCommitResult.data.sha, message }, error: null };
}

export async function createPullRequest(token, owner, repo, { title, body, head, base }) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head, base }),
  });
}

export async function addComment(token, owner, repo, issueOrPrNumber, body) {
  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/issues/${issueOrPrNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function enableAutoMerge(token, pullRequestNodeId, mergeMethod = 'SQUASH') {
  const query = `
    mutation EnableAutoMerge($prId: ID!, $method: PullRequestMergeMethod!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $prId, mergeMethod: $method }) {
        pullRequest { autoMergeRequest { enabledAt mergeMethod } }
      }
    }
  `;
  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { prId: pullRequestNodeId, method: mergeMethod },
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    return { ok: false, data: null, error: `${response.status}: ${error}` };
  }

  const data = await response.json();
  if (data.errors) {
    return { ok: false, data: null, error: data.errors[0]?.message || 'GraphQL error' };
  }
  return { ok: true, data: data.data, error: null };
}

export async function revertCommit(token, owner, repo, commitSha, branch = 'main') {
  const commitRes = await githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/commits/${enc(commitSha)}`);
  if (!commitRes.ok) return commitRes;

  const parentSha = commitRes.data?.parents?.[0]?.sha;
  if (!parentSha) {
    return { ok: false, data: null, error: 'No parent commit found' };
  }

  return githubFetch(token, `/repos/${enc(owner)}/${enc(repo)}/git/refs/heads/${enc(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: parentSha, force: true }),
  });
}
