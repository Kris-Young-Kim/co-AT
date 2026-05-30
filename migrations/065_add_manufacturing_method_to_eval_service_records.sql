-- Add manufacturing_method column to eval_service_records
-- Used for Sheet 7: 맞춤 제작 서비스 현황 관리 (col5 = 제작방법: 3D/CNC)

ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS manufacturing_method text;
