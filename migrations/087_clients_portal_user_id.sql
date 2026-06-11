-- Link portal (web app) users to their eval client record.
-- Set by staff when registering a portal user as a client.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_user_id text;

CREATE INDEX IF NOT EXISTS clients_portal_user_id_idx ON clients (portal_user_id);
