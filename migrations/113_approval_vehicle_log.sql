-- Migration: 113_approval_vehicle_log
-- App: approval
-- Created: 2026-07-02
-- Purpose: 차량운행일지 결재 타입 추가 + approval_vehicles 테이블 생성

-- ── 1. approval_vehicles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_vehicles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number      text NOT NULL,           -- 차량번호 (예: 강원 가 1234)
  name        text NOT NULL,           -- 차량명 (예: 카니발)
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE approval_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read vehicles"
  ON approval_vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin can manage vehicles"
  ON approval_vehicles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 2. 차량 초기 데이터 (2대) ────────────────────────────────
INSERT INTO approval_vehicles (number, name) VALUES
  ('차량번호1', '차량명1'),
  ('차량번호2', '차량명2');

-- ── 3. approval_documents.type CHECK 제약 확장 ───────────────
ALTER TABLE approval_documents
  DROP CONSTRAINT IF EXISTS approval_documents_type_check;

ALTER TABLE approval_documents
  ADD CONSTRAINT approval_documents_type_check
  CHECK (type IN (
    'expenditure',
    'leave',
    'business_report',
    'rental',
    'custom_make',
    'reuse',
    'grant_referral',
    'vehicle_log'
  ));
