
-- 1. Create trusted challenge catalog
CREATE TABLE IF NOT EXISTS public.challenge_catalog (
  challenge_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0 AND target <= 100000),
  fxp_reward INTEGER NOT NULL CHECK (fxp_reward >= 0 AND fxp_reward <= 500),
  bxp_reward INTEGER NOT NULL CHECK (bxp_reward >= 0 AND bxp_reward <= 200),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view challenge catalog" ON public.challenge_catalog;
CREATE POLICY "Anyone can view challenge catalog"
  ON public.challenge_catalog FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "No direct catalog write" ON public.challenge_catalog;
CREATE POLICY "No direct catalog insert" ON public.challenge_catalog FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct catalog update" ON public.challenge_catalog FOR UPDATE USING (false);
CREATE POLICY "No direct catalog delete" ON public.challenge_catalog FOR DELETE USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.challenge_catalog FROM anon, authenticated;

-- Seed catalog (matches WEEKLY_CHALLENGES in src/lib/xpSystem.ts)
INSERT INTO public.challenge_catalog (challenge_id, name, challenge_type, target, fxp_reward, bxp_reward)
VALUES
  ('no_unnecessary_3', 'Settimana Frugale', 'no_unnecessary', 3,   20, 15),
  ('savings_100',     'Risparmio Sprint',  'savings_target', 100, 30, 10),
  ('streak_7',        'Settimana Perfetta','streak',         7,   15, 25),
  ('budget_90',       'Budget Master',     'budget',         90,  25, 20)
ON CONFLICT (challenge_id) DO UPDATE SET
  name = EXCLUDED.name,
  challenge_type = EXCLUDED.challenge_type,
  target = EXCLUDED.target,
  fxp_reward = EXCLUDED.fxp_reward,
  bxp_reward = EXCLUDED.bxp_reward,
  is_active = true;

-- 2. Replace sanitize_user_challenge_insert: force trusted catalog values, reject unknown ids,
--    force ownership/progress/completion fields, prevent duplicate active row per week.
CREATE OR REPLACE FUNCTION public.sanitize_user_challenge_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cat RECORD;
  v_uid UUID := auth.uid();
  v_dup INT;
BEGIN
  IF current_user = 'authenticated' THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Non autenticato.';
    END IF;

    -- Force ownership
    NEW.user_id := v_uid;

    -- Force safe defaults
    NEW.is_completed := false;
    NEW.completed_at := NULL;
    NEW.progress := 0;

    -- Validate against trusted catalog
    SELECT * INTO v_cat
      FROM public.challenge_catalog
     WHERE challenge_id = NEW.challenge_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Challenge id non valido: %', NEW.challenge_id;
    END IF;

    -- Force trusted reward/target values (ignore anything client passed)
    NEW.fxp_reward := v_cat.fxp_reward;
    NEW.bxp_reward := v_cat.bxp_reward;
    NEW.target := v_cat.target;

    -- Normalize week_start to current ISO week Monday
    NEW.week_start := (CURRENT_DATE - (EXTRACT(ISODOW FROM CURRENT_DATE)::INT - 1));

    -- Prevent duplicates for same user/challenge/week
    SELECT COUNT(*) INTO v_dup
      FROM public.user_challenges
     WHERE user_id = v_uid
       AND challenge_id = NEW.challenge_id
       AND week_start = NEW.week_start;
    IF v_dup > 0 THEN
      RAISE EXCEPTION 'Sfida già assegnata per questa settimana.';
    END IF;

    -- Cap total active challenges per week (defense in depth)
    SELECT COUNT(*) INTO v_dup
      FROM public.user_challenges
     WHERE user_id = v_uid AND week_start = NEW.week_start;
    IF v_dup >= 10 THEN
      RAISE EXCEPTION 'Limite settimanale sfide raggiunto.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS sanitize_user_challenge_insert_trg ON public.user_challenges;
CREATE TRIGGER sanitize_user_challenge_insert_trg
BEFORE INSERT ON public.user_challenges
FOR EACH ROW EXECUTE FUNCTION public.sanitize_user_challenge_insert();

-- 3. Harden complete_challenge: derive rewards from catalog, not from user row
CREATE OR REPLACE FUNCTION public.complete_challenge(p_challenge_id text, p_progress integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_row RECORD;
  v_cat RECORD;
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

  -- Trusted catalog lookup (single source of truth for rewards/target)
  SELECT * INTO v_cat
    FROM public.challenge_catalog
   WHERE challenge_id = p_challenge_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge id non valido: %', p_challenge_id;
  END IF;

  v_dow := EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER;
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

  v_clamped := LEAST(p_progress, v_cat.target);

  IF v_clamped >= v_cat.target THEN
    v_just_completed := true;
    UPDATE public.user_challenges
       SET progress     = v_cat.target,
           is_completed = true,
           completed_at = NOW(),
           fxp_reward   = v_cat.fxp_reward,
           bxp_reward   = v_cat.bxp_reward,
           target       = v_cat.target
     WHERE id = v_row.id;

    IF v_cat.fxp_reward > 0 OR v_cat.bxp_reward > 0 THEN
      PERFORM public.process_companion_xp(
        LEAST(GREATEST(v_cat.fxp_reward, 0), 500),
        LEAST(GREATEST(v_cat.bxp_reward, 0), 200),
        'excited'
      );
      v_fxp_awarded := v_cat.fxp_reward;
      v_bxp_awarded := v_cat.bxp_reward;
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
$function$;
