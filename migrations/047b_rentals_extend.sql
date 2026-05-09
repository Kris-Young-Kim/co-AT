-- 047b: Extend rentals table
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS approval_id UUID REFERENCES approval_documents(id);

ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS wait_list_checked_at TIMESTAMPTZ;

ALTER TABLE rentals
  ALTER COLUMN inventory_id DROP NOT NULL;
