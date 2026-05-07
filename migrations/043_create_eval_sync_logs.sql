-- migrations/043_create_eval_sync_logs.sql
CREATE TABLE IF NOT EXISTS eval_sync_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_type   TEXT NOT NULL CHECK (sheet_type IN ('call_log', 'service_record')),
  status       TEXT NOT NULL CHECK (status IN ('success', 'error')),
  rows_added   INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  error_msg    TEXT,
  synced_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read eval_sync_logs"
  ON eval_sync_logs FOR SELECT USING (true);

CREATE POLICY "service role can insert eval_sync_logs"
  ON eval_sync_logs FOR INSERT WITH CHECK (true);

COMMENT ON TABLE eval_sync_logs IS 'Google Sheets 동기화 실행 이력';
