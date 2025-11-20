-- Migration: Create AI Summaries table for caching professor/course summaries
-- Description: Stores AI-generated summaries with cache management
-- Author: GitHub Copilot
-- Date: 2025-11-19

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('professor', 'course')),
  entity_id UUID NOT NULL,
  summary_text TEXT NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one summary per entity
  CONSTRAINT unique_entity_summary UNIQUE (entity_type, entity_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_summaries_entity_lookup 
  ON public.ai_summaries(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_updated_at 
  ON public.ai_summaries(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read summaries (public data)
CREATE POLICY "Anyone can read ai_summaries"
  ON public.ai_summaries
  FOR SELECT
  USING (true);

-- RLS Policy: Only authenticated users can insert/update summaries
-- (In production, you might want to restrict this to admin users only)
CREATE POLICY "Authenticated users can insert ai_summaries"
  ON public.ai_summaries
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ai_summaries"
  ON public.ai_summaries
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Only authenticated users can delete summaries
CREATE POLICY "Authenticated users can delete ai_summaries"
  ON public.ai_summaries
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_ai_summaries_updated_at
  BEFORE UPDATE ON public.ai_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_summaries_updated_at();

-- Optional: Create a view for easier querying with entity names
CREATE OR REPLACE VIEW public.ai_summaries_with_names AS
SELECT 
  s.*,
  CASE 
    WHEN s.entity_type = 'professor' THEN p.full_name
    WHEN s.entity_type = 'course' THEN c.name
  END AS entity_name
FROM public.ai_summaries s
LEFT JOIN public.professors p ON s.entity_type = 'professor' AND s.entity_id = p.id
LEFT JOIN public.courses c ON s.entity_type = 'course' AND s.entity_id = c.id;

-- Grant permissions on the view
GRANT SELECT ON public.ai_summaries_with_names TO authenticated;
GRANT SELECT ON public.ai_summaries_with_names TO anon;

-- Add helpful comment
COMMENT ON TABLE public.ai_summaries IS 'Stores AI-generated summaries for professors and courses with cache management';
COMMENT ON COLUMN public.ai_summaries.entity_type IS 'Type of entity: professor or course';
COMMENT ON COLUMN public.ai_summaries.entity_id IS 'UUID of the professor or course';
COMMENT ON COLUMN public.ai_summaries.review_count IS 'Number of reviews used to generate this summary';
COMMENT ON COLUMN public.ai_summaries.updated_at IS 'Last time the summary was regenerated';
