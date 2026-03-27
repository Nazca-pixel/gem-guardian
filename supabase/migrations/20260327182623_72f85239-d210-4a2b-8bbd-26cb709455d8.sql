
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  level integer,
  fxp integer,
  bxp integer,
  selected_monster_id text,
  subscription_tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE(p.display_name, 'Anonimo') as display_name,
    c.level,
    c.fxp,
    c.bxp,
    COALESCE(c.selected_monster_id, 'phoenix') as selected_monster_id,
    COALESCE(
      (SELECT s.tier::text FROM subscriptions s 
       WHERE s.user_id = p.user_id AND s.is_active = true 
       AND (s.expires_at IS NULL OR s.expires_at > now())
       ORDER BY s.created_at DESC LIMIT 1),
      'free'
    ) as subscription_tier
  FROM profiles p
  JOIN companion_animals c ON c.user_id = p.user_id
  ORDER BY (c.fxp * 0.6 + c.bxp * 0.4) DESC
  LIMIT 50;
$$;
