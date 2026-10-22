ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS repo_contents_storage_url TEXT;

ALTER TABLE scan_jobs
  ADD COLUMN IF NOT EXISTS repo_contents_storage_url TEXT;
