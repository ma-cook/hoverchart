-- 009_feedback.sql
-- Idempotent: user-submitted feedback tickets and their comment threads.
--
-- Author identity is snapshotted (name/email/photo) rather than joined from
-- `users` so a thread stays readable after its author is deleted. `created_by`
-- is deliberately NOT a foreign key, mirroring chat_messages.user_id: the
-- platform's admin user-deletion flow (api/admin.js) deletes from `users`
-- directly and would otherwise fail on a dependent row.

CREATE TABLE IF NOT EXISTS feedback_tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by        TEXT,
  author_name       TEXT,
  author_email      TEXT,
  author_photo_url  TEXT,
  type              TEXT NOT NULL DEFAULT 'feedback'
                    CHECK (type IN ('feedback', 'issue')),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status
  ON feedback_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS feedback_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id         UUID NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
  created_by        TEXT,
  author_name       TEXT,
  author_email      TEXT,
  author_photo_url  TEXT,
  body              TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_ticket
  ON feedback_comments(ticket_id, created_at ASC);
