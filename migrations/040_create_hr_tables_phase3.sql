-- migrations/040_create_hr_tables_phase3.sql

-- ============================================================
-- hr_certificates — 증명서 발급 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_certificates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  type        text NOT NULL
                CHECK (type IN ('employment', 'career', 'salary', 'resignation')),
  purpose     text,
  issued_by   uuid NOT NULL REFERENCES hr_employees(id),
  issued_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS hr_certificates_employee_id_idx ON hr_certificates(employee_id);
CREATE INDEX IF NOT EXISTS hr_certificates_issued_at_idx  ON hr_certificates(issued_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE hr_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_hr_certificates"
  ON hr_certificates FOR ALL TO service_role USING (true) WITH CHECK (true);
