-- Migration: Create review_votes table for tracking useful votes
-- Run this in your Supabase SQL Editor

-- Create the review_votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each user can only vote once per review
  CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_created_at ON public.review_votes(created_at);

-- Enable Row Level Security
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all votes
CREATE POLICY "Anyone can view votes" ON public.review_votes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own votes
CREATE POLICY "Users can insert their own votes" ON public.review_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON public.review_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.review_votes TO authenticated;
GRANT SELECT ON public.review_votes TO anon;

-- Optional: Create a view to get vote counts per review
CREATE OR REPLACE VIEW public.review_vote_counts AS
SELECT 
  review_id,
  COUNT(*) as vote_count
FROM public.review_votes
GROUP BY review_id;

-- Grant permissions on the view
GRANT SELECT ON public.review_vote_counts TO authenticated;
GRANT SELECT ON public.review_vote_counts TO anon;

-- Optional: Create a function to get vote count for a review
CREATE OR REPLACE FUNCTION public.get_review_vote_count(p_review_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.review_votes
  WHERE review_id = p_review_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Optional: Create a function to check if a user has voted on a review
CREATE OR REPLACE FUNCTION public.has_user_voted(p_user_id UUID, p_review_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.review_votes 
    WHERE user_id = p_user_id AND review_id = p_review_id
  ) INTO v_exists;
  
  RETURN COALESCE(v_exists, false);
END;
$$;

COMMENT ON TABLE public.review_votes IS 'Tracks user votes on reviews to identify helpful content';
COMMENT ON COLUMN public.review_votes.user_id IS 'The user who cast the vote';
COMMENT ON COLUMN public.review_votes.review_id IS 'The review being voted on';
