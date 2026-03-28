-- Secure badge awarding: create a function that validates badge eligibility
CREATE OR REPLACE FUNCTION public.award_badge(
  _badge_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only insert if not already awarded (idempotent)
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (_user_id, _badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

-- Secure accessory unlocking: validate BXP requirement
CREATE OR REPLACE FUNCTION public.unlock_accessory(
  _accessory_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _user_bxp integer;
  _required_bxp integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's BXP
  SELECT bxp INTO _user_bxp FROM companion_animals WHERE user_id = _user_id;
  
  -- Get required BXP for accessory
  SELECT bxp_required INTO _required_bxp FROM accessories WHERE id = _accessory_id;
  
  IF _required_bxp IS NULL THEN
    RAISE EXCEPTION 'Accessory not found';
  END IF;

  IF _user_bxp < _required_bxp THEN
    RAISE EXCEPTION 'Insufficient BXP: have %, need %', _user_bxp, _required_bxp;
  END IF;

  -- Unlock the accessory (idempotent)
  INSERT INTO user_accessories (user_id, accessory_id)
  VALUES (_user_id, _accessory_id)
  ON CONFLICT (user_id, accessory_id) DO NOTHING;
END;
$$;

-- Remove direct INSERT policies for badges and accessories
DROP POLICY IF EXISTS "Users can earn badges" ON user_badges;
DROP POLICY IF EXISTS "Users can unlock accessories" ON user_accessories;