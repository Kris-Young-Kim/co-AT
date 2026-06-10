-- 대상자 다중 서비스 케이스 구조
CREATE TABLE IF NOT EXISTS eval_cases (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  case_type   TEXT        NOT NULL DEFAULT 'multi',
  status      TEXT        NOT NULL DEFAULT 'active',
  services    JSONB       NOT NULL DEFAULT '[]',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_cases_client_id ON eval_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_eval_cases_status    ON eval_cases(status);

ALTER TABLE eval_cases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'eval_cases' AND policyname = 'staff_select_eval_cases'
  ) THEN
    CREATE POLICY "staff_select_eval_cases" ON eval_cases
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'eval_cases' AND policyname = 'staff_manage_eval_cases'
  ) THEN
    CREATE POLICY "staff_manage_eval_cases" ON eval_cases
      FOR ALL USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_eval_cases_updated_at'
    ) THEN
      CREATE TRIGGER set_eval_cases_updated_at
        BEFORE UPDATE ON eval_cases
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END$$;
