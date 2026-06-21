-- Run this in Supabase → SQL Editor
create table if not exists advance_payments (
  id           uuid primary key default gen_random_uuid(),
  employee_id  text not null,
  amount       numeric not null,
  given_on     date not null,
  deduct_month text not null,
  reason       text,
  status       text default 'pending',
  created_at   timestamptz default now()
);
