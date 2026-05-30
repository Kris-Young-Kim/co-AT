-- Migration: 060_pipeline_eval_service_records
-- Created: 2026-05-30
-- Purpose: Medical-chart-style data pipeline
--   Any write to eval/inventory tables automatically keeps eval_service_records current.
--   stats app always reflects live data from all apps.
--
-- Pipeline:
--   applications         → trg_application_changed()
--   intake_records       → trg_sync_by_application_id()
--   domain_assessments   → trg_sync_by_application_id()
--   rentals              → trg_sync_by_application_id()
--   inventory_custom_orders  → trg_sync_client_fallback()
--   inventory_reuse_dispatches → trg_sync_client_fallback()
--
--   All paths → sync_eval_service_record(application_id) → upsert one row

-- ================================================================
-- 1. Link eval_service_records to applications
-- ================================================================
ALTER TABLE eval_service_records
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

-- One service record per application (partial unique index for nullable column)
CREATE UNIQUE INDEX IF NOT EXISTS idx_eval_sr_unique_app
  ON eval_service_records(application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eval_sr_application_id
  ON eval_service_records(application_id);

-- ================================================================
-- 2. Add application_id to inventory tables that lack it
-- ================================================================
ALTER TABLE inventory_custom_orders
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

ALTER TABLE inventory_reuse_dispatches
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

-- ================================================================
-- 3. Master sync function — called by every trigger
-- ================================================================
CREATE OR REPLACE FUNCTION sync_eval_service_record(p_application_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app       RECORD;
  v_intake    RECORD;
  v_assess    RECORD;
  v_rental    RECORD;
  v_custom    RECORD;
  v_reuse     RECORD;
BEGIN
  -- Fetch application + client in one join
  SELECT
    a.id, a.client_id, a.created_at, a.service_year, a.status,
    a.category, a.sub_category, a.service_area, a.requested_item,
    a.referral_type, a.visit_type,
    c.name, c.birth_date, c.gender,
    COALESCE(c.city, c.address) AS region,
    c.disability_type,
    c.disability_grade,
    c.economic_status
  INTO v_app
  FROM applications a
  JOIN clients c ON c.id = a.client_id
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- Intake records (상담)
  SELECT
    bool_or(true) AS has_record,
    MIN(ir.consult_date) AS first_date
  INTO v_intake
  FROM intake_records ir
  WHERE ir.application_id = p_application_id;

  -- Domain assessments (평가)
  SELECT
    bool_or(true) AS has_record,
    MIN(da.evaluation_date::date) AS first_date
  INTO v_assess
  FROM domain_assessments da
  WHERE da.application_id = p_application_id;

  -- Rentals (대여)
  SELECT
    bool_or(true) AS has_record,
    MIN(r.rental_start_date::date) AS first_date
  INTO v_rental
  FROM rentals r
  WHERE r.application_id = p_application_id;

  -- Custom orders (맞춤제작)
  SELECT
    bool_or(true) AS has_record,
    MIN(ico.created_at::date) AS first_date
  INTO v_custom
  FROM inventory_custom_orders ico
  WHERE ico.application_id = p_application_id;

  -- Reuse dispatches (재사용)
  SELECT
    bool_or(true) AS has_record,
    MIN(ird.created_at::date) AS first_date
  INTO v_reuse
  FROM inventory_reuse_dispatches ird
  WHERE ird.application_id = p_application_id;

  -- Upsert one row per application
  INSERT INTO eval_service_records (
    application_id,
    client_id,
    name,
    birth_date,
    gender,
    region,
    disability_type,
    economic_status,
    disability_severity,
    received_at,
    application_year,
    application_month,
    service_category,
    service_area,
    product_name,
    referral_type,
    record_status,
    is_closed,
    -- service flags
    is_consult,
    consultation_date,
    is_assessment,
    is_trial,
    is_rental,
    is_custom_make,
    is_reuse,
    is_education,
    is_grant,
    is_info_provision,
    is_monitoring,
    -- dates
    performance_date,
    -- meta
    source,
    updated_at
  ) VALUES (
    p_application_id,
    v_app.client_id,
    v_app.name,
    v_app.birth_date,
    v_app.gender,
    v_app.region,
    v_app.disability_type,
    CASE v_app.economic_status
      WHEN '기초생활수급' THEN '수급자'
      WHEN '차상위'       THEN '차상위'
      WHEN '일반'         THEN '일반'
      ELSE NULL
    END,
    CASE v_app.disability_grade
      WHEN '심한'         THEN '중증'
      WHEN '심하지 않은'  THEN '경증'
      ELSE NULL
    END,
    v_app.created_at::date,
    COALESCE(v_app.service_year, EXTRACT(YEAR  FROM v_app.created_at)::int),
    EXTRACT(MONTH FROM v_app.created_at)::int,
    v_app.category,
    v_app.service_area,
    v_app.requested_item,
    v_app.referral_type,
    CASE v_app.status
      WHEN '완료' THEN '완료'
      WHEN '취소' THEN '취소'
      ELSE '미정'
    END,
    v_app.status = '완료',
    -- service presence flags
    COALESCE(v_intake.has_record, false),
    v_intake.first_date,
    COALESCE(v_assess.has_record, false),
    v_app.category = 'experience',
    COALESCE(v_rental.has_record, false),
    COALESCE(v_custom.has_record, false) OR v_app.category IN ('custom', '맞춤제작'),
    COALESCE(v_reuse.has_record, false),
    v_app.category IN ('education', '교육/홍보'),
    v_app.category IN ('grant', '보조기기 교부사업'),
    v_app.category IN ('info', '정보제공'),
    v_app.category = 'aftercare',
    -- primary performance date (rental → assess → custom → reuse order)
    COALESCE(
      v_rental.first_date,
      v_assess.first_date,
      v_custom.first_date,
      v_reuse.first_date
    ),
    'app',
    now()
  )
  ON CONFLICT (application_id) WHERE application_id IS NOT NULL DO UPDATE SET
    client_id          = EXCLUDED.client_id,
    name               = EXCLUDED.name,
    birth_date         = EXCLUDED.birth_date,
    gender             = EXCLUDED.gender,
    region             = EXCLUDED.region,
    disability_type    = EXCLUDED.disability_type,
    economic_status    = EXCLUDED.economic_status,
    disability_severity= EXCLUDED.disability_severity,
    received_at        = EXCLUDED.received_at,
    application_year   = EXCLUDED.application_year,
    application_month  = EXCLUDED.application_month,
    service_category   = EXCLUDED.service_category,
    service_area       = EXCLUDED.service_area,
    product_name       = EXCLUDED.product_name,
    referral_type      = EXCLUDED.referral_type,
    record_status      = EXCLUDED.record_status,
    is_closed          = EXCLUDED.is_closed,
    is_consult         = EXCLUDED.is_consult,
    consultation_date  = EXCLUDED.consultation_date,
    is_assessment      = EXCLUDED.is_assessment,
    is_trial           = EXCLUDED.is_trial,
    is_rental          = EXCLUDED.is_rental,
    is_custom_make     = EXCLUDED.is_custom_make,
    is_reuse           = EXCLUDED.is_reuse,
    is_education       = EXCLUDED.is_education,
    is_grant           = EXCLUDED.is_grant,
    is_info_provision  = EXCLUDED.is_info_provision,
    is_monitoring      = EXCLUDED.is_monitoring,
    performance_date   = EXCLUDED.performance_date,
    updated_at         = now();
END;
$$;

-- ================================================================
-- 4. Trigger functions
-- ================================================================

-- For applications table (NEW.id = application_id)
CREATE OR REPLACE FUNCTION trg_application_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_eval_service_record(NEW.id);
  RETURN NEW;
END;
$$;

-- For tables with application_id column (intake_records, domain_assessments, rentals)
CREATE OR REPLACE FUNCTION trg_sync_by_application_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_app_id UUID;
BEGIN
  v_app_id := COALESCE(NEW.application_id, OLD.application_id);
  IF v_app_id IS NOT NULL THEN
    PERFORM sync_eval_service_record(v_app_id);
  END IF;
  RETURN NEW;
END;
$$;

-- For inventory tables: use application_id if set, else latest active app by client
CREATE OR REPLACE FUNCTION trg_sync_client_fallback()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_app_id UUID;
BEGIN
  v_app_id := COALESCE(NEW.application_id, OLD.application_id);
  IF v_app_id IS NULL THEN
    SELECT id INTO v_app_id
    FROM applications
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
      AND status NOT IN ('취소')
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  IF v_app_id IS NOT NULL THEN
    PERFORM sync_eval_service_record(v_app_id);
  END IF;
  RETURN NEW;
END;
$$;

-- ================================================================
-- 5. Attach triggers
-- ================================================================

DROP TRIGGER IF EXISTS trg_applications_sync ON applications;
CREATE TRIGGER trg_applications_sync
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION trg_application_changed();

DROP TRIGGER IF EXISTS trg_intake_sync ON intake_records;
CREATE TRIGGER trg_intake_sync
  AFTER INSERT OR UPDATE ON intake_records
  FOR EACH ROW EXECUTE FUNCTION trg_sync_by_application_id();

DROP TRIGGER IF EXISTS trg_assessment_sync ON domain_assessments;
CREATE TRIGGER trg_assessment_sync
  AFTER INSERT OR UPDATE ON domain_assessments
  FOR EACH ROW EXECUTE FUNCTION trg_sync_by_application_id();

DROP TRIGGER IF EXISTS trg_rental_sync ON rentals;
CREATE TRIGGER trg_rental_sync
  AFTER INSERT OR UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION trg_sync_by_application_id();

DROP TRIGGER IF EXISTS trg_custom_order_sync ON inventory_custom_orders;
CREATE TRIGGER trg_custom_order_sync
  AFTER INSERT OR UPDATE ON inventory_custom_orders
  FOR EACH ROW EXECUTE FUNCTION trg_sync_client_fallback();

DROP TRIGGER IF EXISTS trg_reuse_dispatch_sync ON inventory_reuse_dispatches;
CREATE TRIGGER trg_reuse_dispatch_sync
  AFTER INSERT OR UPDATE ON inventory_reuse_dispatches
  FOR EACH ROW EXECUTE FUNCTION trg_sync_client_fallback();

-- ================================================================
-- 6. Backfill — sync all existing applications at migration time
-- ================================================================
CREATE OR REPLACE FUNCTION backfill_eval_service_records()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_app_id UUID;
  v_count  INTEGER := 0;
BEGIN
  FOR v_app_id IN
    SELECT id FROM applications
    WHERE status NOT IN ('취소')
    ORDER BY created_at
  LOOP
    PERFORM sync_eval_service_record(v_app_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

SELECT backfill_eval_service_records();
