-- Seed initial budget category hierarchy (본사업/특성화사업/기능보강사업).
-- Idempotent: parent upserts always return id so children can be re-inserted if needed.
WITH
  p1 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('본사업', 'MAIN', 1)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  ),
  p2 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('특성화 사업', 'SPECIAL', 2)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  ),
  p3 AS (
    INSERT INTO finance_budget_categories (name, code, order_no)
    VALUES ('기능보강 사업', 'INFRA', 3)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  )
INSERT INTO finance_budget_categories (name, code, parent_id, order_no)
SELECT '경상보조', 'MAIN_CURRENT',    id, 1 FROM p1
UNION ALL
SELECT '자본보조', 'MAIN_CAPITAL',    id, 2 FROM p1
UNION ALL
SELECT '경상보조', 'SPECIAL_CURRENT', id, 1 FROM p2
UNION ALL
SELECT '자본보조', 'SPECIAL_CAPITAL', id, 2 FROM p2
UNION ALL
SELECT '자본보조', 'INFRA_CAPITAL',   id, 1 FROM p3
ON CONFLICT (code) DO NOTHING;
