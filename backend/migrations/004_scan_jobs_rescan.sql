-- 004_scan_jobs_rescan.sql
-- Idempotent: diff-only rescan support for scan_jobs. Reuses the existing
-- `sha` column (head commit scanned); adds base commit, rescan flag and the
-- number of changed files processed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scan_jobs' AND column_name = 'base_commit_sha'
  ) THEN
    ALTER TABLE scan_jobs ADD COLUMN base_commit_sha TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scan_jobs' AND column_name = 'is_rescan'
  ) THEN
    ALTER TABLE scan_jobs ADD COLUMN is_rescan BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scan_jobs' AND column_name = 'changed_file_count'
  ) THEN
    ALTER TABLE scan_jobs ADD COLUMN changed_file_count INT;
  END IF;
END $$;