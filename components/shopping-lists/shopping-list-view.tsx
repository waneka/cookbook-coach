'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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

// Auto-categorize items based on keywords
function categorizeItem(ingredient: string): ItemCategory {
  const lower = ingredient.toLowerCase()

  // Produce
  if (/(apple|banana|orange|lemon|lime|avocado|tomato|lettuce|spinach|kale|carrot|celery|onion|garlic|potato|pepper|cucumber|broccoli|cauliflower|zucchini|squash|berry|berries|fruit|vegetable|herb|parsley|cilantro|basil|thyme|rosemary)/i.test(lower)) {
    return 'produce'
  }

  // Meat & Seafood
  if (/(chicken|beef|pork|turkey|lamb|fish|salmon|tuna|shrimp|steak|ground|sausage|bacon|ham|meat|seafood)/i.test(lower)) {
    return 'meat'
  }

  // Dairy & Eggs
  if (/(milk|cream|butter|cheese|yogurt|egg|sour cream|cottage cheese|cream cheese)/i.test(lower)) {
    return 'dairy'
  }

  // Frozen
  if (/(frozen|ice cream|popsicle)/i.test(lower)) {
    return 'frozen'
  }

  // Bakery
  if (/(bread|bun|roll|bagel|tortilla|pita|croissant|muffin|donut|cake|pastry)/i.test(lower)) {
    return 'bakery'
  }

  // Beverages
  if (/(water|juice|soda|coffee|tea|beer|wine|liquor|drink)/i.test(lower)) {
    return 'beverages'
  }

  // Pantry
  if (/(rice|pasta|flour|sugar|salt|pepper|oil|vinegar|sauce|spice|bean|lentil|cereal|oat|nut|seed|can|jar|box|bag)/i.test(lower)) {
    return 'pantry'
  }

  return 'other'
}

export function ShoppingListView({ shoppingList }: ShoppingListViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newItems, setNewItems] = useState('')
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

  const handleAddItems = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItems.trim()) return

    // Split by newlines and filter out empty lines
    const itemList = newItems
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    if (itemList.length === 0) return

    startTransition(async () => {
      let successCount = 0
      let errorCount = 0

      // Add each item with auto-categorization
      for (const ingredient of itemList) {
        const category = categorizeItem(ingredient)
        const result = await addItemToShoppingList({
          shopping_list_id: shoppingList.id,
          item: {
            ingredient,
            category,
          },
        })

        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        setNewItems('')
        toast.success(`Added ${successCount} item${successCount > 1 ? 's' : ''}`)
        router.refresh()
      }

      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} item${errorCount > 1 ? 's' : ''}`)
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

      {/* Add new items form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Items</CardTitle>
          <p className="text-xs text-muted-foreground">
            Add multiple items (one per line)
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItems} className="space-y-2">
            <Textarea
              placeholder="e.g., Bananas&#10;Milk&#10;Bread"
              value={newItems}
              onChange={(e) => setNewItems(e.target.value)}
              disabled={isPending}
              className="min-h-[80px] resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !newItems.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add {newItems.split('\n').filter(i => i.trim()).length > 1 ? 'Items' : 'Item'}
              </Button>
            </div>
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
