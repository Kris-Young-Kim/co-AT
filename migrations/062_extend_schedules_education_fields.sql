-- Extend schedules table for 교육 (education program) reporting
-- Adds fields needed to populate Sheet 3 of the business performance report

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS education_title          text,
  ADD COLUMN IF NOT EXISTS education_hours          integer,
  ADD COLUMN IF NOT EXISTS education_type           text,
  ADD COLUMN IF NOT EXISTS education_audience_type  text
    CHECK (education_audience_type IN ('at_welfare', 'edu_student', 'guardian', 'government', 'other')),
  ADD COLUMN IF NOT EXISTS education_audience_label text;

COMMENT ON COLUMN schedules.education_title          IS '교육명';
COMMENT ON COLUMN schedules.education_hours          IS '교육 시간 (시간)';
COMMENT ON COLUMN schedules.education_type           IS '구분 (교육요청 / 교육주최)';
COMMENT ON COLUMN schedules.education_audience_type  IS '주 교육 대상자 유형: at_welfare(보조기기/복지담당), edu_student(교육기관 학생/종사자), guardian(보호자), government(정부/공공기관), other(기타)';
COMMENT ON COLUMN schedules.education_audience_label IS '주 교육 대상자 설명 (예: 장애인활동지원사, 시군구 담당자)';
