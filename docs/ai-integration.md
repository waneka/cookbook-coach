# AI Integration with Vercel AI SDK

## Overview

Cookbook Coach uses the **Vercel AI SDK** to power its conversational meal planning assistant. This provides a unified interface for AI interactions with built-in streaming, React hooks, and tool calling support.

## Why Vercel AI SDK?

See [AI SDK Comparison](./ai-sdk-comparison.md) for a detailed analysis. In short:
- Built-in React hooks (`useChat`)
- Native streaming support
- Provider flexibility (can switch from Claude to GPT easily)
- Less boilerplate code (~60% reduction)
- First-class Next.js integration

## Installation

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/react
```

## Environment Setup

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

## Architecture

### Three-Tier Pattern

1. **Client Component** - Uses `useChat` hook from `@ai-sdk/react`
2. **API Route** - Handles streaming with `streamText` from `ai`
3. **AI Provider** - Anthropic Claude via `@ai-sdk/anthropic`

```
Client (useChat) → API Route (streamText) → Anthropic (Claude)
                    ↓
                 Streaming Response
```

## Basic Chat Implementation

### Step 1: Create API Route

`app/api/chat/route.ts`:

```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful meal planning assistant. You help users:
    - Create personalized meal plans
    - Find recipes that match their dietary needs
    - Suggest ingredient substitutions
    - Generate shopping lists

    Be friendly, concise, and focus on practical meal planning advice.`,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
```

### Step 2: Create Chat Component

`app/dashboard/coach/page.tsx`:

```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function CoachPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="space-y-4">
        {messages.map(message => (
          <Card key={message.id} className="p-4">
            <div className="font-semibold mb-2">
              {message.role === 'user' ? 'You' : 'AI Coach'}
            </div>
            {message.parts.map((part, index) =>
              part.type === 'text' ? (
                <div key={index}>{part.text}</div>
              ) : null
            )}
          </Card>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about meal planning..."
          disabled={status !== 'ready'}
        />
        <Button type="submit" disabled={status !== 'ready'}>
          {status === 'streaming' ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  )
}
```

## Advanced Features

### Tool Calling (Function Calling)

Enable the AI to call functions like searching recipes or creating meal plans.

`app/api/chat/route.ts`:

```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a meal planning assistant with access to the user\'s recipe library.',
    messages,
    tools: {
      searchRecipes: tool({
        description: 'Search for recipes in the user\'s library by tags or ingredients',
        inputSchema: z.object({
          tags: z.array(z.string()).optional(),
          ingredients: z.array(z.string()).optional(),
        }),
        execute: async ({ tags, ingredients }) => {
          let query = supabase.from('recipes').select('*')

          if (tags && tags.length > 0) {
            query = query.overlaps('tags', tags)
          }

          const { data, error } = await query

          if (error) return { recipes: [] }

          return { recipes: data }
        },
      }),
      createMealPlan: tool({
        description: 'Create a new meal plan with specified recipes',
        inputSchema: z.object({
          name: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          recipeIds: z.array(z.string()),
        }),
        execute: async ({ name, startDate, endDate, recipeIds }) => {
          // Implementation
          return { success: true, mealPlanId: 'generated-id' }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
```

### Streaming with Loading States

Handle different states during AI response:

```typescript
const { messages, sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
})

// status can be: 'ready' | 'submitted' | 'streaming' | 'error'

return (
  <>
    {/* Show loading indicator */}
    {status === 'streaming' && (
      <div className="flex items-center gap-2">
        <Spinner />
        <span>AI is thinking...</span>
        <Button onClick={stop} variant="ghost">Stop</Button>
      </div>
    )}

    {/* Disable input while processing */}
    <Input disabled={status !== 'ready'} />
  </>
)
```

### Conversation Context

Pass additional context to the AI:

