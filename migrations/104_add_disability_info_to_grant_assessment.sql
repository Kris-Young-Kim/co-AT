-- Migration: 104_add_disability_info_to_grant_assessment
-- Created: 2026-06-27
-- Purpose: Add disability information fields (□ 장애정보 section) to
--          eval_grant_assessments, and item_remarks to eval_grant_items.

-- ================================================================
-- 1. Disability info on assessment (□ 장애정보)
-- ================================================================
ALTER TABLE eval_grant_assessments
  ADD COLUMN IF NOT EXISTS disability_cause_1   TEXT,
  ADD COLUMN IF NOT EXISTS disability_onset_1   TEXT,
  ADD COLUMN IF NOT EXISTS disability_cause_2   TEXT,
  ADD COLUMN IF NOT EXISTS disability_onset_2   TEXT,
  ADD COLUMN IF NOT EXISTS disability_progression TEXT,
  ADD COLUMN IF NOT EXISTS disability_status_desc TEXT;

COMMENT ON COLUMN eval_grant_assessments.disability_cause_1    IS '장애원인 ①';
COMMENT ON COLUMN eval_grant_assessments.disability_onset_1    IS '장애원인 ① 발생시기';
COMMENT ON COLUMN eval_grant_assessments.disability_cause_2    IS '장애원인 ②';
COMMENT ON COLUMN eval_grant_assessments.disability_onset_2    IS '장애원인 ② 발생시기';
COMMENT ON COLUMN eval_grant_assessments.disability_progression IS '장애진행정도';
COMMENT ON COLUMN eval_grant_assessments.disability_status_desc IS '장애상태기술';

-- ================================================================
-- 2. Item remarks on grant items (비고/순위)
-- ================================================================
ALTER TABLE eval_grant_items
  ADD COLUMN IF NOT EXISTS item_remarks TEXT;

COMMENT ON COLUMN eval_grant_items.item_remarks IS '비고 (순위 등)';
