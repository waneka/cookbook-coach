import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'

// Simple test endpoint to verify AI SDK is working
// Visit: http://localhost:3000/api/ai/test (GET)
// Or POST with { messages: [...] }

export async function GET() {
  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: 'Say "Hello from Vercel AI SDK!" in a friendly way.',
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI SDK test error:', error)
    return new Response(
      JSON.stringify({
        error: 'AI SDK test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure ANTHROPIC_API_KEY is set in .env.local'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: 'You are a helpful assistant testing the Vercel AI SDK integration.',
      messages: convertToModelMessages(messages), // Convert UIMessage[] to ModelMessage[]
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('AI SDK test error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
