-- G Phase: 대상자 저장 세그먼트 (이름 붙여 재사용 가능한 필터 묶음)

CREATE TABLE IF NOT EXISTS eval_client_segments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  filters     JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- filters 예시:
  -- { "disability_type": "physical", "city": "춘천시",
  --   "service_type": "grant", "staff_id": "user_xxx",
  --   "lifecycle_status": "active" }
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eval_client_segments_name_unique UNIQUE (name)
);

ALTER TABLE eval_client_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read segments"   ON eval_client_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert segments" ON eval_client_segments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff can update segments" ON eval_client_segments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff can delete segments" ON eval_client_segments FOR DELETE TO authenticated USING (true);

CREATE TRIGGER eval_client_segments_updated_at
  BEFORE UPDATE ON eval_client_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
