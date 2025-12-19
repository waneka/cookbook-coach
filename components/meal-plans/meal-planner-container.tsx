'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, BookmarkPlus, ShoppingCart } from 'lucide-react'
import { DragDropMealPlanner } from './drag-drop-meal-planner'
import type { MealPlanItemWithRecipe } from '@/types/meal-plan'
import Link from 'next/link'

interface MealPlannerContainerProps {
  initialItems: MealPlanItemWithRecipe[]
  mode: 'calendar' | 'saved-plan'
  mealPlanId?: string | null
  mealPlanName?: string
  startDate?: string
  endDate?: string
}

export function MealPlannerContainer({
  initialItems,
  mode,
  mealPlanId = null,
  mealPlanName,
  startDate,
  endDate,
}: MealPlannerContainerProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Calculate current week dates for calendar mode
  const getWeekDates = (offset: number) => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday
    const diff = currentDay === 0 ? -6 : 1 - currentDay // Adjust to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff + offset * 7)

    const weekStart = new Date(monday)
    const weekEnd = new Date(monday)
    weekEnd.setDate(monday.getDate() + 6)

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    }
  }

  // For calendar mode, filter items by current week
  const weekDates = mode === 'calendar' ? getWeekDates(currentWeekOffset) : null
  const filteredItems = mode === 'calendar' && weekDates
    ? initialItems.filter((item) => item.date >= weekDates.start && item.date <= weekDates.end)
    : initialItems

  const displayStartDate = weekDates?.start || startDate
  const displayEndDate = weekDates?.end || endDate
  const displayName = mealPlanName || 'Meal Planning'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {mode === 'calendar' ? (
          <>
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
                <Link href={`/shopping-lists/generate?start=${displayStartDate}&end=${displayEndDate}`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Generate List
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {/* Drag-drop planner */}
      <DragDropMealPlanner
        items={filteredItems}
        mealPlanId={mealPlanId}
        mealPlanName={displayName}
        startDate={displayStartDate!}
        endDate={displayEndDate!}
      />
    </div>
  )
}
