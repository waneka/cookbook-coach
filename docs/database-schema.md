# Database Schema Documentation

## Overview

Cookbook Coach uses Supabase (PostgreSQL) for data storage with Row Level Security (RLS) policies to ensure users can only access their own data.

## Schema Diagram

```
users
  ├── recipes (1:many)
  ├── meal_plans (1:many)
  │   └── meal_plan_items (1:many)
  │       └── recipes (many:1)
  ├── shopping_lists (1:many)
  │   └── meal_plans (many:1)
  └── ai_conversations (1:many)
      └── meal_plans (many:1, optional)
```

## Tables

### users

Stores user information synced from Clerk via webhooks.

```sql
create table users (
  id uuid primary key references auth.users(id),
  clerk_id text unique not null,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Columns:**
- `id` - UUID, references Supabase auth.users
- `clerk_id` - Unique Clerk user ID for syncing
- `email` - User's email address
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

---

### recipes

Stores user-created or imported recipes.

```sql
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  source_url text,
  prep_time_minutes int,
  cook_time_minutes int,
  servings int,
  ingredients jsonb not null,
  instructions jsonb not null,
  tags text[],
  image_url text,
  nutrition_info jsonb,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index recipes_user_id_idx on recipes(user_id);
create index recipes_tags_idx on recipes using gin(tags);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Owner of the recipe
- `title` - Recipe name
- `description` - Optional recipe description
- `source_url` - Original URL if scraped from web
- `prep_time_minutes` - Preparation time
- `cook_time_minutes` - Cooking time
- `servings` - Number of servings
- `ingredients` - JSONB array of ingredient objects
- `instructions` - JSONB array of instruction steps
- `tags` - Array of tags (e.g., ['vegan', 'quick'])
- `image_url` - URL to recipe image
- `nutrition_info` - JSONB with nutrition data
- `is_public` - Whether recipe can be shared
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Ingredients JSONB Structure:**
```typescript
{
  item: string,
  amount: number,
  unit: string,
  notes?: string
}[]
```

**Instructions JSONB Structure:**
```typescript
string[] // Array of step descriptions
```

**Nutrition Info JSONB Structure:**
```typescript
{
  calories?: number,
  protein?: number,
  carbs?: number,
  fat?: number,
  fiber?: number
}
```

---

### meal_plans

Stores weekly or custom-period meal plans.

```sql
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  dietary_requirements jsonb,
  ai_conversation_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index meal_plans_user_id_idx on meal_plans(user_id);
create index meal_plans_dates_idx on meal_plans(start_date, end_date);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Owner of the meal plan
- `name` - Meal plan name (e.g., "Week of Dec 15, 2025")
- `start_date` - Plan start date
- `end_date` - Plan end date
- `dietary_requirements` - JSONB with dietary constraints
- `ai_conversation_summary` - Summary of AI chat that created plan
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Dietary Requirements JSONB Structure:**
```typescript
{
  restrictions?: string[], // ['gluten-free', 'dairy-free']
  preferences?: string[], // ['low-carb', 'high-protein']
  goals?: string[], // ['weight-loss', 'muscle-gain']
  allergens?: string[], // ['nuts', 'shellfish']
  calories_target?: number
}
```

---

### meal_plan_items

Individual meals within a meal plan.

```sql
create table meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  date date not null,
  meal_type text not null,
  servings int default 1,
  notes text,
  position int default 0,
  created_at timestamptz default now()
);

create index meal_plan_items_plan_id_idx on meal_plan_items(meal_plan_id);
create index meal_plan_items_recipe_id_idx on meal_plan_items(recipe_id);
```

**Columns:**
- `id` - UUID primary key
- `meal_plan_id` - Parent meal plan
- `recipe_id` - Associated recipe (nullable if deleted)
- `date` - Date of this meal
- `meal_type` - Type: 'breakfast', 'lunch', 'dinner', 'snack'
- `servings` - Number of servings for this meal
- `notes` - Optional notes or modifications
- `position` - Sort order for UI
- `created_at` - Creation timestamp

**Meal Types:**
- `breakfast`
- `lunch`
- `dinner`
- `snack`

---

### shopping_lists

Shopping lists generated from meal plans.

```sql
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  name text not null,
  items jsonb not null,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index shopping_lists_user_id_idx on shopping_lists(user_id);
create index shopping_lists_meal_plan_id_idx on shopping_lists(meal_plan_id);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Owner of the list
- `meal_plan_id` - Source meal plan
- `name` - List name
- `items` - JSONB array of shopping items
- `status` - 'active', 'completed', or 'archived'
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Items JSONB Structure:**
```typescript
{
  ingredient: string,
  amount: number,
  unit: string,
  checked: boolean,
  category: string, // 'produce', 'dairy', 'meat', 'pantry', etc.
  recipe_ids?: string[] // Which recipes need this ingredient
}[]
```

