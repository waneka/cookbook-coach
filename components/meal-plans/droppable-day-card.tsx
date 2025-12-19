'use client'

import { Card } from '@/components/ui/card'
import { DroppableMealSlot } from './droppable-meal-slot'
import type { MealPlanItemWithRecipe, MealType } from '@/types/meal-plan'

interface DroppableDayCardProps {
  date: string
  items: MealPlanItemWithRecipe[]
  mealPlanId: string
  isOver?: boolean
  isDragging?: boolean
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_TYPE_LABELS = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D',
  snack: 'S',
}

export function DroppableDayCard({ date, items, mealPlanId, isOver, isDragging }: DroppableDayCardProps) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00')
    return {
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    }
  }

  const { weekday, day } = formatDate(date)

  // Group items by meal type
  const itemsByMealType: Record<MealType, MealPlanItemWithRecipe[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }

  items.forEach((item) => {
    if (item.meal_type in itemsByMealType) {
      itemsByMealType[item.meal_type as MealType].push(item)
    }
  })

  return (
    <div className={`border-r last:border-r-0 transition-all ${isOver ? 'bg-green-500/10' : ''}`}>
      <div className="p-1">
        <div className="text-center mb-1">
          <div className="text-xs text-muted-foreground">{weekday}</div>
          <div className="text-sm font-medium">{day}</div>
        </div>

        {isDragging ? (
          // Show meal type slots when dragging
          <div className="space-y-0.5">
            {MEAL_TYPES.map((mealType) => (
              <DroppableMealSlot
                key={mealType}
                date={date}
                mealType={mealType}
                items={itemsByMealType[mealType]}
                mealPlanId={mealPlanId}
              />
            ))}
          </div>
        ) : (
          // Show all items grouped when not dragging
          <div className="space-y-0.5 min-h-[100px]">
            {items.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Empty
              </div>
            ) : (
              MEAL_TYPES.map((mealType) => (
                itemsByMealType[mealType].length > 0 && (
                  <div key={mealType}>
                    <DroppableMealSlot
                      date={date}
                      mealType={mealType}
                      items={itemsByMealType[mealType]}
                      mealPlanId={mealPlanId}
                      compact
                    />
                  </div>
                )
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
