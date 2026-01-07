-- 인덱스 최적화 마이그레이션
-- 실행일: 2025-01-27
-- 설명: 자주 조회되는 컬럼 및 복합 쿼리 패턴에 대한 인덱스 추가

-- 1. profiles 테이블 인덱스 최적화
-- clerk_user_id는 로그인 시 자주 조회됨
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
-- 역할별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. clients 테이블 인덱스 최적화
-- 이름 검색 최적화 (대소문자 구분 없이)
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);
-- 전화번호 검색 최적화
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
-- 생성일 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- 3. applications 테이블 인덱스 최적화
-- client_id와 status 조합 조회 (대상자별 신청 목록)
CREATE INDEX IF NOT EXISTS idx_applications_client_status ON applications(client_id, status);
-- 생성일 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
-- 상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
-- 배정 직원별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_applications_assigned_staff_created ON applications(assigned_staff_id, created_at DESC);

-- 4. rentals 테이블 인덱스 최적화
-- 만료일 기준 조회 (D-Day 알림용)
CREATE INDEX IF NOT EXISTS idx_rentals_end_date ON rentals(end_date);
-- client_id와 status 조합 조회
CREATE INDEX IF NOT EXISTS idx_rentals_client_status ON rentals(client_id, status);
-- 만료 예정 대여 조회 (end_date와 status 조합)
CREATE INDEX IF NOT EXISTS idx_rentals_end_date_status ON rentals(end_date, status) WHERE status = 'active';
-- 생성일 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON rentals(created_at DESC);

-- 5. inventory 테이블 인덱스 최적화
-- 상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
-- 카테고리별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
-- 대여 가능 여부와 상태 조합 조회
CREATE INDEX IF NOT EXISTS idx_inventory_rental_status ON inventory(is_rental_available, status) WHERE is_rental_available = true;
-- 생성일 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON inventory(created_at DESC);

-- 6. notices 테이블 인덱스 최적화
-- 상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
-- 생성일 기준 정렬 최적화 (공지사항 목록)
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
-- 공개 공지사항 조회 최적화 (status와 created_at 조합)
CREATE INDEX IF NOT EXISTS idx_notices_public_created ON notices(status, created_at DESC) WHERE status = 'published';

-- 7. schedules 테이블 인덱스 최적화 (일부는 이미 존재하지만 추가 최적화)
-- 일정 타입과 날짜 조합 조회
CREATE INDEX IF NOT EXISTS idx_schedules_type_date ON schedules(schedule_type, scheduled_date);
-- 완료되지 않은 일정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_schedules_pending ON schedules(scheduled_date, status) WHERE status != 'completed';

-- 8. service_logs 테이블 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_service_logs_client_id ON service_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_inventory_id ON service_logs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_created_at ON service_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_logs_service_type ON service_logs(service_type);

-- 9. custom_makes 테이블 인덱스 최적화 (일부는 이미 존재하지만 추가)
-- 진행 상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_custom_makes_status_created ON custom_makes(progress_status, created_at DESC);
-- 배정 직원별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_custom_makes_staff_created ON custom_makes(assigned_staff_id, created_at DESC);

-- 10. pg_trgm 확장 활성화 (텍스트 검색 최적화)
-- 이미 활성화되어 있을 수 있지만, 없으면 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 마이그레이션 완료 로그
COMMENT ON INDEX idx_clients_name_trgm IS '클라이언트 이름 검색 최적화 (대소문자 구분 없이)';
COMMENT ON INDEX idx_applications_client_status IS '대상자별 신청 목록 조회 최적화';
COMMENT ON INDEX idx_rentals_end_date_status IS '만료 예정 대여 조회 최적화 (D-Day 알림용)';
COMMENT ON INDEX idx_notices_public_created IS '공개 공지사항 목록 조회 최적화';
