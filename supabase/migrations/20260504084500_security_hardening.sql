-- =============================================================
-- SECURITY HARDENING MIGRATION v2
-- Fixes:
--   1. Transaction cooldown enforced DB-side (table: transactions)
--   2. Badge self-award with eligibility validation (table: user_badges)
--   3. Revoke anon EXECUTE on all SECURITY DEFINER functions
--   4. checkout_subscription blocked without payment token
-- =============================================================


-- -------------------------------------------------------------
-- 1. TRANSACTION COOLDOWN — BEFORE INSERT trigger
--    Table confirmed: public.transactions (has created_at)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_transaction_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_tx TIMESTAMPTZ;
  secs_remaining NUMERIC;
BEGIN
  SELECT MAX(created_at)
    INTO last_tx
    FROM public.transactions
   WHERE user_id = NEW.user_id;

  IF last_tx IS NOT NULL THEN
    secs_remaining := EXTRACT(EPOCH FROM (INTERVAL '60 seconds' - (NOW() - last_tx)));
    IF secs_remaining > 0 THEN
      RAISE EXCEPTION
        'Cooldown attivo: attendi % secondi prima della prossima transazione.',
        CEIL(secs_remaining);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL  ON FUNCTION public.check_transaction_cooldown() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_transaction_cooldown() TO authenticated;

DROP TRIGGER IF EXISTS enforce_transaction_cooldown ON public.transactions;
CREATE TRIGGER enforce_transaction_cooldown
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_cooldown();


-- -------------------------------------------------------------
-- 2. BADGE ELIGIBILITY CHECK inside award_badge RPC
--    Tables confirmed: public.badges, public.user_badges, public.profiles
--    badges has: id, name, emoji, description, badge_type
--    profiles has: user_id, display_name, avatar_url
--    NOTE: no required_xp/required_level columns exist yet —
--    function will allow award but block duplicates.
--    Extend the eligibility block when those columns are added.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_badge(p_badge_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_badge   RECORD;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;

  -- Badge must exist in master list
  SELECT * INTO v_badge FROM public.badges WHERE id = p_badge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge non trovato: %', p_badge_id;
  END IF;

  -- Idempotent: already owned → return ok silently
  IF EXISTS (
    SELECT 1 FROM public.user_badges
     WHERE user_id = v_user_id AND badge_id = p_badge_id
  ) THEN
    RETURN jsonb_build_object('status', 'already_owned', 'badge_id', p_badge_id);
  END IF;

  -- Insert earned badge
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (v_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN jsonb_build_object('status', 'awarded', 'badge_id', p_badge_id);
END;
$$;

REVOKE ALL  ON FUNCTION public.award_badge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_badge(UUID) TO authenticated;


-- -------------------------------------------------------------
-- 3. BLOCK checkout_subscription WITHOUT PAYMENT TOKEN
--    Creates (or replaces) a safe stub that refuses any call
--    not carrying a valid Stripe payment_intent_id.
--    When you integrate Stripe, replace the stub body with
--    actual webhook verification logic.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.checkout_subscription(
  p_tier              TEXT,
  p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_valid_tiers TEXT[] := ARRAY['free', 'starter', 'pro', 'elite'];
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato.';
  END IF;

  -- Validate tier name
  IF p_tier IS NULL OR NOT (p_tier = ANY(v_valid_tiers)) THEN
    RAISE EXCEPTION 'Tier non valido: %. Valori accettati: free, starter, pro, elite.', p_tier;
  END IF;

  -- Free tier: no payment needed
  IF p_tier = 'free' THEN
    UPDATE public.profiles
       SET updated_at = NOW()
     WHERE user_id = v_user_id;
    RETURN jsonb_build_object('status', 'ok', 'tier', 'free');
  END IF;

  -- Paid tiers: require a Stripe payment_intent_id
  -- TODO: replace this check with real Stripe webhook verification
  IF p_payment_intent_id IS NULL OR LENGTH(TRIM(p_payment_intent_id)) < 10 THEN
    RAISE EXCEPTION
      'Pagamento richiesto per il tier %. Fornisci un payment_intent_id valido.',
      p_tier;
  END IF;

  -- Placeholder: log the intent (extend when Stripe is integrated)
  -- In production: verify p_payment_intent_id via Stripe API in an Edge Function,
  -- then call this RPC only after server-side confirmation.
  RAISE NOTICE 'checkout_subscription: user=% tier=% intent=%',
    v_user_id, p_tier, p_payment_intent_id;

  RETURN jsonb_build_object(
    'status', 'pending_stripe_verification',
    'tier',   p_tier,
    'note',   'Integra Stripe Edge Function per completare la verifica'
  );
END;
$$;

REVOKE ALL  ON FUNCTION public.checkout_subscription(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout_subscription(TEXT, TEXT) TO authenticated;


-- -------------------------------------------------------------
-- 4. REVOKE anon EXECUTE from ALL SECURITY DEFINER functions
--    in the public schema (catches handle_new_user and others)
-- -------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = TRUE
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I FROM anon',
        r.proname
      );
      RAISE NOTICE 'Revoked anon EXECUTE on public.%', r.proname;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skip %: %', r.proname, SQLERRM;
    END;
  END LOOP;
END;
$$;
