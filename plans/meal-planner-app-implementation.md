# Meal Planner App - Implementation Plan

## Project Overview

A Next.js-based AI-powered meal planning application that helps users create weekly meal plans based on dietary requirements, save recipes, generate shopping lists, and interact with an AI coach for personalized meal planning assistance.

## Tech Stack

### Core Framework
- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest React features
- **TypeScript** - Type safety throughout

### Authentication
- **Clerk** - User authentication and management
  - Social login support (Google, etc.)
  - Email/password authentication
  - User profile management
  - Session handling

### Database
- **Supabase** (PostgreSQL)
  - Recipes storage
  - Meal plans
  - User preferences
  - Shopping lists
  - Real-time subscriptions for collaborative features (stretch)

### UI/UX
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible primitives

### AI Integration
- **Vercel AI SDK** - AI orchestration and streaming
  - `@ai-sdk/anthropic` - Claude provider integration
  - `@ai-sdk/react` - React hooks for chat UIs
  - Conversational meal planning coach
  - Recipe generation/modification
  - Dietary constraint adherence
  - Ingredient substitutions
  - Built-in streaming and tool calling support

### Additional Libraries
- **Zod** - Schema validation (also used for AI tool schemas)
- **React Hook Form** - Form handling
- **next-themes** - Dark mode support
- **sonner** - Toast notifications

## Database Schema

### Users Table
```sql
-- Managed by Clerk, synced via webhooks
create table users (
  id uuid primary key references auth.users(id),
  clerk_id text unique not null,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Recipes Table
```sql
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  source_url text, -- Original URL if scraped
  prep_time_minutes int,
  cook_time_minutes int,
  servings int,
  ingredients jsonb not null, -- Array of {item, amount, unit, notes}
  instructions jsonb not null, -- Array of step strings
  tags text[], -- e.g., ['vegetarian', 'gluten-free', 'quick']
  image_url text,
  nutrition_info jsonb, -- Optional: calories, protein, etc.
  is_public boolean default false, -- For sharing recipes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index recipes_user_id_idx on recipes(user_id);
create index recipes_tags_idx on recipes using gin(tags);
```

### Meal Plans Table
```sql
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null, -- e.g., "Week of Dec 15, 2025"
  start_date date not null,
  end_date date not null,
  dietary_requirements jsonb, -- {restrictions: [], preferences: [], goals: []}
  ai_conversation_summary text, -- Summary of AI chat that created this plan
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index meal_plans_user_id_idx on meal_plans(user_id);
create index meal_plans_dates_idx on meal_plans(start_date, end_date);
```

### Meal Plan Items Table
```sql
create table meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  date date not null,
  meal_type text not null, -- 'breakfast', 'lunch', 'dinner', 'snack'
  servings int default 1,
  notes text,
  position int default 0, -- For ordering
  created_at timestamptz default now()
);

create index meal_plan_items_plan_id_idx on meal_plan_items(meal_plan_id);
create index meal_plan_items_recipe_id_idx on meal_plan_items(recipe_id);
```

### Shopping Lists Table
```sql
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  name text not null,
  items jsonb not null, -- [{ingredient, amount, unit, checked, category}]
  status text default 'active', -- 'active', 'completed', 'archived'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index shopping_lists_user_id_idx on shopping_lists(user_id);
create index shopping_lists_meal_plan_id_idx on shopping_lists(meal_plan_id);
```

### AI Conversations Table
```sql
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  meal_plan_id uuid references meal_plans(id) on delete set null,
  messages jsonb not null, -- Array of {role, content, timestamp}
  context jsonb, -- Current dietary prefs, constraints discussed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index ai_conversations_user_id_idx on ai_conversations(user_id);
