-- Migration: 096_add_meeting_external_other_schedule_types
-- App: admin (schedules table)
-- Created: 2026-06-15

-- Add meeting, external_event, other to schedule_type check constraint
-- Add custom_type_label column for 'other' free-text type

ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_schedule_type_check;

ALTER TABLE schedules
ADD CONSTRAINT schedules_schedule_type_check
CHECK (schedule_type IN (
  'visit', 'consult', 'assessment', 'delivery', 'pickup',
  'exhibition', 'education', 'custom_make',
  'meeting', 'external_event', 'other'
));

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS custom_type_label TEXT;

COMMENT ON COLUMN schedules.custom_type_label IS '기타(other) 유형 선택 시 사용자가 직접 입력한 일정 유형 이름';
