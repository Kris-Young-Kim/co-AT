-- migrations/035_create_annual_targets.sql
-- 연도별 사업 목표값 테이블

CREATE TABLE IF NOT EXISTS annual_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,

  -- 보조기기 상담 및 정보제공
  consultation      INTEGER NOT NULL DEFAULT 0,   -- 보조기기 상담(연인원)
  -- 콜센터는 '상시'이므로 목표 없음

  -- 체험지원
  experience        INTEGER NOT NULL DEFAULT 0,   -- 보조기기 사용 체험

  -- 맞춤형 지원사업
  rental            INTEGER NOT NULL DEFAULT 0,   -- 대여
  custom_make       INTEGER NOT NULL DEFAULT 0,   -- 맞춤 제작 지원
  -- 교부사업 맞춤형 평가지원은 '상시'

  -- 사후관리 지원사업
  cleaning          INTEGER NOT NULL DEFAULT 0,   -- 소독 및 세척
  repair            INTEGER NOT NULL DEFAULT 0,   -- 점검 및 수리
  reuse             INTEGER NOT NULL DEFAULT 0,   -- 재사용 지원

  -- 교육 및 홍보사업
  professional_edu  INTEGER NOT NULL DEFAULT 0,   -- 전문인력 교육 등
  promotion         INTEGER NOT NULL DEFAULT 0,   -- 홍보

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage annual_targets"
  ON annual_targets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2026년 초기 목표값 삽입 (강원 기준)
INSERT INTO annual_targets (
  year, consultation, experience,
  rental, custom_make,
  cleaning, repair, reuse,
  professional_edu, promotion
) VALUES (
  2026, 600, 30,
  77, 100,
  84, 15, 9,
  10, 22
) ON CONFLICT (year) DO NOTHING;

COMMENT ON TABLE annual_targets IS '연도별 사업 목표값 — 중앙 보고 달성률 계산용';
