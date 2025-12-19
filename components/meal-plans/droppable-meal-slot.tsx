'use client'

import { useDroppable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { removeMealPlanItem } from '@/app/(dashboard)/meal-plans/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { MealPlanItemWithRecipe, MealType } from '@/types/meal-plan'

interface DroppableMealSlotProps {
  date: string
  mealType: MealType
  items: MealPlanItemWithRecipe[]
  mealPlanId: string
  compact?: boolean
}

// Color coding for meal types
const MEAL_TYPE_COLORS = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-blue-500',
  dinner: 'bg-purple-500',
  snack: 'bg-green-500',
}

const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function DroppableMealSlot({ date, mealType, items, mealPlanId, compact }: DroppableMealSlotProps) {
  const router = useRouter()

  const { setNodeRef, isOver } = useDroppable({
    id: `${date}-${mealType}`,
    data: { date, mealType, mealPlanId },
  })

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeMealPlanItem(itemId)
    if (result.success) {
      toast.success('Recipe removed')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to remove recipe')
    }
  }

  if (compact && items.length === 0) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded transition-colors ${
        compact
          ? 'min-h-0'
          : `min-h-[40px] border border-dashed p-1 ${isOver ? 'border-green-500 bg-green-500/10' : 'border-muted'}`
      }`}
    >
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-10 text-[10px] text-muted-foreground">
          {MEAL_TYPE_LABELS[mealType]}
        </div>
      ) : (
        <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group rounded bg-card hover:bg-accent transition-colors"
            >
              <div className={`flex gap-1 items-center ${compact ? 'p-0.5' : 'p-1'}`}>
                <div
                  className={`w-0.5 h-full rounded ${MEAL_TYPE_COLORS[mealType]} flex-shrink-0`}
                />
                {item.recipe?.image_url && !compact && (
                  <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={item.recipe.image_url}
                      alt={item.recipe.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className={`flex-1 min-w-0 truncate font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  {item.recipe?.title || 'Unknown Recipe'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`}
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
