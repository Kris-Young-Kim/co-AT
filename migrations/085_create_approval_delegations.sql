-- migrations/085_create_approval_delegations.sql

CREATE TABLE approval_delegations (
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

CREATE INDEX approval_delegations_delegator_idx ON approval_delegations (delegator_clerk_id);
CREATE INDEX approval_delegations_delegatee_idx ON approval_delegations (delegatee_clerk_id);

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_bypass" ON approval_delegations
  TO service_role USING (true) WITH CHECK (true);

ALTER TABLE approval_steps
  ADD COLUMN is_delegated boolean NOT NULL DEFAULT false;
