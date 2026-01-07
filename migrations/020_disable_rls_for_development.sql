-- RLS 비활성화 (개발 환경용)
-- 개발 초기/중기에는 RLS를 비활성화하여 개발 편의성을 유지합니다.
-- 프로덕션 배포 전에 반드시 RLS를 다시 활성화해야 합니다.

-- schedules 테이블 RLS 비활성화
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

-- 참고: 다른 테이블의 RLS도 필요시 비활성화할 수 있습니다:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE rentals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_makes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_logs DISABLE ROW LEVEL SECURITY;
