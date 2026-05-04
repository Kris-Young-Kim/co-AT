-- migrations/039_create_hr_tables_phase2.sql

-- ============================================================
-- hr_salary_grades — 호봉표
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_salary_grades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_name   text NOT NULL UNIQUE,
  base_salary  integer NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- hr_allowance_types — 수당 유형
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_allowance_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- hr_salary_records — 월별 급여 대장
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_salary_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  year_month       char(7) NOT NULL,
  salary_grade_id  uuid REFERENCES hr_salary_grades(id),
  base_salary      integer NOT NULL,
  allowances       jsonb NOT NULL DEFAULT '[]',
  deductions       jsonb NOT NULL DEFAULT '{}',
  gross_pay        integer NOT NULL,
  net_pay          integer NOT NULL,
  note             text,
  confirmed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year_month)
);

-- ============================================================
-- hr_daily_wages — 일용직 급여
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_daily_wages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  work_date     date NOT NULL,
  hours_worked  numeric(4,1) NOT NULL,
  hourly_rate   integer NOT NULL,
  gross_pay     integer NOT NULL,
  deductions    jsonb NOT NULL DEFAULT '{}',
  net_pay       integer NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS hr_salary_grades_is_active_idx ON hr_salary_grades(is_active);
CREATE INDEX IF NOT EXISTS hr_salary_records_employee_id_idx ON hr_salary_records(employee_id);
CREATE INDEX IF NOT EXISTS hr_salary_records_year_month_idx ON hr_salary_records(year_month);
CREATE INDEX IF NOT EXISTS hr_daily_wages_employee_id_idx ON hr_daily_wages(employee_id);
CREATE INDEX IF NOT EXISTS hr_daily_wages_work_date_idx ON hr_daily_wages(work_date);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_hr_salary_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hr_salary_grades_updated_at
  BEFORE UPDATE ON hr_salary_grades
  FOR EACH ROW EXECUTE FUNCTION update_hr_salary_grades_updated_at();

CREATE OR REPLACE FUNCTION update_hr_salary_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hr_salary_records_updated_at
  BEFORE UPDATE ON hr_salary_records
  FOR EACH ROW EXECUTE FUNCTION update_hr_salary_records_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE hr_salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_allowance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_daily_wages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_hr_salary_grades"
  ON hr_salary_grades FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_allowance_types"
  ON hr_allowance_types FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_salary_records"
  ON hr_salary_records FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_daily_wages"
  ON hr_daily_wages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Seed default allowance types
-- ============================================================
INSERT INTO hr_allowance_types (name) VALUES
  ('식대'),
  ('위험수당'),
  ('직책수당'),
  ('명절수당')
ON CONFLICT (name) DO NOTHING;
