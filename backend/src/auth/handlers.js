import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import pool from '../db.js';
import { authenticate, optionalAuth } from './middleware.js';
import { encryptSecret, decryptSecret } from '../security/crypto.js';

export const router = Router();

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { accessToken: googleAccessToken } = req.body;
    if (!googleAccessToken) return res.status(400).json({ error: 'accessToken required' });

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    const { sub, email, name, picture } = await response.json();

    const result = await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         photo_url = EXCLUDED.photo_url,
         updated_at = NOW()
       RETURNING *`,
      [sub, email, name || null, picture || null]
    );

    const user = result.rows[0];
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, name: user.display_name, picture: user.photo_url },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const guestId = `guest_${uuid()}`;
    const accessToken = jwt.sign(
      { sub: guestId, isGuest: true },
      process.env.JWT_GUEST_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ accessToken, userId: guestId });
  } catch (err) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, name: user.display_name, picture: user.photo_url },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, display_name, photo_url, created_at FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/code
router.post('/code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    // Validate the auth code against your database of valid codes
    const result = await pool.query(
      `SELECT * FROM auth_codes WHERE code = $1 AND expires_at > NOW() AND used = false`,
      [code]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    const authCode = result.rows[0];
    await pool.query('UPDATE auth_codes SET used = true WHERE id = $1', [authCode.id]);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [authCode.user_id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, name: user.display_name, picture: user.photo_url },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error('Code exchange error:', err);
    res.status(500).json({ error: 'Code exchange failed' });
  }
});

// POST /api/auth/github/token
// Exchanges the GitHub OAuth code server-side and stores the resulting access
// token encrypted at rest, bound to the authenticated user. The token is never
// returned to the browser (server-only). Requires a real (non-guest) session
// — the GitHub surfaces live behind the login wall, so guests are rejected.
router.post('/github/token', optionalAuth, async (req, res) => {
  try {
    if (!req.user || req.user.isGuest) {
      return res.status(401).json({ error: 'GitHub requires a signed-in account' });
    }

    const { code, redirect_uri, redirectUri } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        ...(redirect_uri || redirectUri ? { redirect_uri: redirect_uri || redirectUri } : {}),
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      return res.status(400).json({ error: 'Failed to get GitHub token', details: data });
    }

    let login = null;
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const userData = await userRes.json();
      login = userData.login || null;
    } catch {
      // login is best-effort; storing the token still succeeds
    }

    await pool.query(
      `INSERT INTO github_tokens (owner_id, encrypted_token, github_login)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_id) DO UPDATE SET
         encrypted_token = EXCLUDED.encrypted_token,
         github_login = COALESCE(EXCLUDED.github_login, github_tokens.github_login),
         token_version = github_tokens.token_version + 1,
         updated_at = NOW()`,
      [req.user.sub, encryptSecret(data.access_token), login]
    );

    res.json({ status: 'connected', github_login: login });
  } catch (err) {
    console.error('GitHub token error:', err);
    res.status(500).json({ error: 'GitHub token exchange failed' });
  }
});

// DELETE /api/auth/github/token
// Disconnects GitHub: revokes the stored token at GitHub (when possible) and
// removes the local record. Callers are authenticated sessions.
router.delete('/github/token', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT encrypted_token FROM github_tokens WHERE owner_id = $1',
      [req.user.sub]
    );
    if (rows.length > 0) {
      try {
        const token = decryptSecret(rows[0].encrypted_token);
        const basic = Buffer.from(
          `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`
        ).toString('base64');
        await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${basic}`,
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({ access_token: token }),
        }).catch(() => {});
      } catch {
        // best-effort revoke
      }
      await pool.query('DELETE FROM github_tokens WHERE owner_id = $1', [req.user.sub]);
    }
    res.json({ disconnected: true });
  } catch (err) {
    console.error('GitHub disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect GitHub' });
  }
});
