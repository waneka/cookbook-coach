'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Square } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateConversation } from '@/app/(dashboard)/coach/actions'

interface ChatInterfaceProps {
  initialMessage?: string
  conversationId: string | null
  initialMessages: any[]
}

export function ChatInterface({
  initialMessage,
  conversationId,
  initialMessages,
}: ChatInterfaceProps) {
  const router = useRouter()
  const hasSubmittedInitialRef = useRef(false)

  const { messages, sendMessage, status, stop } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
    }),
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  // Save messages to database when they change
  useEffect(() => {
    const saveMessages = async () => {
      if (conversationId && messages.length > 0 && !isLoading) {
        // Filter out messages with no displayable content before saving
        const messagesToSave = messages.filter((message) => {
          const hasText = message.parts.some((part) => part.type === 'text' && part.text?.trim())
          const hasToolPart =
            message.role === 'assistant' &&
            message.parts.some((part) => part.type?.startsWith('tool-'))
          return hasText || hasToolPart
        })

        console.log('💾 Saving messages to database:', messagesToSave.length, 'of', messages.length)
        await updateConversation(conversationId, messagesToSave)
      }
    }

    saveMessages()
  }, [messages, conversationId, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-submit initial message from URL query parameter
  useEffect(() => {
    if (initialMessage && !hasSubmittedInitialRef.current && status === 'ready') {
      console.log('✅ Auto-submitting message:', initialMessage)
      hasSubmittedInitialRef.current = true

      // Send the message directly
      sendMessage({ text: initialMessage })

      // Clear query params from URL
      router.replace('/coach', { scroll: false })
    }
  }, [initialMessage, status, sendMessage, router])

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

        {messages
          .filter((message) => {
            // Filter out messages with no displayable content
            const hasText = message.parts.some((part) => part.type === 'text' && part.text?.trim())
            const hasToolPart =
              message.role === 'assistant' &&
              message.parts.some((part) => part.type?.startsWith('tool-'))
            return hasText || hasToolPart
          })
          .map((message) => {
            return (
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
                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    return (
                      <p key={index} className="text-sm whitespace-pre-wrap">
                        {part.text}
                      </p>
                    )
                  }

                  // Handle tool parts (type starts with "tool-")
                  if (part.type?.startsWith('tool-') && message.role === 'assistant') {
                    const toolName = part.type.replace('tool-', '')
                    const output = (part as any).output

                    return (
                      <div key={index} className="text-sm space-y-2">
                        {/* Show what the AI did */}
                        <div className="flex items-center gap-2 text-muted-foreground italic">
                          {toolName === 'searchWeb' && '🔎 Searching the web...'}
                          {toolName === 'importRecipe' && '📥 Imported recipe from URL'}
                          {toolName === 'saveRecipe' && '✓ Saved recipe to your library'}
                          {toolName === 'searchRecipes' && '🔍 Searched your recipes'}
                          {toolName === 'fetchWebContent' && '🌐 Fetched web content'}
                          {toolName === 'updateDietaryPreferences' && '⚙️ Updated dietary preferences'}
                        </div>

                        {/* Show the result if there's a message */}
                        {output?.message && (
                          <p className="text-sm">{output.message}</p>
                        )}

                        {/* For importRecipe, show a preview of what was imported */}
                        {toolName === 'importRecipe' && output?.recipe && (
                          <div className="mt-2 p-3 bg-background rounded border">
                            <p className="font-medium">{output.recipe.title}</p>
                            {output.recipe.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {output.recipe.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Would you like me to save this to your library?
                            </p>
                          </div>
                        )}

                        {/* Show error if present */}
                        {output?.error && (
                          <p className="text-sm text-destructive">{output.error}</p>
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </Card>
          </div>
          )
        })}

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
          {isLoading ? (
            <Button
              type="button"
              onClick={() => stop()}
              size="icon"
              className="h-[60px] w-[60px]"
              variant="destructive"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!input?.trim()} size="icon" className="h-[60px] w-[60px]">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
