-- Migration 070: hr_business_trips, hr_severance_records
-- Phase D-4 출장관리, 퇴직금정산

CREATE TABLE hr_business_trips (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  destination   text        NOT NULL,
  purpose       text        NOT NULL,
  start_date    date        NOT NULL,
  end_date      date        NOT NULL,
  days          integer     NOT NULL DEFAULT 1,
  transport     text,                              -- 교통수단
  allowance     integer     NOT NULL DEFAULT 0,   -- 출장비(원)
  status        text        NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  reviewed_by   uuid        REFERENCES hr_employees(id),
  reviewed_at   timestamptz,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hr_severance_records (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_date           date        NOT NULL,
  service_years        numeric(5,2) NOT NULL,      -- 계속근로연수
  avg_daily_wage       integer     NOT NULL,        -- 1일 평균임금
  severance_pay        integer     NOT NULL,        -- 퇴직금
  tax_deducted         integer     NOT NULL DEFAULT 0,
  net_severance        integer     NOT NULL,        -- 실지급액
  note                 text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hr_business_trips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_severance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access hr_business_trips"
  ON hr_business_trips FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service role full access hr_severance_records"
  ON hr_severance_records FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_business_trips"
  ON hr_business_trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated read hr_severance_records"
  ON hr_severance_records FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_hr_business_trips_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_hr_business_trips_updated_at
  BEFORE UPDATE ON hr_business_trips
  FOR EACH ROW EXECUTE FUNCTION update_hr_business_trips_updated_at();

CREATE INDEX idx_hr_business_trips_employee ON hr_business_trips(employee_id, start_date DESC);
CREATE INDEX idx_hr_severance_employee ON hr_severance_records(employee_id);
