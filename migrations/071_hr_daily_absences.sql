-- Migration 071: hr_daily_absences
-- 외출(30분 단위), 오전반차, 오후반차, 지참 관리

CREATE TABLE hr_daily_absences (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  date             date        NOT NULL,
  type             text        NOT NULL,          -- outing | half_am | half_pm | late
  start_time       time,                          -- 외출/지참 시작 시각
  end_time         time,                          -- 외출 복귀 시각
  duration_minutes integer     NOT NULL DEFAULT 0, -- 30분 단위 (외출·지참)
  reason           text,
  status           text        NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by      uuid        REFERENCES hr_employees(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_daily_absence_type
    CHECK (type IN ('outing', 'half_am', 'half_pm', 'late')),
  CONSTRAINT chk_daily_absence_duration_30min
    CHECK (duration_minutes % 30 = 0)
);

ALTER TABLE hr_daily_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access hr_daily_absences"
  ON hr_daily_absences FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_daily_absences"
  ON hr_daily_absences FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_hr_daily_absences_emp_date
  ON hr_daily_absences(employee_id, date DESC);

CREATE INDEX idx_hr_daily_absences_date
  ON hr_daily_absences(date);
