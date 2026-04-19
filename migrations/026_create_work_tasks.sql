-- migrations/026_create_work_tasks.sql

CREATE TABLE IF NOT EXISTS work_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee_id TEXT,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee ON work_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_due_date ON work_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_work_tasks_sort_order ON work_tasks(status, sort_order);

ALTER TABLE work_tasks DISABLE ROW LEVEL SECURITY;
