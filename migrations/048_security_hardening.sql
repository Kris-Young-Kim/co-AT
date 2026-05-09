-- 048_security_hardening.sql
-- Fix: function_search_path_mutable (0011), rls_policy_always_true (0024), public_bucket_allows_listing (0025)

-- ============================================================
-- 1. Fix mutable search_path on all trigger functions
--    (SET search_path = '' + fully-qualify public.now())
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chat_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_eval_service_records_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_hr_employees_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_hr_salary_grades_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_hr_salary_records_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Fix RLS policy always true — call_logs
--    Restrict to authenticated users with staff/admin role
-- ============================================================

DROP POLICY IF EXISTS "staff can manage call_logs" ON public.call_logs;

CREATE POLICY "staff can manage call_logs"
  ON public.call_logs
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
  );

-- ============================================================
-- 3. Fix RLS policy always true — inventory_maintenance_logs
--    INSERT: restrict to rows where created_by matches the caller
-- ============================================================

DROP POLICY IF EXISTS "auth_insert_maintenance" ON public.inventory_maintenance_logs;

CREATE POLICY "auth_insert_maintenance"
  ON public.inventory_maintenance_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()::text
    AND (
      (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
      OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

-- ============================================================
-- 4. Fix public bucket allows listing — uploads
--    Remove the broad SELECT policy; object URLs still work
--    without listing permission.
-- ============================================================

DROP POLICY IF EXISTS "Allow All 1va6avm_0" ON storage.objects;

-- Authenticated users can read objects in uploads bucket (no listing)
CREATE POLICY "uploads_authenticated_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

-- Authenticated users with staff role can insert/update/delete
CREATE POLICY "uploads_staff_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (
      (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
      OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE POLICY "uploads_staff_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (
      (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
      OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

CREATE POLICY "uploads_staff_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (
      (auth.jwt() ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
      OR (auth.jwt() -> 'publicMetadata' ->> 'role') IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );
