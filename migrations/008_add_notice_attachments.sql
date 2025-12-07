-- notices 테이블에 첨부파일 필드 추가
-- 실행일: 2025-12-06
-- 설명: 공지사항에 이미지, PDF, 유튜브 링크 등 첨부파일 추가

ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- attachments 필드 구조:
-- [
--   {
--     "type": "image" | "pdf" | "youtube",
--     "url": "https://...",
--     "name": "파일명",
--     "size": 12345 (bytes, 이미지/PDF만)
--   }
-- ]

COMMENT ON COLUMN notices.attachments IS '첨부파일 목록 (JSON 배열): 이미지, PDF, 유튜브 링크 등';

