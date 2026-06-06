-- =====================================================================
-- Wallet Monster — automated backend tests
-- Targets:
--   * add_savings_funds RPC
--   * block_savings_amount_writes trigger
--   * process_companion_xp daily caps (count / FXP / BXP)
--   * daily cap reset window (Europe/Rome midnight)
--
-- Run with:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/security_tests.sql
--
-- Each test is a DO block that RAISEs EXCEPTION on failure and RAISE NOTICE
-- on pass. The whole script runs in a single transaction and ROLLBACKs at
-- the end so no production data is touched.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Test fixtures
-- ---------------------------------------------------------------------
DO $fixture$
DECLARE
  v_uid1 UUID := '11111111-1111-1111-1111-111111111111';
  v_uid2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Two fake auth users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  VALUES
    (v_uid1, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'wm-test-1@example.invalid', '', now(), now(), now()),
    (v_uid2, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'wm-test-2@example.invalid', '', now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Profiles + companions (handle_new_user trigger does this in prod, but
  -- a raw auth.users insert may not fire it — bootstrap manually)
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (v_uid1, 'T1'), (v_uid2, 'T2')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.companion_animals (user_id, name)
  VALUES (v_uid1, 'Pippo'), (v_uid2, 'Pippo')
  ON CONFLICT (user_id) DO NOTHING;
END
$fixture$;

-- Helper: become user N as role "authenticated" (so triggers + auth.uid() fire)
CREATE OR REPLACE FUNCTION pg_temp.become(p_uid UUID) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
                     jsonb_build_object('sub', p_uid, 'role','authenticated')::TEXT,
                     true);
END $$;

CREATE OR REPLACE FUNCTION pg_temp.reset_role() RETURNS void
LANGUAGE plpgsql AS $$ BEGIN RESET ROLE; END $$;

-- ---------------------------------------------------------------------
-- add_savings_funds: happy path + completion
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_goal_id UUID;
  v_res JSONB;
  v_row RECORD;
BEGIN
  -- Insert goal as service role (bypass tier limits)
  INSERT INTO public.savings_goals (user_id, name, emoji, target_amount, current_amount)
  VALUES (v_uid, 'Test Goal', '🎯', 100, 0)
  RETURNING id INTO v_goal_id;

  PERFORM pg_temp.become(v_uid);

  -- Happy path
  v_res := public.add_savings_funds(v_goal_id, 25);
  IF (v_res->>'status') <> 'ok'                  THEN RAISE EXCEPTION 'add_savings_funds happy: status'; END IF;
  IF (v_res->>'new_amount')::NUMERIC <> 25        THEN RAISE EXCEPTION 'add_savings_funds happy: new_amount'; END IF;
  IF (v_res->>'is_completed')::BOOLEAN <> false   THEN RAISE EXCEPTION 'add_savings_funds happy: is_completed'; END IF;

  -- Fractional accumulation
  PERFORM public.add_savings_funds(v_goal_id, 0.5);
  PERFORM public.add_savings_funds(v_goal_id, 0.01);
  SELECT current_amount INTO v_row FROM public.savings_goals WHERE id = v_goal_id;
  IF v_row.current_amount <> 25.51 THEN
    RAISE EXCEPTION 'add_savings_funds fractional: got %', v_row.current_amount;
  END IF;

  -- Completion at / past target
  v_res := public.add_savings_funds(v_goal_id, 100);
  IF (v_res->>'is_completed')::BOOLEAN <> true THEN RAISE EXCEPTION 'add_savings_funds completion'; END IF;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'PASS: add_savings_funds happy + fractional + completion';
END $t$;

-- ---------------------------------------------------------------------
-- add_savings_funds: rejects bad amounts
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_goal_id UUID;
  v_amount NUMERIC;
  v_amounts NUMERIC[] := ARRAY[0, -1, -0.01, 1000001];
  v_ok BOOLEAN;
BEGIN
  INSERT INTO public.savings_goals (user_id, name, emoji, target_amount, current_amount)
  VALUES (v_uid, 'Bounds Goal', '🎯', 100, 0)
  RETURNING id INTO v_goal_id;

  PERFORM pg_temp.become(v_uid);

  FOREACH v_amount IN ARRAY v_amounts LOOP
    BEGIN
      PERFORM public.add_savings_funds(v_goal_id, v_amount);
      v_ok := false;
    EXCEPTION WHEN OTHERS THEN
      v_ok := true;
    END;
    IF NOT v_ok THEN
      RAISE EXCEPTION 'add_savings_funds bounds: amount % was accepted', v_amount;
    END IF;
  END LOOP;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'PASS: add_savings_funds rejects 0 / negative / fractional-negative / > 1,000,000';
