CREATE TABLE IF NOT EXISTS schedule_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedule_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule_categories_select" ON schedule_categories;
DROP POLICY IF EXISTS "schedule_categories_insert" ON schedule_categories;
DROP POLICY IF EXISTS "schedule_categories_update" ON schedule_categories;
DROP POLICY IF EXISTS "schedule_categories_delete" ON schedule_categories;

CREATE POLICY "schedule_categories_select" ON schedule_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule_categories_insert" ON schedule_categories
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "schedule_categories_update" ON schedule_categories
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "schedule_categories_delete" ON schedule_categories
  FOR DELETE TO authenticated USING (true);

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES schedule_categories(id) ON DELETE SET NULL;

-- Default categories
INSERT INTO schedule_categories (name, color, description, sort_order) VALUES
  ('방문·상담', '#3b82f6', '방문, 상담, 평가 일정', 1),
  ('배송·수거', '#f97316', '배송, 픽업 일정', 2),
  ('견학·교육', '#22c55e', '견학, 교육 일정', 3),
  ('행정·회의', '#6b7280', '회의, 행정 일정', 4),
  ('맞춤제작', '#8b5cf6', '맞춤제작 일정', 5),
  ('외부행사', '#06b6d4', '외부 행사 일정', 6)
ON CONFLICT DO NOTHING;
