-- Migration 068: HR bank account + pay items/groups

-- ─────────────────────────────────────────────
-- 1. hr_employees — 계좌이체 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS bank_name    TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- ─────────────────────────────────────────────
-- 2. hr_pay_items (지급공제항목)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_pay_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('pay', 'deduction')),
  is_statutory BOOLEAN NOT NULL DEFAULT false,
  rate         NUMERIC(6,4),       -- 요율 (예: 0.045)
  fixed_amount INTEGER,            -- 고정금액 (원)
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_pay_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_pay_items" ON hr_pay_items
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 3. hr_pay_groups (지급공제그룹)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_pay_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr_pay_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_pay_groups" ON hr_pay_groups
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 4. hr_pay_group_items (그룹-항목 매핑)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_pay_group_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES hr_pay_groups(id) ON DELETE CASCADE,
  pay_item_id  UUID NOT NULL REFERENCES hr_pay_items(id) ON DELETE CASCADE,
  UNIQUE (group_id, pay_item_id)
);

ALTER TABLE hr_pay_group_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_pay_group_items" ON hr_pay_group_items
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 5. 기본 법정 공제항목 삽입
-- ─────────────────────────────────────────────
INSERT INTO hr_pay_items (name, type, is_statutory, rate) VALUES
  ('국민연금', 'deduction', true, 0.045),
  ('건강보험', 'deduction', true, 0.03545),
  ('장기요양보험', 'deduction', true, 0.004545),
  ('고용보험', 'deduction', true, 0.009),
  ('근로소득세', 'deduction', true, 0.033),
  ('지방소득세', 'deduction', true, 0.0033)
ON CONFLICT DO NOTHING;
