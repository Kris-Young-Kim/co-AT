-- Phase HR-6: 연말정산 테이블
CREATE TABLE IF NOT EXISTS hr_year_end_tax (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  tax_year              INT         NOT NULL,

  -- 총급여 (연간 합산, 자동 계산용으로 저장)
  gross_income          INT         NOT NULL DEFAULT 0,

  -- 인적공제 (본인 기본공제 150만은 자동)
  dependents_count      INT         NOT NULL DEFAULT 0,   -- 부양가족 수 (본인 제외)
  elderly_count         INT         NOT NULL DEFAULT 0,   -- 경로우대 추가공제 인원
  disabled_count        INT         NOT NULL DEFAULT 0,   -- 장애인 추가공제 인원

  -- 특별세액공제 항목 (지출액 입력)
  medical_expenses      INT         NOT NULL DEFAULT 0,   -- 의료비 지출액
  education_expenses    INT         NOT NULL DEFAULT 0,   -- 교육비 지출액
  housing_rent          INT         NOT NULL DEFAULT 0,   -- 월세 연간 납부액

  -- 기납부 세액 (급여대장 합산)
  prepaid_income_tax    INT         NOT NULL DEFAULT 0,
  prepaid_local_tax     INT         NOT NULL DEFAULT 0,

  -- 연말정산 계산 결과
  earned_income_deduction  INT      DEFAULT 0,   -- 근로소득공제
  personal_deduction       INT      DEFAULT 0,   -- 인적공제 합계
  special_tax_credit       INT      DEFAULT 0,   -- 특별세액공제 합계
  calculated_income_tax    INT      DEFAULT 0,   -- 산출세액
  earned_income_tax_credit INT      DEFAULT 0,   -- 근로소득세액공제
  final_income_tax         INT      DEFAULT 0,   -- 결정세액 (소득세)
  final_local_tax          INT      DEFAULT 0,   -- 결정세액 (지방소득세)
  refund_income_tax        INT      DEFAULT 0,   -- 환급(+)/추납(-) 소득세
  refund_local_tax         INT      DEFAULT 0,   -- 환급(+)/추납(-) 지방소득세

  note                  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (employee_id, tax_year)
);

ALTER TABLE hr_year_end_tax ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_year_end_tax_select" ON hr_year_end_tax FOR SELECT USING (true);
CREATE POLICY "hr_year_end_tax_insert" ON hr_year_end_tax FOR INSERT WITH CHECK (true);
CREATE POLICY "hr_year_end_tax_update" ON hr_year_end_tax FOR UPDATE USING (true);
CREATE POLICY "hr_year_end_tax_delete" ON hr_year_end_tax FOR DELETE USING (true);
