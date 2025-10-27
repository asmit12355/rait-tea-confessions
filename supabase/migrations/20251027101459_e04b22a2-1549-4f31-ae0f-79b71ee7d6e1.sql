-- Create app_role enum for admin system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Only admins can view user roles
CREATE POLICY "Only admins can view roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Make user_id nullable in confessions to support anonymous posts
ALTER TABLE public.confessions ALTER COLUMN user_id DROP NOT NULL;

-- Update confessions RLS policies for anonymous posting
DROP POLICY IF EXISTS "Authenticated users can create confessions" ON public.confessions;
CREATE POLICY "Anyone can create confessions"
ON public.confessions
FOR INSERT
WITH CHECK (true);

-- Update confessions update policy - only admin or original poster
DROP POLICY IF EXISTS "Users can update their own confessions" ON public.confessions;
CREATE POLICY "Users can update own or admin can update all"
ON public.confessions
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- Update confessions delete policy - only admin or original poster
DROP POLICY IF EXISTS "Users can delete their own confessions" ON public.confessions;
CREATE POLICY "Users can delete own or admin can delete all"
ON public.confessions
FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- Make user_id nullable in comments for anonymous commenting
ALTER TABLE public.confession_comments ALTER COLUMN user_id DROP NOT NULL;

-- Update comments RLS policies for anonymous posting
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.confession_comments;
CREATE POLICY "Anyone can create comments"
ON public.confession_comments
FOR INSERT
WITH CHECK (true);

-- Update comments delete policy
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.confession_comments;
CREATE POLICY "Users can delete own or admin can delete all"
ON public.confession_comments
FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- Make user_id nullable in votes for anonymous voting
ALTER TABLE public.confession_votes ALTER COLUMN user_id DROP NOT NULL;

-- Update votes RLS policies for anonymous voting
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.confession_votes;
CREATE POLICY "Anyone can vote"
ON public.confession_votes
FOR INSERT
WITH CHECK (true);

-- Update votes update policy
DROP POLICY IF EXISTS "Users can update their own votes" ON public.confession_votes;
CREATE POLICY "Anyone can update votes"
ON public.confession_votes
FOR UPDATE
USING (true);

-- Update votes delete policy
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.confession_votes;
CREATE POLICY "Anyone can delete votes"
ON public.confession_votes
FOR DELETE
USING (true);

-- Add vote_identifier column to track anonymous votes by session/device
ALTER TABLE public.confession_votes ADD COLUMN IF NOT EXISTS vote_identifier TEXT;
CREATE INDEX IF NOT EXISTS idx_vote_identifier ON public.confession_votes(vote_identifier, confession_id);