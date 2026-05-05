# Add Security Audit Log

Create a lightweight, append-only audit trail for sensitive server-side actions (badge awards, XP grants, subscription changes). Direct client writes are blocked; only SECURITY DEFINER functions can insert. Users can read their own audit entries.

## What gets built

### 1. Migration: `security_audit_log` table

```sql
CREATE TABLE public.security_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,      -- e.g. 'badge_awarded', 'xp_granted', 'subscription_changed'
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_audit_log_user_created
  ON public.security_audit_log (user_id, created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit rows
CREATE POLICY "Audit read own"
  ON public.security_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Block direct INSERT/UPDATE/DELETE from any client role.
-- Only SECURITY DEFINER functions (running as the function owner) can write.
CREATE POLICY "Audit no direct insert"
  ON public.security_audit_log FOR INSERT WITH CHECK (false);

CREATE POLICY "Audit no direct update"
  ON public.security_audit_log FOR UPDATE USING (false);

CREATE POLICY "Audit no direct delete"
  ON public.security_audit_log FOR DELETE USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.security_audit_log FROM anon, authenticated;
GRANT  SELECT ON public.security_audit_log TO authenticated;
```

### 2. Internal logger helper

```sql
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

REVOKE EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
```

This helper is callable only from other SECURITY DEFINER functions in the same schema (no external role has EXECUTE).

### 3. Wire logging into existing RPCs

Update these functions to append audit rows on successful sensitive actions:

- **`award_badge(p_badge_id)`** — log `'badge_awarded'` with `{badge_id, badge_name, badge_type}` after the INSERT into `user_badges`.
- **`unlock_accessory(_accessory_id)`** — log `'accessory_unlocked'` with `{accessory_id, bxp_required}` after the INSERT.
- **`checkout_subscription(p_tier, p_payment_intent_id)`** — log `'subscription_changed'` with `{tier, status}` for the free-tier success path (paid still raises today).

Each function's body gets one extra `PERFORM public.log_security_event(...)` call before returning.

## What is NOT changed

- No client/UI changes. No new hooks or pages.
- No changes to RLS on other tables.
- No changes to `client.ts`, `types.ts`, or `.env`.

## Security model

- **Append-only from trusted code:** RLS denies all client INSERT/UPDATE/DELETE. The `WITH CHECK (false)` policies plus revoked grants make tampering impossible from PostgREST.
- **Per-user visibility:** Users can read their own log entries (useful for a future "activity" screen). Cross-user reads require service role.
- **Cascade on user delete:** GDPR-friendly; deleting an auth user removes their audit rows.
- **No PII in payload:** payloads carry IDs and tier names only.

## Update `@security-memory`

Add a section noting:
- `security_audit_log` is append-only, written only by SECURITY DEFINER RPCs via `log_security_event`.
- Users may SELECT their own rows; no client may INSERT/UPDATE/DELETE.
- This is intentional and should not be flagged as "table writable by definer functions".

## Files touched

- New: `supabase/migrations/<timestamp>_security_audit_log.sql` (table + policies + helper + updated RPC bodies).
- Updated: security memory via `security--update_memory`.
