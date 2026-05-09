-- migrations/047_inventory_phase2.sql

-- 1. Extend inventory table
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Backfill existing rows
UPDATE inventory SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
ALTER TABLE inventory ALTER COLUMN qr_token SET NOT NULL;

-- 2. Extend rentals table
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS approval_id UUID REFERENCES approval_documents(id),
  ADD COLUMN IF NOT EXISTS wait_list_checked_at TIMESTAMPTZ;

-- Allow inventory_id to be null (pending_assignment status before device scanned)
ALTER TABLE rentals ALTER COLUMN inventory_id DROP NOT NULL;

-- extension_count already exists; ensure max is enforced at app level

-- 3. Custom-made orders
CREATE TABLE IF NOT EXISTS inventory_custom_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID REFERENCES inventory(id),
  client_id       UUID NOT NULL REFERENCES eval_clients(id),
  approval_id     UUID REFERENCES approval_documents(id),
  status          TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','in_progress','completed','delivered')),
  track_token     UUID UNIQUE DEFAULT gen_random_uuid(),
  requested_at    TIMESTAMPTZ DEFAULT now(),
  delivered_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Reuse dispatches
CREATE TABLE IF NOT EXISTS inventory_reuse_dispatches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES inventory(id),
  client_id       UUID NOT NULL REFERENCES eval_clients(id),
  approval_id     UUID REFERENCES approval_documents(id),
  status          TEXT NOT NULL DEFAULT 'donated'
                    CHECK (status IN ('donated','inspecting','cleaning','delivered')),
  dispatched_at   TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Fabrication equipment
CREATE TABLE IF NOT EXISTS inventory_fab_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('3d_printer','cnc','laser','other')),
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','in_use','maintenance')),
  serial_number   TEXT,
  purchased_at    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. Custom order <-> equipment junction (N:M)
CREATE TABLE IF NOT EXISTS inventory_custom_order_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES inventory_custom_orders(id) ON DELETE CASCADE,
  equipment_id    UUID NOT NULL REFERENCES inventory_fab_equipment(id),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE (custom_order_id, equipment_id)
);

-- 7. Maintenance logs
CREATE TABLE IF NOT EXISTS inventory_maintenance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES inventory(id),
  type            TEXT NOT NULL CHECK (type IN ('inspection','repair','cleaning')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','done')),
  performed_at    TIMESTAMPTZ,
  technician      TEXT,
  cost            INTEGER DEFAULT 0,
  notes           TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 8. Dispatch summary view
CREATE OR REPLACE VIEW inventory_dispatch_summary AS
  SELECT 'rental'::text AS dispatch_type, id, device_id, client_id, approval_id, status, created_at
  FROM rentals
  UNION ALL
  SELECT 'custom'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_custom_orders
  UNION ALL
  SELECT 'reuse'::text, id, device_id, client_id, approval_id, status, created_at
  FROM inventory_reuse_dispatches;

-- 9. updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_orders_updated_at') THEN
    CREATE TRIGGER trg_custom_orders_updated_at
      BEFORE UPDATE ON inventory_custom_orders
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reuse_dispatches_updated_at') THEN
    CREATE TRIGGER trg_reuse_dispatches_updated_at
      BEFORE UPDATE ON inventory_reuse_dispatches
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fab_equipment_updated_at') THEN
    CREATE TRIGGER trg_fab_equipment_updated_at
      BEFORE UPDATE ON inventory_fab_equipment
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- 10. RLS
ALTER TABLE inventory_custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reuse_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_fab_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_custom_order_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_custom_orders" ON inventory_custom_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_custom_orders" ON inventory_custom_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_reuse" ON inventory_reuse_dispatches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_reuse" ON inventory_reuse_dispatches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_fab_equipment" ON inventory_fab_equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_fab_equipment" ON inventory_fab_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_order_equipment" ON inventory_custom_order_equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_order_equipment" ON inventory_custom_order_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_maintenance" ON inventory_maintenance_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_maintenance" ON inventory_maintenance_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "service_all_maintenance" ON inventory_maintenance_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. Extend approval_documents type check
ALTER TABLE approval_documents
  DROP CONSTRAINT IF EXISTS approval_documents_type_check;
ALTER TABLE approval_documents
  ADD CONSTRAINT approval_documents_type_check
  CHECK (type IN ('expenditure','leave','business_report','rental','custom_make','reuse'));
