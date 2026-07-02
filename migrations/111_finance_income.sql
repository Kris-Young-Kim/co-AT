-- 수입·후원금 관리
CREATE TABLE IF NOT EXISTS finance_income (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  income_date  DATE        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'grant'
    CHECK (category IN ('national_grant','provincial_grant','local_grant','donation','self_funding','other')),
  source       TEXT        NOT NULL,   -- 수입원 (기관명 또는 기부자)
  amount       INTEGER     NOT NULL CHECK (amount > 0),
  description  TEXT,
  note         TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_income_all" ON finance_income USING (true) WITH CHECK (true);
