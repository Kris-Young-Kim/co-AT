-- migrations/038_create_hr_tables_phase1.sql

-- ============================================================
-- hr_employees
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_employees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    text UNIQUE,
  name             text NOT NULL,
  email            text NOT NULL,
  phone            text,
  department       text NOT NULL,
  position         text NOT NULL,
  employment_type  text NOT NULL CHECK (employment_type IN ('full_time','part_time','contract','daily')),
  hire_date        date NOT NULL,
  leave_date       date,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- hr_careers
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_careers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization  text NOT NULL,
  position      text NOT NULL,
  start_date    date NOT NULL,
  end_date      date,
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- hr_attendance_records
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_attendance_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  date         date NOT NULL,
  check_in     timestamptz,
  check_out    timestamptz,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- ============================================================
-- hr_leave_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type   text NOT NULL CHECK (leave_type IN ('annual','sick','special','unpaid')),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  days_used    numeric(4,1) NOT NULL,
  reason       text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by  uuid REFERENCES hr_employees(id),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS hr_employees_clerk_user_id_idx ON hr_employees(clerk_user_id);
CREATE INDEX IF NOT EXISTS hr_employees_is_active_idx ON hr_employees(is_active);
CREATE INDEX IF NOT EXISTS hr_careers_employee_id_idx ON hr_careers(employee_id);
CREATE INDEX IF NOT EXISTS hr_attendance_records_employee_id_date_idx ON hr_attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS hr_leave_requests_employee_id_idx ON hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS hr_leave_requests_status_idx ON hr_leave_requests(status);

-- ============================================================
-- updated_at trigger for hr_employees
-- ============================================================
CREATE OR REPLACE FUNCTION update_hr_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hr_employees_updated_at
  BEFORE UPDATE ON hr_employees
  FOR EACH ROW EXECUTE FUNCTION update_hr_employees_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_requests ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by admin client in server actions)
CREATE POLICY "service_role_all_hr_employees"
  ON hr_employees FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_careers"
  ON hr_careers FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_attendance_records"
  ON hr_attendance_records FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_hr_leave_requests"
  ON hr_leave_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
