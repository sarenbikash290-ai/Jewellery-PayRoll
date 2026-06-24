-- Run this in Supabase → SQL Editor to add bank and tax detail columns to the employees table.
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS pan_no TEXT,
ADD COLUMN IF NOT EXISTS pf_no TEXT;
