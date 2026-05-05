-- =========================================================
-- process_companion_xp: server-authoritative XP/BXP/level
-- =========================================================
CREATE OR REPLACE FUNCTION public.process_companion_xp(
  p_fxp_delta INTEGER DEFAULT 0,
  p_bxp_delta INTEGER DEFAULT 0,
  p_mood TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_fxp INTEGER;
  v_bxp INTEGER;
  v_level INTEGER;
  v_mood TEXT;
  v_levels_gained INTEGER := 0;
  v_threshold INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;

  IF p_fxp_delta IS NULL OR p_fxp_delta < 0 OR p_fxp_delta > 500 THEN
    RAISE EXCEPTION 'fxp_delta fuori range (0-500): %', p_fxp_delta;
  END IF;
  IF p_bxp_delta IS NULL OR p_bxp_delta < 0 OR p_bxp_delta > 200 THEN
    RAISE EXCEPTION 'bxp_delta fuori range (0-200): %', p_bxp_delta;
  END IF;

  SELECT fxp, bxp, level, mood
    INTO v_fxp, v_bxp, v_level, v_mood
    FROM public.companion_animals
   WHERE user_id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Companion non trovato.';
  END IF;

  v_fxp := v_fxp + p_fxp_delta;
  v_bxp := v_bxp + p_bxp_delta;

  -- Level-up loop: threshold = level * 100
  v_threshold := v_level * 100;
  WHILE v_fxp >= v_threshold LOOP
    v_fxp := v_fxp - v_threshold;
    v_level := v_level + 1;
    v_levels_gained := v_levels_gained + 1;
    v_threshold := v_level * 100;
  END LOOP;

  IF p_mood IS NOT NULL AND p_mood IN ('happy','excited','sad','neutral','angry') THEN
    v_mood := p_mood;
  END IF;
  IF v_levels_gained > 0 THEN
    v_mood := 'excited';
  END IF;

  UPDATE public.companion_animals
     SET fxp = v_fxp,
         bxp = v_bxp,
         level = v_level,
         mood = v_mood
   WHERE user_id = v_user_id;

  PERFORM public.log_security_event(
    v_user_id,
    'xp_granted',
    jsonb_build_object(
      'fxp_delta', p_fxp_delta,
      'bxp_delta', p_bxp_delta,
      'levels_gained', v_levels_gained,
      'new_level', v_level
    )
  );

  RETURN jsonb_build_object(
    'status', 'ok',
    'new_fxp', v_fxp,
    'new_bxp', v_bxp,
    'new_level', v_level,
    'levels_gained', v_levels_gained,
    'new_mood', v_mood
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_companion_xp(INTEGER, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.process_companion_xp(INTEGER, INTEGER, TEXT) TO authenticated;

-- =========================================================
-- update_companion_streak: server-authoritative streak
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_companion_streak(
  p_action TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_checkin DATE;
  v_new_streak INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;
  IF p_action NOT IN ('checkin','reset') THEN
    RAISE EXCEPTION 'Azione non valida: %', p_action;
  END IF;

  SELECT COALESCE(current_streak, 0),
         COALESCE(longest_streak, 0),
         last_checkin_date
    INTO v_current_streak, v_longest_streak, v_last_checkin
    FROM public.companion_animals
   WHERE user_id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Companion non trovato.';
  END IF;

  IF p_action = 'reset' THEN
    UPDATE public.companion_animals
       SET current_streak = 0
     WHERE user_id = v_user_id;
    PERFORM public.log_security_event(v_user_id, 'streak_reset', NULL);
    RETURN jsonb_build_object('status','ok','current_streak',0,'longest_streak',v_longest_streak);
  END IF;

  -- checkin
  IF v_last_checkin = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'status','already_checked_in',
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'last_checkin_date', v_last_checkin
    );
  END IF;

  IF v_last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_longest_streak := GREATEST(v_longest_streak, v_new_streak);

  UPDATE public.companion_animals
     SET current_streak     = v_new_streak,
         longest_streak     = v_longest_streak,
         checkin_streak     = v_new_streak,
         last_checkin_date  = CURRENT_DATE,
         last_activity_date = CURRENT_DATE
   WHERE user_id = v_user_id;

  PERFORM public.log_security_event(
    v_user_id,
    'streak_updated',
    jsonb_build_object(
      'current_streak', v_new_streak,
      'longest_streak', v_longest_streak
    )
  );

  RETURN jsonb_build_object(
    'status','ok',
    'current_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'last_checkin_date', CURRENT_DATE
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_companion_streak(TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_companion_streak(TEXT) TO authenticated;

-- =========================================================
-- complete_challenge: server-authoritative challenge progress
-- =========================================================
CREATE OR REPLACE FUNCTION public.complete_challenge(
  p_challenge_id TEXT,
  p_progress INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row RECORD;
  v_week_start DATE;
  v_dow INTEGER;
  v_clamped INTEGER;
  v_just_completed BOOLEAN := false;
  v_fxp_awarded INTEGER := 0;
  v_bxp_awarded INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;
  IF p_progress IS NULL OR p_progress < 0 THEN
    RAISE EXCEPTION 'progress non valido: %', p_progress;
  END IF;

  -- Compute week start (Monday)
  v_dow := EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER; -- 1=Mon..7=Sun
  v_week_start := CURRENT_DATE - (v_dow - 1);

  SELECT *
    INTO v_row
    FROM public.user_challenges
   WHERE user_id = v_user_id
     AND challenge_id = p_challenge_id
     AND week_start = v_week_start
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sfida non trovata per la settimana corrente.';
  END IF;

  IF v_row.is_completed THEN
    RETURN jsonb_build_object(
      'status','already_completed',
      'progress', v_row.progress,
      'is_completed', true,
      'fxp_awarded', 0,
      'bxp_awarded', 0
    );
  END IF;

  v_clamped := LEAST(p_progress, v_row.target);

  IF v_clamped >= v_row.target THEN
    v_just_completed := true;
    UPDATE public.user_challenges
       SET progress     = v_row.target,
           is_completed = true,
           completed_at = NOW()
     WHERE id = v_row.id;

    -- Award reward via trusted XP RPC (clamped to safe ranges already)
    IF v_row.fxp_reward > 0 OR v_row.bxp_reward > 0 THEN
      PERFORM public.process_companion_xp(
        LEAST(GREATEST(v_row.fxp_reward, 0), 500),
        LEAST(GREATEST(v_row.bxp_reward, 0), 200),
        'excited'
      );
      v_fxp_awarded := v_row.fxp_reward;
      v_bxp_awarded := v_row.bxp_reward;
    END IF;

    PERFORM public.log_security_event(
      v_user_id,
      'challenge_completed',
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'fxp_awarded', v_fxp_awarded,
        'bxp_awarded', v_bxp_awarded
      )
    );
  ELSE
    UPDATE public.user_challenges
       SET progress = v_clamped
     WHERE id = v_row.id;
    PERFORM public.log_security_event(
      v_user_id,
      'challenge_progress',
      jsonb_build_object('challenge_id', p_challenge_id, 'progress', v_clamped)
    );
  END IF;

  RETURN jsonb_build_object(
    'status','ok',
    'progress', v_clamped,
    'is_completed', v_just_completed,
    'fxp_awarded', v_fxp_awarded,
    'bxp_awarded', v_bxp_awarded
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_challenge(TEXT, INTEGER) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_challenge(TEXT, INTEGER) TO authenticated;

-- =========================================================
-- Strengthen block_challenge_cheating trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.block_challenge_cheating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    -- Block self-completion
    IF NEW.is_completed = true AND OLD.is_completed = false THEN
      RAISE EXCEPTION 'Completamento sfida non consentito direttamente. Usa complete_challenge().';
    END IF;
    -- Block progress > target
    IF NEW.progress > NEW.target THEN
      RAISE EXCEPTION 'progress non può superare target.';
    END IF;
    -- Block reward / completed_at tampering
    IF NEW.fxp_reward   <> OLD.fxp_reward
       OR NEW.bxp_reward <> OLD.bxp_reward
       OR NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
      RAISE EXCEPTION 'Modifica diretta dei campi reward/completed_at non consentita.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop the duplicate older trigger (keep only block_challenge_cheating_trg)
DROP TRIGGER IF EXISTS block_challenge_cheating ON public.user_challenges;