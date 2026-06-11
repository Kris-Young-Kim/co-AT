-- Remove legacy placeholder categories seeded by migration 046.
-- Children must be deleted before parents (RESTRICT constraint).
-- Also removes any budgets referencing these categories (none expected in production).
-- Guard: finance_budgets may not exist if migration 046 was not yet applied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'finance_budgets'
  ) THEN
    DELETE FROM finance_budgets
      WHERE category_id IN (
        SELECT id FROM finance_budget_categories
        WHERE code IN ('BUSINESS_RENTAL','BUSINESS_CUSTOM_MAKE','BUSINESS_EDUCATION',
                       'OPERATION_SALARY','OPERATION_OFFICE','OPERATION_VEHICLE',
                       'BUSINESS','OPERATION')
      );
  END IF;
END $$;
DELETE FROM finance_budget_categories
  WHERE code IN ('BUSINESS_RENTAL','BUSINESS_CUSTOM_MAKE','BUSINESS_EDUCATION',
                 'OPERATION_SALARY','OPERATION_OFFICE','OPERATION_VEHICLE');
DELETE FROM finance_budget_categories
  WHERE code IN ('BUSINESS','OPERATION');

-- Seed real budget category hierarchy (본사업/특성화사업/기능보강사업).
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
