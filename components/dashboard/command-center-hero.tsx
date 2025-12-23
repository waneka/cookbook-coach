'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Calendar, ShoppingCart, Utensils, Sparkles } from 'lucide-react'

const QUICK_ACTIONS = [
  { icon: Utensils, label: 'Pasta ideas', href: '/coach?q=find pasta recipes' },
  { icon: Calendar, label: 'Plan week', href: '/meal-plans' },
  { icon: ShoppingCart, label: 'Shopping list', href: '/shopping-lists' },
  { icon: Sparkles, label: 'Surprise me', href: '/coach?q=suggest something new' },
]

export function CommandCenterHero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/coach?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Hero Text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            What should I cook this week?
          </h1>
          <p className="text-muted-foreground">
            Ask your AI coach anything about meal planning, recipes, or cooking
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="e.g., Find me healthy dinner recipes for this week..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-14 text-base"
            />
          </div>
        </form>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.href)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
