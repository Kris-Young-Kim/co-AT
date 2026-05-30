-- Migration: 058_extend_clients_fields
-- App: eval (shared clients table)
-- Created: 2026-05-30
-- Reason: Add fields from Google Sheets 신규_기초입력 + 신규_장애정보
--   These fields were in the source sheets but not captured in the clients table.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS city TEXT,                     -- 거주지(시군)
  ADD COLUMN IF NOT EXISTS floor_number TEXT,              -- 층수
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,             -- 보호자성명
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,     -- 보호자관계
  ADD COLUMN IF NOT EXISTS email TEXT,                     -- 이메일
  ADD COLUMN IF NOT EXISTS secondary_disability_type TEXT, -- 부장애유형
  ADD COLUMN IF NOT EXISTS care_level TEXT,                -- 요양등급
  ADD COLUMN IF NOT EXISTS disability_progression TEXT,    -- 장애진행정도
  ADD COLUMN IF NOT EXISTS progression_cause TEXT,         -- 진행원인및이유
  ADD COLUMN IF NOT EXISTS disability_description TEXT;    -- 장애상태기술
