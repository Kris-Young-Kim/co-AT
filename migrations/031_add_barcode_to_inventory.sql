-- migrations/031_add_barcode_to_inventory.sql
-- inventory 테이블에 바코드 컬럼 추가 (1D 바코드, qr_code와 별도 관리)

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 바코드 중복 방지 (null 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_barcode_unique
  ON inventory(barcode) WHERE barcode IS NOT NULL;

-- 바코드 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
