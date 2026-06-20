-- Run this in Supabase → SQL Editor
create table if not exists app_config (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Seed with default bypass value
insert into app_config (key, value)
values ('authorized_wifi_ips', '["127.0.0.1"]')
on conflict (key) do nothing;
