-- =====================================================
-- Add Dietary Preferences to Users Table
-- =====================================================

-- Add dietary preferences columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS dietary_preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dietary_notes text;

-- Create index for dietary preferences queries
CREATE INDEX IF NOT EXISTS users_dietary_preferences_idx ON public.users USING gin(dietary_preferences);

-- Add comment for documentation
COMMENT ON COLUMN public.users.dietary_preferences IS 'Structured dietary preferences: allergies, diet types, restrictions (e.g., {"allergies": ["nuts", "dairy"], "diets": ["vegetarian"], "restrictions": []})';
COMMENT ON COLUMN public.users.dietary_notes IS 'Free-form dietary guidelines and notes that can be set by user or AI';
