-- ============================================================
-- Fix 1: Allow reading profiles of providers/businesses publicly
-- (needed for provider detail screen — profile join was blocked by RLS)
-- ============================================================
CREATE POLICY "profiles_select_provider_public"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM providers  WHERE user_id = id)
    OR
    EXISTS (SELECT 1 FROM businesses WHERE user_id = id)
  );

-- ============================================================
-- Fix 2: Disable email confirmation so users can log in
-- immediately after signing up (no confirmation email needed)
-- ============================================================
UPDATE auth.config
SET email_confirm = false
WHERE id = 1;

-- Alternative if the above doesn't work on your Supabase plan:
-- Go to Dashboard → Authentication → Settings →
-- uncheck "Enable email confirmations" → Save
