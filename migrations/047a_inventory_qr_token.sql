-- 047a: Add qr_token to inventory table
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE DEFAULT gen_random_uuid();

UPDATE inventory SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;

ALTER TABLE inventory ALTER COLUMN qr_token SET NOT NULL;
