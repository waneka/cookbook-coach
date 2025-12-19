'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DroppableMealSlot } from './droppable-meal-slot'
import { AddRecipeDialog } from './add-recipe-dialog'
import type { MealPlanItemWithRecipe, MealType } from '@/types/meal-plan'

interface DroppableDayCardProps {
  date: string
  items: MealPlanItemWithRecipe[]
  mealPlanId: string | null
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
  const [addRecipeDialog, setAddRecipeDialog] = useState<{
    open: boolean
    mealType: MealType
  }>({
    open: false,
    mealType: 'lunch',
  })

  const formatDate = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00')
    return {
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    }
  }

  const { weekday, day} = formatDate(date)

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
              <div className="flex items-center justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-16 w-full"
                  onClick={() => setAddRecipeDialog({ open: true, mealType: 'lunch' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Button>
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

      {/* Add Recipe Dialog */}
      <AddRecipeDialog
        mealPlanId={mealPlanId}
        date={date}
        mealType={addRecipeDialog.mealType}
        open={addRecipeDialog.open}
        onOpenChange={(open) => setAddRecipeDialog({ ...addRecipeDialog, open })}
      />
    </div>
  )
}
