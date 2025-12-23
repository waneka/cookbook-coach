import { ChatInterface } from '@/components/chat/chat-interface'
import { Card } from '@/components/ui/card'
import { getLatestConversation, createConversation } from './actions'

interface CoachPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const params = await searchParams
  const initialMessage = params.q

  // Load or create conversation
  const conversationResult = await getLatestConversation()
  let conversationId: string | null = null
  let initialMessages: any[] = []

  if (conversationResult.success && conversationResult.data) {
    conversationId = conversationResult.data.id
    initialMessages = conversationResult.data.messages || []
  } else {
    const createResult = await createConversation()
    if (createResult.success && createResult.data) {
      conversationId = createResult.data.id
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="pb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-muted-foreground">
          Chat with your personal meal planning assistant
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <ChatInterface
          initialMessage={initialMessage}
          conversationId={conversationId}
          initialMessages={initialMessages}
        />
      </Card>
    </div>
  )
}
