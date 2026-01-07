-- regulations 테이블 생성 (RAG 챗봇용 규정 문서 저장)
-- 실행일: 2025-01-27
-- 설명: 보조기기센터 운영 지침서를 벡터화하여 저장하는 테이블
-- 참고: Gemini Embedding API를 사용하여 벡터 생성

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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_regulations_category ON regulations(category);
CREATE INDEX IF NOT EXISTS idx_regulations_section ON regulations(section);
CREATE INDEX IF NOT EXISTS idx_regulations_title ON regulations(title);
CREATE INDEX IF NOT EXISTS idx_regulations_created_at ON regulations(created_at DESC);

-- GIN 인덱스 (JSONB 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_regulations_embedding ON regulations USING GIN (embedding);

-- 전체 텍스트 검색을 위한 인덱스 (제목 + 내용)
CREATE INDEX IF NOT EXISTS idx_regulations_content_search ON regulations USING GIN (to_tsvector('korean', title || ' ' || content));

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE regulations IS '보조기기센터 운영 지침서 벡터화 데이터 (RAG 챗봇용)';
COMMENT ON COLUMN regulations.embedding IS 'Gemini Embedding API로 생성한 벡터 (JSON 배열)';
COMMENT ON COLUMN regulations.category IS '카테고리: 대여, 수리, 맞춤제작, 평가, 예산, 인력, 보고 등';
COMMENT ON COLUMN regulations.chunk_index IS '원본 문서 내 청크 순서 (문서 재구성 시 사용)';
