-- Migration: 089_create_eval_session_transcripts
-- App: eval
-- Created: 2026-06-12

-- ============================================================
-- Table: eval_session_transcripts
-- STT 녹취 대화록 저장 (음성 상담·방문 기록 → 텍스트·AI 요약)
-- ============================================================
CREATE TABLE IF NOT EXISTS eval_session_transcripts (
  id                        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id                 uuid        REFERENCES clients(id) ON DELETE SET NULL,
  staff_id                  text,
  session_type              text        NOT NULL CHECK (session_type IN ('call', 'video', 'visit', 'meeting')),
  session_date              date        NOT NULL,
  duration_sec              integer,
  transcript                text        NOT NULL,
  raw_transcript            text,
  ai_summary                text,
  key_points                jsonb,
  consent_given             boolean     DEFAULT false NOT NULL,
  linked_call_log_id        uuid        REFERENCES call_logs(id) ON DELETE SET NULL,
  linked_service_record_id  uuid        REFERENCES eval_service_records(id) ON DELETE SET NULL,
  created_at                timestamptz DEFAULT now() NOT NULL,
  updated_at                timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE eval_session_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "staff can read transcripts"
  ON eval_session_transcripts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff can insert transcripts"
  ON eval_session_transcripts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "staff can update own transcripts"
  ON eval_session_transcripts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eval_session_transcripts_client_id
  ON eval_session_transcripts (client_id);

CREATE INDEX IF NOT EXISTS idx_eval_session_transcripts_session_date
  ON eval_session_transcripts (session_date DESC);

CREATE INDEX IF NOT EXISTS idx_eval_session_transcripts_linked_call_log
  ON eval_session_transcripts (linked_call_log_id)
  WHERE linked_call_log_id IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_eval_session_transcripts
  BEFORE UPDATE ON eval_session_transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
