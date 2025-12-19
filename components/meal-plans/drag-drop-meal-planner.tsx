'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { WeekCalendarView } from './week-calendar-view'
import { RecipeLibraryPanel } from './recipe-library-panel'
import { RecipeDragOverlay } from './recipe-drag-overlay'
import { addRecipeToMealSlot } from '@/app/(dashboard)/meal-plans/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { MealPlanItemWithRecipe, MealType } from '@/types/meal-plan'
import type { Recipe } from '@/types/recipe'

interface DragDropMealPlannerProps {
  items: MealPlanItemWithRecipe[]
  mealPlanId: string | null
  mealPlanName: string
  startDate: string
  endDate: string
}

export function DragDropMealPlanner({
  items,
  mealPlanId,
  mealPlanName,
  startDate,
  endDate
}: DragDropMealPlannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, newItem: { recipe: Recipe; date: string; mealType: MealType }) => [
      ...state,
      {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        meal_plan_id: mealPlanId || 'temp',
        recipe_id: newItem.recipe.id,
        date: newItem.date,
        meal_type: newItem.mealType,
        servings: 1,
        notes: null,
        position: 0,
        created_at: new Date().toISOString(),
        recipe: {
          id: newItem.recipe.id,
          title: newItem.recipe.title,
          image_url: newItem.recipe.image_url || undefined,
          prep_time_minutes: newItem.recipe.prep_time_minutes || undefined,
          cook_time_minutes: newItem.recipe.cook_time_minutes || undefined,
        },
      } as MealPlanItemWithRecipe,
    ]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const recipe = event.active.data.current?.recipe
    if (recipe) {
      setActiveRecipe(recipe)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRecipe(null)
    setSelectedMealType(null)

    const { active, over } = event

    if (!over) return

    const recipe = active.data.current?.recipe as Recipe
    if (!recipe) return

    // Handle drop on week view (has mealType in drop data)
    if (over.data.current?.mealType) {
      const { date, mealType } = over.data.current

      startTransition(async () => {
        // Optimistically add the item
        addOptimisticItem({ recipe, date, mealType })

        // Call server action in background
        const result = await addRecipeToMealSlot({
          meal_plan_id: mealPlanId,
          recipe_id: recipe.id,
          date,
          meal_type: mealType,
        })

        if (result.success) {
          toast.success(`Added ${recipe.title} to ${mealType}`)
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to add recipe')
          router.refresh() // Refresh to remove optimistic update
        }
      })
    }
  }

  // Create a temporary meal plan object for WeekCalendarView
  const tempMealPlan = {
    id: mealPlanId || 'calendar',
    name: mealPlanName,
    start_date: startDate,
    end_date: endDate,
    items: optimisticItems,
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-screen">
        {/* Calendar Section */}
        <Card className="mb-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">{mealPlanName}</h2>
            </div>

            <WeekCalendarView
              mealPlan={tempMealPlan as any}
              activeRecipe={activeRecipe}
            />
          </CardContent>
        </Card>

        {/* Recipe Library Panel - Fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <RecipeLibraryPanel
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeRecipe ? <RecipeDragOverlay recipe={activeRecipe} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
