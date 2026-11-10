// Feedback / issue ticket API.
//
// Used by two surfaces:
//   - The public feedback overlay on the landing page: any signed-in (non-guest)
//     account may open a ticket and comment. The list is scoped server-side to
//     open + in-progress tickets.
//   - The admin dashboard's Feedback section: application admins see every
//     ticket regardless of status and are the only ones who may change a
//     ticket's status.
//
// Author identity is snapshotted onto every row (see migrations/009_feedback.sql)
// so a thread survives the deletion of its author's account.

import { Router } from 'express';
import pool from '../db.js';
import { isAppAdminEmail } from '../auth/admin.js';

export const router = Router();

const VALID_TYPES = new Set(['feedback', 'issue']);
const VALID_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);
// Statuses a non-admin is ever shown or allowed to act on.
const PUBLIC_STATUSES = ['open', 'in_progress'];

const MAX_TITLE = 200;
const MAX_BODY = 5000;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isAdmin = (req) => Boolean(req.user && !req.guest && isAppAdminEmail(req.user.email));

function parsePaging(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT)
  );
  return { page, limit, offset: (page - 1) * limit };
}

// Snapshot the caller's profile for display. Guests never reach here.
function authorFields(user) {
  return [
    user.sub,
    user.name || user.displayName || null,
    user.email || null,
    user.picture || user.photoURL || null,
  ];
}

// Resolve the requested status filter against what the caller is allowed to see.
// Admins may request any subset (or all); everyone else is clamped to the public
// set no matter what they ask for.
function resolveStatuses(req, admin) {
  const raw = String(req.query.status || '').trim();
  if (admin) {
    if (!raw || raw === 'all') return null; // no filter
    const requested = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => VALID_STATUSES.has(s));
    return requested.length > 0 ? requested : null;
  }
  return PUBLIC_STATUSES;
}

// GET /api/feedback/tickets?status=&page=&limit=
// Newest first, with a comment count per ticket.
router.get('/tickets', async (req, res) => {
  const admin = isAdmin(req);
  const { page, limit, offset } = parsePaging(req.query);
  const statuses = resolveStatuses(req, admin);

  try {
    const result = await pool.query(
      `SELECT t.id, t.created_by, t.author_name, t.author_email, t.author_photo_url,
              t.type, t.title, t.body, t.status, t.created_at, t.updated_at,
              COALESCE(c.comment_count, 0) AS comment_count,
              COUNT(*) OVER () AS total_count
       FROM feedback_tickets t
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS comment_count
         FROM feedback_comments fc WHERE fc.ticket_id = t.id
       ) c ON TRUE
       WHERE $1::text[] IS NULL OR t.status = ANY($1::text[])
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [statuses, limit, offset]
    );

    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const tickets = result.rows.map(({ total_count: _total, ...ticket }) => ticket);
    res.json({ tickets, total, page, limit });
  } catch (err) {
    console.error('List feedback tickets error:', err);
    res.status(500).json({ error: 'Failed to list feedback' });
  }
});

// POST /api/feedback/tickets
router.post('/tickets', async (req, res) => {
  if (!req.user || req.guest) {
    return res.status(403).json({ error: 'Sign in to submit feedback' });
  }

  const type = VALID_TYPES.has(req.body?.type) ? req.body.type : 'feedback';
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();

  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (title.length > MAX_TITLE) {
    return res.status(400).json({ error: `Title must be ${MAX_TITLE} characters or fewer` });
  }
  if (!body) return res.status(400).json({ error: 'Description is required' });
  if (body.length > MAX_BODY) {
    return res.status(400).json({ error: `Description must be ${MAX_BODY} characters or fewer` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO feedback_tickets
         (created_by, author_name, author_email, author_photo_url, type, title, body)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [...authorFields(req.user), type, title, body]
    );
    res.status(201).json({ ...result.rows[0], comment_count: 0 });
  } catch (err) {
    console.error('Create feedback ticket error:', err);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// GET /api/feedback/tickets/:id
// A non-admin may only read a ticket that is still open or in progress; a
// resolved/closed ticket 404s for them exactly as if it did not exist.
router.get('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Ticket not found' });

  const admin = isAdmin(req);

  try {
    const ticketResult = await pool.query(
      `SELECT * FROM feedback_tickets WHERE id = $1`,
      [id]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = ticketResult.rows[0];
    if (!admin && !PUBLIC_STATUSES.includes(ticket.status)) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const commentsResult = await pool.query(
      `SELECT id, created_by, author_name, author_email, author_photo_url, body, created_at
       FROM feedback_comments
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({ ...ticket, comments: commentsResult.rows });
  } catch (err) {
    console.error('Get feedback ticket error:', err);
    res.status(500).json({ error: 'Failed to load feedback' });
  }
});

// POST /api/feedback/tickets/:id/comments
router.post('/tickets/:id/comments', async (req, res) => {
  if (!req.user || req.guest) {
    return res.status(403).json({ error: 'Sign in to comment' });
  }

  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Ticket not found' });

  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment is required' });
  if (body.length > MAX_BODY) {
    return res.status(400).json({ error: `Comment must be ${MAX_BODY} characters or fewer` });
  }

  const admin = isAdmin(req);

  try {
    const ticketResult = await pool.query(
      'SELECT id, status FROM feedback_tickets WHERE id = $1',
      [id]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const { status } = ticketResult.rows[0];
    if (!admin && !PUBLIC_STATUSES.includes(status)) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const result = await pool.query(
      `INSERT INTO feedback_comments
         (ticket_id, created_by, author_name, author_email, author_photo_url, body)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_by, author_name, author_email, author_photo_url, body, created_at`,
      [id, ...authorFields(req.user), body]
    );

    await pool.query('UPDATE feedback_tickets SET updated_at = NOW() WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create feedback comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PATCH /api/feedback/tickets/:id
// Status changes are application-admin only.
router.patch('/tickets/:id', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Ticket not found' });

  const { status } = req.body || {};
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({
      error: `status must be one of: ${[...VALID_STATUSES].join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE feedback_tickets SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update feedback ticket error:', err);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});
