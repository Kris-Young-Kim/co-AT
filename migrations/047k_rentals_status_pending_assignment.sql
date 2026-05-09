-- 047k: Add pending_assignment to rentals status check constraint
ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check;

ALTER TABLE rentals
  ADD CONSTRAINT rentals_status_check
  CHECK (status IN ('rented', 'returned', 'overdue', 'damaged', 'pending_assignment'));
