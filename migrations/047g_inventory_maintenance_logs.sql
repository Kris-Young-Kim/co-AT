-- 047g: Create inventory_maintenance_logs table
CREATE TABLE IF NOT EXISTS inventory_maintenance_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES inventory(id),
  type         TEXT NOT NULL CHECK (type IN ('inspection','repair','cleaning')),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','done')),
  performed_at TIMESTAMPTZ,
  technician   TEXT,
  cost         INTEGER DEFAULT 0,
  notes        TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_maintenance" ON inventory_maintenance_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_maintenance" ON inventory_maintenance_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_all_maintenance" ON inventory_maintenance_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