```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: `You are a meal planning assistant.

  User Context:
  - Dietary restrictions: ${userPreferences.restrictions.join(', ')}
  - Cuisine preferences: ${userPreferences.cuisines.join(', ')}
  - Cooking skill: ${userPreferences.skillLevel}
  - Available recipes: ${recipeCount}
  `,
  messages,
})
```

### Error Handling

```typescript
const { messages, error } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
  onError: (error) => {
    console.error('Chat error:', error)
    toast.error('Failed to send message. Please try again.')
  },
})

// Display error in UI
{error && (
  <div className="text-red-500">
    Error: {error.message}
  </div>
)}
```

## Meal Planning-Specific Patterns

### Recipe Suggestion Flow

```typescript
// System prompt for recipe suggestions
const recipeAssistantPrompt = `You are a recipe recommendation assistant.

Available recipes: ${JSON.stringify(recipes)}

When suggesting recipes:
1. Match dietary restrictions exactly
2. Consider prep/cook time preferences
3. Suggest complementary meals
4. Explain why each recipe fits

Format suggestions as:
- Recipe name
- Why it's a good fit
- Prep time
- Key ingredients
`
```

### Meal Plan Generation

```typescript
// API route for meal plan creation with AI assistance
export async function POST(req: Request) {
  const { dietaryRequirements, preferences, recipeLibrary } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `Create a balanced weekly meal plan.

Requirements: ${JSON.stringify(dietaryRequirements)}
Preferences: ${JSON.stringify(preferences)}
Available Recipes: ${JSON.stringify(recipeLibrary)}

Respond with a structured meal plan in JSON format.`,
    prompt: 'Create a meal plan for the week',
  })

  return result.toUIMessageStreamResponse()
}
```

## Performance Optimization

### Throttle UI Updates

Reduce re-renders during streaming:

```typescript
const { messages } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
  experimental_throttle: 50, // Update every 50ms instead of every chunk
})
```

### Edge Runtime

Deploy API routes to Edge for lower latency:

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  // Streaming works great on Edge
}
```

## Testing

### Mock AI Responses

```typescript
// __tests__/chat.test.tsx
import { render, screen } from '@testing-library/react'
import { useChat } from '@ai-sdk/react'

jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(),
}))

test('displays AI responses', () => {
  (useChat as jest.Mock).mockReturnValue({
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi!' }] },
    ],
    sendMessage: jest.fn(),
    status: 'ready',
  })

  render(<ChatComponent />)

  expect(screen.getByText('Hello')).toBeInTheDocument()
  expect(screen.getByText('Hi!')).toBeInTheDocument()
})
```

## Common Patterns

### Suggested Prompts

```typescript
const suggestedPrompts = [
  "Help me plan meals for this week",
  "I need a vegetarian dinner idea",
  "What can I make with chicken and rice?",
  "Create a shopping list from my meal plan",
]

<div className="grid grid-cols-2 gap-2">
  {suggestedPrompts.map(prompt => (
    <Button
      key={prompt}
      variant="outline"
      onClick={() => sendMessage({ text: prompt })}
    >
      {prompt}
    </Button>
  ))}
</div>
```

### Message Formatting

```typescript
// Format messages with markdown, code blocks, lists, etc.
import ReactMarkdown from 'react-markdown'

{message.parts.map((part, index) =>
  part.type === 'text' ? (
    <ReactMarkdown key={index}>{part.text}</ReactMarkdown>
  ) : null
)}
```

## Best Practices

1. **Keep system prompts focused** - Be specific about the AI's role
2. **Validate tool inputs** - Always use Zod schemas for tool calling
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Rate limit** - Implement rate limiting on API routes
5. **Stream responses** - Always use streaming for better UX
6. **Persist conversations** - Save to database for conversation history
7. **Add context** - Include relevant user data in system prompts
8. **Test thoroughly** - Mock AI responses in tests

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [Anthropic Claude Docs](https://docs.anthropic.com/)
- [AI SDK Comparison](./ai-sdk-comparison.md)
