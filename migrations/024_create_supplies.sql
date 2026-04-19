-- migrations/024_create_supplies.sql

CREATE TABLE IF NOT EXISTS supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT '개',
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supply_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_supply_id ON supply_transactions(supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_transactions_created_at ON supply_transactions(created_at DESC);

ALTER TABLE supplies DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_transactions DISABLE ROW LEVEL SECURITY;
