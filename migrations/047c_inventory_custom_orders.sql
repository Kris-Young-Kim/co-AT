-- 047c: Create inventory_custom_orders table
CREATE TABLE IF NOT EXISTS inventory_custom_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID REFERENCES inventory(id),
  client_id    UUID NOT NULL REFERENCES clients(id),
  approval_id  UUID REFERENCES approval_documents(id),
  status       TEXT NOT NULL DEFAULT 'requested'
                 CHECK (status IN ('requested','in_progress','completed','delivered')),
  track_token  UUID UNIQUE DEFAULT gen_random_uuid(),
  requested_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_custom_orders" ON inventory_custom_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_all_custom_orders" ON inventory_custom_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custom_orders_updated_at
  BEFORE UPDATE ON inventory_custom_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