```

## Project Structure

```
cookbook-coach/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Dashboard layout with nav
│   │   ├── page.tsx                      # Dashboard home
│   │   ├── recipes/
│   │   │   ├── page.tsx                  # Recipe library
│   │   │   ├── new/page.tsx              # Add recipe (manual or URL)
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Recipe detail view
│   │   │       ├── edit/page.tsx         # Edit recipe
│   │   │       └── cook/page.tsx         # Cook mode
│   │   ├── meal-plans/
│   │   │   ├── page.tsx                  # Meal plan list
│   │   │   ├── new/page.tsx              # Create new meal plan
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Meal plan view
│   │   │       ├── edit/page.tsx         # Edit meal plan
│   │   │       └── chat/page.tsx         # AI chat for this plan
│   │   ├── shopping-lists/
│   │   │   ├── page.tsx                  # Shopping list management
│   │   │   └── [id]/page.tsx             # Individual list
│   │   └── coach/
│   │       └── page.tsx                  # AI coach chat (general)
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── clerk/route.ts            # Clerk user sync
│   │   ├── ai/
│   │   │   ├── chat/route.ts             # AI conversation endpoint
│   │   │   └── recipe-scraper/route.ts   # Scrape recipe from URL
│   │   ├── recipes/
│   │   │   └── route.ts                  # Recipe CRUD
│   │   ├── meal-plans/
│   │   │   └── route.ts                  # Meal plan CRUD
│   │   └── shopping-lists/
│   │       └── route.ts                  # Shopping list CRUD
│   ├── layout.tsx                        # Root layout with ClerkProvider
│   └── page.tsx                          # Landing page
├── components/
│   ├── ui/                               # shadcn/ui components
│   ├── recipes/
│   │   ├── recipe-card.tsx
│   │   ├── recipe-form.tsx
│   │   ├── recipe-detail.tsx
│   │   ├── ingredient-list.tsx
│   │   ├── cook-mode-view.tsx            # Step-by-step cook mode
│   │   └── url-scraper.tsx
│   ├── meal-plans/
│   │   ├── meal-plan-calendar.tsx        # Week view
│   │   ├── meal-plan-form.tsx
│   │   ├── meal-slot.tsx                 # Individual meal slot
│   │   └── drag-drop-recipe.tsx
│   ├── shopping-lists/
│   │   ├── shopping-list-view.tsx
│   │   ├── ingredient-item.tsx
│   │   └── export-buttons.tsx
│   ├── ai/
│   │   ├── chat-interface.tsx            # Reusable chat UI
│   │   ├── message-bubble.tsx
│   │   ├── suggestions.tsx               # Quick actions
│   │   └── meal-plan-preview.tsx         # AI-suggested plan preview
│   └── navigation/
│       ├── navbar.tsx
│       └── sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser client
│   │   ├── server.ts                     # Server client
│   │   └── middleware.ts                 # Auth middleware
│   ├── ai/
│   │   ├── anthropic.ts                  # Claude API wrapper
│   │   ├── prompts.ts                    # System prompts
│   │   └── streaming.ts                  # Streaming utilities
│   ├── scrapers/
│   │   └── recipe-parser.ts              # Parse recipe from URL
│   ├── utils/
│   │   ├── date.ts                       # Date helpers
│   │   ├── nutrition.ts                  # Nutrition calculations
│   │   └── shopping-list.ts              # List aggregation logic
│   └── validations/
│       ├── recipe.ts                     # Zod schemas
│       ├── meal-plan.ts
│       └── shopping-list.ts
├── hooks/
│   ├── use-recipes.ts                    # Recipe queries/mutations
│   ├── use-meal-plans.ts
│   ├── use-shopping-lists.ts
│   └── use-ai-chat.ts
├── types/
│   ├── recipe.ts
│   ├── meal-plan.ts
│   ├── shopping-list.ts
│   └── ai.ts
├── docs/                                 # Living documentation
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-routes.md
│   ├── ai-integration.md
│   └── component-guide.md
├── plans/                                # Implementation plans
│   └── meal-planner-app-implementation.md (this file)
└── middleware.ts                         # Clerk middleware
```

## Implementation Phases

### Phase 1: Foundation Setup
**Goal:** Get authentication, database, and basic UI framework in place

#### Tasks:
1. **Environment Setup**
   - Install dependencies (Clerk, Supabase, shadcn/ui, Anthropic SDK)
   - Configure environment variables
   - Set up Clerk authentication
   - Initialize Supabase project and get credentials

2. **Database Setup**
   - Create Supabase project
   - Run migrations to create tables
   - Set up Row Level Security (RLS) policies
   - Create database types generation

3. **Authentication Flow**
   - Implement Clerk middleware
   - Create sign-in/sign-up pages
   - Set up Clerk webhook for user sync to Supabase
   - Protect dashboard routes

4. **UI Foundation**
   - Install and configure shadcn/ui
   - Set up Tailwind config
   - Create base layout components (navbar, sidebar)
   - Implement dark mode with next-themes
   - Add toast notifications (Sonner)

**Deliverable:** Working auth flow, users can sign up/in and see an empty dashboard

---

### Phase 2: Recipe Management
**Goal:** Users can add, view, edit, and delete recipes

#### Tasks:
1. **Recipe Database & API**
   - Implement recipe CRUD API routes
   - Add server actions for recipe operations
   - Set up Supabase RLS for recipes
   - Create type-safe recipe queries with TypeScript

2. **Recipe Components**
   - Build recipe form (manual input)
   - Create recipe card for grid/list view
   - Build recipe detail page
   - Implement recipe editing
   - Add image upload (Supabase Storage)

3. **Recipe Library Page**
   - Build recipe listing with search/filter
   - Add tag-based filtering
   - Implement sorting (date, name, cook time)
   - Add pagination or infinite scroll

4. **URL Recipe Scraper (Nice to Have)**
   - Research recipe microdata/schema.org parsing
   - Build parser for common recipe sites
   - Create URL input flow
   - Handle errors gracefully

**Deliverable:** Full recipe CRUD functionality, users can manage their recipe library

---

### Phase 3: AI Coach Integration
**Goal:** Chat interface that understands user dietary needs and suggests meal plans

#### Tasks:
1. **AI Infrastructure**
   - Set up Anthropic API client
   - Create streaming endpoint for chat
   - Design system prompts for meal planning
   - Implement conversation persistence

2. **Chat Interface**
   - Build chat UI with message bubbles
   - Implement streaming responses
   - Add loading states and error handling
   - Create suggested prompts/quick actions

3. **AI Context Management**
   - Store user dietary preferences
   - Pass recipe library context to AI
   - Maintain conversation history
   - Implement context summarization for long chats

4. **AI Capabilities**
   - Understand dietary restrictions (vegan, keto, allergies, etc.)
   - Suggest recipes from user's library
   - Generate new recipe ideas
   - Modify existing recipes
   - Create balanced meal plans

**Deliverable:** Working AI coach that can discuss meal planning and understand user preferences

---

### Phase 4: Meal Planning
**Goal:** Create and manage weekly meal plans with AI assistance

#### Tasks:
1. **Meal Plan Data Layer**
   - Implement meal plan CRUD operations
   - Create meal plan item associations
   - Build API routes and server actions

2. **Meal Plan UI**
   - Create weekly calendar view
   - Build meal slot components (breakfast, lunch, dinner)
   - Implement drag-and-drop recipe assignment
   - Add manual meal entry

3. **AI-Assisted Planning**
   - Connect AI chat to meal plan creation
   - Allow AI to suggest complete meal plans
   - Preview AI-suggested plans before saving
   - Modify plans through conversation

4. **Meal Plan Management**
   - View past/future meal plans
   - Duplicate/template functionality
   - Edit/delete meal plans
   - Share meal plans (stretch)

**Deliverable:** Users can create meal plans manually or with AI assistance

---

### Phase 5: Shopping Lists
**Goal:** Automatically generate shopping lists from meal plans

#### Tasks:
1. **Shopping List Generation**
   - Aggregate ingredients from meal plan
   - Consolidate duplicate ingredients
   - Organize by category (produce, dairy, meat, etc.)
   - Handle unit conversions

2. **Shopping List UI**
   - Display categorized ingredient list
   - Checkbox for marking items as purchased
   - Edit quantities and add custom items
   - Delete/clear items

3. **Shopping List Management**
   - Create shopping list from meal plan
   - Save/archive shopping lists
   - View shopping history
   - Print-friendly view

4. **Export Features**
   - Export as text/PDF
   - Copy to clipboard
   - Instacart integration (stretch goal - research Instacart API/URL format)

**Deliverable:** Automated shopping list generation with export capabilities

---

### Phase 6: Cook Mode (Stretch)
**Goal:** Enhanced cooking experience with step-by-step instructions

#### Tasks:
1. **Cook Mode UI**
   - Full-screen step-by-step view
   - Large text for readability
   - Ingredient list always visible
   - Timer integration for steps

2. **Navigation**
   - Previous/Next step buttons
   - Progress indicator
   - Voice commands (stretch - Web Speech API)
   - Hands-free mode considerations

3. **Features**
   - Built-in timers per step
   - Ingredient highlighting
   - Notes/substitutions display
   - Mark steps as complete

**Deliverable:** Immersive cooking experience with easy-to-follow instructions

---

### Phase 7: Polish & Optimization
**Goal:** Production-ready app with great UX

#### Tasks:
1. **Performance**
   - Implement proper loading states
   - Add skeleton screens
   - Optimize images
   - Add caching strategies

2. **Error Handling**
   - Graceful error states
   - Retry mechanisms
   - User-friendly error messages
   - Logging and monitoring

3. **Mobile Responsiveness**
   - Test on various screen sizes
   - Optimize touch interactions
   - Ensure cook mode works on tablets
   - PWA considerations

4. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels
   - Color contrast

5. **Documentation**
   - Update living docs
   - API documentation
   - User guide
   - Deployment guide

**Deliverable:** Polished, production-ready application

---

## AI System Prompts

### Meal Planning Coach System Prompt
```
You are a helpful meal planning assistant. You help users create personalized meal plans based on their dietary preferences, restrictions, and goals.

