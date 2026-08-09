-- ============================================================
-- HRPulse — Remove Leave Type Column Migration
-- Run this in your Supabase project SQL Editor (Optional)
-- ============================================================

-- Drop the 'type' column from leaves table if it exists
ALTER TABLE leaves DROP COLUMN IF EXISTS type;
