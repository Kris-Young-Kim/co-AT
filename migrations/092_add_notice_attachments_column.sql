-- Migration: 092_add_notice_attachments_column
-- App: shared (notices)
-- Created: 2026-06-14
-- Note: 008_add_notice_attachments.sql was created but never applied to DB

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN notices.attachments IS '첨부파일 목록 (JSON 배열): 이미지, PDF, 유튜브 링크';
