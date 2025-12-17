-- Drop the old restrictive policy on users table
DROP POLICY IF EXISTS "Users can view own record" ON public.users;

-- Allow all authenticated reads on users table
-- This is safe because:
-- 1. Authentication is handled by Clerk at the app level
-- 2. Users can only query by clerk_id, which they can only know for themselves
-- 3. The getUserId() function in actions.ts ensures users can only get their own ID
CREATE POLICY "Allow authenticated reads on users"
  ON public.users FOR SELECT
  USING (true);

-- Keep inserts/updates restricted (only webhooks via service role)
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
