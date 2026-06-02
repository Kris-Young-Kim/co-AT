-- Migration: 066_add_satisfaction_score
-- App: eval
-- Created: 2026-06-03
-- Reason: Track service satisfaction score (1-5) and optional comment per service record.
--         Feeds into stats EvalScoreWidget 서비스효과성 (5점) calculation.

ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER
    CHECK (satisfaction_score BETWEEN 1 AND 5);

ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT;

COMMENT ON COLUMN eval_service_records.satisfaction_score    IS '서비스 만족도 점수 (1=매우불만족 ~ 5=매우만족) — 종결 시 기록';
COMMENT ON COLUMN eval_service_records.satisfaction_comment  IS '만족도 코멘트 (선택)';

CREATE INDEX IF NOT EXISTS idx_eval_sr_satisfaction
  ON eval_service_records(application_year, satisfaction_score)
  WHERE satisfaction_score IS NOT NULL;
