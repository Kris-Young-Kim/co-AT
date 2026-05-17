-- Migration: 055_clients_registration_workflow
-- App: eval (shared clients table)
-- Created: 2026-05-17
-- Reason: pending→registered two-step client lifecycle for eval app
--   clients table is shared core infrastructure (not namespaced per convention)
--   assigned_staff_id stores Clerk user ID (TEXT, not UUID)

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS guardian_contact TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered')),
  ADD COLUMN IF NOT EXISTS assigned_staff_id TEXT,  -- Clerk user ID (e.g. user_xxx)
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'staff'
    CHECK (source IN ('portal', 'staff'));

-- Mark all pre-migration clients as registered (safe to re-run)
UPDATE clients SET status = 'registered' WHERE status = 'pending';
