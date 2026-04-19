-- migrations/022_create_notice_reads.sql

CREATE TABLE IF NOT EXISTS notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notice_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_reads_notice_id ON notice_reads(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_reads_clerk_user_id ON notice_reads(clerk_user_id);

-- RLS 비활성화 (개발 환경 - 기존 패턴과 동일)
ALTER TABLE notice_reads DISABLE ROW LEVEL SECURITY;
