-- =====================================================
-- Cookbook Coach - Initial Database Schema
-- =====================================================
-- This migration creates all tables, indexes, and RLS policies
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Synced from Clerk via webhooks

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON public.users(clerk_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- =====================================================
-- 2. RECIPES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  source_url text,
  prep_time_minutes int,
  cook_time_minutes int,
  servings int,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  image_url text,
  nutrition_info jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS recipes_tags_idx ON public.recipes USING gin(tags);
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON public.recipes(created_at DESC);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recipes"
  ON public.recipes
  FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = recipes.user_id));

CREATE POLICY "Users can insert own recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = recipes.user_id));

CREATE POLICY "Users can update own recipes"
  ON public.recipes
  FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = recipes.user_id));

CREATE POLICY "Users can delete own recipes"
  ON public.recipes
  FOR DELETE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = recipes.user_id));

CREATE POLICY "Anyone can view public recipes"
  ON public.recipes
  FOR SELECT
  USING (is_public = true);

-- =====================================================
-- 3. MEAL PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  dietary_requirements jsonb DEFAULT '{}'::jsonb,
  ai_conversation_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_dates_idx ON public.meal_plans(start_date, end_date);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meal plans"
  ON public.meal_plans
  FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = meal_plans.user_id));

CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = meal_plans.user_id));

CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans
  FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = meal_plans.user_id));

CREATE POLICY "Users can delete own meal plans"
  ON public.meal_plans
  FOR DELETE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = meal_plans.user_id));

-- =====================================================
-- 4. MEAL PLAN ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings int DEFAULT 1,
  notes text,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS meal_plan_items_plan_id_idx ON public.meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS meal_plan_items_recipe_id_idx ON public.meal_plan_items(recipe_id);
CREATE INDEX IF NOT EXISTS meal_plan_items_date_idx ON public.meal_plan_items(date);

-- Enable RLS
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from meal_plans)
CREATE POLICY "Users can view own meal plan items"
  ON public.meal_plan_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      INNER JOIN public.users u ON mp.user_id = u.id
      WHERE mp.id = meal_plan_items.meal_plan_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own meal plan items"
  ON public.meal_plan_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      INNER JOIN public.users u ON mp.user_id = u.id
      WHERE mp.id = meal_plan_items.meal_plan_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own meal plan items"
  ON public.meal_plan_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      INNER JOIN public.users u ON mp.user_id = u.id
      WHERE mp.id = meal_plan_items.meal_plan_id
      AND u.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own meal plan items"
  ON public.meal_plan_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      INNER JOIN public.users u ON mp.user_id = u.id
      WHERE mp.id = meal_plan_items.meal_plan_id
      AND u.clerk_id = auth.uid()::text
    )
  );

-- =====================================================
-- 5. SHOPPING LISTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS shopping_lists_meal_plan_id_idx ON public.shopping_lists(meal_plan_id);
CREATE INDEX IF NOT EXISTS shopping_lists_status_idx ON public.shopping_lists(status);

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shopping lists"
  ON public.shopping_lists
  FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = shopping_lists.user_id));

CREATE POLICY "Users can insert own shopping lists"
  ON public.shopping_lists
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = shopping_lists.user_id));

CREATE POLICY "Users can update own shopping lists"
  ON public.shopping_lists
  FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = shopping_lists.user_id));

CREATE POLICY "Users can delete own shopping lists"
  ON public.shopping_lists
  FOR DELETE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = shopping_lists.user_id));

-- =====================================================
-- 6. AI CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_meal_plan_id_idx ON public.ai_conversations(meal_plan_id);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = ai_conversations.user_id));

CREATE POLICY "Users can insert own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = ai_conversations.user_id));

CREATE POLICY "Users can update own conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = ai_conversations.user_id));

CREATE POLICY "Users can delete own conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = ai_conversations.user_id));

-- =====================================================
-- 7. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. HELPER FUNCTIONS (Optional)
-- =====================================================

-- Function to get user_id from clerk_id
CREATE OR REPLACE FUNCTION public.get_user_id_from_clerk(clerk_user_id text)
RETURNS uuid AS $$
  SELECT id FROM public.users WHERE clerk_id = clerk_user_id LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables, indexes, RLS policies, and triggers created!
