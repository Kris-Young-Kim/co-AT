-- Migration: 090_create_eval_case_records
-- App: eval
-- Created: 2026-06-13
-- Replaces SOAP format with center-specific 상담기록지 / 평가지 forms

-- ============================================================
-- Table: eval_consultation_records (상담기록지)
-- ============================================================
CREATE TABLE IF NOT EXISTS eval_consultation_records (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id      uuid        REFERENCES applications(id) ON DELETE SET NULL,
  consultation_date   date        NOT NULL DEFAULT CURRENT_DATE,
  consultation_type   text        NOT NULL DEFAULT '내방',  -- 내방/방문/전화/화상/기타
  consultant          text,
  purpose             text,   -- 방문·상담 목적 / 주호소
  current_situation   text,   -- 현재 상황
  content             text,   -- 상담 내용
  result              text,   -- 결과 및 조치사항
  next_plan           text,   -- 향후 계획
  ai_generated        boolean     NOT NULL DEFAULT false,
  created_by          text,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE eval_consultation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read consultation records"
  ON eval_consultation_records FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff can insert consultation records"
  ON eval_consultation_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "staff can update consultation records"
  ON eval_consultation_records FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff can delete consultation records"
  ON eval_consultation_records FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX ON eval_consultation_records (client_id);
CREATE INDEX ON eval_consultation_records (consultation_date DESC);

-- ============================================================
-- Table: eval_assessment_notes (평가지)
-- ============================================================
CREATE TABLE IF NOT EXISTS eval_assessment_notes (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id      uuid        REFERENCES applications(id) ON DELETE SET NULL,
  assessment_date     date        NOT NULL DEFAULT CURRENT_DATE,
  assessor            text,
  physical_function   text,   -- 신체기능 평가
  cognitive_function  text,   -- 인지기능 평가
  environment         text,   -- 환경 요인
  device_needs        text,   -- 보조기기 필요도
  recommendations     text,   -- 추천 사항
  notes               text,   -- 비고
  ai_generated        boolean     NOT NULL DEFAULT false,
  created_by          text,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE eval_assessment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read assessment notes"
  ON eval_assessment_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff can insert assessment notes"
  ON eval_assessment_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "staff can update assessment notes"
  ON eval_assessment_notes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff can delete assessment notes"
  ON eval_assessment_notes FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX ON eval_assessment_notes (client_id);
CREATE INDEX ON eval_assessment_notes (assessment_date DESC);

-- ============================================================
-- Shared updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_eval_case_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_eval_consultation_records_updated_at
  BEFORE UPDATE ON eval_consultation_records
  FOR EACH ROW EXECUTE FUNCTION update_eval_case_records_updated_at();

CREATE TRIGGER set_eval_assessment_notes_updated_at
  BEFORE UPDATE ON eval_assessment_notes
  FOR EACH ROW EXECUTE FUNCTION update_eval_case_records_updated_at();
