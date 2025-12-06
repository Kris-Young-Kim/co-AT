-- inventory 테이블 필드 추가
-- 실행일: 2025-01-XX
-- 설명: inventory 테이블에 대여 가능 여부, 구입 정보, 제조사, 모델, QR 코드 필드 추가

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS is_rental_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_inventory_is_rental_available ON inventory(is_rental_available);
CREATE INDEX IF NOT EXISTS idx_inventory_qr_code ON inventory(qr_code);
CREATE INDEX IF NOT EXISTS idx_inventory_manufacturer ON inventory(manufacturer);

-- 마이그레이션 완료 로그
COMMENT ON COLUMN inventory.is_rental_available IS '대여 가능 여부 (기본값: true)';
COMMENT ON COLUMN inventory.purchase_date IS '구입일';
COMMENT ON COLUMN inventory.purchase_price IS '구입가격';
COMMENT ON COLUMN inventory.manufacturer IS '제조사';
COMMENT ON COLUMN inventory.model IS '모델명';
COMMENT ON COLUMN inventory.qr_code IS 'QR 코드 값 (고유 식별자)';

