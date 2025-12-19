'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, BookmarkPlus } from 'lucide-react'
import { AddRecipeDialog } from './add-recipe-dialog'
import type { MealPlanItemWithRecipe, MealType } from '@/types/meal-plan'
import Link from 'next/link'

interface MealCalendarProps {
  initialItems: MealPlanItemWithRecipe[]
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

export function MealCalendar({ initialItems }: MealCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [addRecipeDialog, setAddRecipeDialog] = useState<{
    open: boolean
    date: string
    mealType: MealType
  }>({
    open: false,
    date: '',
    mealType: 'breakfast',
  })

  // Calculate current week dates
  const getWeekDates = (offset: number) => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday
    const diff = currentDay === 0 ? -6 : 1 - currentDay // Adjust to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff + offset * 7)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeekOffset)
  const startDate = weekDates[0].toISOString().split('T')[0]
  const endDate = weekDates[6].toISOString().split('T')[0]

  // Group items by date and meal type
  const itemsByDateAndMeal = initialItems.reduce((acc, item) => {
    const dateKey = item.date
    const mealType = item.meal_type as MealType

    if (!acc[dateKey]) {
      acc[dateKey] = {} as Partial<Record<MealType, MealPlanItemWithRecipe[]>>
    }
    if (!acc[dateKey][mealType]) {
      acc[dateKey][mealType] = []
    }
    acc[dateKey][mealType]!.push(item)
    return acc
  }, {} as Record<string, Partial<Record<MealType, MealPlanItemWithRecipe[]>>>)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(0)}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/meal-plans/saved">
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Saved Plans
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/shopping-lists/generate?start=${startDate}&end=${endDate}`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Generate List
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const dateKey = formatDateKey(date)
          const itemsForDate = itemsByDateAndMeal[dateKey] || {}

          return (
            <Card key={dateKey} className={isToday(date) ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-medium">
                  {formatDate(date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {MEAL_TYPES.map((mealType) => {
                  const items = itemsForDate[mealType] || []

                  return (
                    <div key={mealType} className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">
                        {MEAL_TYPE_LABELS[mealType]}
                      </div>
                      {items.length > 0 ? (
                        <div className="space-y-1">
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              href={`/recipes/${item.recipe_id}`}
                              className="block"
                            >
                              <div className="text-xs p-2 rounded bg-accent hover:bg-accent/80 transition-colors">
                                {item.recipe?.title || 'Unknown Recipe'}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() =>
                          setAddRecipeDialog({
                            open: true,
                            date: dateKey,
                            mealType,
                          })
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add recipe dialog */}
      <AddRecipeDialog
        mealPlanId={null} // No meal plan for calendar view
        date={addRecipeDialog.date}
        mealType={addRecipeDialog.mealType}
        open={addRecipeDialog.open}
        onOpenChange={(open) =>
          setAddRecipeDialog({ ...addRecipeDialog, open })
        }
      />
    </div>
  )
}
