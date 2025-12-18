'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import {
  createConversation,
  getLatestConversation,
  updateConversation,
} from '@/app/(dashboard)/coach/actions'

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
    }),
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  // Load or create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      const result = await getLatestConversation()

      if (result.success && result.data) {
        // Load existing conversation
        setConversationId(result.data.id)
        if (result.data.messages && Array.isArray(result.data.messages)) {
          setMessages(result.data.messages)
        }
      } else {
        // Create new conversation
        const createResult = await createConversation()
        if (createResult.success && createResult.data) {
          setConversationId(createResult.data.id)
        }
      }

      setIsInitialized(true)
    }

    initConversation()
  }, [])

  // Save messages to database when they change
  useEffect(() => {
    const saveMessages = async () => {
      if (conversationId && isInitialized && messages.length > 0 && !isLoading) {
        await updateConversation(conversationId, messages)
      }
    }

    saveMessages()
  }, [messages, conversationId, isInitialized, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input })
      setInput('')
      // Keep focus on input after sending - use longer delay to ensure it happens after scroll
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium mb-2">Start a conversation with your AI coach</p>
            <p className="text-sm">Ask about recipes, meal planning, dietary advice, and more!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="p-4">
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <p key={index} className="text-sm whitespace-pre-wrap">
                      {part.text}
                    </p>
                  ) : null
                )}
              </div>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-muted">
              <div className="p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">AI is thinking...</p>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recipes, meal planning, or dietary advice..."
            className="min-h-[60px] max-h-[200px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input?.trim()} size="icon" className="h-[60px] w-[60px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
