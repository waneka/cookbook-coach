# Getting Started with Cookbook Coach

## Overview

This guide will help you understand the codebase structure and start developing features for Cookbook Coach.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Clerk account (for authentication)
- Supabase account (for database)
- Anthropic API key (for AI features)

## Initial Setup

### 1. Environment Variables

Create a `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

See `database-schema.md` for complete schema. Run migrations in Supabase SQL editor or via CLI.

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure Quick Reference

```
cookbook-coach/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected app pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── recipes/          # Recipe-related components
│   ├── meal-plans/       # Meal planning components
│   └── ai/               # AI chat components
├── lib/                   # Utilities and configuration
│   ├── supabase/         # Database clients
│   ├── ai/               # AI integration
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

## Key Concepts

### Server vs Client Components

- **Server Components** (default): For data fetching, no 'use client' directive
- **Client Components**: Need 'use client' at top, for interactivity

### Database Access

**Server Components:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('recipes').select('*')
```

**Client Components:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('recipes').select('*')
```

### Authentication

Current user in Server Component:
```typescript
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()
```

Current user in Client Component:
```typescript
import { useUser } from '@clerk/nextjs'

const { user } = useUser()
```

### AI Integration

See `ai-integration.md` for detailed guide on using Claude API.

## Common Development Tasks

### Adding a New Page

1. Create file in `app/(dashboard)/your-page/page.tsx`
2. Export default async function component
3. Add navigation link in navbar/sidebar

### Creating a Component

1. Add to appropriate folder in `components/`
2. Use TypeScript for props
3. Follow shadcn/ui patterns for UI components

### Adding an API Route

1. Create `route.ts` in `app/api/your-route/`
2. Export GET, POST, etc. functions
3. Validate input with Zod
4. Check authentication

### Database Queries

1. Define TypeScript types in `types/`
2. Create custom hook in `hooks/` if complex
3. Use Supabase client with type generics
4. Handle loading and error states

## Development Workflow

1. **Feature Branch:** Create from `main`
2. **Develop:** Make changes, test locally
3. **Documentation:** Update docs if needed
4. **Commit:** Descriptive commit messages
5. **PR:** Create pull request for review

## Testing

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:e2e    # End-to-end tests
```

## Common Issues

### Authentication Errors
- Check Clerk keys in `.env.local`
- Verify middleware is configured
- Clear cookies and retry

### Database Connection
- Verify Supabase URL and keys
- Check RLS policies
- Ensure user is synced from Clerk webhook

### AI Not Responding
- Verify Anthropic API key
- Check rate limits
- Review API error logs

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Anthropic API](https://docs.anthropic.com)

## Next Steps

1. Review `architecture.md` for system design
2. Check `database-schema.md` for data model
3. See `plans/` folder for implementation roadmap
4. Join team chat for questions

## Getting Help

- Check existing documentation in `docs/`
- Review related code in similar features
- Ask in team chat
- Create GitHub issue for bugs
