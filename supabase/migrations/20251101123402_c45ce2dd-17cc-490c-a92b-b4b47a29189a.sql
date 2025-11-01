-- Create confession_reports table for anonymous reporting
CREATE TABLE public.confession_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  confession_id UUID NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reporter_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.confession_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for confession reports
CREATE POLICY "Anyone can create reports" 
ON public.confession_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view reports" 
ON public.confession_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));