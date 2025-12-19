'use client'

import { useDroppable } from '@dnd-kit/core'
import { Card } from '@/components/ui/card'
import type { MealPlanWithItems, MealType, MealPlanItemWithRecipe } from '@/types/meal-plan'

interface MonthCalendarViewProps {
  mealPlan: MealPlanWithItems
}

// Color coding for meal types
const MEAL_TYPE_COLORS = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-blue-500',
  dinner: 'bg-purple-500',
  snack: 'bg-green-500',
}

function DroppableDayCell({ date, items, mealPlanId }: { date: string; items: MealPlanItemWithRecipe[]; mealPlanId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `month-${date}`,
    data: { date, mealPlanId },
  })

  const dayNumber = new Date(date + 'T00:00:00').getDate()
  const isToday = date === new Date().toISOString().split('T')[0]

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] p-2 border rounded-lg transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-muted'
      } ${isToday ? 'bg-accent' : 'bg-card'}`}
    >
      <div className="text-sm font-medium mb-1">{dayNumber}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`w-2 h-2 rounded-full ${MEAL_TYPE_COLORS[item.meal_type as MealType]}`}
            title={`${item.recipe?.title} (${item.meal_type})`}
          />
        ))}
      </div>
    </div>
  )
}

export function MonthCalendarView({ mealPlan }: MonthCalendarViewProps) {
  const start = new Date(mealPlan.start_date)
  const end = new Date(mealPlan.end_date)

  // Get the first day of the month and last day of the month
  const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1)
  const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0)

  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // Calculate total cells needed
  const daysInMonth = lastDayOfMonth.getDate()
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

  // Generate all dates for the calendar
  const calendarDates: (string | null)[] = []

  // Add empty cells for days before the month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDates.push(null)
  }

  // Add all days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), day)
    calendarDates.push(date.toISOString().split('T')[0])
  }

  // Add empty cells to complete the last week
  while (calendarDates.length < totalCells) {
    calendarDates.push(null)
  }

  // Group items by date
  const itemsByDate: Record<string, typeof mealPlan.items> = {}
  mealPlan.items.forEach((item) => {
    if (!itemsByDate[item.date]) {
      itemsByDate[item.date] = []
    }
    itemsByDate[item.date].push(item)
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDates.map((date, index) => (
          <div key={index}>
            {date ? (
              <DroppableDayCell
                date={date}
                items={itemsByDate[date] || []}
                mealPlanId={mealPlan.id}
              />
            ) : (
              <div className="min-h-[80px] p-2 border border-transparent" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
