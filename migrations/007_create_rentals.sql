-- rentals 테이블 생성
-- 실행일: 2025-01-XX
-- 설명: 대여 관리 테이블 (보조기기 대여 및 반납 관리)

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 관련 정보
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- 대여 기간
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  return_date DATE, -- 실제 반납일
  
  -- 대여 관리
  extension_count INTEGER DEFAULT 0, -- 연장 횟수
  status TEXT DEFAULT 'rented' CHECK (status IN ('rented', 'returned', 'overdue', 'damaged')),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_rentals_application_id ON rentals(application_id);
CREATE INDEX IF NOT EXISTS idx_rentals_inventory_id ON rentals(inventory_id);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_rental_end_date ON rentals(rental_end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_return_date ON rentals(return_date);

-- 복합 인덱스 (대여 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_rentals_status_end_date ON rentals(status, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_client_status ON rentals(client_id, status);

-- 대여 기간 검증을 위한 CHECK 제약조건 (선택사항)
-- ALTER TABLE rentals ADD CONSTRAINT check_rental_dates 
--   CHECK (rental_end_date >= rental_start_date);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE rentals IS '대여 관리 테이블 (보조기기 대여 및 반납 관리)';
COMMENT ON COLUMN rentals.status IS '대여 상태: rented(대여중), returned(반납완료), overdue(연체), damaged(손상)';
COMMENT ON COLUMN rentals.extension_count IS '대여 기간 연장 횟수';
COMMENT ON COLUMN rentals.return_date IS '실제 반납일 (반납 완료 시 기록)';

