-- Create a secure function for subscription checkout
CREATE OR REPLACE FUNCTION public.checkout_subscription(
  _tier subscription_tier,
  _is_annual boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _expires_at timestamptz;
  _result json;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate expiration
  IF _is_annual THEN
    _expires_at := now() + interval '1 year';
  ELSE
    _expires_at := now() + interval '1 month';
  END IF;

  -- Deactivate existing active subscriptions
  UPDATE subscriptions
  SET is_active = false, updated_at = now()
  WHERE user_id = _user_id AND is_active = true;

  -- Create new subscription
  INSERT INTO subscriptions (user_id, tier, is_annual, expires_at)
  VALUES (_user_id, _tier, _is_annual, _expires_at)
  RETURNING json_build_object(
    'id', id,
    'tier', tier,
    'is_annual', is_annual,
    'expires_at', expires_at,
    'is_active', is_active
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Remove the INSERT policy that allows users to self-assign tiers
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;

-- Remove the UPDATE policy that allows users to modify their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;