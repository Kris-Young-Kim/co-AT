-- 047e: Create inventory_fab_equipment table
CREATE TABLE IF NOT EXISTS inventory_fab_equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('3d_printer','cnc','laser','other')),
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','in_use','maintenance')),
  serial_number TEXT,
  purchased_at  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_fab_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_fab_equipment" ON inventory_fab_equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_all_fab_equipment" ON inventory_fab_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_fab_equipment_updated_at
  BEFORE UPDATE ON inventory_fab_equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
