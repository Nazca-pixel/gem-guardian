-- Add streak tracking columns to companion_animals
ALTER TABLE public.companion_animals
ADD COLUMN current_streak INTEGER DEFAULT 0,
ADD COLUMN longest_streak INTEGER DEFAULT 0,
ADD COLUMN last_activity_date DATE DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.companion_animals.current_streak IS 'Current consecutive days streak';
COMMENT ON COLUMN public.companion_animals.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN public.companion_animals.last_activity_date IS 'Date of last transaction activity';