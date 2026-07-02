-- 예산 전용(流用) 이력
CREATE TABLE IF NOT EXISTS finance_budget_transfers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  year             INTEGER     NOT NULL,
  from_category_id UUID        NOT NULL REFERENCES finance_budget_categories(id),
  to_category_id   UUID        NOT NULL REFERENCES finance_budget_categories(id),
  amount           INTEGER     NOT NULL CHECK (amount > 0),
  reason           TEXT        NOT NULL,
  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_budget_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_budget_transfers_all" ON finance_budget_transfers USING (true) WITH CHECK (true);