END $t$;

-- ---------------------------------------------------------------------
-- add_savings_funds: rejects another user's goal
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_a UUID := '11111111-1111-1111-1111-111111111111';
  v_b UUID := '22222222-2222-2222-2222-222222222222';
  v_goal_a UUID;
  v_ok BOOLEAN := false;
BEGIN
  INSERT INTO public.savings_goals (user_id, name, emoji, target_amount, current_amount)
  VALUES (v_a, 'A Goal', '🎯', 100, 0)
  RETURNING id INTO v_goal_a;

  PERFORM pg_temp.become(v_b);
  BEGIN
    PERFORM public.add_savings_funds(v_goal_a, 10);
  EXCEPTION WHEN OTHERS THEN
    v_ok := true;
  END;
  PERFORM pg_temp.reset_role();

  IF NOT v_ok THEN
    RAISE EXCEPTION 'add_savings_funds cross-user: user B added funds to user A goal';
  END IF;
  RAISE NOTICE 'PASS: add_savings_funds rejects another user''s goal';
END $t$;

-- ---------------------------------------------------------------------
-- block_savings_amount_writes trigger
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_goal_id UUID;
  v_ok BOOLEAN;
BEGIN
  INSERT INTO public.savings_goals (user_id, name, emoji, target_amount, current_amount)
  VALUES (v_uid, 'Trigger Goal', '🎯', 100, 0)
  RETURNING id INTO v_goal_id;

  PERFORM pg_temp.become(v_uid);

  -- Direct UPDATE of current_amount must be blocked
  v_ok := false;
  BEGIN
    UPDATE public.savings_goals SET current_amount = 9999 WHERE id = v_goal_id;
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'trigger: current_amount UPDATE not blocked'; END IF;

  -- Direct UPDATE of is_completed must be blocked
  v_ok := false;
  BEGIN
    UPDATE public.savings_goals SET is_completed = true WHERE id = v_goal_id;
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'trigger: is_completed UPDATE not blocked'; END IF;

  -- Cosmetic UPDATEs (name/emoji) must still work
  UPDATE public.savings_goals SET name = 'Renamed', emoji = '🚀' WHERE id = v_goal_id;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'PASS: trigger blocks current_amount + is_completed, allows cosmetic edits';
END $t$;

-- ---------------------------------------------------------------------
-- process_companion_xp: under cap success
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_res JSONB;
BEGIN
  -- Wipe any prior audit events for this user today (Rome window)
  DELETE FROM public.security_audit_log
   WHERE user_id = v_uid AND action = 'xp_granted'
     AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';

  PERFORM pg_temp.become(v_uid);
  v_res := public.process_companion_xp(10, 5, NULL);
  PERFORM pg_temp.reset_role();

  IF (v_res->>'status') <> 'ok' THEN RAISE EXCEPTION 'xp under-cap: %', v_res; END IF;
  RAISE NOTICE 'PASS: process_companion_xp under daily caps';
END $t$;

