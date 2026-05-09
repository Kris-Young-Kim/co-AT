-- 047j: Make rentals.application_id nullable
-- Needed for approval-triggered rentals that have no application record
ALTER TABLE rentals
  ALTER COLUMN application_id DROP NOT NULL;
