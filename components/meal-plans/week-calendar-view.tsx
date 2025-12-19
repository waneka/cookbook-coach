'use client'

import { DroppableDayCard } from './droppable-day-card'
import type { MealPlanWithItems, MealsByDate } from '@/types/meal-plan'
import type { Recipe } from '@/types/recipe'

interface WeekCalendarViewProps {
  mealPlan: MealPlanWithItems
  activeDayId?: string | null
  activeRecipe?: Recipe | null
}

export function WeekCalendarView({ mealPlan, activeDayId, activeRecipe }: WeekCalendarViewProps) {
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

  // Group items by date
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
      const mealType = item.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack'
      groupedItems[item.date][mealType].push(item)
    }
  })

  // Flatten items by date for the day card
  const itemsByDate: Record<string, typeof mealPlan.items> = {}
  dates.forEach((date) => {
    itemsByDate[date] = mealPlan.items.filter((item) => item.date === date)
  })

  return (
    <div className="grid grid-cols-7 gap-1">
      {dates.map((date) => (
        <DroppableDayCard
          key={date}
          date={date}
          items={itemsByDate[date]}
          mealPlanId={mealPlan.id}
          isOver={activeDayId === date}
          isDragging={!!activeRecipe}
        />
      ))}
    </div>
  )
}
