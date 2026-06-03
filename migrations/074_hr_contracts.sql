-- Migration 074: hr_contracts
-- Phase D-5 근로계약서 관리

CREATE TABLE hr_contracts (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid          NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  contract_type    text          NOT NULL DEFAULT 'initial',
  start_date       date          NOT NULL,
  end_date         date,
  employment_type  text          NOT NULL DEFAULT 'full_time',
  position         text          NOT NULL,
  department       text          NOT NULL,
  base_salary      numeric(12,0) NOT NULL DEFAULT 0,
  work_hours       integer       NOT NULL DEFAULT 40,
  signed_at        date,
  note             text,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT chk_contract_type       CHECK (contract_type    IN ('initial', 'renewal', 'amendment')),
  CONSTRAINT chk_contract_employment CHECK (employment_type  IN ('full_time', 'part_time', 'contract', 'daily')),
  CONSTRAINT chk_contract_work_hours CHECK (work_hours > 0 AND work_hours <= 52)
);

ALTER TABLE hr_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access hr_contracts"
  ON hr_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read hr_contracts"
  ON hr_contracts FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_hr_contracts_emp      ON hr_contracts(employee_id, start_date DESC);
CREATE INDEX idx_hr_contracts_end_date ON hr_contracts(end_date) WHERE end_date IS NOT NULL;
