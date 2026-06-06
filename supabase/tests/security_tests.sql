-- =====================================================================
-- Wallet Monster — automated backend tests
--
-- Targets:
--   * add_savings_funds RPC (happy path, fractional, completion, bounds, cross-user)
--   * block_savings_amount_writes trigger (blocks current_amount + is_completed,
--     allows cosmetic edits)
--   * process_companion_xp daily caps (60 calls, 1500 FXP, 600 BXP)
--   * Daily cap reset window = midnight Europe/Rome
--
-- HOW TO RUN
--   This script writes to `auth.users` (it creates two ephemeral fake users,
--   runs all assertions, then deletes them — auth.users cascade deletes the
--   rest). That means it must be run with a role that can write to the
--   `auth` schema: either `postgres` (Supabase SQL editor) or via the
--   service-role connection. The Lovable sandbox role (`sandbox_exec`) does
--   NOT have permission to write to `auth.users`, so this file cannot be run
--   via `code--exec psql`. Run it instead from the Supabase SQL Editor:
--
--     1. Open Cloud → Database → SQL Editor
--     2. Paste the contents of this file
--     3. Run it. Every test will log `PASS:` or raise an exception on failure.
--
-- The whole script is wrapped in BEGIN…ROLLBACK so production data is never
-- modified even on a successful run.
-- =====================================================================

BEGIN;

DO $fixture$
DECLARE
  v_uid1 UUID := gen_random_uuid();
  v_uid2 UUID := gen_random_uuid();
BEGIN
  -- Stash UUIDs in session variables so later DO blocks can read them
  PERFORM set_config('wm.test_uid1', v_uid1::TEXT, false);
  PERFORM set_config('wm.test_uid2', v_uid2::TEXT, false);

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  VALUES
    (v_uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'wm-test-1-'||v_uid1||'@example.invalid', '', now(), now(), now()),
    (v_uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'wm-test-2-'||v_uid2||'@example.invalid', '', now(), now(), now());

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (v_uid1,'T1'), (v_uid2,'T2')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.companion_animals (user_id, name)
  VALUES (v_uid1,'Pippo'), (v_uid2,'Pippo')
  ON CONFLICT (user_id) DO NOTHING;
END
$fixture$;

CREATE OR REPLACE FUNCTION pg_temp.uid1() RETURNS UUID LANGUAGE sql AS
$$ SELECT current_setting('wm.test_uid1')::UUID $$;
CREATE OR REPLACE FUNCTION pg_temp.uid2() RETURNS UUID LANGUAGE sql AS
$$ SELECT current_setting('wm.test_uid2')::UUID $$;
CREATE OR REPLACE FUNCTION pg_temp.become(p_uid UUID) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role','authenticated', true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', p_uid, 'role','authenticated')::TEXT, true);
END $$;

