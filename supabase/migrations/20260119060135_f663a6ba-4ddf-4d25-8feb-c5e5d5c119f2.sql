-- Create user_challenges table for tracking weekly challenges
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  fxp_reward INTEGER NOT NULL DEFAULT 0,
  bxp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per user per challenge per week
  UNIQUE(user_id, challenge_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own challenges" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_challenges_updated_at
BEFORE UPDATE ON public.user_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();