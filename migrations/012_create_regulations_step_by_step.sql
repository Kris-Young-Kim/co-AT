-- regulations 테이블 생성 (단계별 실행용)
-- 이 파일은 문제 해결을 위해 단계별로 나눈 버전입니다.
-- 전체 마이그레이션을 한 번에 실행하는 것이 권장됩니다.

-- ============================================
-- 1단계: 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 문서 청크 정보
  title TEXT NOT NULL, -- 섹션 제목 (예: "대여 기준", "수리비 한도")
  content TEXT NOT NULL, -- 청크 내용 (500-1000자 단위)
  section TEXT, -- 원본 문서의 섹션 정보 (예: "제2장", "제3장")
  category TEXT, -- 카테고리 (예: "대여", "수리", "평가", "예산")
  
  -- 벡터 정보
  embedding JSONB, -- Gemini Embedding 벡터 (JSON 배열로 저장)
  embedding_model TEXT DEFAULT 'text-embedding-004', -- 사용한 모델 정보
  
  -- 메타데이터
  source_file TEXT DEFAULT '보조기기센터사업안내.md', -- 원본 파일명
  chunk_index INTEGER, -- 문서 내 청크 순서
  chunk_size INTEGER, -- 청크 크기 (문자 수)
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 테이블 생성 확인
SELECT 'regulations 테이블이 생성되었습니다.' AS status;

-- ============================================
-- 2단계: 기본 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_regulations_category ON regulations(category);
CREATE INDEX IF NOT EXISTS idx_regulations_section ON regulations(section);
CREATE INDEX IF NOT EXISTS idx_regulations_title ON regulations(title);
CREATE INDEX IF NOT EXISTS idx_regulations_created_at ON regulations(created_at DESC);

-- ============================================
-- 3단계: GIN 인덱스 생성 (JSONB 검색 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_regulations_embedding ON regulations USING GIN (embedding);

-- ============================================
-- 4단계: 전체 텍스트 검색 인덱스 생성
-- ============================================
-- simple 설정 사용 (korean 설정이 없을 수 있음)
CREATE INDEX IF NOT EXISTS idx_regulations_content_search ON regulations USING GIN (to_tsvector('simple', title || ' ' || content));

-- ============================================
-- 5단계: 테이블 및 컬럼 코멘트 추가
-- ============================================
COMMENT ON TABLE regulations IS '보조기기센터 운영 지침서 벡터화 데이터 (RAG 챗봇용)';
COMMENT ON COLUMN regulations.embedding IS 'Gemini Embedding API로 생성한 벡터 (JSON 배열)';
COMMENT ON COLUMN regulations.category IS '카테고리: 대여, 수리, 맞춤제작, 평가, 예산, 인력, 보고 등';
COMMENT ON COLUMN regulations.chunk_index IS '원본 문서 내 청크 순서 (문서 재구성 시 사용)';

-- ============================================
-- 최종 확인
-- ============================================
SELECT 
  'regulations 테이블 및 인덱스 생성 완료' AS status,
  COUNT(*) AS table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'regulations';