**Categories:**
- `produce`
- `dairy`
- `meat`
- `seafood`
- `pantry`
- `frozen`
- `bakery`
- `beverages`
- `other`

---

### ai_conversations

Stores AI chat conversations for context and history.

```sql
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  meal_plan_id uuid references meal_plans(id) on delete set null,
  messages jsonb not null,
  context jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index ai_conversations_user_id_idx on ai_conversations(user_id);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Owner of the conversation
- `meal_plan_id` - Associated meal plan (if applicable)
- `messages` - JSONB array of chat messages
- `context` - Current conversation context
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Messages JSONB Structure:**
```typescript
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: string
}[]
```

**Context JSONB Structure:**
```typescript
{
  dietary_preferences?: string[],
  current_restrictions?: string[],
  family_size?: number,
  meal_prep_time?: string,
  cooking_skill?: string
}
```

---

## Row Level Security (RLS) Policies

All tables have RLS enabled to ensure users can only access their own data.

### Example RLS Policies for `recipes`

```sql
-- Enable RLS
alter table recipes enable row level security;

-- Users can view their own recipes
create policy "Users can view own recipes"
  on recipes for select
  using (auth.uid() = user_id);

-- Users can insert their own recipes
create policy "Users can create own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

-- Users can update their own recipes
create policy "Users can update own recipes"
  on recipes for update
  using (auth.uid() = user_id);

-- Users can delete their own recipes
create policy "Users can delete own recipes"
  on recipes for delete
  using (auth.uid() = user_id);

-- Public recipes can be viewed by anyone (for sharing feature)
create policy "Anyone can view public recipes"
  on recipes for select
  using (is_public = true);
```

### Similar Policies for Other Tables

Apply similar RLS policies to:
- `meal_plans`
- `meal_plan_items` (via meal_plan_id)
- `shopping_lists`
- `ai_conversations`

---

## Migrations

### Creating Migrations

1. Make schema changes in Supabase SQL Editor
2. Export migration:
   ```bash
   supabase db diff -f migration_name
   ```
3. Commit migration file to version control

### Applying Migrations

```bash
# Local
supabase db reset

# Production
supabase db push
```

---

## Type Generation

Generate TypeScript types from database schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Generate types
supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

### Using Generated Types

```typescript
import { Database } from '@/types/supabase'

type Recipe = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
```

---

## Indexes

Strategic indexes for query performance:

- `recipes_user_id_idx` - Fast user recipe lookups
- `recipes_tags_idx` - GIN index for tag searches
- `meal_plans_user_id_idx` - Fast user meal plan lookups
- `meal_plans_dates_idx` - Date range queries
- `meal_plan_items_plan_id_idx` - Fast meal plan item lookups
- `meal_plan_items_recipe_id_idx` - Recipe usage tracking
- `shopping_lists_user_id_idx` - Fast user list lookups
- `shopping_lists_meal_plan_id_idx` - Meal plan to list relationship
- `ai_conversations_user_id_idx` - Fast conversation history

---

## Common Queries

### Get all recipes for a user

```sql
select * from recipes
where user_id = auth.uid()
order by created_at desc;
```

### Get meal plan with all items

```sql
select
  mp.*,
  json_agg(
    json_build_object(
      'id', mpi.id,
      'date', mpi.date,
      'meal_type', mpi.meal_type,
      'recipe', r
    )
  ) as items
from meal_plans mp
left join meal_plan_items mpi on mp.id = mpi.meal_plan_id
left join recipes r on mpi.recipe_id = r.id
where mp.id = $1
group by mp.id;
```

### Generate shopping list from meal plan

```sql
select
  jsonb_agg(distinct jsonb_build_object(
    'ingredient', ingredient->>'item',
    'amount', (ingredient->>'amount')::numeric,
    'unit', ingredient->>'unit',
    'checked', false,
    'recipe_ids', array_agg(r.id)
  ))
from meal_plans mp
join meal_plan_items mpi on mp.id = mpi.meal_plan_id
join recipes r on mpi.recipe_id = r.id
cross join jsonb_array_elements(r.ingredients) as ingredient
where mp.id = $1;
```

---

## Backup & Recovery

### Automated Backups
- Supabase provides daily automated backups
- Retained for 7 days on free tier, longer on paid plans

### Manual Backup

```bash
# Backup to SQL file
pg_dump postgresql://[connection-string] > backup.sql

# Restore from backup
psql postgresql://[connection-string] < backup.sql
```

---

## Performance Considerations

1. **JSONB Indexes**: Consider adding GIN indexes to JSONB columns if querying nested data frequently
2. **Partial Indexes**: Use for specific query patterns (e.g., active shopping lists)
3. **Foreign Key Constraints**: All set with appropriate cascade/set null behavior
4. **Connection Pooling**: Use Supabase connection pooler for serverless
5. **Query Optimization**: Monitor slow query log in Supabase dashboard
