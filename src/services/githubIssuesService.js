const GITHUB_API = 'https://api.github.com';

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
    return { ok: false, data: null, error: `${response.status}: ${error}` };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, data, error: null };
}

export async function createIssue(token, owner, repo, { title, body }) {
  return githubFetch(token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  });
}

export async function assignCopilotToIssue(token, owner, repo, issueNumber) {
  return githubFetch(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/assignees`,
    {
      method: 'POST',
      body: JSON.stringify({ assignees: ['copilot'] }),
    }
  );
}

export async function getIssue(token, owner, repo, issueNumber) {
  return githubFetch(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`
  );
}

export async function findPullRequestForIssue(token, owner, repo, issueNumber) {
  const result = await githubFetch(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=100`
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
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify({ event: 'APPROVE' }),
    }
  );
}

export async function mergePullRequest(token, owner, repo, prNumber) {
  return githubFetch(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}/merge`,
    {
      method: 'PUT',
      body: JSON.stringify({ merge_method: 'squash' }),
    }
  );
}

export async function getPullRequest(token, owner, repo, prNumber) {
  return githubFetch(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}`
  );
}
