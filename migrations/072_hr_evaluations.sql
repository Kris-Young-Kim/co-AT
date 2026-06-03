-- Migration 072: hr_evaluations
-- Phase D-5 인사평가 시스템

CREATE TABLE hr_evaluations (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid          NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  evaluator_id  uuid          REFERENCES hr_employees(id) ON DELETE SET NULL,
  year          integer       NOT NULL,
  period        text          NOT NULL DEFAULT 'year_end',
  rating        text,
  score         numeric(5,2),
  strengths     text,
  improvements  text,
  comment       text,
  status        text          NOT NULL DEFAULT 'draft',
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, period),
  CONSTRAINT chk_eval_period  CHECK (period  IN ('mid', 'year_end')),
  CONSTRAINT chk_eval_rating  CHECK (rating  IN ('S', 'A', 'B', 'C', 'D') OR rating IS NULL),
  CONSTRAINT chk_eval_status  CHECK (status  IN ('draft', 'submitted', 'confirmed')),
  CONSTRAINT chk_eval_score   CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

ALTER TABLE hr_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access hr_evaluations"
  ON hr_evaluations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_evaluations"
  ON hr_evaluations FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_hr_evaluations_emp_year  ON hr_evaluations(employee_id, year DESC);
CREATE INDEX idx_hr_evaluations_year      ON hr_evaluations(year, period);
