-- migrations/042_create_eval_service_records.sql
CREATE TABLE IF NOT EXISTS eval_service_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES clients(id),

  -- 접수 정보
  received_at       DATE,
  application_year  INTEGER,
  application_no    INTEGER,
  is_re_application BOOLEAN DEFAULT false,

  -- 대상자 정보 (시트 원본 보존)
  name              TEXT,
  birth_date        DATE,
  gender            TEXT,
  region            TEXT,
  disability_type   TEXT,

  -- 서비스 분류
  service_category  TEXT,
  product_name      TEXT,
  item_category     TEXT,
  service_content   TEXT,
  service_area      TEXT,

  -- 보조기기센터 사업 체크박스
  is_consult        BOOLEAN DEFAULT false,
  is_assessment     BOOLEAN DEFAULT false,
  is_trial          BOOLEAN DEFAULT false,
  is_rental         BOOLEAN DEFAULT false,
  is_custom_make    BOOLEAN DEFAULT false,
  is_grant          BOOLEAN DEFAULT false,
  is_education      BOOLEAN DEFAULT false,
  is_other_business BOOLEAN DEFAULT false,
  is_info_provision BOOLEAN DEFAULT false,

  -- 재원연계
  is_public_funding  BOOLEAN DEFAULT false,
  is_private_funding BOOLEAN DEFAULT false,
  is_self_pay        BOOLEAN DEFAULT false,
  is_funding_secured BOOLEAN DEFAULT false,

  -- 사후관리
  is_repair     BOOLEAN DEFAULT false,
  is_cleaning   BOOLEAN DEFAULT false,
  is_reuse      BOOLEAN DEFAULT false,
  is_monitoring BOOLEAN DEFAULT false,

  -- 서비스 제공 방법
  referral_type TEXT,
  is_phone      BOOLEAN DEFAULT false,
  is_visit_in   BOOLEAN DEFAULT false,
  is_visit_out  BOOLEAN DEFAULT false,

  is_closed  BOOLEAN DEFAULT false,
  staff_name TEXT,
  source     TEXT DEFAULT 'sheets',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage eval_service_records"
  ON eval_service_records FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_eval_sr_received_at    ON eval_service_records(received_at);
CREATE INDEX IF NOT EXISTS idx_eval_sr_name_birthdate ON eval_service_records(name, birth_date);
CREATE INDEX IF NOT EXISTS idx_eval_sr_client_id      ON eval_service_records(client_id);

COMMENT ON TABLE eval_service_records IS '보조기기 서비스 실적 — 중앙 보고용 전용 테이블';
