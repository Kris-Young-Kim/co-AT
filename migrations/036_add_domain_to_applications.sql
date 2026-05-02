-- migrations/036_add_domain_to_applications.sql
-- applications 테이블에 서비스 영역 컬럼 추가
-- 영역: WC(휠체어), ADL(일상생활), S(보행), SP(자세유지), EC(환경조절),
--       CA(의사소통), L(학습), AAC(보완대체의사소통), AM(장기요양)

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS domain TEXT
    CHECK (domain IN ('WC','ADL','S','SP','EC','CA','L','AAC','AM'));

CREATE INDEX IF NOT EXISTS idx_applications_domain ON applications(domain);

COMMENT ON COLUMN applications.domain IS
  '서비스 영역: WC/ADL/S/SP/EC/CA/L/AAC/AM — 중앙 보고 영역별 집계용';
