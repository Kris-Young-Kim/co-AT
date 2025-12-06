-- applications 테이블 필드 추가
-- 실행일: 2025-01-XX
-- 설명: applications 테이블에 category, sub_category, desired_date, assigned_staff_id 필드 추가

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('consult', 'experience', 'custom', 'aftercare', 'education')),
  ADD COLUMN IF NOT EXISTS sub_category TEXT,
  ADD COLUMN IF NOT EXISTS desired_date DATE,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES profiles(id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_applications_category ON applications(category);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_staff_id ON applications(assigned_staff_id);

-- 마이그레이션 완료 로그
COMMENT ON COLUMN applications.category IS '서비스 카테고리: consult(상담), experience(체험), custom(맞춤형), aftercare(사후관리), education(교육홍보)';
COMMENT ON COLUMN applications.sub_category IS '서비스 세부 카테고리: repair(수리), rental(대여), custom_make(맞춤제작), visit(방문), exhibition(전시), cleaning(소독), reuse(재활용) 등';
COMMENT ON COLUMN applications.desired_date IS '희망 서비스 일자';
COMMENT ON COLUMN applications.assigned_staff_id IS '배정된 담당 직원 ID (profiles 테이블 참조)';

