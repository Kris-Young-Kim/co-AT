-- Migration: 053_add_contact_address_to_service_records
-- App: eval
-- Created: 2026-05-13
-- Reason: Sheet analysis confirmed AP(index 41)=연락처, AQ(index 42)=주소.
--         Previous SR_COL indices 41-51 (migration 050) were wrong — those
--         columns do not exist in this sheet. These two columns are the only
--         missing fields from the 보조기기 서비스 상세 sheet.

ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS contact TEXT;

ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN eval_service_records.contact IS '연락처 — 시트 AP열(인덱스 41)';
COMMENT ON COLUMN eval_service_records.address IS '상세 주소 — 시트 AQ열(인덱스 42)';
