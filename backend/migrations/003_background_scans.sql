-- 003_background_scans.sql
-- Idempotent: background scan jobs + server-only GitHub token storage + space
-- diagram persistence columns.
--
-- The base tables (users, spaces) already exist in the managed database but are
-- NOT recreated by the migrations in this repo, so new columns are added via
-- information_schema guards and all new tables use IF NOT EXISTS.

-- 1. spaces: persist the generated diagram + repo so any device can rehydrate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'markdown_storage_url'
  ) THEN
    ALTER TABLE spaces ADD COLUMN markdown_storage_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'diagram_commit_sha'
  ) THEN
    ALTER TABLE spaces ADD COLUMN diagram_commit_sha TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spaces' AND column_name = 'diagram_repo'
  ) THEN
    ALTER TABLE spaces ADD COLUMN diagram_repo JSONB;
  END IF;
END $$;

-- 2. users: plan tier gates background-scan concurrency (free = 1 active)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tier'
  ) THEN
    ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;

-- 3. Background repository scan jobs.
-- status: queued -> fetching -> parsing -> generating -> uploading -> done
--         (any of the above may transition to failed | cancelled)
CREATE TABLE IF NOT EXISTS scan_jobs (
  id                   UUID PRIMARY KEY,
  owner_id             TEXT NOT NULL,
  space_id             UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  repo_owner           TEXT NOT NULL,
  repo_name            TEXT NOT NULL,
  branch               TEXT,
  sha                  TEXT,
  status               TEXT NOT NULL DEFAULT 'queued'
                       CHECK (status IN (
                         'queued','fetching','parsing','generating',
                         'uploading','done','failed','cancelled'
                       )),
  progress             INT NOT NULL DEFAULT 0,
  stage                TEXT,
  error                TEXT,
  markdown_storage_url TEXT,
  objects_created      INT,
  connections_created  INT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_space_status
  ON scan_jobs(space_id, status);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_owner_active
  ON scan_jobs(owner_id)
  WHERE status IN ('queued','fetching','parsing','generating','uploading');

-- 4. Server-only GitHub access tokens (encrypted at rest).
CREATE TABLE IF NOT EXISTS github_tokens (
  owner_id         TEXT PRIMARY KEY,
  encrypted_token  TEXT NOT NULL,
  github_login     TEXT,
  token_version    INT NOT NULL DEFAULT 1,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);