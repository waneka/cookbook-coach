-- Migration: Make meal_plan_id optional and add user_id to meal_plan_items
-- This allows meal plan items to exist independently (not tied to a named plan)

-- Add user_id column to meal_plan_items
ALTER TABLE public.meal_plan_items
  ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate user_id from existing meal_plans
UPDATE public.meal_plan_items mpi
SET user_id = mp.user_id
FROM public.meal_plans mp
WHERE mpi.meal_plan_id = mp.id;

-- Make user_id NOT NULL after populating
ALTER TABLE public.meal_plan_items
  ALTER COLUMN user_id SET NOT NULL;

-- Make meal_plan_id nullable
ALTER TABLE public.meal_plan_items
  ALTER COLUMN meal_plan_id DROP NOT NULL;

-- Update the foreign key to allow NULL while keeping CASCADE on delete
ALTER TABLE public.meal_plan_items
  DROP CONSTRAINT meal_plan_items_meal_plan_id_fkey;

ALTER TABLE public.meal_plan_items
  ADD CONSTRAINT meal_plan_items_meal_plan_id_fkey
  FOREIGN KEY (meal_plan_id)
  REFERENCES public.meal_plans(id)
  ON DELETE CASCADE;

-- Add index on user_id for performance
CREATE INDEX IF NOT EXISTS meal_plan_items_user_id_idx ON public.meal_plan_items(user_id);

-- Add combined index for date range queries
CREATE INDEX IF NOT EXISTS meal_plan_items_user_date_idx ON public.meal_plan_items(user_id, date);

-- Update RLS policies to use user_id for ownership
DROP POLICY IF EXISTS "Allow authenticated meal plan item operations" ON public.meal_plan_items;

CREATE POLICY "Users can view own meal plan items"
  ON public.meal_plan_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = meal_plan_items.user_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own meal plan items"
  ON public.meal_plan_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = meal_plan_items.user_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own meal plan items"
  ON public.meal_plan_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = meal_plan_items.user_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own meal plan items"
  ON public.meal_plan_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = meal_plan_items.user_id
      AND u.clerk_id = auth.uid()::text
    )
  );
