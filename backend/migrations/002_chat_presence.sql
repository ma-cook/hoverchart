-- 002_chat_presence.sql
-- Idempotent: safely creates the group-chat and presence tables if they are
-- missing (e.g. a space DB that predates this feature). Re-running is a no-op.
-- Mirrors the column layout used by backend/src/ws/chat.js + signaling.js/queries.

CREATE TABLE IF NOT EXISTS chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  display_name TEXT,
  photo_url   TEXT,
  text        TEXT NOT NULL,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_space_time
  ON chat_messages(space_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS user_presence (
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  display_name TEXT,
  photo_url   TEXT,
  is_guest    BOOLEAN DEFAULT false,
  online      BOOLEAN DEFAULT false,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, user_id)
);
