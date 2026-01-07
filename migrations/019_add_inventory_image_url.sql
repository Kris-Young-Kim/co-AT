-- inventory 테이블에 이미지 URL 필드 추가
-- 실행일: 2025-01-XX
-- 설명: 재고 항목에 이미지 URL 추가 (Supabase Storage 경로)

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_inventory_image_url ON inventory(image_url) WHERE image_url IS NOT NULL;

-- 마이그레이션 완료 로그
COMMENT ON COLUMN inventory.image_url IS '재고 항목 이미지 URL (Supabase Storage 경로)';
