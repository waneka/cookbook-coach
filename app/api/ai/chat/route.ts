import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages,
      system: `You are a helpful meal planning and cooking assistant. You help users:
- Plan balanced, healthy meals
- Discover new recipes
- Understand dietary needs and restrictions
- Organize their meal planning
- Get cooking tips and substitutions

Be friendly, concise, and practical. Focus on actionable advice.
When discussing recipes, consider nutritional balance, variety, and the user's preferences.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
