-- Migration: 107_create_appointment_tables
-- App: shared (web portal + admin)
-- Created: 2026-06-28

-- ============================================================
-- Table: appointment_slots  (staff-defined available times)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_slots (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id         text        NOT NULL,
  slot_date        date        NOT NULL,
  slot_time        time        NOT NULL,
  duration_minutes integer     DEFAULT 60 NOT NULL,
  service_types    text[]      DEFAULT '{}' NOT NULL,
  max_bookings     integer     DEFAULT 1 NOT NULL,
  current_bookings integer     DEFAULT 0 NOT NULL,
  is_active        boolean     DEFAULT true NOT NULL,
  notes            text,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_bookings CHECK (current_bookings >= 0 AND current_bookings <= max_bookings)
);

ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read active slots"
  ON appointment_slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service role full access on appointment_slots"
  ON appointment_slots FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX ON appointment_slots (slot_date, is_active);
CREATE INDEX ON appointment_slots (staff_id);

-- ============================================================
-- Table: appointment_requests  (client portal booking requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_requests (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id           uuid        REFERENCES appointment_slots(id) ON DELETE SET NULL,
  client_id         uuid        REFERENCES clients(id) ON DELETE SET NULL,
  portal_user_id    text        NOT NULL,
  requester_name    text,
  requester_contact text,
  service_type      text        NOT NULL,
  notes             text,
  status            text        DEFAULT 'pending_review' NOT NULL,
  assigned_staff_id text,
  staff_note        text,
  schedule_id       uuid        REFERENCES schedules(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_status CHECK (status IN ('pending_review', 'confirmed', 'rejected', 'cancelled'))
);

ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read own requests"
  ON appointment_requests FOR SELECT
  USING (auth.uid()::text = portal_user_id);

CREATE POLICY "service role full access on appointment_requests"
  ON appointment_requests FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX ON appointment_requests (portal_user_id);
CREATE INDEX ON appointment_requests (client_id);
CREATE INDEX ON appointment_requests (slot_id);
CREATE INDEX ON appointment_requests (status);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_appointment_slots
  BEFORE UPDATE ON appointment_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_appointment_requests
  BEFORE UPDATE ON appointment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
