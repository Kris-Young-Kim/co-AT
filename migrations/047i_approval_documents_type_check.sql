-- 047i: Extend approval_documents type constraint to include inventory types
ALTER TABLE approval_documents
  DROP CONSTRAINT IF EXISTS approval_documents_type_check;

ALTER TABLE approval_documents
  ADD CONSTRAINT approval_documents_type_check
  CHECK (type IN ('expenditure','leave','business_report','rental','custom_make','reuse'));
