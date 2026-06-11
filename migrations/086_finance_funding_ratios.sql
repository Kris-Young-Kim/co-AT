-- Add national_ratio and provincial_ratio to finance_budget_categories.
-- All existing categories default to 50/50 (국비 50%, 도비 50%).
ALTER TABLE finance_budget_categories
  ADD COLUMN IF NOT EXISTS national_ratio   integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS provincial_ratio integer NOT NULL DEFAULT 50;
