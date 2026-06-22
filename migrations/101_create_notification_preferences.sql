-- Migration 101: notification_preferences
-- Per-client opt-out settings for notification channels

create table if not exists notification_preferences (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  email_opt_out boolean not null default false,
  sms_opt_out   boolean not null default false,
  updated_at    timestamptz not null default now(),
  constraint notification_preferences_client_id_key unique (client_id)
);

alter table notification_preferences enable row level security;

create policy "staff_manage_notification_preferences"
  on notification_preferences
  for all
  using (true)
  with check (true);

create index if not exists notification_preferences_client_id_idx
  on notification_preferences (client_id);
