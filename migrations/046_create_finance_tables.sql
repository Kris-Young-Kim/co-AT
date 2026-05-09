-- ── finance_budget_categories ────────────────────────────
CREATE TABLE IF NOT EXISTS finance_budget_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES finance_budget_categories(id) ON DELETE RESTRICT,
  name       text NOT NULL,
  code       text UNIQUE,
  order_no   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read finance_budget_categories"
  ON finance_budget_categories FOR SELECT
  USING (true);

CREATE POLICY "service role write finance_budget_categories"
  ON finance_budget_categories FOR ALL
  USING (auth.role() = 'service_role');

-- ── finance_budgets ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year        integer NOT NULL,
  category_id uuid NOT NULL REFERENCES finance_budget_categories(id) ON DELETE RESTRICT,
  amount      bigint NOT NULL DEFAULT 0,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, category_id)
);

CREATE INDEX ON finance_budgets (year);

ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read finance_budgets"
  ON finance_budgets FOR SELECT
  USING (true);

CREATE POLICY "service role write finance_budgets"
  ON finance_budgets FOR ALL
  USING (auth.role() = 'service_role');

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_finance_budgets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_finance_budgets_updated_at
  BEFORE UPDATE ON finance_budgets
  FOR EACH ROW EXECUTE FUNCTION update_finance_budgets_updated_at();

-- ── finance_expenditures ──────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_expenditures (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         uuid REFERENCES finance_budget_categories(id) ON DELETE SET NULL,
  spend_date          date NOT NULL,
  amount              bigint NOT NULL,
  description         text NOT NULL,
  source_approval_id  uuid,  -- soft FK to approval_documents
  is_manual           boolean NOT NULL DEFAULT false,
  receipt_url         text,
  note                text,
  created_by          text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON finance_expenditures (spend_date);
CREATE INDEX ON finance_expenditures (category_id);
CREATE INDEX ON finance_expenditures (source_approval_id);

ALTER TABLE finance_expenditures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read finance_expenditures"
  ON finance_expenditures FOR SELECT
  USING (true);

CREATE POLICY "service role write finance_expenditures"
  ON finance_expenditures FOR ALL
  USING (auth.role() = 'service_role');

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_finance_expenditures_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_finance_expenditures_updated_at
  BEFORE UPDATE ON finance_expenditures
  FOR EACH ROW EXECUTE FUNCTION update_finance_expenditures_updated_at();

-- ── finance_budget_adjustments ────────────────────────────
CREATE TABLE IF NOT EXISTS finance_budget_adjustments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id      uuid NOT NULL REFERENCES finance_budgets(id) ON DELETE CASCADE,
  before_amount  bigint NOT NULL,
  after_amount   bigint NOT NULL,
  reason         text,
  adjusted_by    text NOT NULL,
  adjusted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON finance_budget_adjustments (budget_id);

ALTER TABLE finance_budget_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read finance_budget_adjustments"
  ON finance_budget_adjustments FOR SELECT
  USING (true);

CREATE POLICY "service role write finance_budget_adjustments"
  ON finance_budget_adjustments FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed: default categories ──────────────────────────────
INSERT INTO finance_budget_categories (id, parent_id, name, code, order_no) VALUES
  ('00000000-0000-0000-0001-000000000001', NULL, '사업비', 'BUSINESS', 1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0001-000000000001', '보조기기 대여', 'BUSINESS_RENTAL', 1),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0001-000000000001', '보조기기 제작', 'BUSINESS_CUSTOM_MAKE', 2),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0001-000000000001', '교육·홍보', 'BUSINESS_EDUCATION', 3),
  ('00000000-0000-0000-0002-000000000001', NULL, '운영비', 'OPERATION', 2),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000001', '인건비', 'OPERATION_SALARY', 1),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0002-000000000001', '사무용품비', 'OPERATION_OFFICE', 2),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0002-000000000001', '차량유지비', 'OPERATION_VEHICLE', 3)
ON CONFLICT (id) DO NOTHING;
