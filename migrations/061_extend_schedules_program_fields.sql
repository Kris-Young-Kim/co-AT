-- Extend schedules table for 체험프로그램 (experience/exhibition program) reporting
-- Adds fields needed to populate Sheet 2 of the business performance report

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS participant_count  integer,
  ADD COLUMN IF NOT EXISTS reception_method   text,
  ADD COLUMN IF NOT EXISTS visitor_org_name   text,
  ADD COLUMN IF NOT EXISTS visitor_org_type   text
    CHECK (visitor_org_type IN ('government', 'education', 'welfare', 'medical', 'individual', 'other'));

COMMENT ON COLUMN schedules.participant_count IS '체험 참가 인원 수 (명)';
COMMENT ON COLUMN schedules.reception_method  IS '접수 방법 (방문, 연락, 이메일 등)';
COMMENT ON COLUMN schedules.visitor_org_name  IS '방문 기관명';
COMMENT ON COLUMN schedules.visitor_org_type  IS '방문 기관 유형: government(정부/공공), education(교육), welfare(복지/비영리), medical(의료), individual(개인), other(기타)';
