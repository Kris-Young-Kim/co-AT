-- Migration: 083_create_eval_ippa_assessments
-- Purpose: K-IPPA (Korean Individual Prioritised Problem Assessment)
--   Measures functional outcome before and after assistive device support.
--   3~5 activity problems selected by client, scored 0-5 each phase.
--   Outcome score = Σ(pre_score - post_score) / n  (positive = improved)

CREATE TABLE IF NOT EXISTS eval_ippa_assessments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assessment_year INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,

  -- Pre-measurement (before assistive device support)
  pre_date        DATE,
  -- Post-measurement (4~6 weeks after support)
  post_date       DATE,

  -- Items: [{problem: string, pre_score: 0-5, post_score: 0-5 | null}]
  items           JSONB       NOT NULL DEFAULT '[]',

  -- Computed outcome: Σ(pre_score - post_score) / item_count
  outcome_score   NUMERIC(5,2),

  notes           TEXT,
  -- pre_only: pre done, awaiting post | completed: both done
  status          TEXT        NOT NULL DEFAULT 'pre_only'
                  CHECK (status IN ('pre_only', 'completed')),

  staff_id        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ippa_client_id ON eval_ippa_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_ippa_year      ON eval_ippa_assessments(assessment_year);
CREATE INDEX IF NOT EXISTS idx_ippa_status    ON eval_ippa_assessments(status);

ALTER TABLE eval_ippa_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'eval_ippa_assessments' AND policyname = 'staff_select_ippa'
  ) THEN
    CREATE POLICY "staff_select_ippa" ON eval_ippa_assessments
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'eval_ippa_assessments' AND policyname = 'staff_manage_ippa'
  ) THEN
    CREATE POLICY "staff_manage_ippa" ON eval_ippa_assessments
      FOR ALL USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_ippa_updated_at'
    ) THEN
      CREATE TRIGGER set_ippa_updated_at
        BEFORE UPDATE ON eval_ippa_assessments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END$$;
