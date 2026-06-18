-- ============================================================
-- HRPulse — Attendance Correction & Payroll Locking Migration
-- Run this in your Supabase project SQL Editor
-- ============================================================

-- Table: attendance_audit_logs
-- Stores an immutable log of every attendance correction made by admins.
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     text        NOT NULL,
  employee_name   text        NOT NULL,
  attendance_date date        NOT NULL,
  previous_status text,                   -- NULL if the record did not exist before
  new_status      text        NOT NULL,
  check_in_before text,
  check_out_before text,
  check_in_after  text,
  check_out_after text,
  edited_by       text        NOT NULL,
  edit_timestamp  timestamptz NOT NULL DEFAULT now(),
  reason          text
);

CREATE INDEX IF NOT EXISTS idx_audit_employee_id    ON attendance_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_date           ON attendance_audit_logs(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp      ON attendance_audit_logs(edit_timestamp DESC);

-- Table: payroll_month_locks
-- Once a month is locked, attendance for that month cannot be edited.
CREATE TABLE IF NOT EXISTS payroll_month_locks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  year        int         NOT NULL,
  month       int         NOT NULL CHECK (month BETWEEN 1 AND 12),
  locked_by   text        NOT NULL DEFAULT 'Admin',
  locked_at   timestamptz NOT NULL DEFAULT now(),
  notes       text,
  UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_lock_year_month ON payroll_month_locks(year, month);

-- ============================================================
-- Verification: list new tables
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('attendance_audit_logs', 'payroll_month_locks');
