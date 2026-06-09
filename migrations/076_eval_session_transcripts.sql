-- migrations/076_eval_session_transcripts.sql
-- Phase E-5: 세션 대화록 (STT + AI 요약)

CREATE TABLE IF NOT EXISTS eval_session_transcripts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 uuid REFERENCES clients(id) ON DELETE CASCADE,
  staff_id                  text NOT NULL,
  session_type              text NOT NULL
                            CHECK (session_type IN ('call', 'video', 'visit', 'meeting')),
  duration_sec              integer,
  raw_transcript            text,
  transcript                text,
  ai_summary                text,
  key_points                jsonb,
  consent_given             boolean DEFAULT false,
  linked_call_log_id        uuid,
  linked_service_record_id  uuid,
  session_date              date NOT NULL DEFAULT CURRENT_DATE,
  created_at                timestamptz DEFAULT now()
);

ALTER TABLE eval_session_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_all_transcripts" ON eval_session_transcripts;

CREATE POLICY "staff_all_transcripts"
  ON eval_session_transcripts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_session_transcripts_client_id
  ON eval_session_transcripts (client_id);
CREATE INDEX IF NOT EXISTS idx_session_transcripts_session_date
  ON eval_session_transcripts (session_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_transcripts_linked_call_log
  ON eval_session_transcripts (linked_call_log_id)
  WHERE linked_call_log_id IS NOT NULL;
