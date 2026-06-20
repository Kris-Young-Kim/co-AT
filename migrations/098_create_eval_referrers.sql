-- G Phase: Referrer CRM — 의뢰처 기관·담당자·협력활동 관리

CREATE TABLE IF NOT EXISTS eval_referrers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CONSTRAINT eval_referrers_type_check
                 CHECK (type IN (
                   'hospital',     -- 병원/의원
                   'health_center',-- 보건소
                   'welfare_center',-- 복지관
                   'school',       -- 학교/특수학교
                   'local_gov',    -- 지자체
                   'agency',       -- 공단/기관
                   'il_center',    -- IL센터
                   'at_medical',   -- 장애인보건의료센터
                   'individual'    -- 개인(자가접수)
                 )),
  address      TEXT,
  phone        TEXT,
  email        TEXT,
  website      TEXT,
  notes        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_referrers_type     ON eval_referrers(type);
CREATE INDEX IF NOT EXISTS idx_eval_referrers_is_active ON eval_referrers(is_active);

ALTER TABLE eval_referrers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read referrers"   ON eval_referrers FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert referrers" ON eval_referrers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff can update referrers" ON eval_referrers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff can delete referrers" ON eval_referrers FOR DELETE TO authenticated USING (true);

CREATE TRIGGER eval_referrers_updated_at
  BEFORE UPDATE ON eval_referrers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 의뢰처 담당자
CREATE TABLE IF NOT EXISTS eval_referrer_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES eval_referrers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  position     TEXT,
  phone        TEXT,
  email        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_referrer_contacts_referrer ON eval_referrer_contacts(referrer_id);

ALTER TABLE eval_referrer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read referrer contacts"   ON eval_referrer_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert referrer contacts" ON eval_referrer_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff can update referrer contacts" ON eval_referrer_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff can delete referrer contacts" ON eval_referrer_contacts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER eval_referrer_contacts_updated_at
  BEFORE UPDATE ON eval_referrer_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 협력 활동 이력
CREATE TABLE IF NOT EXISTS eval_referrer_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES eval_referrers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CONSTRAINT eval_referrer_activities_type_check
                  CHECK (activity_type IN ('mou', 'education', 'visit', 'consultation', 'other')),
  title         TEXT NOT NULL,
  activity_date DATE NOT NULL,
  description   TEXT,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_referrer_activities_referrer ON eval_referrer_activities(referrer_id);
CREATE INDEX IF NOT EXISTS idx_eval_referrer_activities_date     ON eval_referrer_activities(activity_date);

ALTER TABLE eval_referrer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read referrer activities"   ON eval_referrer_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert referrer activities" ON eval_referrer_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff can update referrer activities" ON eval_referrer_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff can delete referrer activities" ON eval_referrer_activities FOR DELETE TO authenticated USING (true);

-- FK: eval_grant_assessments → eval_referrers
ALTER TABLE eval_grant_assessments
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES eval_referrers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eval_grant_assessments_referrer
  ON eval_grant_assessments(referrer_id) WHERE referrer_id IS NOT NULL;

-- FK: eval_service_records → eval_referrers
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES eval_referrers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eval_service_records_referrer
  ON eval_service_records(referrer_id) WHERE referrer_id IS NOT NULL;
