-- migrations/052_extend_eval_sync_logs.sql
-- Add 'client' to the sheet_type check constraint in eval_sync_logs

ALTER TABLE eval_sync_logs DROP CONSTRAINT IF EXISTS eval_sync_logs_sheet_type_check;
ALTER TABLE eval_sync_logs ADD CONSTRAINT eval_sync_logs_sheet_type_check
  CHECK (sheet_type IN ('call_log', 'service_record', 'client'));

COMMENT ON COLUMN eval_sync_logs.sheet_type IS 'call_log | service_record | client';
