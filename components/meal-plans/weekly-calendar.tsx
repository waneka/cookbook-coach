'use client'

import { useState } from 'react'
import { MealSlot } from './meal-slot'
import { AddRecipeDialog } from './add-recipe-dialog'
import type { MealPlanWithItems, MealsByDate, MealType } from '@/types/meal-plan'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

interface WeeklyCalendarProps {
  mealPlan: MealPlanWithItems
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function WeeklyCalendar({ mealPlan }: WeeklyCalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null)

  // Generate dates between start and end
  const getDatesInRange = () => {
    const dates: string[] = []
    const start = new Date(mealPlan.start_date)
    const end = new Date(mealPlan.end_date)

    let current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const dates = getDatesInRange()

  // Group items by date and meal type
  const groupedItems: MealsByDate = {}
  dates.forEach((date) => {
    groupedItems[date] = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
  })

  mealPlan.items.forEach((item) => {
    if (groupedItems[item.date]) {
      groupedItems[item.date][item.meal_type as MealType].push(item)
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleAddRecipe = (date: string, mealType: string) => {
    setSelectedSlot({ date, mealType: mealType as MealType })
  }

  return (
    <>
      <div className="space-y-4">
        {dates.map((date) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 pt-0">
              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground px-1">
                    {MEAL_TYPE_LABELS[mealType]}
                  </h4>
                  <MealSlot
                    date={date}
                    mealType={mealType}
                    items={groupedItems[date][mealType]}
                    onAddRecipe={handleAddRecipe}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {selectedSlot && (
        <AddRecipeDialog
          mealPlanId={mealPlan.id}
          date={selectedSlot.date}
          mealType={selectedSlot.mealType}
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
        />
      )}
    </>
  )
}
