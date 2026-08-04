-- ============================================================
-- HRPulse — Dedicated Payslips Table Migration
-- Run this script in your Supabase Project SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS payslips (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id           text         NOT NULL UNIQUE, -- e.g. PSL-2026-06-EMP001
  employee_id       text         NOT NULL,
  employee_name     text         NOT NULL,
  department        text         NOT NULL,
  role              text         NOT NULL,
  month             text         NOT NULL,        -- YYYY-MM e.g. 2026-06
  month_label       text         NOT NULL,        -- e.g. June 2026
  basic_salary      numeric      NOT NULL DEFAULT 0,
  hra               numeric      NOT NULL DEFAULT 0,
  allowances        numeric      NOT NULL DEFAULT 0,
  gross_salary      numeric      NOT NULL DEFAULT 0,
  incentives        numeric      NOT NULL DEFAULT 0,
  pf_deduction      numeric      NOT NULL DEFAULT 0,
  esi_deduction     numeric      NOT NULL DEFAULT 0,
  tds_deduction     numeric      NOT NULL DEFAULT 0,
  pt_deduction      numeric      NOT NULL DEFAULT 0,
  lop_deduction     numeric      NOT NULL DEFAULT 0,
  advance_deduction numeric      NOT NULL DEFAULT 0,
  total_deductions  numeric      NOT NULL DEFAULT 0,
  net_pay           numeric      NOT NULL DEFAULT 0,
  status            text         NOT NULL DEFAULT 'processed',
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- Indexes for lightning fast queries & lookups
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_month       ON payslips(month);
CREATE INDEX IF NOT EXISTS idx_payslips_slip_id     ON payslips(slip_id);

-- Verify created table
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'payslips';