-- ---------------------------------------------------------------------
-- process_companion_xp: 60-call cap rejects 61st
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  -- Seed exactly 60 events with zero deltas (call cap only)
  INSERT INTO public.security_audit_log (user_id, action, payload)
  SELECT v_uid, 'xp_granted', jsonb_build_object('fxp_delta',0,'bxp_delta',0)
    FROM generate_series(1, 60);

  PERFORM pg_temp.become(v_uid);
  BEGIN
    PERFORM public.process_companion_xp(1, 0, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Limite giornaliero XP%' THEN v_ok := true; END IF;
  END;
  PERFORM pg_temp.reset_role();

  IF NOT v_ok THEN RAISE EXCEPTION 'xp 60-call cap not enforced'; END IF;
  RAISE NOTICE 'PASS: process_companion_xp 60-call/day cap';
END $t$;

-- ---------------------------------------------------------------------
-- process_companion_xp: FXP sum cap (1500)
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  INSERT INTO public.security_audit_log (user_id, action, payload)
  VALUES
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',500,'bxp_delta',0)),
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',500,'bxp_delta',0)),
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',500,'bxp_delta',0));
  -- already 1500 FXP today

  PERFORM pg_temp.become(v_uid);
  BEGIN
    PERFORM public.process_companion_xp(1, 0, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%FXP%' THEN v_ok := true; END IF;
  END;
  PERFORM pg_temp.reset_role();

  IF NOT v_ok THEN RAISE EXCEPTION 'xp FXP cap not enforced'; END IF;
  RAISE NOTICE 'PASS: process_companion_xp daily FXP sum cap (1500)';
END $t$;

-- ---------------------------------------------------------------------
-- process_companion_xp: BXP sum cap (600)
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  INSERT INTO public.security_audit_log (user_id, action, payload)
  VALUES
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',0,'bxp_delta',200)),
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',0,'bxp_delta',200)),
    (v_uid, 'xp_granted', jsonb_build_object('fxp_delta',0,'bxp_delta',200));

  PERFORM pg_temp.become(v_uid);
  BEGIN
    PERFORM public.process_companion_xp(0, 1, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%BXP%' THEN v_ok := true; END IF;
  END;
  PERFORM pg_temp.reset_role();

  IF NOT v_ok THEN RAISE EXCEPTION 'xp BXP cap not enforced'; END IF;
  RAISE NOTICE 'PASS: process_companion_xp daily BXP sum cap (600)';
END $t$;

-- ---------------------------------------------------------------------
-- process_companion_xp: input-range validation still enforced
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_ok BOOLEAN;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  PERFORM pg_temp.become(v_uid);

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(501, 0, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'fxp>500 not rejected'; END IF;

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(0, 201, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'bxp>200 not rejected'; END IF;

  v_ok := false;
  BEGIN PERFORM public.process_companion_xp(-1, 0, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'negative fxp not rejected'; END IF;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'PASS: process_companion_xp input range validation';
END $t$;

-- ---------------------------------------------------------------------
-- Daily cap reset: events from BEFORE today's Europe/Rome midnight are not counted
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_rome_midnight TIMESTAMPTZ;
  v_res JSONB;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  v_rome_midnight := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';

  -- 100 huge xp_granted events 1 second BEFORE the Rome reset boundary
  INSERT INTO public.security_audit_log (user_id, action, payload, created_at)
  SELECT v_uid, 'xp_granted',
         jsonb_build_object('fxp_delta',500,'bxp_delta',200),
         v_rome_midnight - INTERVAL '1 second'
    FROM generate_series(1, 100);

  PERFORM pg_temp.become(v_uid);
  v_res := public.process_companion_xp(1, 1, NULL);
  PERFORM pg_temp.reset_role();

  IF (v_res->>'status') <> 'ok' THEN
    RAISE EXCEPTION 'reset BEFORE: pre-midnight events leaked into today: %', v_res;
  END IF;
  RAISE NOTICE 'PASS: pre-Rome-midnight events do not count toward today''s cap';
END $t$;

-- ---------------------------------------------------------------------
-- Daily cap reset: events AFTER today's Europe/Rome midnight ARE counted
-- ---------------------------------------------------------------------
DO $t$
DECLARE
  v_uid UUID := '11111111-1111-1111-1111-111111111111';
  v_rome_midnight TIMESTAMPTZ;
  v_ok BOOLEAN := false;
BEGIN
  DELETE FROM public.security_audit_log WHERE user_id = v_uid AND action = 'xp_granted';
  v_rome_midnight := (date_trunc('day', now() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';

  -- 60 events 1 second AFTER Rome midnight (still today in Rome) — fills call cap
  INSERT INTO public.security_audit_log (user_id, action, payload, created_at)
  SELECT v_uid, 'xp_granted',
         jsonb_build_object('fxp_delta',0,'bxp_delta',0),
         v_rome_midnight + INTERVAL '1 second'
    FROM generate_series(1, 60);

  PERFORM pg_temp.become(v_uid);
  BEGIN
    PERFORM public.process_companion_xp(1, 0, NULL);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Limite giornaliero%' THEN v_ok := true; END IF;
  END;
  PERFORM pg_temp.reset_role();

  IF NOT v_ok THEN RAISE EXCEPTION 'reset AFTER: post-midnight events not counted toward cap'; END IF;
  RAISE NOTICE 'PASS: post-Rome-midnight events count toward today''s cap';
END $t$;

ROLLBACK;
