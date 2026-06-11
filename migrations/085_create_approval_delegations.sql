-- migrations/085_create_approval_delegations.sql
-- Stores approval delegation records: who delegated to whom, for what period.

CREATE TABLE IF NOT EXISTS approval_delegations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_clerk_id  text NOT NULL,
  delegatee_clerk_id  text NOT NULL,
  start_date          date,
  end_date            date,
  is_active           boolean NOT NULL DEFAULT true,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_delegation CHECK (delegator_clerk_id != delegatee_clerk_id)
);

CREATE INDEX IF NOT EXISTS approval_delegations_delegator_idx ON approval_delegations (delegator_clerk_id);
CREATE INDEX IF NOT EXISTS approval_delegations_delegatee_idx ON approval_delegations (delegatee_clerk_id);

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_bypass" ON approval_delegations;
CREATE POLICY "service_role_bypass" ON approval_delegations
  TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'approval_steps' AND column_name = 'is_delegated'
  ) THEN
    ALTER TABLE approval_steps ADD COLUMN is_delegated boolean NOT NULL DEFAULT false;
  END IF;
END $$;
