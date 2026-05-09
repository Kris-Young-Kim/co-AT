-- 047d: Create inventory_reuse_dispatches table
CREATE TABLE IF NOT EXISTS inventory_reuse_dispatches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID NOT NULL REFERENCES inventory(id),
  client_id     UUID NOT NULL REFERENCES clients(id),
  approval_id   UUID REFERENCES approval_documents(id),
  status        TEXT NOT NULL DEFAULT 'donated'
                  CHECK (status IN ('donated','inspecting','cleaning','delivered')),
  dispatched_at TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_reuse_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_reuse" ON inventory_reuse_dispatches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_all_reuse" ON inventory_reuse_dispatches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_reuse_dispatches_updated_at
  BEFORE UPDATE ON inventory_reuse_dispatches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
