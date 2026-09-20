/**
 * Client adapter for the server-side GitHub proxy (/api/github/fetch).
 *
 * The GitHub access token lives server-only; the browser never holds it. Every
 * GitHub API call is routed here and the backend authenticates with the user's
 * stored token. `githubProxyFetch` returns the backend wrapper
 * `{ ok, status, statusText, headers, body }`; `githubProxyRequest` recasts it
 * into a fetch-like Response object so existing callers keep working.
 */
import { loadTokens } from '../api-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function serializeQuery(query) {
  if (query == null || query === '') return '';
  if (typeof query === 'string') return query;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
    else usp.set(key, value);
  }
  return usp.toString();
}

export async function githubProxyFetch(path, opts = {}) {
  const { method = 'GET', query, body, githubHeaders, signal } = opts;
  const { accessToken } = loadTokens();

  const res = await fetch(`${API_BASE}/api/github/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      path,
      method,
      query: serializeQuery(query),
      body,
      headers: githubHeaders,
    }),
    signal,
  });

  if (!res.ok) {
    let message = `GitHub proxy failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
}

export async function githubProxyRequest(path, opts = {}) {
  const data = await githubProxyFetch(path, opts);
  const body = typeof data.body === 'string' ? data.body : JSON.stringify(data.body ?? null);
  return {
    ok: !!data.ok,
    status: data.status,
    statusText: data.statusText,
    headers: {
      get: (name) => data.headers?.[String(name).toLowerCase()] ?? null,
    },
    json: async () => JSON.parse(body),
    text: async () => body,
  };
}