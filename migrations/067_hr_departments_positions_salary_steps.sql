-- Migration 067: HR departments, positions, salary steps
-- Adds structured lookup tables for department, position, and pay-grade (호봉) management.

-- ─────────────────────────────────────────────
-- 1. hr_departments (부서)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_departments" ON hr_departments
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 2. hr_positions (직급)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_positions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT,
  level      INTEGER NOT NULL DEFAULT 1,  -- 1 = 최하위, 높을수록 상위
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_positions" ON hr_positions
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 3. hr_salary_steps (호봉)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_salary_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,            -- 1호봉, 2호봉 …
  step_name   TEXT,                        -- 선택적 별칭
  base_amount INTEGER NOT NULL DEFAULT 0, -- 원 단위
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (step_number)
);

ALTER TABLE hr_salary_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_salary_steps" ON hr_salary_steps
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 4. hr_salary_step_history (호봉승급 이력)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_salary_step_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  from_step_id   UUID REFERENCES hr_salary_steps(id),
  to_step_id     UUID NOT NULL REFERENCES hr_salary_steps(id),
  effective_date DATE NOT NULL,
  reason         TEXT,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_salary_step_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_step_history" ON hr_salary_step_history
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 5. hr_employees — FK 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES hr_departments(id),
  ADD COLUMN IF NOT EXISTS position_id   UUID REFERENCES hr_positions(id),
  ADD COLUMN IF NOT EXISTS salary_step_id UUID REFERENCES hr_salary_steps(id);

-- ─────────────────────────────────────────────
-- 6. 인덱스
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_employees_department ON hr_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_position   ON hr_employees(position_id);
CREATE INDEX IF NOT EXISTS idx_hr_step_history_emp     ON hr_salary_step_history(employee_id, effective_date DESC);
