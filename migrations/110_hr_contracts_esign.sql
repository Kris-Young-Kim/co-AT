-- Phase: 근로계약서 전자서명
-- Workflow: draft → pending_employee → employee_signed → completed
ALTER TABLE hr_contracts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_employee','employee_signed','completed','cancelled')),
  ADD COLUMN IF NOT EXISTS employee_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS employee_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS employer_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS employee_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employer_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_to TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS hr_contracts_employee_token_idx
  ON hr_contracts(employee_token);
