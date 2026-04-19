-- migrations/027_create_event_roles.sql

CREATE TABLE IF NOT EXISTS event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  assignee_name TEXT NOT NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_roles_schedule_id ON event_roles(schedule_id);

ALTER TABLE event_roles DISABLE ROW LEVEL SECURITY;
