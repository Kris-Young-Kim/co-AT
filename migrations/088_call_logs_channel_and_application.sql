-- Migration: 088_call_logs_channel_and_application
-- App: shared (call_logs)
-- Created: 2026-06-12

-- ============================================================
-- Add channel + application_id to call_logs
-- channel: tracks intake source (phone / web / chatbot)
-- application_id: optional FK to the application created from this log
-- ============================================================

ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS channel TEXT
    CHECK (channel IN ('phone', 'web', 'chatbot')),
  ADD COLUMN IF NOT EXISTS application_id UUID
    REFERENCES applications(id) ON DELETE SET NULL;

-- Default existing rows to 'phone' (historical call logs)
UPDATE call_logs
  SET channel = 'phone'
  WHERE channel IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_channel ON call_logs (channel);
CREATE INDEX IF NOT EXISTS idx_call_logs_application_id ON call_logs (application_id);

COMMENT ON COLUMN call_logs.channel IS '접수 채널: phone(유선), web(온라인 신청), chatbot(AI 챗봇)';
COMMENT ON COLUMN call_logs.application_id IS '이 접수로 생성된 applications.id (선택)';