Context:
- User's saved recipes: {recipeLibrary}
- Dietary restrictions: {restrictions}
- Preferences: {preferences}
- Family size: {familySize}

Your capabilities:
1. Suggest recipes from the user's library that match their requirements
2. Recommend modifications to existing recipes
3. Generate new recipe ideas when needed
4. Create balanced weekly meal plans
5. Consider variety, nutrition, and practicality

Guidelines:
- Always respect dietary restrictions (allergies, vegan, etc.)
- Balance macros and variety throughout the week
- Consider prep time and complexity
- Reuse ingredients across meals to minimize waste
- Ask clarifying questions when requirements are unclear

When suggesting a meal plan, provide:
- Recipe name (from library or new)
- Which day and meal type
- Any modifications needed
- Why it fits their requirements
```

### Recipe Modification System Prompt
```
You are a recipe modification assistant. Help users adapt recipes to meet dietary requirements, substitute ingredients, or adjust serving sizes.

When modifying recipes:
1. Maintain the spirit and flavor profile of the original
2. Only suggest substitutions that work chemically/texturally
3. Explain why substitutions work
4. Adjust cooking times/temps if needed
5. Warn about major flavor/texture changes

Consider:
- Dietary restrictions (gluten-free, vegan, keto, etc.)
- Ingredient availability
- Skill level
- Equipment requirements
```

## Security Considerations

### Row Level Security (RLS) Policies

All user data must be protected with RLS policies:

```sql
-- Users can only see their own recipes
create policy "Users can view own recipes"
  on recipes for select
  using (auth.uid() = user_id);

