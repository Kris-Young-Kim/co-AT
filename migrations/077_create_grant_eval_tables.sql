-- Migration: 077_create_grant_eval_tables
-- App: eval
-- Created: 2026-06-09
-- Purpose: 교부사업 적합성 평가 시스템

-- ================================================================
-- 1. eval_grant_referral_docs (접수공문) - must be created before assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS eval_grant_referral_docs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_year                INTEGER NOT NULL,
  doc_number              TEXT,
  sending_org             TEXT NOT NULL,
  doc_date                DATE,
  receive_date            DATE,
  referral_round          INTEGER,
  referral_count          INTEGER DEFAULT 0,
  assessment_count        INTEGER DEFAULT 0,
  assessment_items_count  INTEGER DEFAULT 0,
  cancel_count            INTEGER DEFAULT 0,
  result_send_date        DATE,
  note                    TEXT,
  created_by              TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_grant_referral_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage eval_grant_referral_docs"
  ON eval_grant_referral_docs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_grant_referral_docs_doc_year
  ON eval_grant_referral_docs (doc_year);
CREATE INDEX IF NOT EXISTS idx_grant_referral_docs_sending_org
  ON eval_grant_referral_docs (sending_org);

-- ================================================================
-- 2. eval_grant_assessments (평가 마스터)
-- ================================================================
CREATE TABLE IF NOT EXISTS eval_grant_assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  application_id        UUID REFERENCES applications(id) ON DELETE SET NULL,
  assessment_year       INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  assessment_month      INTEGER CHECK (assessment_month BETWEEN 1 AND 12),
  referral_org          TEXT,
  referral_doc_id       UUID REFERENCES eval_grant_referral_docs(id) ON DELETE SET NULL,
  evaluator_name        TEXT,
  evaluator_staff_id    TEXT,
  evaluation_date       DATE,
  prior_grant_records   JSONB DEFAULT '[]',
  general_opinion       TEXT,
  change_cancel_reason  TEXT,
  final_result          TEXT CHECK (final_result IN ('적합', '부적합', '조건부적합', '보류', '취소')),
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'submitted', 'completed')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eval_grant_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage eval_grant_assessments"
  ON eval_grant_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_grant_assessments_client_id
  ON eval_grant_assessments (client_id);
CREATE INDEX IF NOT EXISTS idx_grant_assessments_assessment_year
  ON eval_grant_assessments (assessment_year);
CREATE INDEX IF NOT EXISTS idx_grant_assessments_status
  ON eval_grant_assessments (status);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION trg_grant_assessments_updated_at_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_assessments_updated_at ON eval_grant_assessments;
CREATE TRIGGER trg_grant_assessments_updated_at
  BEFORE UPDATE ON eval_grant_assessments
  FOR EACH ROW EXECUTE FUNCTION trg_grant_assessments_updated_at_fn();

-- ================================================================
-- 3. eval_grant_items (신청 품목, max 3)
-- ================================================================
CREATE TABLE IF NOT EXISTS eval_grant_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id         UUID NOT NULL REFERENCES eval_grant_assessments(id) ON DELETE CASCADE,
  item_order            SMALLINT NOT NULL CHECK (item_order BETWEEN 1 AND 3),
  item_category         TEXT NOT NULL,
  item_name             TEXT,
  use_plan              TEXT,
  use_location          TEXT CHECK (use_location IN ('가정', '직장', '학교', '기타')),
  use_location_detail   TEXT,
  usage_experience      BOOLEAN,
  self_usage_possible   BOOLEAN,
  support_person        TEXT,
  score_env             SMALLINT CHECK (score_env IN (2,4,6,8,10)),
  score_operation       SMALLINT CHECK (score_operation IN (2,4,6,8,10)),
  score_disability      SMALLINT CHECK (score_disability IN (2,4,6,8,10)),
  score_use_plan        SMALLINT CHECK (score_use_plan IN (2,4,6,8,10)),
  score_effectiveness   SMALLINT CHECK (score_effectiveness IN (2,4,6,8,10)),
  total_score           SMALLINT GENERATED ALWAYS AS (
                          COALESCE(score_env, 0)
                          + COALESCE(score_operation, 0)
                          + COALESCE(score_disability, 0)
                          + COALESCE(score_use_plan, 0)
                          + COALESCE(score_effectiveness, 0)
                        ) STORED,
  checklist_responses   JSONB DEFAULT '{}',
  item_opinion          TEXT,
  item_result           TEXT CHECK (item_result IN ('적합', '부적합', '조건부적합', '보류')),
  recommended_model     TEXT,
  vendor_name           TEXT,
  vendor_phone          TEXT,
  support_amount        INTEGER,
  has_self_pay          BOOLEAN DEFAULT false,
  final_item_name       TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (assessment_id, item_order)
);

