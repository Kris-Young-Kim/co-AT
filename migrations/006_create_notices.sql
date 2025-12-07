-- notices 테이블 생성
-- 실행일: 2025-01-XX
-- 설명: 공지사항 테이블 (공지, 지원사업, 이벤트 등)

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 공지사항 내용
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('notice', 'support', 'event')),
  
  -- 공지사항 설정
  is_pinned BOOLEAN DEFAULT false,
  
  -- 작성자 정보
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- 복합 인덱스 (공지사항 목록 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_notices_pinned_created ON notices(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_category_created ON notices(category, created_at DESC);

-- updated_at 자동 업데이트를 위한 트리거 함수 (필요시 별도 생성)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';
--
-- CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE notices IS '공지사항 테이블 (공지, 활동 소식, 지원사업, 서비스 사례 등)';
COMMENT ON COLUMN notices.category IS '공지사항 카테고리: notice(공지), event(활동 소식), support(지원사업), case(서비스 사례)';
COMMENT ON COLUMN notices.is_pinned IS '상단 고정 여부 (true일 경우 목록 상단에 고정 표시)';

