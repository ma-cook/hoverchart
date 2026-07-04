CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT,
  display_name TEXT,
  photo_url   TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Spaces
CREATE TABLE spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  is_public   BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spaces_owner ON spaces(owner_id);

-- 3. Spatial cells
CREATE TABLE spatial_cells (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  x           INTEGER NOT NULL,
  y           INTEGER NOT NULL,
  z           INTEGER NOT NULL,
  bounds      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, id)
);

-- 4. Objects
CREATE TABLE objects (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  cell_id     TEXT NOT NULL,
  cell_x      INTEGER NOT NULL,
  cell_y      INTEGER NOT NULL,
  cell_z      INTEGER NOT NULL,
  position    REAL[] NOT NULL,
  scale       REAL[] DEFAULT '{1,1,1}',
  rotation    REAL[] DEFAULT '{0,0,0}',
  type        TEXT NOT NULL,
  color       TEXT,
  content     TEXT,
  header_text TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, cell_id, id)
);
CREATE INDEX idx_objects_space_cell ON objects(space_id, cell_id);
CREATE INDEX idx_objects_cell_coords ON objects(space_id, cell_x, cell_y, cell_z);

-- 5. Connections
CREATE TABLE connections (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  cell_id     TEXT NOT NULL,
  start_obj   TEXT NOT NULL,
  end_obj     TEXT NOT NULL,
  start_data  JSONB,
  end_data    JSONB,
  line_style  TEXT DEFAULT 'straight',
  color       TEXT DEFAULT '#000000',
  text        TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, cell_id, id)
);
CREATE INDEX idx_connections_space_cell ON connections(space_id, cell_id);

-- 6. Chat messages
CREATE TABLE chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  user_id     TEXT,
  display_name TEXT,
  photo_url   TEXT,
  text        TEXT NOT NULL,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_space_time ON chat_messages(space_id, timestamp DESC);

-- 7. User presence
CREATE TABLE user_presence (
  space_id    UUID NOT NULL REFERENCES spaces(id),
  user_id     TEXT NOT NULL,
  display_name TEXT,
  photo_url   TEXT,
  is_guest    BOOLEAN DEFAULT false,
  online      BOOLEAN DEFAULT false,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, user_id)
);

-- 8. Organizations
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_id      TEXT NOT NULL REFERENCES users(id),
  plan          TEXT DEFAULT 'free',
  member_limit  INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  role        TEXT DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE org_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  email       TEXT NOT NULL,
  invited_by  TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_org_invites_email ON org_invites(email, status);

-- 9. Updates (admin announcements)
CREATE TABLE updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
