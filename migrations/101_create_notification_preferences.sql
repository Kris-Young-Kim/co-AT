-- Migration 101: notification_preferences
-- Per-client opt-out settings for notification channels

create table notification_preferences (
  id            uuid default gen_random_uuid() not null,
  client_id     uuid not null,
  email_opt_out boolean not null default false,
  sms_opt_out   boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (id),
  unique (client_id),
  foreign key (client_id) references clients(id) on delete cascade
);

alter table notification_preferences enable row level security;

create policy "staff_manage_notification_preferences"
  on notification_preferences
  for all
  using (true)
  with check (true);

create index notification_preferences_client_id_idx
  on notification_preferences (client_id);