ALTER TABLE eval_grant_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can manage eval_grant_items"
  ON eval_grant_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE INDEX IF NOT EXISTS idx_grant_items_assessment_id
  ON eval_grant_items (assessment_id);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION trg_grant_items_updated_at_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_items_updated_at ON eval_grant_items;
CREATE TRIGGER trg_grant_items_updated_at
  BEFORE UPDATE ON eval_grant_items
  FOR EACH ROW EXECUTE FUNCTION trg_grant_items_updated_at_fn();

-- Max 3 items per assessment trigger
CREATE OR REPLACE FUNCTION trg_grant_items_max3_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM eval_grant_items
    WHERE assessment_id = NEW.assessment_id
  ) >= 3 THEN
    RAISE EXCEPTION '한 평가에 최대 3개 품목만 등록할 수 있습니다';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_items_max3 ON eval_grant_items;
CREATE TRIGGER trg_grant_items_max3
  BEFORE INSERT ON eval_grant_items
  FOR EACH ROW EXECUTE FUNCTION trg_grant_items_max3_fn();

-- ================================================================
-- 4. eval_item_checklist_templates (품목별 체크리스트 템플릿)
-- ================================================================
CREATE TABLE IF NOT EXISTS eval_item_checklist_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_category   TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  question_text   TEXT NOT NULL,
  question_order  SMALLINT NOT NULL DEFAULT 1,
  hint_text       TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (item_category, question_id)
);

ALTER TABLE eval_item_checklist_templates ENABLE ROW LEVEL SECURITY;

-- Staff can SELECT only
CREATE POLICY "staff can select eval_item_checklist_templates"
  ON eval_item_checklist_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

-- ADMIN/MANAGER can manage (INSERT/UPDATE/DELETE)
CREATE POLICY "admin manager can manage eval_item_checklist_templates"
  ON eval_item_checklist_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE INDEX IF NOT EXISTS idx_checklist_templates_item_category
  ON eval_item_checklist_templates (item_category);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_question_order
  ON eval_item_checklist_templates (item_category, question_order);

