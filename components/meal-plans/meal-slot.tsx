'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { MealPlanItemWithRecipe } from '@/types/meal-plan'
import Image from 'next/image'
import { removeMealPlanItem } from '@/app/(dashboard)/meal-plans/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MealSlotProps {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  items: MealPlanItemWithRecipe[]
  onAddRecipe: (date: string, mealType: string) => void
}

export function MealSlot({ date, mealType, items, onAddRecipe }: MealSlotProps) {
  const router = useRouter()

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeMealPlanItem(itemId)
    if (result.success) {
      toast.success('Recipe removed from meal plan')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to remove recipe')
    }
  }

  return (
    <Card className="h-full min-h-[120px]">
      <CardContent className="p-3 space-y-2">
        {items.length === 0 ? (
          <Button
            variant="ghost"
            className="w-full h-full min-h-[96px] border-2 border-dashed"
            onClick={() => onAddRecipe(date, mealType)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg border bg-card p-2 hover:bg-accent transition-colors"
              >
                <div className="flex gap-2">
                  {item.recipe?.image_url && (
                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.recipe.image_url}
                        alt={item.recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.recipe?.title || 'Unknown Recipe'}
                    </p>
                    {item.servings && item.servings > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {item.servings} servings
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onAddRecipe(date, mealType)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
