-- Add checkin_streak column to track consecutive daily check-ins
ALTER TABLE public.companion_animals 
ADD COLUMN checkin_streak integer NOT NULL DEFAULT 0;