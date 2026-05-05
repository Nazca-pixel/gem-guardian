-- 1. Attach companion_animals stat-write protection trigger
DROP TRIGGER IF EXISTS block_companion_stat_writes_trg ON public.companion_animals;
CREATE TRIGGER block_companion_stat_writes_trg
  BEFORE UPDATE ON public.companion_animals
  FOR EACH ROW
  EXECUTE FUNCTION public.block_companion_stat_writes();

-- 2. Attach user_challenges reward/completion protection trigger
DROP TRIGGER IF EXISTS block_challenge_cheating_trg ON public.user_challenges;
CREATE TRIGGER block_challenge_cheating_trg
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.block_challenge_cheating();

-- Also block reward inflation on INSERT: force reward fields to catalog defaults
CREATE OR REPLACE FUNCTION public.sanitize_user_challenge_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    -- Users cannot self-mark completion or set completion timestamp on insert
    NEW.is_completed := false;
    NEW.completed_at := NULL;
    NEW.progress := 0;
    -- Reward fields must be 0 on insert from clients; trusted server logic sets them
    -- (the app already passes catalog values; this is a defense-in-depth clamp)
    -- We allow the provided values but cap to sane bounds:
    IF NEW.fxp_reward < 0 OR NEW.fxp_reward > 1000 THEN
      RAISE EXCEPTION 'fxp_reward fuori range consentito';
    END IF;
    IF NEW.bxp_reward < 0 OR NEW.bxp_reward > 1000 THEN
      RAISE EXCEPTION 'bxp_reward fuori range consentito';
    END IF;
    IF NEW.target IS NULL OR NEW.target <= 0 OR NEW.target > 100000 THEN
      RAISE EXCEPTION 'target non valido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_user_challenge_insert_trg ON public.user_challenges;
CREATE TRIGGER sanitize_user_challenge_insert_trg
  BEFORE INSERT ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_user_challenge_insert();

-- 3. Attach tier limit triggers
DROP TRIGGER IF EXISTS check_tier_limits_savings_trg ON public.savings_goals;
CREATE TRIGGER check_tier_limits_savings_trg
  BEFORE INSERT ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tier_limits();

DROP TRIGGER IF EXISTS check_tier_limits_transactions_trg ON public.transactions;
CREATE TRIGGER check_tier_limits_transactions_trg
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tier_limits();

-- 4. Attach transaction cooldown trigger
DROP TRIGGER IF EXISTS check_transaction_cooldown_trg ON public.transactions;
CREATE TRIGGER check_transaction_cooldown_trg
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_cooldown();

-- 5. Tighten payment guard: reject all paid-tier checkouts until real Stripe verification exists
CREATE OR REPLACE FUNCTION public.checkout_subscription(p_tier text, p_payment_intent_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    RETURN jsonb_build_object('status', 'ok', 'tier', 'free');
  END IF;
  -- Paid tiers require real Stripe verification via a webhook-populated table.
  -- Until that integration exists, never grant paid tiers from this RPC.
  RAISE EXCEPTION 'Pagamento non ancora integrato. I tier a pagamento richiedono verifica Stripe lato server.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.checkout_subscription(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_subscription(text, text) TO authenticated;