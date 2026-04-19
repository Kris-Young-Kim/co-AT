-- migrations/025_create_meeting_minutes.sql

-- schedules 테이블 schedule_type에 'meeting' 추가
ALTER TABLE schedules
  DROP CONSTRAINT IF EXISTS schedules_schedule_type_check;

ALTER TABLE schedules
  ADD CONSTRAINT schedules_schedule_type_check
  CHECK (schedule_type IN (
    'visit', 'consult', 'assessment', 'delivery', 'pickup',
    'exhibition', 'education', 'custom_make', 'meeting'
  ));

-- 회의록 테이블
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL DEFAULT 'weekly' CHECK (meeting_type IN (
    'weekly', 'monthly', 'biweekly_policy', 'other'
  )),
  attendees TEXT[] DEFAULT '{}',
  agenda TEXT,
  minutes TEXT,
  action_items JSONB DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_schedule_id ON meeting_minutes(schedule_id);

ALTER TABLE meeting_minutes DISABLE ROW LEVEL SECURITY;
