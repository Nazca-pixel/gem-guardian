-- Add selected_monster_id column to companion_animals table
ALTER TABLE public.companion_animals
ADD COLUMN selected_monster_id TEXT DEFAULT 'phoenix';

-- Add comment for clarity
COMMENT ON COLUMN public.companion_animals.selected_monster_id IS 'ID of the currently selected monster from the bestiary';