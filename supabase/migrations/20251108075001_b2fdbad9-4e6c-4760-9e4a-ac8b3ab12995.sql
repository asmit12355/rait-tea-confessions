-- Add device_info column to confessions table
ALTER TABLE public.confessions
ADD COLUMN IF NOT EXISTS device_info text;

-- Add device_info column to confession_reports table
ALTER TABLE public.confession_reports
ADD COLUMN IF NOT EXISTS device_info text;

-- Add device_info column to confession_comments table for completeness
ALTER TABLE public.confession_comments
ADD COLUMN IF NOT EXISTS device_info text;