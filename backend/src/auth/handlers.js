import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import pool from '../db.js';

export const router = Router();

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
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
router.post('/github/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        ...(redirectUri && { redirect_uri: redirectUri }),
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      return res.status(400).json({ error: 'Failed to get GitHub token', details: data });
    }

    res.json({ access_token: data.access_token });
  } catch (err) {
    console.error('GitHub token error:', err);
    res.status(500).json({ error: 'GitHub token exchange failed' });
  }
});
