-- Migration: 103_fix_record_status_constraint
-- Created: 2026-06-27
-- Purpose: Expand record_status CHECK constraint to include all values used
--          across forms ('접수', '진행중', '보류') and sync triggers ('미정', '취소').
--          The old constraint only allowed ('완료', '미정', '취소'), which blocked
--          both direct form submissions and the grant-eval sync trigger in some envs.

-- Step 1: NULL out any record_status values that won't fit the new constraint
UPDATE eval_service_records
SET record_status = NULL
WHERE record_status IS NOT NULL
  AND record_status NOT IN ('접수', '진행중', '완료', '보류', '미정', '취소');

-- Step 2: Drop the old (too-narrow) constraint
ALTER TABLE eval_service_records
  DROP CONSTRAINT IF EXISTS eval_service_records_record_status_check;

-- Step 3: Add expanded constraint covering all values used across forms and triggers
ALTER TABLE eval_service_records
  ADD CONSTRAINT eval_service_records_record_status_check
    CHECK (record_status IN ('접수', '진행중', '완료', '보류', '미정', '취소'));
