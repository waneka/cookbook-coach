# Architecture Documentation

## Overview

Cookbook Coach is a Next.js 15 application using the App Router architecture with React Server Components. The application follows a modern, type-safe, serverless architecture.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude API
- **Hosting:** Vercel (recommended)

## Architecture Patterns

### Server Components vs Client Components

**Server Components (Default):**
- Used for data fetching, layout, and static content
- Direct database access via Supabase server client
- Better performance, smaller bundle size
- Examples: recipe listing pages, meal plan views

**Client Components ('use client'):**
- Used for interactivity, state management, browser APIs
- Forms, chat interfaces, drag-and-drop
- Examples: recipe forms, AI chat, shopping list checkboxes

### Data Flow

```
User Request
    ↓
Next.js Middleware (Clerk Auth)
    ↓
App Router (Server Component)
    ↓
[Server Action or API Route]
    ↓
Supabase (via RLS policies)
    ↓
Response to Client
```

### Authentication Flow

1. User signs in via Clerk
2. Clerk middleware validates session
3. Clerk webhook syncs user to Supabase `users` table
4. All subsequent requests include Clerk user ID
5. Supabase RLS policies enforce data access based on user ID

### AI Integration Pattern

```
Client Component (Chat UI)
    ↓
API Route (/api/ai/chat)
    ↓
Anthropic Claude API (streaming)
    ↓
Stream response to client
    ↓
Persist conversation to Supabase
```

## File Organization

### Route Groups
- `(auth)` - Public authentication pages
- `(dashboard)` - Protected application pages

### Colocation
- Components near their usage
- Server actions in route folders
- Shared utilities in `/lib`

## Database Strategy

### PostgreSQL via Supabase
- Relational data model
- JSONB for flexible data (ingredients, nutrition)
- Row Level Security (RLS) for authorization
- Real-time subscriptions (future feature)

### Type Safety
- Generated TypeScript types from Supabase schema
- Zod validation for runtime safety
- Type-safe database queries

## State Management

### Server State
- Supabase queries via hooks
- React Server Components for initial data
- Optimistic updates with React Query (if needed)

### Client State
- React hooks for local UI state
- URL state for filters/search
- Context for theme and global UI

## API Design

### REST-ful Routes
- `/api/recipes` - Recipe CRUD
- `/api/meal-plans` - Meal plan management
- `/api/shopping-lists` - Shopping list operations
- `/api/ai/chat` - AI conversation

### Server Actions
- Preferred for mutations from Server Components
- Automatic CSRF protection
- Type-safe

## Security Model

### Authentication
- Clerk handles auth completely
- JWT tokens in cookies
- Middleware protects routes

### Authorization
- Row Level Security in Supabase
- Users can only access their own data
- Server actions verify ownership

### Input Validation
- Zod schemas on all inputs
- Sanitization for XSS prevention
- Rate limiting on AI endpoints

## Performance Optimization

### Strategies
- Server Components reduce JavaScript bundle
- Streaming for AI responses
- Image optimization with Next.js Image
- Database indexes on common queries
- Caching with React `cache()` function

### Loading Patterns
- Suspense boundaries for streaming
- Skeleton loaders for UX
- Optimistic UI updates

## Error Handling

### Layers
1. **Component Level:** Error boundaries, fallback UI
2. **API Level:** Structured error responses, status codes
3. **Database Level:** Transaction rollbacks, constraint validation
4. **AI Level:** Timeout handling, fallback responses

### User Feedback
- Toast notifications (Sonner)
- Inline validation errors
- Graceful degradation

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server
npm run db:migrate   # Run database migrations
npm run db:types     # Generate TypeScript types
npm run test         # Run tests
```

### Environment Setup
- `.env.local` for local development
- Environment variables in Vercel for production

## Deployment Strategy

### Vercel Deployment
- Automatic deployments from `main` branch
- Preview deployments for PRs
- Environment variables configured in dashboard
- Edge functions for performance

### Database Migrations
- Supabase migrations tracked in version control
- Applied automatically via CI/CD or manually
- Schema changes tested in preview environments

## Monitoring & Observability

### Metrics
- Vercel Analytics for performance
- Error tracking (Sentry recommended)
- Database query performance (Supabase dashboard)
- AI usage and costs

### Logging
- Server logs via Vercel
- Client errors to error tracking service
- AI conversation logs for debugging

## Accessibility

### Standards
- WCAG 2.1 Level AA compliance
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader support

### Tools
- shadcn/ui built on Radix (accessible primitives)
- Lighthouse audits
- axe DevTools for testing

## Extension Points

### Future Integrations
- Calendar APIs (Google Calendar)
- Grocery delivery (Instacart)
- Nutrition APIs
- Recipe sharing/social features
- Mobile app (React Native)

### Plugin Architecture
- Modular AI prompt system
- Configurable recipe parsers
- Extensible export formats
