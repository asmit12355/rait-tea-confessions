-- Create confessions table
CREATE TABLE public.confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create votes table
CREATE TABLE public.confession_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(confession_id, user_id)
);

-- Create comments table
CREATE TABLE public.confession_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for confessions
CREATE POLICY "Anyone can view confessions"
  ON public.confessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create confessions"
  ON public.confessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confessions"
  ON public.confessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confessions"
  ON public.confessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON public.confession_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.confession_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.confession_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.confession_votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.confession_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.confession_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.confession_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for confessions
CREATE TRIGGER update_confessions_updated_at
  BEFORE UPDATE ON public.confessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.confessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.confession_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.confession_comments;