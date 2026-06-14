-- Migration: 094_add_qr_token_to_clients
-- App: eval (clients table is shared, no namespace prefix)
-- Created: 2026-06-14

-- Add qr_token column for client barcode identification
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Backfill existing rows
UPDATE clients SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE clients ALTER COLUMN qr_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_qr_token ON clients (qr_token);
