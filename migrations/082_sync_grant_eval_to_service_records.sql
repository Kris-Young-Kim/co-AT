-- Migration: 082_sync_grant_eval_to_service_records
-- Purpose: Auto-sync eval_grant_assessments → eval_service_records
--          so stats app (is_grant flag) reflects grant evaluation activity.
-- Each grant assessment gets one eval_service_records row with is_grant = true.
-- Trigger fires on INSERT or UPDATE of eval_grant_assessments.

-- ================================================================
-- 1. Add grant_assessment_id column to eval_service_records
-- ================================================================
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS grant_assessment_id UUID
    REFERENCES eval_grant_assessments(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eval_sr_unique_grant
  ON eval_service_records(grant_assessment_id)
  WHERE grant_assessment_id IS NOT NULL;

-- ================================================================
-- 2. Sync function
-- ================================================================
CREATE OR REPLACE FUNCTION sync_grant_eval_service_record(p_grant_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_g RECORD;
  v_c RECORD;
BEGIN
  SELECT id, client_id, assessment_year, evaluation_date, status
  INTO v_g FROM eval_grant_assessments WHERE id = p_grant_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT name, birth_date, gender,
    COALESCE(city, address) AS region,
    disability_type, disability_grade, economic_status
  INTO v_c FROM clients WHERE id = v_g.client_id;
  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO eval_service_records (
    grant_assessment_id,
    client_id,
    name,
    birth_date,
    gender,
    region,
    disability_type,
    disability_severity,
    economic_status,
    received_at,
    application_year,
    application_month,
    service_category,
    record_status,
    is_closed,
    is_grant,
    source,
    updated_at
  ) VALUES (
    v_g.id,
    v_g.client_id,
    v_c.name,
    v_c.birth_date,
    v_c.gender,
    v_c.region,
    v_c.disability_type,
    CASE v_c.disability_grade
      WHEN '심한'        THEN '중증'
      WHEN '심하지 않은' THEN '경증'
      ELSE NULL
    END,
    CASE v_c.economic_status
      WHEN '기초생활수급' THEN '수급자'
      WHEN '차상위'       THEN '차상위'
      WHEN '일반'         THEN '일반'
      ELSE NULL
    END,
    COALESCE(v_g.evaluation_date::date, CURRENT_DATE),
    v_g.assessment_year,
    CASE WHEN v_g.evaluation_date IS NOT NULL
         THEN EXTRACT(MONTH FROM v_g.evaluation_date::date)::int
         ELSE EXTRACT(MONTH FROM CURRENT_DATE)::int
    END,
    'grant',
    CASE v_g.status
      WHEN 'submitted' THEN '완료'
      WHEN 'completed' THEN '완료'
      ELSE '미정'
    END,
    v_g.status IN ('submitted', 'completed'),
    true,
    'grant_eval',
    NOW()
  )
  ON CONFLICT (grant_assessment_id) WHERE grant_assessment_id IS NOT NULL
  DO UPDATE SET
    client_id           = EXCLUDED.client_id,
    name                = EXCLUDED.name,
    birth_date          = EXCLUDED.birth_date,
    gender              = EXCLUDED.gender,
    region              = EXCLUDED.region,
    disability_type     = EXCLUDED.disability_type,
    disability_severity = EXCLUDED.disability_severity,
    economic_status     = EXCLUDED.economic_status,
    received_at         = EXCLUDED.received_at,
    application_year    = EXCLUDED.application_year,
    application_month   = EXCLUDED.application_month,
    service_category    = EXCLUDED.service_category,
    record_status       = EXCLUDED.record_status,
    is_closed           = EXCLUDED.is_closed,
    is_grant            = true,
    source              = 'grant_eval',
    updated_at          = NOW();
END;
$$;

-- ================================================================
-- 3. Trigger function
-- ================================================================
CREATE OR REPLACE FUNCTION trg_grant_eval_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_grant_eval_service_record(NEW.id);
  RETURN NEW;
END;
$$;

-- ================================================================
-- 4. Attach trigger to eval_grant_assessments
-- ================================================================
DROP TRIGGER IF EXISTS trg_grant_eval_sync ON eval_grant_assessments;
CREATE TRIGGER trg_grant_eval_sync
  AFTER INSERT OR UPDATE ON eval_grant_assessments
  FOR EACH ROW EXECUTE FUNCTION trg_grant_eval_changed();

-- ================================================================
-- 5. Backfill existing assessments
-- ================================================================
DO $$
DECLARE v_id UUID;
BEGIN
  FOR v_id IN SELECT id FROM eval_grant_assessments ORDER BY created_at
  LOOP
    PERFORM sync_grant_eval_service_record(v_id);
  END LOOP;
END$$;
