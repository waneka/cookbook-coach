import { ChatInterface } from '@/components/chat/chat-interface'
import { Card } from '@/components/ui/card'

export default function CoachPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="pb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-muted-foreground">
          Chat with your personal meal planning assistant
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <ChatInterface />
      </Card>
    </div>
  )
}
