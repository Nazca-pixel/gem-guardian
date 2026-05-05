-- 1. Audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_created
  ON public.security_audit_log (user_id, created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit rows
DROP POLICY IF EXISTS "Audit read own" ON public.security_audit_log;
CREATE POLICY "Audit read own"
  ON public.security_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Block all client writes
DROP POLICY IF EXISTS "Audit no direct insert" ON public.security_audit_log;
CREATE POLICY "Audit no direct insert"
  ON public.security_audit_log FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Audit no direct update" ON public.security_audit_log;
CREATE POLICY "Audit no direct update"
  ON public.security_audit_log FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Audit no direct delete" ON public.security_audit_log;
CREATE POLICY "Audit no direct delete"
  ON public.security_audit_log FOR DELETE USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.security_audit_log FROM anon, authenticated;
GRANT  SELECT ON public.security_audit_log TO authenticated;

-- 2. Internal logger helper (callable only by other SECURITY DEFINER functions)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action  TEXT,
  p_payload JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, payload)
  VALUES (p_user_id, p_action, p_payload);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, JSONB) FROM anon, authenticated;

-- 3. Wire logging into existing RPCs

-- award_badge
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
    v_eligible := false;
  END IF;

  IF NOT v_eligible THEN
    RAISE EXCEPTION 'Requisiti non soddisfatti per il badge %.', v_badge.name;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (v_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  PERFORM public.log_security_event(
    v_user_id,
    'badge_awarded',
    jsonb_build_object(
      'badge_id', p_badge_id,
      'badge_name', v_badge.name,
      'badge_type', v_badge.badge_type
    )
  );

  RETURN jsonb_build_object('status', 'awarded', 'badge_id', p_badge_id);
END;
$function$;

-- unlock_accessory
CREATE OR REPLACE FUNCTION public.unlock_accessory(_accessory_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _user_bxp integer;
  _required_bxp integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT bxp INTO _user_bxp FROM companion_animals WHERE user_id = _user_id;

  SELECT bxp_required INTO _required_bxp FROM accessories WHERE id = _accessory_id;

  IF _required_bxp IS NULL THEN
    RAISE EXCEPTION 'Accessory not found';
  END IF;

  IF _user_bxp < _required_bxp THEN
    RAISE EXCEPTION 'Insufficient BXP: have %, need %', _user_bxp, _required_bxp;
  END IF;

  INSERT INTO user_accessories (user_id, accessory_id)
  VALUES (_user_id, _accessory_id)
  ON CONFLICT (user_id, accessory_id) DO NOTHING;

  PERFORM public.log_security_event(
    _user_id,
    'accessory_unlocked',
    jsonb_build_object(
      'accessory_id', _accessory_id,
      'bxp_required', _required_bxp
    )
  );
END;
$function$;

-- checkout_subscription
CREATE OR REPLACE FUNCTION public.checkout_subscription(p_tier text, p_payment_intent_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     UUID   := auth.uid();
  v_valid_tiers TEXT[] := ARRAY['free','starter','pro','elite'];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;
  IF p_tier IS NULL OR NOT (p_tier = ANY(v_valid_tiers)) THEN
    RAISE EXCEPTION 'Tier non valido: %', p_tier;
  END IF;
  IF p_tier = 'free' THEN
    PERFORM public.log_security_event(
      v_user_id,
      'subscription_changed',
      jsonb_build_object('tier', 'free', 'status', 'ok')
    );
    RETURN jsonb_build_object('status', 'ok', 'tier', 'free');
  END IF;
  RAISE EXCEPTION 'Pagamento non ancora integrato. I tier a pagamento richiedono verifica Stripe lato server.';
END;
$function$;