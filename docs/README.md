# Cookbook Coach Documentation

Welcome to the Cookbook Coach documentation! This living documentation will help you understand, develop, and maintain the application.

## Documentation Index

### Getting Started
- **[Getting Started Guide](./getting-started.md)** - Setup instructions, project structure, and common development tasks

### Architecture & Design
- **[Architecture Overview](./architecture.md)** - System design, patterns, tech stack, and architectural decisions
- **[Database Schema](./database-schema.md)** - Complete database schema with tables, relationships, RLS policies, and common queries
- **[AI Integration Guide](./ai-integration.md)** - Complete guide to using Vercel AI SDK with Claude
- **[AI SDK Comparison](./ai-sdk-comparison.md)** - Analysis: Vercel AI SDK vs. Anthropic SDK

### Implementation Plans
- **[Main Implementation Plan](../plans/meal-planner-app-implementation.md)** - Comprehensive plan with phases, tasks, and deliverables

## Quick Links

### Core Technologies
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clerk Docs](https://clerk.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Development Tools
- [Vercel](https://vercel.com/docs)
- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)

## Documentation Philosophy

This documentation is designed to be:

1. **Living** - Updated as the codebase evolves
2. **Practical** - Focus on how-to guides and real examples
3. **Comprehensive** - Cover architecture, API, components, and patterns
4. **AI-Friendly** - Written to help AI agents understand the codebase context

## Contributing to Documentation

When making significant changes to the codebase:

1. Update relevant documentation files
2. Add new guides if introducing new patterns
3. Keep code examples up-to-date
4. Update architecture docs for major decisions

## Project Vision

Cookbook Coach aims to be a personal AI-powered meal planning assistant that:

- Makes meal planning effortless through conversational AI
- Adapts to dietary needs and preferences
- Saves time with automated shopping lists
- Provides a delightful cooking experience
- Respects privacy with user-owned data

## Key Features

1. **Recipe Management** - Save, edit, and organize recipes
2. **AI Coach** - Conversational meal planning assistant
3. **Meal Planning** - Weekly plans with drag-and-drop interface
4. **Shopping Lists** - Auto-generated from meal plans
5. **Cook Mode** - Step-by-step cooking instructions (stretch)

## Tech Stack Summary

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Auth:** Clerk (user management and authentication)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **AI:** Anthropic Claude API
- **Testing:** Vitest, Playwright, MSW
- **Deployment:** Vercel

## Project Structure

```
cookbook-coach/
├── app/              # Next.js App Router
├── components/       # React components
├── lib/             # Utilities and integrations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── docs/            # This documentation
└── plans/           # Implementation plans
```

## Development Phases

The project is being built in phases:

1. **Foundation Setup** - Auth, database, UI framework
2. **Recipe Management** - CRUD operations for recipes
3. **AI Coach Integration** - Conversational interface
4. **Meal Planning** - Weekly meal plan creation
5. **Shopping Lists** - Automated list generation
6. **Cook Mode** - Enhanced cooking experience (stretch)
7. **Polish & Optimization** - Production readiness

See the [implementation plan](../plans/meal-planner-app-implementation.md) for details.

## Getting Help

- Check the relevant documentation file
- Review code examples in similar features
- Consult the tech stack documentation
- Review git history for context on changes

## Questions or Feedback

This is a personal project, but documentation improvements are always welcome!
