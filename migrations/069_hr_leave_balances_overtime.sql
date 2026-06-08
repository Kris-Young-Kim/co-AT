-- Migration 069: hr_leave_balances, hr_overtime_records
-- Phase D-3 근태관리 고도화

CREATE TABLE hr_leave_balances (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  year           integer     NOT NULL,
  leave_type     text        NOT NULL DEFAULT 'annual',
  entitlement    numeric(5,1) NOT NULL DEFAULT 0,   -- 부여일수
  used           numeric(5,1) NOT NULL DEFAULT 0,   -- 사용일수
  carry_over     numeric(5,1) NOT NULL DEFAULT 0,   -- 전년도 이월
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, leave_type)
);

CREATE TABLE hr_overtime_records (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  date              date        NOT NULL,
  regular_minutes   integer     NOT NULL DEFAULT 0,   -- 소정근로
  overtime_minutes  integer     NOT NULL DEFAULT 0,   -- 연장근로
  night_minutes     integer     NOT NULL DEFAULT 0,   -- 야간근로 (22:00-06:00)
  holiday_minutes   integer     NOT NULL DEFAULT 0,   -- 휴일근로
  total_minutes     integer     NOT NULL DEFAULT 0,   -- 합계
  approved          boolean     NOT NULL DEFAULT false,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- RLS
ALTER TABLE hr_leave_balances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_overtime_records ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service role full access hr_leave_balances"
  ON hr_leave_balances FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service role full access hr_overtime_records"
  ON hr_overtime_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read
CREATE POLICY "authenticated read hr_leave_balances"
  ON hr_leave_balances FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated read hr_overtime_records"
  ON hr_overtime_records FOR SELECT TO authenticated USING (true);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_hr_leave_balances_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_hr_leave_balances_updated_at
  BEFORE UPDATE ON hr_leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_hr_leave_balances_updated_at();