-- ---------------------------------------------------------------------
-- TEST 1 — add_savings_funds happy path + fractional + completion
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_goal UUID; v_res JSONB; v_cur NUMERIC;
BEGIN
  INSERT INTO public.savings_goals(user_id,name,emoji,target_amount,current_amount)
  VALUES (pg_temp.uid1(),'Test Goal','🎯',100,0) RETURNING id INTO v_goal;
  PERFORM pg_temp.become(pg_temp.uid1());

  v_res := public.add_savings_funds(v_goal, 25);
  IF (v_res->>'status')<>'ok' OR (v_res->>'new_amount')::NUMERIC<>25
     OR (v_res->>'is_completed')::BOOLEAN<>false THEN
    RAISE EXCEPTION 'add_savings_funds happy: %', v_res;
  END IF;

  PERFORM public.add_savings_funds(v_goal, 0.5);
  PERFORM public.add_savings_funds(v_goal, 0.01);
  SELECT current_amount INTO v_cur FROM public.savings_goals WHERE id=v_goal;
  IF v_cur <> 25.51 THEN RAISE EXCEPTION 'fractional sum got %', v_cur; END IF;

  v_res := public.add_savings_funds(v_goal, 100);
  IF (v_res->>'is_completed')::BOOLEAN <> true THEN
    RAISE EXCEPTION 'completion not flagged: %', v_res;
  END IF;
  RESET ROLE;
  RAISE NOTICE 'PASS: add_savings_funds happy + fractional + completion';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 2 — add_savings_funds rejects bad amounts (0, negative, >1M)
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_goal UUID; v_amt NUMERIC; v_ok BOOLEAN;
BEGIN
  INSERT INTO public.savings_goals(user_id,name,emoji,target_amount,current_amount)
  VALUES (pg_temp.uid1(),'Bounds Goal','🎯',100,0) RETURNING id INTO v_goal;
  PERFORM pg_temp.become(pg_temp.uid1());
  FOREACH v_amt IN ARRAY ARRAY[0::NUMERIC, -1, -0.01, 1000001] LOOP
    v_ok := false;
    BEGIN PERFORM public.add_savings_funds(v_goal, v_amt);
    EXCEPTION WHEN OTHERS THEN v_ok := true; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'amount % was accepted', v_amt; END IF;
  END LOOP;
  RESET ROLE;
  RAISE NOTICE 'PASS: add_savings_funds rejects 0, -1, -0.01, 1,000,001';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 3 — add_savings_funds rejects another user's goal
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_goal UUID; v_ok BOOLEAN := false;
BEGIN
  INSERT INTO public.savings_goals(user_id,name,emoji,target_amount,current_amount)
  VALUES (pg_temp.uid1(),'A Goal','🎯',100,0) RETURNING id INTO v_goal;
  PERFORM pg_temp.become(pg_temp.uid2());
  BEGIN PERFORM public.add_savings_funds(v_goal, 10);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  RESET ROLE;
  IF NOT v_ok THEN RAISE EXCEPTION 'cross-user write not rejected'; END IF;
  RAISE NOTICE 'PASS: add_savings_funds rejects another user''s goal';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 4 — block_savings_amount_writes trigger
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_goal UUID; v_ok BOOLEAN;
BEGIN
  INSERT INTO public.savings_goals(user_id,name,emoji,target_amount,current_amount)
  VALUES (pg_temp.uid1(),'Trig Goal','🎯',100,0) RETURNING id INTO v_goal;
  PERFORM pg_temp.become(pg_temp.uid1());

  v_ok := false;
  BEGIN UPDATE public.savings_goals SET current_amount=9999 WHERE id=v_goal;
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'current_amount not blocked'; END IF;

  v_ok := false;
  BEGIN UPDATE public.savings_goals SET is_completed=true WHERE id=v_goal;
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'is_completed not blocked'; END IF;

  UPDATE public.savings_goals SET name='Renamed', emoji='🚀' WHERE id=v_goal;  -- must succeed
  RESET ROLE;
  RAISE NOTICE 'PASS: trigger blocks current_amount + is_completed, allows cosmetic';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 5 — process_companion_xp under cap succeeds
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_res JSONB;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  PERFORM pg_temp.become(pg_temp.uid1());
  v_res := public.process_companion_xp(10, 5, NULL);
  RESET ROLE;
  IF (v_res->>'status') <> 'ok' THEN RAISE EXCEPTION 'under-cap: %', v_res; END IF;
  RAISE NOTICE 'PASS: process_companion_xp under daily caps';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 6 — 60-call/day cap
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  INSERT INTO public.security_audit_log(user_id,action,payload)
  SELECT pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',0,'bxp_delta',0)
    FROM generate_series(1,60);
  PERFORM pg_temp.become(pg_temp.uid1());
  BEGIN PERFORM public.process_companion_xp(1,0,NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Limite giornaliero XP%' THEN v_ok := true; END IF;
  END;
  RESET ROLE;
  IF NOT v_ok THEN RAISE EXCEPTION '60-call cap not enforced'; END IF;
  RAISE NOTICE 'PASS: xp cap — 60 calls/day';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 7 — FXP sum cap (1500)
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  INSERT INTO public.security_audit_log(user_id,action,payload) VALUES
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',500,'bxp_delta',0)),
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',500,'bxp_delta',0)),
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',500,'bxp_delta',0));
  PERFORM pg_temp.become(pg_temp.uid1());
  BEGIN PERFORM public.process_companion_xp(1,0,NULL);
  EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%FXP%' THEN v_ok := true; END IF; END;
  RESET ROLE;
  IF NOT v_ok THEN RAISE EXCEPTION 'FXP sum cap not enforced'; END IF;
  RAISE NOTICE 'PASS: xp cap — FXP sum 1500/day';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 8 — BXP sum cap (600)
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  INSERT INTO public.security_audit_log(user_id,action,payload) VALUES
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',0,'bxp_delta',200)),
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',0,'bxp_delta',200)),
    (pg_temp.uid1(),'xp_granted',jsonb_build_object('fxp_delta',0,'bxp_delta',200));
  PERFORM pg_temp.become(pg_temp.uid1());
  BEGIN PERFORM public.process_companion_xp(0,1,NULL);
  EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%BXP%' THEN v_ok := true; END IF; END;
  RESET ROLE;
  IF NOT v_ok THEN RAISE EXCEPTION 'BXP sum cap not enforced'; END IF;
  RAISE NOTICE 'PASS: xp cap — BXP sum 600/day';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 9 — input range validation (fxp>500, bxp>200, negative)
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_ok BOOLEAN;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  PERFORM pg_temp.become(pg_temp.uid1());

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(501,0,NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'fxp>500 accepted'; END IF;

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(0,201,NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'bxp>200 accepted'; END IF;

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(-1,0,NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'negative fxp accepted'; END IF;
  RESET ROLE;
  RAISE NOTICE 'PASS: xp input-range validation';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 10 — daily reset BEFORE Europe/Rome midnight is NOT counted
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_mid TIMESTAMPTZ; v_res JSONB;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  v_mid := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';
  INSERT INTO public.security_audit_log(user_id,action,payload,created_at)
  SELECT pg_temp.uid1(),'xp_granted',
         jsonb_build_object('fxp_delta',500,'bxp_delta',200),
         v_mid - INTERVAL '1 second'
    FROM generate_series(1,100);
  PERFORM pg_temp.become(pg_temp.uid1());
  v_res := public.process_companion_xp(1,1,NULL);
  RESET ROLE;
  IF (v_res->>'status') <> 'ok' THEN
    RAISE EXCEPTION 'pre-midnight events leaked: %', v_res;
  END IF;
  RAISE NOTICE 'PASS: reset BEFORE Rome midnight ignored';
END $t$;

-- ---------------------------------------------------------------------
-- TEST 11 — events AFTER Rome midnight ARE counted
-- ---------------------------------------------------------------------
DO $t$
DECLARE v_mid TIMESTAMPTZ; v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id=pg_temp.uid1() AND action='xp_granted';
  v_mid := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';
  INSERT INTO public.security_audit_log(user_id,action,payload,created_at)
  SELECT pg_temp.uid1(),'xp_granted',
         jsonb_build_object('fxp_delta',0,'bxp_delta',0),
         v_mid + INTERVAL '1 second'
    FROM generate_series(1,60);
  PERFORM pg_temp.become(pg_temp.uid1());
  BEGIN PERFORM public.process_companion_xp(1,0,NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Limite giornaliero%' THEN v_ok := true; END IF;
  END;
  RESET ROLE;
  IF NOT v_ok THEN RAISE EXCEPTION 'post-midnight events not counted'; END IF;
  RAISE NOTICE 'PASS: reset AFTER Rome midnight counted';
END $t$;

ROLLBACK;
