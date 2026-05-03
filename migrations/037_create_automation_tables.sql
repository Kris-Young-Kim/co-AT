-- migrations/037_create_automation_tables.sql
-- Automation execution logs and channel config tables
-- Created: 2026-05-03

-- 1. automation_logs: records every cron/manual run result
CREATE TABLE IF NOT EXISTS automation_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name      text NOT NULL,
  triggered_by  text NOT NULL CHECK (triggered_by IN ('cron', 'manual')),
  status        text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  total_sent    int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  fail_count    int NOT NULL DEFAULT 0,
  channel       text NOT NULL CHECK (channel IN ('in-app', 'email', 'kakao')),
  error_message text,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_job_name   ON automation_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status     ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);

-- 2. automation_channels: channel enable/disable + config
CREATE TABLE IF NOT EXISTS automation_channels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type   text NOT NULL UNIQUE CHECK (channel_type IN ('email', 'kakao')),
  is_enabled     boolean NOT NULL DEFAULT false,
  config         jsonb,
  last_tested_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Seed default channel rows
INSERT INTO automation_channels (channel_type, is_enabled)
VALUES ('email', false), ('kakao', false)
ON CONFLICT (channel_type) DO NOTHING;

-- RLS: ADMIN only
ALTER TABLE automation_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_automation_logs"
  ON automation_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt()->>'sub'
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_all_automation_channels"
  ON automation_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt()->>'sub'
        AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE automation_logs     IS 'Automation job execution history (cron and manual)';
COMMENT ON TABLE automation_channels IS 'Notification channel config (email, kakao)';
