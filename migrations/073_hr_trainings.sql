-- Migration 073: hr_trainings, hr_training_attendees
-- Phase D-5 교육훈련 관리

CREATE TABLE hr_trainings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  category    text        NOT NULL DEFAULT 'voluntary',
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  hours       integer     NOT NULL DEFAULT 0,
  provider    text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_training_category CHECK (category IN ('mandatory', 'voluntary', 'external'))
);

CREATE TABLE hr_training_attendees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid        NOT NULL REFERENCES hr_trainings(id) ON DELETE CASCADE,
  employee_id uuid        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  attended    boolean     NOT NULL DEFAULT false,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, employee_id)
);

ALTER TABLE hr_trainings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access hr_trainings"
  ON hr_trainings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_trainings"
  ON hr_trainings FOR SELECT TO authenticated USING (true);

CREATE POLICY "service role full access hr_training_attendees"
  ON hr_training_attendees FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_training_attendees"
  ON hr_training_attendees FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_hr_trainings_date            ON hr_trainings(start_date DESC);
CREATE INDEX idx_hr_training_attendees_emp    ON hr_training_attendees(employee_id);
CREATE INDEX idx_hr_training_attendees_train  ON hr_training_attendees(training_id);
