'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WeekCalendarView } from './week-calendar-view'
import { MonthCalendarView } from './month-calendar-view'
import { RecipeLibraryPanel } from './recipe-library-panel'
import { DraggableRecipeCard } from './draggable-recipe-card'
import { RecipeDragOverlay } from './recipe-drag-overlay'
import { addRecipeToMealSlot } from '@/app/(dashboard)/meal-plans/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { MealPlanWithItems, MealType } from '@/types/meal-plan'
import type { Recipe } from '@/types/recipe'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DragDropMealPlannerProps {
  mealPlan: MealPlanWithItems
}

type CalendarView = 'week' | 'month'

export function DragDropMealPlanner({ mealPlan }: DragDropMealPlannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)

  const [optimisticMealPlan, addOptimisticItem] = useOptimistic(
    mealPlan,
    (state, newItem: { recipe: Recipe; date: string; mealType: MealType }) => ({
      ...state,
      items: [
        ...state.items,
        {
          id: `temp-${Date.now()}`,
          meal_plan_id: state.id,
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
        },
      ],
    })
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
      const { date, mealType, mealPlanId } = over.data.current

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
    // Handle drop on month view (needs meal type selection)
    else if (over.data.current?.date && calendarView === 'month') {
      // For month view, we need to ask which meal type
      // For now, default to lunch
      const { date, mealPlanId } = over.data.current
      const mealType = 'lunch'

      startTransition(async () => {
        // Optimistically add the item
        addOptimisticItem({ recipe, date, mealType })

        const result = await addRecipeToMealSlot({
          meal_plan_id: mealPlanId,
          recipe_id: recipe.id,
          date,
          meal_type: mealType,
        })

        if (result.success) {
          toast.success(`Added ${recipe.title}`)
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to add recipe')
          router.refresh() // Refresh to remove optimistic update
        }
      })
    }
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
              <h2 className="text-xl font-semibold">{optimisticMealPlan.name}</h2>
              <Select value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={isPanelCollapsed ? (calendarView === 'week' ? '' : 'h-[calc(100vh-300px)] overflow-auto') : (calendarView === 'week' ? '' : 'h-[250px] overflow-auto')}>
              {calendarView === 'week' ? (
                <WeekCalendarView mealPlan={optimisticMealPlan} activeRecipe={activeRecipe} />
              ) : (
                <MonthCalendarView mealPlan={optimisticMealPlan} />
              )}
            </div>
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
