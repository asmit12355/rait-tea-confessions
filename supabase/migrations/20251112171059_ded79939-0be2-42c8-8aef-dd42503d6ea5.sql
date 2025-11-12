-- Add slug column to confessions table for SEO-friendly URLs
ALTER TABLE public.confessions 
ADD COLUMN slug text;

-- Create index on slug for faster lookups
CREATE INDEX idx_confessions_slug ON public.confessions(slug);

-- Update existing confessions with slugs generated from titles
UPDATE public.confessions
SET slug = lower(trim(regexp_replace(regexp_replace(regexp_replace(title, '[^\w\s-]', '', 'g'), '\s+', '-', 'g'), '--+', '-', 'g')))
WHERE slug IS NULL;