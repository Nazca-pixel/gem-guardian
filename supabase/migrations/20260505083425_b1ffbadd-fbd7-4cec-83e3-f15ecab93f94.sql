
-- 1. Drop the old vulnerable checkout_subscription overload
DROP FUNCTION IF EXISTS public.checkout_subscription(subscription_tier, boolean);

-- 2. Replace award_badge with one that enforces eligibility
CREATE OR REPLACE FUNCTION public.award_badge(p_badge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_badge RECORD;
  v_companion RECORD;
  v_total_saved NUMERIC;
  v_tx_count INTEGER;
  v_eligible BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;

  SELECT * INTO v_badge FROM public.badges WHERE id = p_badge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge non trovato: %', p_badge_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = v_user_id AND badge_id = p_badge_id) THEN
    RETURN jsonb_build_object('status', 'already_owned');
  END IF;

  SELECT level, current_streak, longest_streak
    INTO v_companion
    FROM public.companion_animals
   WHERE user_id = v_user_id;

  -- Eligibility per badge type / name
  IF v_badge.badge_type = 'level' THEN
    IF v_badge.name = 'Maestro'  AND v_companion.level >= 5  THEN v_eligible := true; END IF;
    IF v_badge.name = 'Esperto'  AND v_companion.level >= 10 THEN v_eligible := true; END IF;

  ELSIF v_badge.badge_type IN ('streak', 'streak_7', 'streak_30', 'streak_100') THEN
    IF v_badge.name IN ('7 Giorni', 'Settimana di Fuoco')
       AND COALESCE(GREATEST(v_companion.current_streak, v_companion.longest_streak), 0) >= 7 THEN
      v_eligible := true;
    END IF;
    IF v_badge.name IN ('Costante', 'Mese da Campione')
       AND COALESCE(GREATEST(v_companion.current_streak, v_companion.longest_streak), 0) >= 30 THEN
      v_eligible := true;
    END IF;
    IF v_badge.name IN ('Leggenda', 'Leggenda dello Streak')
       AND COALESCE(GREATEST(v_companion.current_streak, v_companion.longest_streak), 0) >= 100 THEN
      v_eligible := true;
    END IF;

  ELSIF v_badge.badge_type = 'savings' THEN
    SELECT COALESCE(SUM(current_amount), 0) INTO v_total_saved
      FROM public.savings_goals WHERE user_id = v_user_id;
    IF v_badge.name = 'Risparmiatore' AND v_total_saved >= 100  THEN v_eligible := true; END IF;
    IF v_badge.name = 'Super Saver'   AND v_total_saved >= 1000 THEN v_eligible := true; END IF;

  ELSIF v_badge.badge_type = 'tracking' THEN
    SELECT COUNT(*) INTO v_tx_count FROM public.transactions WHERE user_id = v_user_id;
    IF v_badge.name = 'Prima Spesa' AND v_tx_count >= 1 THEN v_eligible := true; END IF;

  ELSIF v_badge.badge_type = 'behavior' THEN
    -- Behaviour badges are awarded by trusted server-side logic only
    v_eligible := false;
  END IF;

  IF NOT v_eligible THEN
    RAISE EXCEPTION 'Requisiti non soddisfatti per il badge %.', v_badge.name;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (v_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN jsonb_build_object('status', 'awarded', 'badge_id', p_badge_id);
END;
$function$;

-- 3. Block direct client writes to companion stats (XP / BXP / level / streaks)
--    SECURITY DEFINER functions (game logic) bypass this because triggers run
--    with the SESSION role, and definer functions still see role = 'authenticated';
--    so we additionally allow updates initiated through pg_trigger_depth() > 0
--    only when coming from our trusted definer functions.
CREATE OR REPLACE FUNCTION public.block_companion_stat_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow only when called from a SECURITY DEFINER function (nested call)
  -- pg_trigger_depth() > 0 indicates we are inside a trigger chain, but we
  -- want to detect "called from a definer function". We use the fact that
  -- our trusted RPCs are SECURITY DEFINER and run as the function owner
  -- (postgres). Direct PostgREST calls run as 'authenticated'.
  IF current_user = 'authenticated' THEN
    IF NEW.fxp <> OLD.fxp
       OR NEW.bxp <> OLD.bxp
       OR NEW.level <> OLD.level
       OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
       OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
       OR NEW.consecutive_failed_months <> OLD.consecutive_failed_months THEN
      RAISE EXCEPTION 'Modifica diretta dei valori di gioco non consentita. Usa le azioni di gioco.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_block_companion_stat_writes ON public.companion_animals;
CREATE TRIGGER trg_block_companion_stat_writes
BEFORE UPDATE ON public.companion_animals
FOR EACH ROW
EXECUTE FUNCTION public.block_companion_stat_writes();

-- 4. Enforce free-tier limits server-side (savings_goals + transactions/day)
DROP TRIGGER IF EXISTS trg_check_tier_limits_savings ON public.savings_goals;
CREATE TRIGGER trg_check_tier_limits_savings
BEFORE INSERT ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.check_tier_limits();

DROP TRIGGER IF EXISTS trg_check_tier_limits_transactions ON public.transactions;
CREATE TRIGGER trg_check_tier_limits_transactions
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.check_tier_limits();

-- 5. Attach existing cooldown trigger if not already present
DROP TRIGGER IF EXISTS trg_check_transaction_cooldown ON public.transactions;
CREATE TRIGGER trg_check_transaction_cooldown
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.check_transaction_cooldown();

-- 6. Tighten EXECUTE on sensitive RPCs (deny anon, allow authenticated only)
REVOKE EXECUTE ON FUNCTION public.checkout_subscription(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.checkout_subscription(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.award_badge(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.award_badge(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unlock_accessory(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.unlock_accessory(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
