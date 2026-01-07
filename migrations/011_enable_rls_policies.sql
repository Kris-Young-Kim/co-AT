-- RLS (Row Level Security) 정책 활성화
-- 주의: 이 마이그레이션은 프로덕션 배포 전에 실행해야 합니다.
-- 개발 환경에서는 RLS를 비활성화하여 개발 편의성을 유지할 수 있습니다.

-- ============================================
-- 1. profiles 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (
  clerk_user_id = (
    SELECT clerk_user_id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    LIMIT 1
  )
);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (
  clerk_user_id = (
    SELECT clerk_user_id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    LIMIT 1
  )
);

-- 관리자/직원은 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원은 모든 프로필 수정 가능
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 2. applications 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 신청서만 조회 가능
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
USING (
  client_id IN (
    SELECT id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);

-- 사용자는 자신의 신청서만 생성 가능
CREATE POLICY "Users can create own applications"
ON applications FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);

-- 관리자/직원은 모든 신청서 조회 가능
CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원은 모든 신청서 수정 가능
CREATE POLICY "Admins can update all applications"
ON applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 3. schedules 테이블 RLS 정책
-- ============================================

-- 공개 일정은 모든 사용자 조회 가능 (exhibition, education)
CREATE POLICY "Public schedules are viewable by all"
ON schedules FOR SELECT
USING (
  schedule_type IN ('exhibition', 'education')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 일정 생성/수정/삭제 가능
CREATE POLICY "Admins can manage schedules"
ON schedules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 4. notices 테이블 RLS 정책
-- ============================================

-- 공개 공지사항은 모든 사용자 조회 가능
CREATE POLICY "Public notices are viewable by all"
ON notices FOR SELECT
USING (is_public = true);

-- 관리자/직원은 모든 공지사항 조회 가능
CREATE POLICY "Admins can view all notices"
ON notices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 공지사항 생성/수정/삭제 가능
CREATE POLICY "Admins can manage notices"
ON notices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 5. inventory 테이블 RLS 정책
-- ============================================

-- 관리자/직원만 재고 조회 가능
CREATE POLICY "Admins can view inventory"
ON inventory FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 재고 관리 가능
CREATE POLICY "Admins can manage inventory"
ON inventory FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 6. rentals 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 대여만 조회 가능
CREATE POLICY "Users can view own rentals"
ON rentals FOR SELECT
USING (
  client_id IN (
    SELECT id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);

-- 관리자/직원은 모든 대여 조회 가능
CREATE POLICY "Admins can view all rentals"
ON rentals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 대여 관리 가능
CREATE POLICY "Admins can manage rentals"
ON rentals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 7. custom_makes 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 맞춤제작만 조회 가능
CREATE POLICY "Users can view own custom makes"
ON custom_makes FOR SELECT
USING (
  client_id IN (
    SELECT id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);

-- 관리자/직원은 모든 맞춤제작 조회 가능
CREATE POLICY "Admins can view all custom makes"
ON custom_makes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 맞춤제작 관리 가능
CREATE POLICY "Admins can manage custom makes"
ON custom_makes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 8. service_logs 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 서비스 로그만 조회 가능
CREATE POLICY "Users can view own service logs"
ON service_logs FOR SELECT
USING (
  client_id IN (
    SELECT id FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
  )
);

-- 관리자/직원은 모든 서비스 로그 조회 가능
CREATE POLICY "Admins can view all service logs"
ON service_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- 관리자/직원만 서비스 로그 생성/수정 가능
CREATE POLICY "Admins can manage service logs"
ON service_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = auth.jwt() ->> 'sub'
    AND role IN ('admin', 'manager', 'staff')
  )
);

-- ============================================
-- 주의사항
-- ============================================
-- 
-- 이 마이그레이션을 실행하기 전에:
-- 1. 모든 정책이 올바르게 작동하는지 테스트하세요.
-- 2. 개발 환경에서는 RLS를 비활성화할 수 있습니다:
--    ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
-- 3. 프로덕션 배포 전에 반드시 RLS를 활성화하세요:
--    ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
--
-- RLS 활성화 명령어는 별도로 실행해야 합니다.
-- 각 테이블에 대해:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_makes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
