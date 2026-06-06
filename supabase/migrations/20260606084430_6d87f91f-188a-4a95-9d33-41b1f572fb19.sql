
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
  v_today_calls INTEGER;
  v_today_fxp INTEGER;
  v_today_bxp INTEGER;
  v_day_start TIMESTAMPTZ;
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

  -- Daily window starts at midnight Europe/Rome (matches Italian user-base expectations)
  v_day_start := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';

  SELECT
    COUNT(*),
    COALESCE(SUM(COALESCE((payload->>'fxp_delta')::INT, 0)), 0),
    COALESCE(SUM(COALESCE((payload->>'bxp_delta')::INT, 0)), 0)
    INTO v_today_calls, v_today_fxp, v_today_bxp
    FROM public.security_audit_log
   WHERE user_id = v_user_id
     AND action  = 'xp_granted'
     AND created_at >= v_day_start;

  IF v_today_calls >= 60 THEN
    RAISE EXCEPTION 'Limite giornaliero XP raggiunto. Riprova domani.';
  END IF;
  IF (v_today_fxp + p_fxp_delta) > 1500 THEN
    RAISE EXCEPTION 'Limite giornaliero FXP raggiunto.';
  END IF;
  IF (v_today_bxp + p_bxp_delta) > 600 THEN
    RAISE EXCEPTION 'Limite giornaliero BXP raggiunto.';
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