create policy "Users can create own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recipes"
  on recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete own recipes"
  on recipes for delete
  using (auth.uid() = user_id);

-- Similar policies for meal_plans, shopping_lists, ai_conversations
```

### API Security
- All API routes check authentication via Clerk
- Server actions verify user ownership before operations
- Input validation with Zod schemas
- Rate limiting on AI endpoints
- Sanitize user input for XSS prevention

### Environment Variables
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (used by Vercel AI SDK)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Testing Strategy

### Unit Tests
- Utility functions (date helpers, nutrition calcs, shopping list aggregation)
- Zod schema validation
- Recipe parsing logic

### Integration Tests
- API routes
- Server actions
- Database queries

### E2E Tests
- User authentication flow
- Recipe CRUD operations
- Meal plan creation
- AI chat interaction
- Shopping list generation

### Tools
- Vitest + React Testing Library
- Playwright for E2E
- MSW for API mocking

## Deployment

### Platform
- Vercel (recommended for Next.js)
- Environment variables configured
- Preview deployments for PRs

### Monitoring
- Vercel Analytics
- Error tracking (Sentry)
- AI usage monitoring
- Database query performance

## Future Enhancements

1. **Social Features**
   - Share recipes publicly
   - Follow other users
   - Community recipe ratings

2. **Advanced AI**
   - Image-based recipe recognition
   - Nutritional analysis
   - Meal prep batching suggestions

3. **Integrations**
   - Calendar sync (Google Calendar)
   - Grocery delivery APIs (Instacart, Amazon Fresh)
   - Fitness app integration (MyFitnessPal)

4. **Mobile App**
   - React Native version
   - Offline mode
   - Barcode scanning

5. **Family Features**
   - Multiple user profiles per account
   - Kid-friendly recipe filters
   - Leftover tracking

## Success Metrics

- User can create an account and add first recipe in < 5 minutes
- AI chat response time < 2 seconds
- Meal plan creation time < 10 minutes with AI assistance
- 90%+ of recipe URLs parse successfully
- Mobile-responsive on all screen sizes
- Accessibility score > 90 (Lighthouse)

## Questions to Resolve

1. Recipe URL parsing - which sites to prioritize?
2. Instacart integration - API vs. URL generation?
3. Image storage limits and optimization strategy
4. AI conversation token limits and cost management
5. Nutritional data source - manual input vs. API integration?
