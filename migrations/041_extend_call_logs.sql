-- migrations/041_extend_call_logs.sql
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS requester_name    TEXT,
  ADD COLUMN IF NOT EXISTS requester_contact TEXT;

COMMENT ON COLUMN call_logs.requester_name    IS '의뢰인 성명';
COMMENT ON COLUMN call_logs.requester_contact IS '의뢰인 연락처';
