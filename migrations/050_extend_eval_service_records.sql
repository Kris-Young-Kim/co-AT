-- Migration: 050_extend_eval_service_records
-- App: eval
-- Created: 2026-05-09
-- Reason: Add missing columns identified by comparing Google Sheets source
--         ([사례관리] 2. 접수 및 상담.xlsx → 접수+상담(실적용) sheet)
--         against the current eval_service_records schema.

-- ============================================================
-- 🔴 필수 누락 컬럼 7개
-- ============================================================

-- 실적월 (1~12) — 월별 집계용
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS application_month INTEGER
    CHECK (application_month BETWEEN 1 AND 12);

-- 접수현황 — 완료 / 미정 / 취소
-- NOTE: 'status' is a reserved-like identifier in PG; using record_status to avoid shadowing
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS record_status TEXT
    CHECK (record_status IN ('완료', '미정', '취소'));

-- 상담일 — 접수일과 별개로 실제 상담이 이루어진 날짜
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS consultation_date DATE;

-- 서비스대분류 — 공적급여 / 민간지원 / 기타 / 서비스지원
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS service_major_category TEXT
    CHECK (service_major_category IN ('공적급여', '민간지원', '기타', '서비스지원'));

-- 서비스중분류 — 사업분류(service_category)보다 세부 텍스트
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS service_sub_category TEXT;

-- 경제상황 — 수급자 / 차상위 / 일반
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS economic_status TEXT
    CHECK (economic_status IN ('수급자', '차상위', '일반'));

-- 장애정도 — 중증 / 경증
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS disability_severity TEXT
    CHECK (disability_severity IN ('중증', '경증'));

-- ============================================================
-- 🟡 날짜형 보완 3개 (기존 boolean 유지, 날짜 컬럼 추가)
-- ============================================================

-- 종결일 (is_closed boolean은 유지)
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS closed_at DATE;

-- 모니터링 날짜 (is_monitoring boolean은 유지)
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS monitoring_date DATE;

-- 실적기준일 — 사업별 실적 산정 기준일 (대여일, 맞춤제작 완료일 등)
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS performance_date DATE;

-- ============================================================
-- 🟡 사업별 세부 정보 3개
-- ============================================================

-- 체험지원 적용대수
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS trial_device_count INTEGER;

-- 정보제공 영역 (중앙 보고용: 교육 및 훈련 / 정보제공 등)
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS info_provision_area TEXT;

-- 재원연계 상세 (민간지원사업명, 후원처 등 텍스트)
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS funding_source_detail TEXT;

-- ============================================================
-- 인덱스 — 자주 필터링되는 컬럼
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_eval_sr_year_month
  ON eval_service_records(application_year, application_month);

CREATE INDEX IF NOT EXISTS idx_eval_sr_record_status
  ON eval_service_records(record_status);

CREATE INDEX IF NOT EXISTS idx_eval_sr_service_major_cat
  ON eval_service_records(service_major_category);

CREATE INDEX IF NOT EXISTS idx_eval_sr_consultation_date
  ON eval_service_records(consultation_date);

CREATE INDEX IF NOT EXISTS idx_eval_sr_performance_date
  ON eval_service_records(performance_date);

-- ============================================================
-- 코멘트
-- ============================================================

COMMENT ON COLUMN eval_service_records.application_month    IS '실적월 (1~12) — 월별 집계 기준';
COMMENT ON COLUMN eval_service_records.record_status        IS '접수현황: 완료 / 미정 / 취소 — 완료 시 is_closed=true 및 closed_at 설정 필요';
COMMENT ON COLUMN eval_service_records.consultation_date    IS '상담일 — 접수일과 다를 수 있음';
COMMENT ON COLUMN eval_service_records.service_major_category IS '서비스대분류: 공적급여 / 민간지원 / 기타 / 서비스지원';
COMMENT ON COLUMN eval_service_records.service_sub_category IS '서비스중분류 — 사업분류 하위 세부 텍스트';
COMMENT ON COLUMN eval_service_records.economic_status      IS '경제상황: 수급자 / 차상위 / 일반';
COMMENT ON COLUMN eval_service_records.disability_severity  IS '장애정도: 중증 / 경증';
COMMENT ON COLUMN eval_service_records.closed_at            IS '종결일 (날짜) — is_closed boolean과 병행 사용';
COMMENT ON COLUMN eval_service_records.monitoring_date      IS '모니터링 날짜 — is_monitoring boolean과 병행 사용';
COMMENT ON COLUMN eval_service_records.performance_date     IS '실적기준일 — 사업별 실적 산정 기준일';
COMMENT ON COLUMN eval_service_records.trial_device_count   IS '체험지원 적용 대수';
COMMENT ON COLUMN eval_service_records.info_provision_area  IS '정보제공 영역 (중앙 보고서용)';
COMMENT ON COLUMN eval_service_records.funding_source_detail IS '재원연계 상세 — 민간지원사업명, 후원처 등';
