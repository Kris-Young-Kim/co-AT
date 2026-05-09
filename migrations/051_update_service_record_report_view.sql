-- Migration: 051_update_service_record_report_view
-- App: eval
-- Created: 2026-05-09
-- Reason: Extend v_service_record_report to include the 13 new columns added in migration 050.
-- NOTE: CREATE OR REPLACE VIEW requires existing columns to stay in the same ordinal positions.
--       Original columns (from migration 044) are preserved unchanged; new columns are appended.

CREATE OR REPLACE VIEW v_service_record_report AS
SELECT
  -- ── original columns (migration 044) — order must not change ──
  received_at,
  application_year,
  application_no,
  name,
  birth_date,
  gender,
  region,
  disability_type,
  service_category,
  product_name,
  item_category,
  service_content,
  service_area,
  is_consult, is_assessment, is_trial, is_rental,
  is_custom_make, is_grant, is_education,
  is_other_business, is_info_provision,
  is_public_funding, is_private_funding,
  is_self_pay, is_funding_secured,
  is_repair, is_cleaning, is_reuse, is_monitoring,
  referral_type, is_phone, is_visit_in, is_visit_out,
  is_closed,
  staff_name,

  -- ── new columns (migration 050) — appended after existing columns ──
  application_month,
  is_re_application,
  record_status,
  consultation_date,
  performance_date,
  economic_status,
  disability_severity,
  service_major_category,
  service_sub_category,
  trial_device_count,
  info_provision_area,
  funding_source_detail,
  closed_at,
  monitoring_date

FROM eval_service_records
ORDER BY received_at, created_at;
