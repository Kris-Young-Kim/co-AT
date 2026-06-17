-- E-6 CRM: lifecycle status + tags for clients

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'
  CONSTRAINT clients_lifecycle_status_check
    CHECK (lifecycle_status IN ('active', 'inactive', 'closed', 'readmit'));

CREATE TABLE IF NOT EXISTS client_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL CHECK (char_length(tag) BETWEEN 1 AND 20),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_tags_unique UNIQUE (client_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON client_tags(client_id);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read tags" ON client_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff can insert tags" ON client_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "staff can delete tags" ON client_tags
  FOR DELETE TO authenticated USING (true);
