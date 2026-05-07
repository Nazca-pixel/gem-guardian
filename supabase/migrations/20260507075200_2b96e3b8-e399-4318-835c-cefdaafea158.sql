-- Attach anti-cheat triggers (functions already exist but were not attached)

DROP TRIGGER IF EXISTS block_companion_stat_writes_trg ON public.companion_animals;
CREATE TRIGGER block_companion_stat_writes_trg
BEFORE UPDATE ON public.companion_animals
FOR EACH ROW EXECUTE FUNCTION public.block_companion_stat_writes();

DROP TRIGGER IF EXISTS block_challenge_cheating_trg ON public.user_challenges;
CREATE TRIGGER block_challenge_cheating_trg
BEFORE UPDATE ON public.user_challenges
FOR EACH ROW EXECUTE FUNCTION public.block_challenge_cheating();

DROP TRIGGER IF EXISTS sanitize_user_challenge_insert_trg ON public.user_challenges;
CREATE TRIGGER sanitize_user_challenge_insert_trg
BEFORE INSERT ON public.user_challenges
FOR EACH ROW EXECUTE FUNCTION public.sanitize_user_challenge_insert();

DROP TRIGGER IF EXISTS check_tier_limits_savings_trg ON public.savings_goals;
CREATE TRIGGER check_tier_limits_savings_trg
BEFORE INSERT ON public.savings_goals
FOR EACH ROW EXECUTE FUNCTION public.check_tier_limits();

DROP TRIGGER IF EXISTS check_tier_limits_tx_trg ON public.transactions;
CREATE TRIGGER check_tier_limits_tx_trg
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.check_tier_limits();

DROP TRIGGER IF EXISTS check_transaction_cooldown_trg ON public.transactions;
CREATE TRIGGER check_transaction_cooldown_trg
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.check_transaction_cooldown();

-- Belt-and-suspenders: revoke direct write privileges on protected tables
-- (RLS already blocks them, but removing grants is defense-in-depth).
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions    FROM anon, authenticated;
REVOKE INSERT, DELETE          ON public.user_badges     FROM anon, authenticated;
REVOKE INSERT, DELETE          ON public.user_accessories FROM anon, authenticated;
-- user_accessories UPDATE remains allowed for equip/unequip toggle (RLS owner-only).