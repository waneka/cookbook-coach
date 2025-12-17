# AI SDK Comparison: Vercel AI SDK vs. Anthropic SDK

## Summary

**Recommendation: Use Vercel AI SDK** ✅

The Vercel AI SDK is the superior choice for this project due to its React-first design, built-in streaming support, provider flexibility, and seamless Next.js integration.

## Detailed Comparison

### Vercel AI SDK

#### Pros ✅

1. **Provider Agnostic**
   - Easily switch between AI providers (Anthropic, OpenAI, Google, etc.)
   - Same API regardless of provider
   - Future-proof if we want to add model selection

2. **React Hooks Built-in**
   - `useChat()` hook handles all chat state management
   - Automatic message handling, loading states, error handling
   - No need to manually manage streaming state

3. **Streaming Support**
   - `streamText()` with automatic streaming to client
   - `toUIMessageStreamResponse()` for Next.js API routes
   - Server Actions support for modern Next.js patterns

4. **Tool/Function Calling**
   - Built-in tool calling with Zod schema validation
   - Perfect for future features like recipe suggestions, meal plan generation
   - Type-safe tool definitions

5. **Next.js Integration**
   - Designed specifically for Next.js 13+ App Router
   - Works seamlessly with Server Components and Server Actions
   - Optimized for Edge Runtime

6. **Type Safety**
   - Full TypeScript support
   - `UIMessage` type for consistent message handling
   - Auto-completion for all APIs

7. **Minimal Client Bundle**
   - Only ships necessary code to client
   - React hooks are lightweight
   - Server-side code stays server-side

#### Cons ⚠️

1. **Extra Abstraction**
   - Another layer on top of Anthropic API
   - Slight learning curve for Vercel-specific patterns

2. **Bundle Size**
   - Adds ~30kb to bundle (minimal impact)

### Anthropic SDK (Direct)

#### Pros ✅

1. **Direct API Access**
   - No abstraction layer
   - Official Anthropic SDK

2. **Full Control**
   - Access to all Anthropic-specific features immediately
   - Direct control over API calls

#### Cons ⚠️

1. **Manual Streaming Implementation**
   - Need to handle SSE streams manually
   - More boilerplate code for React integration

2. **Provider Lock-in**
   - Switching to another provider requires rewriting code
   - Can't easily A/B test different models

3. **No React Hooks**
   - Must build own state management
   - Manual handling of loading, errors, optimistic updates

4. **More Code to Write**
   - Custom streaming logic
   - Message formatting
   - Error handling
   - UI state management

## Code Comparison

### Vercel AI SDK

**API Route** (`app/api/chat/route.ts`):
```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    system: 'You are a helpful meal planning assistant.'
  })

  return result.toUIMessageStreamResponse()
}
```

**Client Component**:
```tsx
'use client'
import { useChat } from '@ai-sdk/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  )
}
```

**Total: ~30 lines of code** ✅

### Anthropic SDK (Direct)

**API Route** (`app/api/chat/route.ts`):
```typescript
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages,
    stream: true,
  })

  // Custom SSE encoding
  const encoder = new TextEncoder()
  const customStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.delta?.text || ''
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }
      controller.close()
    }
  })

  return new Response(customStream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

**Client Component**:
```tsx
'use client'
import { useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          assistantMessage += data.text
          setMessages([...newMessages, { role: 'assistant', content: assistantMessage }])
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </form>
    </div>
  )
}
```

**Total: ~80+ lines of code** ⚠️

## Feature Comparison Matrix

| Feature | Vercel AI SDK | Anthropic SDK |
|---------|--------------|---------------|
| Streaming Support | ✅ Built-in | ⚠️ Manual implementation |
| React Hooks | ✅ `useChat`, `useCompletion` | ❌ Build your own |
| Type Safety | ✅ Full TypeScript | ✅ Full TypeScript |
| Provider Flexibility | ✅ Swap providers easily | ❌ Locked to Anthropic |
| Tool Calling | ✅ Built-in with Zod | ✅ Supported |
| Next.js Integration | ✅ Optimized | ⚠️ Manual setup |
| Server Actions | ✅ Supported | ⚠️ Manual setup |
| Bundle Size | ~30kb | ~15kb |
| Loading States | ✅ Automatic | ❌ Manual |
| Error Handling | ✅ Built-in | ❌ Manual |
| Optimistic Updates | ✅ Built-in | ❌ Manual |
| Message Management | ✅ Automatic | ❌ Manual state |
| Learning Curve | Low | Medium |

## Use Cases for Vercel AI SDK

Perfect for:
- ✅ **Chat interfaces** (like our AI Coach)
- ✅ **Streaming responses** (better UX)
- ✅ **Multi-model support** (test different providers)
- ✅ **Rapid development** (less boilerplate)
- ✅ **Next.js applications** (first-class support)
- ✅ **Tool calling** (recipe suggestions, meal planning)

## Use Cases for Anthropic SDK

Consider if:
- ⚠️ Need absolute control over every API call
- ⚠️ Using Anthropic-specific features not yet in Vercel SDK
- ⚠️ Building non-React applications
- ⚠️ Minimal bundle size is critical (saving ~15kb)

## Migration Path

If we start with Vercel AI SDK and later need direct Anthropic access:
- Vercel AI SDK uses `@ai-sdk/anthropic` under the hood
- Can still access raw Anthropic SDK if needed
- Not locked in - easy to migrate

## Recommendation for Cookbook Coach

**Use Vercel AI SDK** because:

1. **Faster Development** - Built-in hooks save weeks of work
2. **Better UX** - Streaming and loading states handled automatically
3. **Future-Proof** - Easy to add OpenAI, Google, etc. for comparison
4. **Less Code** - ~60% less code to maintain
5. **Type Safety** - Excellent TypeScript support
6. **Next.js Native** - Built for the framework we're using

## Installation

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/react
```

## Environment Variables

```bash
# Keep the same Anthropic key
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## Updated Tech Stack

- ✅ **Vercel AI SDK** - AI orchestration and streaming
- ✅ **@ai-sdk/anthropic** - Anthropic provider for AI SDK
- ✅ **@ai-sdk/react** - React hooks for chat UIs
- ❌ ~~@anthropic-ai/sdk~~ - Not needed, AI SDK handles it

## Next Steps

1. Install Vercel AI SDK packages
2. Update implementation plan to use AI SDK patterns
3. Create AI route handlers with `streamText`
4. Build chat UI with `useChat` hook
5. Add tool calling for meal planning features
