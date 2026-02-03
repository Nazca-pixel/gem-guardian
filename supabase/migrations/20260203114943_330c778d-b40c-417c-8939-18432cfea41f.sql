-- Add last_checkin_date to companion_animals table
ALTER TABLE public.companion_animals 
ADD COLUMN IF NOT EXISTS last_checkin_date date NULL;