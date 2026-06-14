-- Migration: 093_fix_notices_rls
-- App: shared (notices)
-- Created: 2026-06-14
-- Fix: Enable RLS on notices + replace broken is_public policy

-- Enable RLS (safe: all current queries use service role which bypasses RLS)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Drop broken policy that references non-existent is_public column
DROP POLICY IF EXISTS "Public notices are viewable by all" ON notices;

-- All notices are public content — anyone can read
CREATE POLICY "Public notices are viewable by all"
  ON notices FOR SELECT
  USING (true);

-- Only staff/admin can manage notices (INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Admins can manage notices" ON notices;
DROP POLICY IF EXISTS "Admins can view all notices" ON notices;
CREATE POLICY "Admins can manage notices"
  ON notices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
        AND role IN ('admin', 'manager', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
        AND role IN ('admin', 'manager', 'staff')
    )
  );
