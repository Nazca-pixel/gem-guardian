
-- Admin role system
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- No direct client access; only SECURITY DEFINER functions read it
DROP POLICY IF EXISTS "no_direct_admin_select" ON public.admin_users;
CREATE POLICY "no_direct_admin_select" ON public.admin_users FOR SELECT USING (false);
DROP POLICY IF EXISTS "no_direct_admin_insert" ON public.admin_users;
CREATE POLICY "no_direct_admin_insert" ON public.admin_users FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "no_direct_admin_update" ON public.admin_users;
CREATE POLICY "no_direct_admin_update" ON public.admin_users FOR UPDATE USING (false);
DROP POLICY IF EXISTS "no_direct_admin_delete" ON public.admin_users;
CREATE POLICY "no_direct_admin_delete" ON public.admin_users FOR DELETE USING (false);

-- Trusted admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Helper: assert admin or raise
CREATE OR REPLACE FUNCTION public._assert_admin()
RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non autenticato.'; END IF;
  IF NOT public.is_admin(v_uid) THEN RAISE EXCEPTION 'Accesso negato: admin richiesto.'; END IF;
  RETURN v_uid;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._assert_admin() FROM PUBLIC, anon, authenticated;

-- ============ Admin RPCs ============

CREATE OR REPLACE FUNCTION public.admin_grant_badge(p_target_user_id UUID, p_badge_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := public._assert_admin();
BEGIN
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (p_target_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  PERFORM public.log_security_event(v_actor, 'admin_grant_badge',
    jsonb_build_object('actor_user_id', v_actor, 'target_user_id', p_target_user_id,
      'action_type','grant_badge','new_value', p_badge_id, 'source','dev_panel'));
  RETURN jsonb_build_object('status','ok');
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_grant_badge(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_badge(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unlock_accessory(p_target_user_id UUID, p_accessory_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := public._assert_admin();
BEGIN
  INSERT INTO public.user_accessories (user_id, accessory_id, is_equipped)
  VALUES (p_target_user_id, p_accessory_id, false)
  ON CONFLICT (user_id, accessory_id) DO NOTHING;
  PERFORM public.log_security_event(v_actor, 'admin_unlock_accessory',
    jsonb_build_object('actor_user_id', v_actor, 'target_user_id', p_target_user_id,
      'action_type','unlock_accessory','new_value', p_accessory_id, 'source','dev_panel'));
  RETURN jsonb_build_object('status','ok');
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_unlock_accessory(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_unlock_accessory(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_companion_stats(
  p_target_user_id UUID,
  p_level INT DEFAULT NULL,
  p_fxp INT DEFAULT NULL,
  p_bxp INT DEFAULT NULL,
  p_current_streak INT DEFAULT NULL,
  p_longest_streak INT DEFAULT NULL,
  p_mood TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor UUID := public._assert_admin();
  v_old RECORD;
BEGIN
  SELECT level, fxp, bxp, current_streak, longest_streak, mood INTO v_old
    FROM public.companion_animals WHERE user_id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Companion non trovato.'; END IF;

  UPDATE public.companion_animals SET
    level = COALESCE(p_level, level),
    fxp = COALESCE(p_fxp, fxp),
    bxp = COALESCE(p_bxp, bxp),
    current_streak = COALESCE(p_current_streak, current_streak),
    longest_streak = COALESCE(p_longest_streak, longest_streak),
    mood = COALESCE(p_mood, mood)
  WHERE user_id = p_target_user_id;

  PERFORM public.log_security_event(v_actor, 'admin_adjust_companion_stats',
    jsonb_build_object('actor_user_id', v_actor, 'target_user_id', p_target_user_id,
      'action_type','adjust_companion',
      'old_value', to_jsonb(v_old),
      'new_value', jsonb_build_object('level',p_level,'fxp',p_fxp,'bxp',p_bxp,
        'current_streak',p_current_streak,'longest_streak',p_longest_streak,'mood',p_mood),
      'source','dev_panel'));
  RETURN jsonb_build_object('status','ok');
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_companion_stats(UUID,INT,INT,INT,INT,INT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_companion_stats(UUID,INT,INT,INT,INT,INT,TEXT) TO authenticated;

-- The block_companion_stat_writes trigger uses current_user='authenticated' guard.
-- SECURITY DEFINER functions run as table owner (postgres), so they bypass it. Good.

CREATE OR REPLACE FUNCTION public.admin_set_subscription(
  p_target_user_id UUID, p_tier TEXT, p_is_active BOOLEAN, p_expires_at TIMESTAMPTZ
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor UUID := public._assert_admin();
  v_valid TEXT[] := ARRAY['free','starter','pro','elite'];
BEGIN
  IF NOT (p_tier = ANY(v_valid)) THEN RAISE EXCEPTION 'Tier non valido: %', p_tier; END IF;
  INSERT INTO public.subscriptions (user_id, tier, is_active, expires_at, starts_at)
  VALUES (p_target_user_id, p_tier::subscription_tier, p_is_active, p_expires_at, now());
  PERFORM public.log_security_event(v_actor, 'admin_set_subscription',
    jsonb_build_object('actor_user_id', v_actor, 'target_user_id', p_target_user_id,
      'action_type','set_subscription',
      'new_value', jsonb_build_object('tier',p_tier,'is_active',p_is_active,'expires_at',p_expires_at),
      'source','dev_panel'));
  RETURN jsonb_build_object('status','ok');
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_subscription(UUID,TEXT,BOOLEAN,TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription(UUID,TEXT,BOOLEAN,TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_complete_challenge(
  p_target_user_id UUID, p_challenge_id TEXT, p_progress INT, p_mark_completed BOOLEAN
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor UUID := public._assert_admin();
  v_row RECORD;
  v_week_start DATE;
  v_dow INT;
BEGIN
  v_dow := EXTRACT(ISODOW FROM CURRENT_DATE)::INT;
  v_week_start := CURRENT_DATE - (v_dow - 1);
  SELECT * INTO v_row FROM public.user_challenges
    WHERE user_id = p_target_user_id AND challenge_id = p_challenge_id AND week_start = v_week_start FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sfida non trovata.'; END IF;

  UPDATE public.user_challenges SET
    progress = LEAST(GREATEST(p_progress, 0), v_row.target),
    is_completed = COALESCE(p_mark_completed, is_completed),
    completed_at = CASE WHEN p_mark_completed THEN NOW() ELSE completed_at END
  WHERE id = v_row.id;

  PERFORM public.log_security_event(v_actor, 'admin_complete_challenge',
    jsonb_build_object('actor_user_id', v_actor, 'target_user_id', p_target_user_id,
      'action_type','complete_challenge',
      'new_value', jsonb_build_object('challenge_id',p_challenge_id,'progress',p_progress,'mark_completed',p_mark_completed),
      'source','dev_panel'));
  RETURN jsonb_build_object('status','ok');
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_complete_challenge(UUID,TEXT,INT,BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_complete_challenge(UUID,TEXT,INT,BOOLEAN) TO authenticated;
