-- Migration: 059_extend_applications_fields
-- App: eval (shared applications table)
-- Created: 2026-05-30
-- Reason: Add fields matching [사례관리] 2. 접수 및 상담.xlsx format
--   의뢰구분, 진행분류, 신청품목, 서비스영역, 내방/방문, 비고

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS referral_type TEXT,   -- 의뢰구분 (방문/유선/인터넷/기관연계/기타)
  ADD COLUMN IF NOT EXISTS progress_type TEXT,   -- 진행분류 (신규/계속/재접수)
  ADD COLUMN IF NOT EXISTS requested_item TEXT,  -- 신청품목
  ADD COLUMN IF NOT EXISTS service_area TEXT,    -- 서비스영역
  ADD COLUMN IF NOT EXISTS visit_type TEXT,      -- 내방/방문 (내방/방문)
  ADD COLUMN IF NOT EXISTS notes TEXT;           -- 비고
