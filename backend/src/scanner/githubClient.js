/**
 * githubClient.js
 *
 * Server-side GitHub REST client used by the background scanner. Talks to
 * api.github.com directly with the server-stored token (never shared with the
 * browser). Mirrors the structure / file-shape contract that
 * `src/services/githubRepoService.js` produces in the browser so the shared
 * scan core receives identical inputs on both paths.
 */

import { getTreeSitterLanguage } from '../../../src/shared/scanCore.js';
import { sleep } from './util.js';

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_RETRIES = 3;

const classifyFileType = (filePath) => {
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

export class GithubClient {
  /**
   * @param {object} opts
   * @param {string} opts.token - Server-side GitHub access token (scoped)
   * @param {string} opts.owner - Repository owner
   * @param {string} opts.repo  - Repository name
   * @param {string} [opts.ref] - Optional pinned ref (branch / SHA) to scan
   */
  constructor({ token, owner, repo, ref = null }) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
  }

  async request(path, { query = {}, headers = {}, method = 'GET', body } = {}) {
    const url = new URL(GITHUB_API_BASE + path);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    let attempt = 0;
    for (;;) {
      attempt += 1;
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'hoverchart-scanner',
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if ((res.status === 403 || res.status === 429) && attempt < MAX_RETRIES) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = Math.min((retryAfter ? parseInt(retryAfter, 10) : 2 ** attempt) * 1000, 10_000);
        console.warn(`? GitHub rate-limited (${res.status}), retry ${attempt} in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      return res;
    }
  }

  /** Latest commit SHA for the scanned ref (or the default branch). */
  async latestCommitSha() {
    const path = `/repos/${this.owner}/${this.repo}/commits/${encodeURIComponent(this.ref ?? 'HEAD')}`;
    const res = await this.request(path, { query: { per_page: 1 } });
    if (!res.ok) throw new Error(`GitHub API error fetching commit: ${res.status}`);
    const data = await res.json();
    return data.sha;
  }

  /**
   * Repo file list in the exact `{ path, name, type }` shape the browser
   * fetcher produces — one recursive git-tree call, with the truncation
   * fallback that walks sub-trees when the tree exceeds GitHub's 100k limit.
   */
  async fetchStructure() {
    const commitSha = await this.latestCommitSha();
    const commitRes = await this.request(`/repos/${this.owner}/${this.repo}/git/commits/${commitSha}`);
    if (!commitRes.ok) throw new Error(`GitHub API error fetching commit: ${commitRes.status}`);
    const commitData = await commitRes.json();
    const treeSha = commitData.tree.sha;

    const treeRes = await this.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSha}`, {
      query: { recursive: 1 },
    });
    if (!treeRes.ok) throw new Error(`GitHub API error fetching tree: ${treeRes.status}`);
    const treeData = await treeRes.json();

    const collectBlobs = (items) => {
      const out = [];
      for (const item of items) {
        if (item.type !== 'blob') continue;
        const type = classifyFileType(item.path);
        if (!type) continue;
        out.push({ path: item.path, name: item.path.split('/').pop(), type });
      }
      return out;
    };

    const structure = collectBlobs(treeData.tree || []);

    if (treeData.truncated) {
      console.warn('? Repository tree truncated, fetching sub-trees...');
      const dirs = (treeData.tree || []).filter((i) => i.type === 'tree');
      const subTreeResults = await Promise.all(
        dirs.map(async (dir) => {
          const sub = await this.request(`/repos/${this.owner}/${this.repo}/git/trees/${dir.sha}`, {
            query: { recursive: 1 },
          });
          if (!sub.ok) return [];
          const subData = await sub.json();
          return collectBlobs(subData.tree || []);
        }),
      );
      for (const sub of subTreeResults) structure.push(...sub);
    }

    return structure;
  }

  /**
   * Raw body of a file. Mirrors the browser's raw-CDN-first / contents-API
   * fallback (0 rate-limit cost when a ref is pinned).
   * @returns {Promise<string|null>} null when the file is absent (404)
   */
  async fetchFile(filePath, ref = this.ref) {
    if (ref) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${encodeURIComponent(ref)}/${encodePath(filePath)}`;
        const res = await fetch(rawUrl, { headers: { 'User-Agent': 'hoverchart-scanner' } });
        if (res.ok) return await res.text();
      } catch {
        // network error — fall through to the Contents API
      }
    }

    const apiPath = `/repos/${this.owner}/${this.repo}/contents/${encodePath(filePath)}`;
    const res = await this.request(apiPath, { headers: { Accept: 'application/vnd.github.v3.raw' } });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`⚠️  GitHub API error for ${filePath}: ${res.status}`);
      return null;
    }
    return await res.text();
  }
}

/** Encode each path segment so the Contents API accepts special characters. */
const encodePath = (filePath) => filePath.split('/').map(encodeURIComponent).join('/');