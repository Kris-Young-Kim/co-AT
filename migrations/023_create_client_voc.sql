-- migrations/023_create_client_voc.sql

CREATE TABLE IF NOT EXISTS client_voc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('complaint', 'suggestion', 'praise')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  response TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_voc_client_id ON client_voc(client_id);
CREATE INDEX IF NOT EXISTS idx_client_voc_type ON client_voc(type);
CREATE INDEX IF NOT EXISTS idx_client_voc_status ON client_voc(status);

ALTER TABLE client_voc DISABLE ROW LEVEL SECURITY;
