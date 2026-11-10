ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS shared_with_orgs JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
