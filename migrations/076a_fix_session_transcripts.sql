-- migrations/076a_fix_session_transcripts.sql
-- Fix: add WITH CHECK to RLS policy, add updated_at column, add missing index

-- 1. Fix RLS policy — add WITH CHECK
DROP POLICY IF EXISTS "staff_all_transcripts" ON eval_session_transcripts;

CREATE POLICY "staff_all_transcripts"
  ON eval_session_transcripts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('ADMIN', 'MANAGER', 'STAFF')
    )
  );

-- 2. Add updated_at column
ALTER TABLE eval_session_transcripts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_eval_session_transcripts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_eval_session_transcripts_updated_at
  BEFORE UPDATE ON eval_session_transcripts
  FOR EACH ROW EXECUTE FUNCTION update_eval_session_transcripts_updated_at();

-- 3. Add missing index on linked_service_record_id
CREATE INDEX IF NOT EXISTS idx_session_transcripts_linked_service_record
  ON eval_session_transcripts (linked_service_record_id)
  WHERE linked_service_record_id IS NOT NULL;
