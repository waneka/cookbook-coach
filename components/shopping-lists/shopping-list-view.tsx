'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { updateItemChecked, addItemToShoppingList, deleteItemFromShoppingList } from '@/app/(dashboard)/shopping-lists/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ShoppingListWithParsedFields, ItemCategory } from '@/types/shopping-list'

interface ShoppingListViewProps {
  shoppingList: ShoppingListWithParsedFields & { recipeMap: Record<string, string> }
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  produce: '🥬 Produce',
  meat: '🍖 Meat & Seafood',
  dairy: '🥛 Dairy & Eggs',
  pantry: '🥫 Pantry',
  frozen: '❄️ Frozen',
  bakery: '🍞 Bakery',
  beverages: '🥤 Beverages',
  other: '📦 Other',
}

export function ShoppingListView({ shoppingList }: ShoppingListViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newItem, setNewItem] = useState('')
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  // Group items by category
  const itemsByCategory = shoppingList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<ItemCategory, typeof shoppingList.items>)

  const handleCheckItem = async (itemId: string, checked: boolean) => {
    startTransition(async () => {
      const result = await updateItemChecked(shoppingList.id, { itemId, checked })
      if (!result.success) {
        toast.error(result.error || 'Failed to update item')
      }
      router.refresh()
    })
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return

    startTransition(async () => {
      const result = await addItemToShoppingList({
        shopping_list_id: shoppingList.id,
        item: {
          ingredient: newItem.trim(),
        },
      })

      if (result.success) {
        setNewItem('')
        toast.success('Item added')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to add item')
      }
    })
  }

  const handleDeleteItem = async (itemId: string) => {
    startTransition(async () => {
      const result = await deleteItemFromShoppingList(shoppingList.id, itemId)
      if (result.success) {
        toast.success('Item removed')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to remove item')
      }
    })
  }

  const handleCopyAsMarkdown = async () => {
    let markdown = `# ${shoppingList.name}\n\n`

    // Add items by category
    Object.entries(CATEGORY_LABELS).forEach(([category, label]) => {
      const items = itemsByCategory[category as ItemCategory]
      if (items && items.length > 0) {
        markdown += `## ${label}\n\n`
        items.forEach((item) => {
          const checkbox = item.checked ? '[x]' : '[ ]'
          const amount = item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount || ''
          markdown += `- ${checkbox} ${amount} ${item.ingredient}`.trim() + '\n'
        })
        markdown += '\n'
      }
    })

    try {
      await navigator.clipboard.writeText(markdown)
      setCopiedToClipboard(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const checkedCount = shoppingList.items.filter((item) => item.checked).length
  const totalCount = shoppingList.items.length

  return (
    <div className="space-y-4">
      {/* Header with stats and copy button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {checkedCount} of {totalCount} items checked
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyAsMarkdown} disabled={isPending}>
          {copiedToClipboard ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy as Markdown
            </>
          )}
        </Button>
      </div>

      {/* Add new item form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              placeholder="e.g., Bananas, Milk, etc."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !newItem.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Items grouped by category */}
      {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
        const items = itemsByCategory[category as ItemCategory]
        if (!items || items.length === 0) return null

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const hasRecipes = item.recipeBreakdown && item.recipeBreakdown.length > 0
                const isExpanded = expandedItems.has(item.id)

                return (
                  <div key={item.id} className="rounded-lg hover:bg-accent group">
                    <div className="flex items-center gap-3 p-2">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)}
                        disabled={isPending}
                      />
                      <div
                        className={`flex-1 min-w-0 ${hasRecipes ? 'cursor-pointer' : ''}`}
                        onClick={() => hasRecipes && toggleExpanded(item.id)}
                      >
                        <div className="flex items-center gap-2">
                          {hasRecipes && (
                            <span className="text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                          )}
                          <span className={`${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                            {item.amount && item.unit ? (
                              <span className="font-medium">
                                {item.amount} {item.unit}{' '}
                              </span>
                            ) : item.amount ? (
                              <span className="font-medium">{item.amount} </span>
                            ) : null}
                            {item.ingredient}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Expanded recipe breakdown */}
                    {isExpanded && hasRecipes && (
                      <div className="px-2 pb-2 pl-12">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {item.recipeBreakdown!.map((breakdown, index) => {
                            const formatDate = (dateString: string) => {
                              const date = new Date(dateString + 'T00:00:00')
                              return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short'
                              })
                            }

                            return (
                              <div key={index}>
                                {breakdown.amount && breakdown.unit ? (
                                  <span className="font-medium">{breakdown.amount} {breakdown.unit}</span>
                                ) : breakdown.amount ? (
                                  <span className="font-medium">{breakdown.amount}</span>
                                ) : (
                                  <span className="font-medium">Some</span>
                                )}{' '}
                                for{' '}
                                <Link
                                  href={`/recipes/${breakdown.recipeId}`}
                                  className="hover:underline text-foreground"
                                >
                                  {shoppingList.recipeMap[breakdown.recipeId] || 'Unknown Recipe'}
                                </Link>
                                {breakdown.date && (
                                  <span className="text-muted-foreground"> ({formatDate(breakdown.date)})</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {shoppingList.items.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No items yet. Add some items to get started!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
