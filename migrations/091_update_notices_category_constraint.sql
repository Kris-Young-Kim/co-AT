-- notices 테이블 category CHECK 제약 업데이트
-- 기존: ('notice', 'support', 'event')
-- 변경: ('notice', 'activity', 'support', 'case') — 공지/활동소식/지원사업/서비스사례

ALTER TABLE notices
  DROP CONSTRAINT IF EXISTS notices_category_check;

ALTER TABLE notices
  ADD CONSTRAINT notices_category_check
    CHECK (category IN ('notice', 'activity', 'support', 'case'));

COMMENT ON COLUMN notices.category IS '공지사항 카테고리: notice(공지), activity(활동 소식), support(지원사업), case(서비스 사례)';
