'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AITestPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/test',
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

  const statusColor = {
    ready: 'bg-green-500',
    submitted: 'bg-yellow-500',
    streaming: 'bg-blue-500',
    error: 'bg-red-500',
  }[status]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI SDK Test</h1>
        <p className="text-muted-foreground">
          Testing Vercel AI SDK integration with Claude
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connection Status</CardTitle>
            <Badge variant="outline" className="gap-2">
              <div className={`h-2 w-2 rounded-full ${statusColor}`} />
              {status}
            </Badge>
          </div>
          <CardDescription>
            {status === 'ready' && 'Ready to send messages'}
            {status === 'submitted' && 'Sending your message...'}
            {status === 'streaming' && 'Receiving AI response...'}
            {status === 'error' && 'Error occurred - check console'}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No messages yet. Try saying hello!
              </p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <p key={index} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : null
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={status !== 'ready'}
              className="flex-1"
            />
            <Button type="submit" disabled={status !== 'ready'}>
              {status === 'streaming' ? 'Sending...' : 'Send'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Try asking "What can you help me with?"
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Quick Test Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            'Hello! Can you hear me?',
            'What can you help me with?',
            'Tell me a joke about cooking',
            'Explain streaming in simple terms',
          ].map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setInput(prompt)
                sendMessage({ text: prompt })
              }}
              disabled={status !== 'ready'}
            >
              {prompt}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
