-- migrations/034_create_call_logs.sql
-- 콜센터 상담 일지 테이블

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  log_date DATE NOT NULL,

  -- 의뢰인 정보
  requester_type TEXT CHECK (requester_type IN (
    '장애 당사자', '보호자 및 지인', '유관기관 종사자',
    '시군구(및 읍면동) 담당자', '교육기관 종사자', '기타'
  )),
  requester_region TEXT,

  -- 대상자 정보
  target_name TEXT,
  target_gender TEXT CHECK (target_gender IN ('남', '여', NULL)),
  target_disability_type TEXT,
  target_disability_severity TEXT CHECK (target_disability_severity IN ('심한', '심하지 않은', NULL)),
  target_economic_status TEXT,

  -- 질문 유형 (다중 선택)
  q_public_benefit    BOOLEAN NOT NULL DEFAULT false,  -- 공적급여
  q_private_benefit   BOOLEAN NOT NULL DEFAULT false,  -- 민간급여
  q_device            BOOLEAN NOT NULL DEFAULT false,  -- 보조기기
  q_case_management   BOOLEAN NOT NULL DEFAULT false,  -- 사례연계
  q_other             BOOLEAN NOT NULL DEFAULT false,  -- 기타

  -- 상담 내용
  question_content TEXT,
  answer TEXT,

  -- 담당자
  staff_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_log_date ON call_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_call_logs_requester_type ON call_logs(requester_type);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage call_logs"
  ON call_logs FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE call_logs IS '콜센터 상담 일지 — 중앙 보고용';
