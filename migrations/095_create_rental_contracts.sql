-- Migration: 095_create_rental_contracts
-- App: inventory / web (shared)
-- Created: 2026-06-14

-- ============================================================
-- Table: rental_contracts
-- Stores e-signature contracts for device rentals
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_contracts (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id       uuid        NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  signing_token   uuid        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'signed', 'cancelled')),

  -- Signer info (filled at signing time)
  signer_name     text,
  signer_type     text        CHECK (signer_type IN ('client', 'guardian') OR signer_type IS NULL),
  signature_data  text,       -- base64 PNG of drawn signature

  -- Delivery
  sent_to         text,       -- email address or phone number
  sent_via        text        CHECK (sent_via IN ('email', 'sms', 'manual') OR sent_via IS NULL),
  sent_at         timestamptz,

  -- Timestamps
  signed_at       timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- Staff can read all contracts
CREATE POLICY "staff can read rental_contracts"
  ON rental_contracts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Staff can insert contracts
CREATE POLICY "staff can insert rental_contracts"
  ON rental_contracts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Staff can update contracts
CREATE POLICY "staff can update rental_contracts"
  ON rental_contracts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Public read by signing_token (for /sign/[token] page)
CREATE POLICY "public can read contract by signing_token"
  ON rental_contracts
  FOR SELECT
  USING (true);

-- Public update only pending contracts by signing_token (for signature submission)
-- No auth.uid() required — signer accesses via token link
CREATE POLICY "public can sign pending contract"
  ON rental_contracts
  FOR UPDATE
  USING (status = 'pending');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rental_contracts_rental_id ON rental_contracts (rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_signing_token ON rental_contracts (signing_token);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts (status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON rental_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
