-- 047f: Create inventory_custom_order_equipment junction table
CREATE TABLE IF NOT EXISTS inventory_custom_order_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES inventory_custom_orders(id) ON DELETE CASCADE,
  equipment_id    UUID NOT NULL REFERENCES inventory_fab_equipment(id),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE (custom_order_id, equipment_id)
);

ALTER TABLE inventory_custom_order_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_order_equipment" ON inventory_custom_order_equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_all_order_equipment" ON inventory_custom_order_equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);
