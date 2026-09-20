import { Router } from 'express';
import pool from '../db.js';
import { decryptSecret } from '../security/crypto.js';

export const router = Router();

const GITHUB_API = 'https://api.github.com';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
const FORWARD_HEADERS = new Set(['accept', 'content-type', 'if-match', 'if-none-match']);
const ALLOWED_PREFIXES = ['/repos/', '/user/', '/user', '/graphql']; // '/user' + '/user/' branches swallowed by '/user/' below

function isValidGithubPath(p) {
  if (typeof p !== 'string' || p === '' || p[0] !== '/' || p.length > 1024) return false;
  if (p.includes('\\') || p.includes('@') || p.includes('..') || p.includes('://')) return false;
  for (const prefix of ALLOWED_PREFIXES) {
    if (p === prefix) return true;
    if (prefix.endsWith('/') && p.startsWith(prefix)) return true;
  }
  return false;
}

function buildQuery(query) {
  if (query == null || query === '') return '';
  if (typeof query === 'string') return query;
  if (typeof query === 'object') {
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
      else usp.set(key, value);
    }
    return usp.toString();
  }
  return '';
}

async function getServerToken(ownerId) {
  const { rows } = await pool.query(
    'SELECT encrypted_token FROM github_tokens WHERE owner_id = $1',
    [ownerId]
  );
  if (rows.length === 0) return null;
  try {
    return decryptSecret(rows[0].encrypted_token);
  } catch (err) {
    console.error('Failed to decrypt GitHub token:', err.message);
    return null;
  }
}

// Guard: GitHub features require a real (non-guest) signed-in account with a
// stored server-side token.
function requireConnected(req, res) {
  if (!req.user || req.user.isGuest) {
    res.status(401).json({ error: 'GitHub requires a signed-in account' });
    return false;
  }
  return true;
}

// GET /api/github/status — is the current user connected to GitHub?
router.get('/status', async (req, res) => {
  if (!requireConnected(req, res)) return;
  try {
    const { rows } = await pool.query(
      'SELECT github_login FROM github_tokens WHERE owner_id = $1',
      [req.user.sub]
    );
    res.json({ connected: rows.length > 0, github_login: rows[0]?.github_login || null });
  } catch (err) {
    console.error('GitHub status error:', err);
    res.status(500).json({ error: 'Failed to check GitHub status' });
  }
});

// POST /api/github/fetch — host-allow-listed forwarder to api.github.com.
// The client supplies { path, method, query, body, headers }; the server
// authenticates with the user's stored token. No client-supplied auth ever
// reaches GitHub.
router.post('/fetch', async (req, res) => {
  if (!requireConnected(req, res)) return;

  const { path: ghPath, method = 'GET', query, body, headers } = req.body || {};
  const httpMethod = String(method).toUpperCase();
  if (!ALLOWED_METHODS.has(httpMethod)) {
    return res.status(400).json({ error: 'Unsupported method' });
  }
  if (!isValidGithubPath(ghPath)) {
    return res.status(400).json({ error: 'Invalid or disallowed GitHub path' });
  }

  const token = await getServerToken(req.user.sub);
  if (!token) return res.status(401).json({ error: 'GitHub not connected' });

  const qs = buildQuery(query);
  const url = `${GITHUB_API}${ghPath}${qs ? `?${qs}` : ''}`;

  const fwdHeaders = { Authorization: `Bearer ${token}` };
  if (headers && typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) {
      const lower = String(k).toLowerCase();
      if (FORWARD_HEADERS.has(lower) && v) fwdHeaders[k] = v;
    }
  }
  if (httpMethod !== 'GET' && !Object.keys(fwdHeaders).some((h) => h.toLowerCase() === 'content-type')) {
    fwdHeaders['Content-Type'] = 'application/json';
  }

  try {
    const upstream = await fetch(url, {
      method: httpMethod,
      headers: fwdHeaders,
      body:
        body === undefined || body === null
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
    });
    const upstreamText = await upstream.text();
    const link = upstream.headers.get('Link') || '';
    res.json({
      ok: upstream.ok,
      status: upstream.status,
      statusText: upstream.statusText,
      headers: { link },
      body: upstreamText,
    });
  } catch (err) {
    console.error('GitHub proxy error:', err.message);
    res.status(502).json({ error: 'GitHub proxy request failed' });
  }
});