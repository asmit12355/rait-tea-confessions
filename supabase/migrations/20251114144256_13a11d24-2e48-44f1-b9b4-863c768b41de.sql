-- Add tags column to confessions table
ALTER TABLE public.confessions 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better tag search performance
CREATE INDEX idx_confessions_tags ON public.confessions USING GIN(tags);