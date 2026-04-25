-- migrations/030_create_resources.sql
-- resources 테이블: 영상자료(video)와 문서자료(document)를 하나의 테이블로 관리

CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('document', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  -- 문서자료 전용
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  -- 영상자료 전용 (YouTube ID 배열)
  youtube_ids TEXT[],
  -- 공통
  resource_date DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
