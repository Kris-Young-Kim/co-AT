ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_web_visible boolean NOT NULL DEFAULT false;

-- Existing public-type schedules default to web-visible
UPDATE schedules
SET is_web_visible = true
WHERE schedule_type IN ('exhibition', 'education', 'external_event');
