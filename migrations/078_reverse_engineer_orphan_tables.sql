-- migrations/078_reverse_engineer_orphan_tables.sql
-- Reverse-engineered from production (tables existed without migration files)
-- Tables: intake_records, domain_assessments, process_logs, supplies, supply_transactions

-- ── intake_records ────────────────────────────────────────────────────────────
-- Initial consultation intake form tied to an application.
-- Captures body function data, current devices, environmental info.
CREATE TABLE IF NOT EXISTS intake_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id          UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  consultant_id           UUID REFERENCES profiles(id),
  consult_date            DATE,
  body_function_data      JSONB,
  current_devices         JSONB,
  cognitive_sensory_check TEXT[],
  consultation_content    TEXT,
  main_activity_place     TEXT,
  activity_posture        TEXT,
  main_supporter          TEXT,
  environment_limitations TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE intake_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_intake_records"
  ON intake_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_intake_records_application_id
  ON intake_records (application_id);
CREATE INDEX IF NOT EXISTS idx_intake_records_consultant_id
  ON intake_records (consultant_id);
CREATE INDEX IF NOT EXISTS idx_intake_records_consult_date
  ON intake_records (consult_date DESC);

-- ── domain_assessments ────────────────────────────────────────────────────────
-- Domain-specific assessment (body, environment, cognitive) for an application.
-- evaluation_data / measurements stored as JSONB for flexible form structure.
CREATE TABLE IF NOT EXISTS domain_assessments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  evaluator_id        UUID REFERENCES profiles(id),
  evaluation_date     DATE,
  domain_type         TEXT NOT NULL,
  evaluation_data     JSONB,
  measurements        JSONB,
  evaluator_opinion   TEXT,
  recommended_device  TEXT,
  future_plan         TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE domain_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_domain_assessments"
  ON domain_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_domain_assessments_application_id
  ON domain_assessments (application_id);
CREATE INDEX IF NOT EXISTS idx_domain_assessments_domain_type
  ON domain_assessments (domain_type);
CREATE INDEX IF NOT EXISTS idx_domain_assessments_evaluator_id
  ON domain_assessments (evaluator_id);

-- ── process_logs ──────────────────────────────────────────────────────────────
-- Step-by-step process tracking log for an application.
CREATE TABLE IF NOT EXISTS process_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  staff_id       UUID REFERENCES profiles(id),
  log_date       DATE,
  service_area   TEXT,
  funding_source TEXT,
  process_step   TEXT,
  item_name      TEXT,
  content        TEXT,
  remarks        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_process_logs"
  ON process_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_process_logs_application_id
  ON process_logs (application_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_staff_id
  ON process_logs (staff_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_log_date
  ON process_logs (log_date DESC);

-- ── supplies ──────────────────────────────────────────────────────────────────
-- Consumable supplies inventory (소모품) — separate from inventory (assistive devices).
CREATE TABLE IF NOT EXISTS supplies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT,
  unit          TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  location      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_supplies"
  ON supplies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies (category);
CREATE INDEX IF NOT EXISTS idx_supplies_name ON supplies (name);

-- ── supply_transactions ───────────────────────────────────────────────────────
-- In/out transaction log for supplies.
-- clerk_user_id is a Clerk user ID (text), not a profiles FK.
CREATE TABLE IF NOT EXISTS supply_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id     UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,  -- 'in' | 'out'
  quantity      INTEGER NOT NULL,
  reason        TEXT,
  clerk_user_id TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE supply_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_supply_transactions"
  ON supply_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_supply_transactions_supply_id
  ON supply_transactions (supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_type
  ON supply_transactions (type);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_created_at
  ON supply_transactions (created_at DESC);
