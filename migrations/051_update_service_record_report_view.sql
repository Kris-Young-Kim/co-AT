-- Migration: 051_update_service_record_report_view
-- App: eval
-- Created: 2026-05-09
-- Reason: Extend v_service_record_report to include the 13 new columns added in migration 050.

CREATE OR REPLACE VIEW v_service_record_report AS
SELECT
  -- 접수 기본 정보
  received_at,
  application_year,
  application_month,
  application_no,
  is_re_application,

  -- 접수 상태
  record_status,
  consultation_date,
  performance_date,

  -- 대상자 정보
  name,
  birth_date,
  gender,
  region,
  economic_status,
  disability_type,
  disability_severity,

  -- 서비스 분류
  service_major_category,
  service_category,
  service_sub_category,
  product_name,
  item_category,
  service_content,
  service_area,

  -- 보조기기센터 사업 체크박스
  is_consult, is_assessment, is_trial, is_rental,
  is_custom_make, is_grant, is_education,
  is_other_business, is_info_provision,

  -- 체험지원 세부
  trial_device_count,
  info_provision_area,

  -- 재원연계
  is_public_funding, is_private_funding,
  is_self_pay, is_funding_secured,
  funding_source_detail,

  -- 사후관리
  is_repair, is_cleaning, is_reuse, is_monitoring,
  monitoring_date,

  -- 서비스 방법
  referral_type, is_phone, is_visit_in, is_visit_out,

  -- 종결
  is_closed,
  closed_at,

  -- 담당
  staff_name

FROM eval_service_records
ORDER BY received_at, created_at;