-- ================================================================
-- 5. stats pipeline: sync trigger on grant assessments
-- ================================================================
CREATE OR REPLACE FUNCTION trg_grant_assessment_sync_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.application_id IS NOT NULL THEN
    PERFORM sync_eval_service_record(NEW.application_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_assessment_sync ON eval_grant_assessments;
CREATE TRIGGER trg_grant_assessment_sync
  AFTER INSERT OR UPDATE ON eval_grant_assessments
  FOR EACH ROW EXECUTE FUNCTION trg_grant_assessment_sync_fn();

-- ================================================================
-- 6. VIEW: eval_grant_assessment_list
-- ================================================================
CREATE OR REPLACE VIEW eval_grant_assessment_list AS
SELECT
  ga.id,
  ga.client_id,
  ga.assessment_year,
  ga.assessment_month,
  ga.referral_org,
  ga.evaluation_date,
  ga.final_result,
  ga.status,
  ga.created_at,
  ga.updated_at,
  c.name          AS client_name,
  c.birth_date,
  c.disability_type,
  c.disability_grade,
  COUNT(gi.id)::int AS item_count,
  ARRAY_AGG(gi.item_category ORDER BY gi.item_order)
    FILTER (WHERE gi.id IS NOT NULL) AS item_categories
FROM eval_grant_assessments ga
JOIN clients c ON c.id = ga.client_id
LEFT JOIN eval_grant_items gi ON gi.assessment_id = ga.id
GROUP BY
  ga.id,
  c.name,
  c.birth_date,
  c.disability_type,
  c.disability_grade;

-- ================================================================
-- 7. SEED: eval_item_checklist_templates
-- ================================================================

-- 전동휠체어 (5 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('전동휠체어', 'q1', '실내외 이동 환경(문턱, 경사로, 엘리베이터)이 전동휠체어 사용에 적합합니까?', 1, '문턱 2cm 이하, 경사도 1:12 이하 권장'),
('전동휠체어', 'q2', '조이스틱 또는 대체 조작 장치를 독립적으로 조작할 수 있는 상지 기능이 있습니까?', 2, '손가락 굴곡/신전, 손목 움직임 확인'),
('전동휠체어', 'q3', '배터리 충전 및 기본 관리를 자가 또는 보호자가 수행할 수 있습니까?', 3, '충전 장소 및 전원 접근성 포함'),
('전동휠체어', 'q4', '현재 보행 및 이동 능력(기능적 보행 불가 또는 현저히 제한)이 전동휠체어 적용 기준에 부합합니까?', 4, 'K-등급 또는 FAC 2 이하 참고'),
('전동휠체어', 'q5', '심폐 기능 및 착석 유지 능력이 장시간 전동휠체어 사용에 적합합니까?', 5, '착석 균형, 압박 궤양 위험도 고려')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 수동휠체어 (4 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('수동휠체어', 'q1', '이동 경로(실내외)가 수동휠체어 통행에 적합한 폭과 경사를 갖추고 있습니까?', 1, '통로 폭 최소 80cm, 경사도 고려'),
('수동휠체어', 'q2', '자가 추진이 가능한 상지 근력과 협응 능력을 보유하고 있거나 주 돌봄자가 보조 가능합니까?', 2, '자가 추진 불가 시 보조자 확인 필수'),
('수동휠체어', 'q3', '현재 하지 기능 저하로 장거리 보행이 불가능하거나 현저히 제한됩니까?', 3, '기능적 보행 거리 50m 미만 기준 참고'),
('수동휠체어', 'q4', '착석 자세 유지 능력 및 욕창 예방 조치(방석 포함)가 고려되어 있습니까?', 4, '등받이 각도, 팔걸이 높이 맞춤 포함')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 전동침대 (4 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('전동침대', 'q1', '침실 공간이 전동침대 설치 및 이동 보조 동선 확보에 충분합니까?', 1, '침대 양측 최소 90cm 이동 공간 권장'),
('전동침대', 'q2', '체위 변경 또는 기립 보조 기능이 의학적으로 필요한 상태입니까?', 2, '욕창 예방, 기립성 저혈압, 호흡 보조 등 적응증 확인'),
('전동침대', 'q3', '리모컨 조작이 가능한 인지 기능 및 상지 기능을 보유하고 있거나 보호자가 조작 가능합니까?', 3, '인지 저하 시 보호자 교육 계획 포함'),
('전동침대', 'q4', '전원 연결 및 전기 안전 환경이 설치 장소에 갖춰져 있습니까?', 4, '접지 콘센트, 전선 정리 등 낙상 예방 고려')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 목욕의자 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('목욕의자', 'q1', '욕실 구조(면적, 문 폭, 미끄럼 방지)가 목욕의자 사용에 적합합니까?', 1, '욕실 문 최소 60cm, 바닥 미끄럼 방지 처리 여부'),
('목욕의자', 'q2', '독립적 착석이 가능하거나 보조 하에 욕실 이동이 가능합니까?', 2, '이동 시 낙상 위험도 함께 평가'),
('목욕의자', 'q3', '상지 기능 저하 또는 균형 장애로 인해 서서 목욕하기가 위험하거나 불가능합니까?', 3, '버그 균형 척도(BBS) 또는 기능 평가 참고')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 보행차 (4 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('보행차', 'q1', '잔존 보행 능력이 있으나 균형 또는 지구력 저하로 보조 장치가 필요합니까?', 1, 'FAC 3~4 또는 TUG 13.5초 이상 참고'),
('보행차', 'q2', '보행차를 조작할 수 있는 상지 근력 및 파악력이 충분합니까?', 2, '핸들 높이 맞춤 조정 가능 여부 포함'),
('보행차', 'q3', '이동 경로(실내외 바닥 재질, 문턱, 경사)가 보행차 사용에 적합합니까?', 3, '야외 사용 시 바퀴 크기 및 제동 장치 고려'),
('보행차', 'q4', '보행차 사용에 필요한 인지 기능 및 안전 판단 능력이 있습니까?', 4, '치매 또는 인지 저하 수준 별도 평가 권장')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 이동변기 (4 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('이동변기', 'q1', '화장실까지의 이동이 어렵거나 야간 이용 시 낙상 위험이 있습니까?', 1, '이동 거리, 조명 환경, 야간 인지 수준 고려'),
('이동변기', 'q2', '이동변기 착석 및 이탈 동작을 자가 또는 보조 하에 안전하게 수행할 수 있습니까?', 2, '팔걸이 지지 능력, 하지 근력 평가'),
('이동변기', 'q3', '이동변기를 배치할 충분한 공간이 침실 또는 사용 구역에 있습니까?', 3, '적정 공간 최소 0.7m x 1.2m 권장'),
('이동변기', 'q4', '사용 후 처리(비우기, 세척) 담당자 또는 절차가 마련되어 있습니까?', 4, '독거 노인, 중증 장애인의 경우 돌봄 계획 필수')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 소변수집장치 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('소변수집장치', 'q1', '이동 제한 또는 요실금으로 인해 소변수집장치가 의학적으로 필요합니까?', 1, '야간뇨, 절박성 요실금, 요의 전달 불가 등 적응증 확인'),
('소변수집장치', 'q2', '장치 착용 및 비우기를 자가 또는 보호자가 안전하게 수행할 수 있습니까?', 2, '피부 상태, 감각 저하 여부 추가 확인'),
('소변수집장치', 'q3', '피부 손상 방지를 위한 정기적 관리 계획이 수립되어 있습니까?', 3, '소변로 감염 예방, 피부 완전성 모니터링 포함')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 욕창방지방석 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('욕창방지방석', 'q1', '장시간 착석으로 인한 욕창 발생 위험이 의학적으로 평가되었습니까?', 1, 'Braden Scale 18점 이하 또는 기존 욕창 병력 확인'),
('욕창방지방석', 'q2', '현재 사용 중인 휠체어 또는 의자의 치수에 방석이 적합합니까?', 2, '좌면 폭, 깊이, 등받이 높이 측정 병행 권장'),
('욕창방지방석', 'q3', '방석 청결 유지 및 정기 검사를 담당할 수 있는 사람이 있습니까?', 3, '커버 세탁, 에어 방석 압력 점검 등 유지관리 포함')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 욕창방지매트리스 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('욕창방지매트리스', 'q1', '침상 생활 비율이 높고 욕창 발생 위험이 높게 평가됩니까?', 1, 'Braden Scale 15점 이하, 하루 침상 시간 18시간 이상 기준 참고'),
('욕창방지매트리스', 'q2', '기존 침대 프레임과 매트리스 규격이 호환됩니까?', 2, '싱글/더블 표준 규격 및 전동침대 연동 여부 확인'),
('욕창방지매트리스', 'q3', '에어 매트리스 사용 시 전원 공급 및 압력 조절 장치 관리가 가능합니까?', 3, '정전 대비 수동 공기 주입 방법 교육 필요')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 보청기 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('보청기', 'q1', '청각 검사(순음청력검사)에서 보청기 급여 기준에 해당하는 청력 손실이 확인됩니까?', 1, '장애 등록: 양이 평균 70dB 이상, 비급여 완화 기준 별도 확인'),
('보청기', 'q2', '보청기 조작(전원, 볼륨, 배터리 교체)을 자가 또는 보호자가 수행할 수 있습니까?', 2, '미세 손가락 조작 능력, 시력 상태 고려'),
('보청기', 'q3', '보청기 착용 후 의사소통 개선 효과가 충분히 예상됩니까?', 3, '어음명료도 검사 결과 및 착용 이익 평가 포함')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 시각보조기기 (3 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('시각보조기기', 'q1', '시력 검사 결과 저시력 또는 시각 장애 기준에 해당합니까?', 1, '교정 시력 0.1 이하 또는 시야 10도 이하 기준 참고'),
('시각보조기기', 'q2', '신청 기기(확대경, 점자정보단말기, 화면낭독소프트웨어 등)가 일상생활 독립성 향상에 직접 기여합니까?', 2, '활용 목적(학업, 직업, 일상생활) 구체적으로 기술'),
('시각보조기기', 'q3', '기기 조작 및 유지관리를 위한 훈련 계획이 수립되어 있습니까?', 3, '훈련 기관, 방법, 기간 포함하여 작성')
ON CONFLICT (item_category, question_id) DO NOTHING;

-- 의사소통보조기기 (4 questions)
INSERT INTO eval_item_checklist_templates (item_category, question_id, question_text, question_order, hint_text) VALUES
('의사소통보조기기', 'q1', '언어 표현 능력이 현저히 제한되어 대체 의사소통 수단이 필요합니까?', 1, '뇌성마비, ALS, 뇌졸중 후 실어증 등 적응증 확인'),
('의사소통보조기기', 'q2', '의사소통 보조기기(AAC)를 조작할 수 있는 신체 부위(손, 눈, 머리 등)가 있습니까?', 2, '직접 선택, 스캐닝, 시선 추적 등 접근 방식 평가'),
('의사소통보조기기', 'q3', '주요 의사소통 상대(가족, 치료사)가 기기 활용 지원에 참여할 의지가 있습니까?', 3, '보호자 교육 계획 및 자연스러운 사용 환경 조성 포함'),
('의사소통보조기기', 'q4', '인지 기능(상징 이해, 어휘 학습)이 AAC 기기를 효과적으로 활용하기에 충분합니까?', 4, '언어치료사 평가 결과 참조, 최소 단계 기기부터 시작 권장')
ON CONFLICT (item_category, question_id) DO NOTHING;
