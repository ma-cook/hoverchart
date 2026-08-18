-- Plan overlay: shared collaborative task plans per space

CREATE TABLE plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Plan',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_plans_space ON plans(space_id);

CREATE TABLE plan_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  space_id     UUID NOT NULL REFERENCES spaces(id),
  user_id      TEXT NOT NULL,
  user_name    TEXT NOT NULL,
  user_picture TEXT,
  text         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'completed')),
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_plan_tasks_plan ON plan_tasks(plan_id);
CREATE INDEX idx_plan_tasks_space ON plan_tasks(space_id);
