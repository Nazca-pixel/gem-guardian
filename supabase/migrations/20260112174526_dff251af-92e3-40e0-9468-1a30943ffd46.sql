-- Remove the old constraint that limits level to 1-10
ALTER TABLE public.companion_animals DROP CONSTRAINT companion_animals_level_check;

-- Add a new constraint allowing levels 1-100
ALTER TABLE public.companion_animals ADD CONSTRAINT companion_animals_level_check CHECK (level >= 1 AND level <= 100);