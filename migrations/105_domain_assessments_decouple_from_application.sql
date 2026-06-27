-- Allow domain_assessments to exist without an application
-- (consultation-record-linked or standalone assessment sessions)

ALTER TABLE domain_assessments ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE domain_assessments
  ADD COLUMN IF NOT EXISTS consultation_record_id uuid
    REFERENCES eval_consultation_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid;

CREATE INDEX IF NOT EXISTS idx_domain_assessments_consult
  ON domain_assessments(consultation_record_id);

CREATE INDEX IF NOT EXISTS idx_domain_assessments_client_id
  ON domain_assessments(client_id);
