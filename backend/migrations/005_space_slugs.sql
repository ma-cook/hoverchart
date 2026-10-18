-- Human-readable, URL-facing space slug (username + space name).
-- The UUID primary key remains the canonical internal identifier; `slug` is a
-- unique, stable alias assigned once at creation and never regenerated.
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_spaces_slug ON spaces(slug);
