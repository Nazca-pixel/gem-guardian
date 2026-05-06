-- =====================================================================
-- Security hardening pass: dedupe triggers, retire legacy helpers,
-- lock down internal SECURITY DEFINER trigger helpers from anon/PUBLIC.
-- =====================================================================

-- 1. companion_animals: keep only ONE anti-cheat trigger
--    (block_companion_stat_writes_trg). Drop legacy + duplicate triggers.
DROP TRIGGER IF EXISTS block_companion_cheating       ON public.companion_animals;
DROP TRIGGER IF EXISTS block_companion_direct_write   ON public.companion_animals;
DROP TRIGGER IF EXISTS trg_block_companion_stat_writes ON public.companion_animals;

-- Now the legacy functions are unreferenced and safe to drop.
DROP FUNCTION IF EXISTS public.block_companion_cheating();
DROP FUNCTION IF EXISTS public.block_companion_direct_write();

-- 2. user_challenges: keep only block_challenge_cheating_trg + sanitize_user_challenge_insert_trg.
--    Drop any duplicate older triggers on the same table.
DROP TRIGGER IF EXISTS block_challenge_cheating              ON public.user_challenges;
DROP TRIGGER IF EXISTS trg_block_challenge_cheating          ON public.user_challenges;
DROP TRIGGER IF EXISTS sanitize_user_challenge_insert        ON public.user_challenges;
DROP TRIGGER IF EXISTS trg_sanitize_user_challenge_insert    ON public.user_challenges;

-- Re-create canonical triggers idempotently (in case naming differs in some env).
DROP TRIGGER IF EXISTS block_challenge_cheating_trg ON public.user_challenges;
CREATE TRIGGER block_challenge_cheating_trg
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.block_challenge_cheating();

DROP TRIGGER IF EXISTS sanitize_user_challenge_insert_trg ON public.user_challenges;
CREATE TRIGGER sanitize_user_challenge_insert_trg
  BEFORE INSERT ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_user_challenge_insert();

-- 3. savings_goals: keep only check_tier_limits_savings_trg.
DROP TRIGGER IF EXISTS enforce_tier_limits_goals     ON public.savings_goals;
DROP TRIGGER IF EXISTS trg_check_tier_limits_savings ON public.savings_goals;

-- 4. transactions: keep only check_tier_limits_transactions_trg + check_transaction_cooldown_trg.
DROP TRIGGER IF EXISTS enforce_tier_limits_tx              ON public.transactions;
DROP TRIGGER IF EXISTS trg_check_tier_limits_transactions  ON public.transactions;
DROP TRIGGER IF EXISTS enforce_transaction_cooldown        ON public.transactions;
DROP TRIGGER IF EXISTS trg_check_transaction_cooldown      ON public.transactions;

-- 5. Revoke EXECUTE on internal trigger helpers from PUBLIC/anon/authenticated.
--    Triggers fire as table owner regardless of EXECUTE grants, so this only
--    removes the ability for clients to call them directly via PostgREST RPC.
--    Resolves the scanner findings about anon-callable SECURITY DEFINER funcs
--    for these internal helpers.

REVOKE EXECUTE ON FUNCTION public.block_companion_stat_writes()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_challenge_cheating()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_user_challenge_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_tier_limits()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_transaction_cooldown()     FROM PUBLIC, anon, authenticated;

-- 6. Drop duplicate subscriptions SELECT policy (anon role exposure).
--    Keeps the equivalent {authenticated} policy.
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
