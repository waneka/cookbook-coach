-- Fix RLS policies for meal_plan_items to work with Clerk authentication
-- Since we use Clerk (not Supabase Auth), auth.uid() doesn't work
-- We rely on server-side validation in actions instead

DROP POLICY IF EXISTS "Users can view own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can insert own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can update own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can delete own meal plan items" ON public.meal_plan_items;

-- Create permissive policies that allow authenticated operations
-- User ownership is validated in server actions via getUserId()
CREATE POLICY "Allow authenticated meal plan item operations"
  ON public.meal_plan_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
