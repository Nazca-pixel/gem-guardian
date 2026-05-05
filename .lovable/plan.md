# Server-Authoritative Game Progression

Move all XP/level/streak/challenge writes into trusted SECURITY DEFINER RPCs so the existing anti-cheat triggers stop silently breaking core gameplay. The current `block_companion_stat_writes` trigger blocks every `authenticated`-role write to `fxp/bxp/level/current_streak/longest_streak`, which means level-ups, BXP gains, streak updates, daily check-ins, and challenge rewards currently fail. After this change all stat mutations flow through validated RPCs.

## 1. Database migration

Create one migration adding 3 RPCs + 1 trigger function. All RPCs: `SECURITY DEFINER`, `SET search_path = public`, `REVOKE EXECUTE ... FROM PUBLIC, anon`, `GRANT EXECUTE ... TO authenticated`.

### `process_companion_xp(p_fxp_delta INT DEFAULT 0, p_bxp_delta INT DEFAULT 0, p_mood TEXT DEFAULT NULL)` → `JSONB`
- Auth: `auth.uid()` required.
- Validate ranges: `p_fxp_delta` in [0, 500], `p_bxp_delta` in [0, 200]. Reject negatives and out-of-range.
- `SELECT ... FOR UPDATE` on caller's `companion_animals` row.
- Run level-up loop: threshold per level = `level * 100`; while `new_fxp >= threshold` subtract and increment level (count `levels_gained`).
- Update `fxp`, `bxp`, `level`, and `mood` (only if `p_mood` not null and in allowed set).
- `PERFORM log_security_event(uid, 'xp_granted', jsonb_build_object('fxp_delta', p_fxp_delta, 'bxp_delta', p_bxp_delta, 'levels_gained', levels_gained, 'new_level', new_level))`.
- Return `{status, new_fxp, new_bxp, new_level, levels_gained, new_mood}`.

### `update_companion_streak(p_action TEXT)` → `JSONB`
- Accepts `'checkin'` or `'reset'`.
- For `checkin`: lock companion row; if `last_checkin_date = CURRENT_DATE` return `{status:'already_checked_in'}`; if `last_checkin_date = CURRENT_DATE - 1` increment streak else reset to 1; update `longest_streak = GREATEST(longest_streak, current_streak)`; set `last_checkin_date = CURRENT_DATE`, `last_activity_date = CURRENT_DATE`, `checkin_streak` mirrored.
- For `reset`: zero `current_streak`.
- Log `'streak_updated'`.
- Return `{status, current_streak, longest_streak, last_checkin_date}`.

### `complete_challenge(p_challenge_id TEXT, p_progress INT)` → `JSONB`
Note: actual `user_challenges.challenge_id` is `TEXT`, columns are `progress`/`target`/`fxp_reward`/`bxp_reward` (not the names suggested in the request).
- Look up the row by `(user_id = auth.uid(), challenge_id = p_challenge_id, week_start = current week Monday)` `FOR UPDATE`.
- Reject if `p_progress < 0` or `p_progress > target` (clamp to target).
- If already completed, return `{status:'already_completed'}`.
- Update `progress = LEAST(p_progress, target)`. If `progress >= target`, set `is_completed = true`, `completed_at = now()`, then `PERFORM process_companion_xp(fxp_reward, bxp_reward, 'excited')`.
- Log `'challenge_progress'` (and `'challenge_completed'` when applicable).
- Return `{status, progress, is_completed, fxp_awarded, bxp_awarded}`.

### `block_challenge_cheating()` trigger function (replace existing)
The current body only blocks reward field tampering. Strengthen it: on `BEFORE UPDATE` when `current_user = 'authenticated'`, raise if:
- `NEW.is_completed = true AND OLD.is_completed = false` (clients cannot self-complete), OR
- `NEW.progress > NEW.target`, OR
- any of `fxp_reward`, `bxp_reward`, `completed_at` changed.

The existing duplicate trigger `block_challenge_cheating` is dropped; only `block_challenge_cheating_trg` remains.

## 2. Client refactor

No UI/visual changes. Keep all React Query invalidations exactly as today.

### `src/hooks/useLevelUp.ts`
- `processLevelUp`: remove the JS level-loop and the direct `update({ level, fxp, mood })`. Call `supabase.rpc('process_companion_xp', { p_fxp_delta: fxpToAdd, p_mood: 'happy' })`. Read `new_level`, `new_fxp`, `levels_gained` from the returned JSON. Keep the badge-award block (uses `award_badge` RPC already). If `levels_gained > 0`, optionally call again with `p_mood: 'excited'` — simpler: send mood based on a pre-check, or skip mood update.
- `processBxpUpdate`: remove `update({ bxp })`. Call `supabase.rpc('process_companion_xp', { p_bxp_delta: bxpToAdd })`. Use `new_bxp` from response. Keep accessory unlock loop (already uses `unlock_accessory` RPC).

### `src/hooks/useStreak.ts`
- Replace the `update({ current_streak, longest_streak, last_activity_date })` block with `supabase.rpc('update_companion_streak', { p_action: 'checkin' })`. Map response to existing `StreakUpdate` shape. Keep badge milestone check.

### `src/hooks/useDailyCheckin.ts`
- Replace the `update({ bxp, last_checkin_date, checkin_streak })` call with two RPC calls:
  1. `supabase.rpc('update_companion_streak', { p_action: 'checkin' })` → gives `current_streak`.
  2. `supabase.rpc('process_companion_xp', { p_bxp_delta: calculateBxpReward(newStreak) })` → gives `new_bxp`.
- Keep the `hasCheckedInToday` short-circuit and surrounding milestone/frugal logic.

### `src/hooks/useWeeklyChallenges.ts`
- `useUpdateChallengeProgress`: remove the manual `update(user_challenges)` and the follow-up `update(companion_animals)`. Single call: `supabase.rpc('complete_challenge', { p_challenge_id: challengeId, p_progress: progress })`. Derive `justCompleted` from response (`is_completed === true && fxp_awarded > 0`). Keep both query invalidations.

### `src/hooks/useChallengeProgress.ts`
- No structural change — it already routes through `useUpdateChallengeProgress`, so it inherits the RPC migration automatically.

## 3. Out of scope / not changed
- `src/integrations/supabase/client.ts`, `types.ts`, `.env`: untouched.
- All UI components, modals, and toasts: untouched.
- `award_badge`, `unlock_accessory`, `checkout_subscription`, `check_tier_limits`, audit log: already in place — reused, not modified.

## 4. Security memory update
After the migration applies, update `@security-memory` to record:
- All companion stat mutations now flow through `process_companion_xp` / `update_companion_streak`.
- Challenge completion now flows through `complete_challenge`; clients can no longer self-mark `is_completed`.
- The two open scanner findings (`companion_stat_writes`, `challenge_completion`) are remediated.

## Technical details (for review)

```text
client hook                RPC                        protected columns written
─────────────────────────  ─────────────────────────  ─────────────────────────────
useLevelUp.processLevelUp  process_companion_xp       fxp, level, mood
useLevelUp.processBxpUpd.  process_companion_xp       bxp
useStreak                  update_companion_streak    current_streak, longest_streak,
                                                      last_activity_date
useDailyCheckin            update_companion_streak    + bxp via process_companion_xp
                           + process_companion_xp
useWeeklyChallenges        complete_challenge         progress, is_completed,
                                                      completed_at (+ fxp/bxp via
                                                      process_companion_xp)
```

Trigger `block_companion_stat_writes` stays in place and continues to block any direct PostgREST write — RPCs bypass it because they execute as the function owner, not `authenticated`.