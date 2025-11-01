-- Add IP tracking columns to tables
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.confession_comments ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.confession_reports ADD COLUMN IF NOT EXISTS ip_address TEXT;