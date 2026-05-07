-- migrations/044_create_report_views.sql
CREATE OR REPLACE VIEW v_call_log_report AS
SELECT
  log_date,
  requester_name,
  requester_region,
  requester_contact,
  requester_type,
  target_name,
  target_gender,
  target_disability_type,
  target_disability_severity,
  target_economic_status,
  q_public_benefit,
  q_private_benefit,
  q_device,
  q_case_management,
  q_other,
  question_content,
  answer,
  staff_name
FROM call_logs
ORDER BY log_date, created_at;

CREATE OR REPLACE VIEW v_service_record_report AS
SELECT
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
  is_closed, staff_name
FROM eval_service_records
ORDER BY received_at, created_at;
