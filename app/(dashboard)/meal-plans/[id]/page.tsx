import { notFound } from 'next/navigation'
import { getMealPlan } from '../actions'
import { DragDropMealPlanner } from '@/components/meal-plans/drag-drop-meal-planner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { DeleteMealPlanButton } from '@/components/meal-plans/delete-meal-plan-button'

interface MealPlanPageProps {
  params: Promise<{ id: string }>
}

export default async function MealPlanPage({ params }: MealPlanPageProps) {
  const { id } = await params
  const result = await getMealPlan(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const mealPlan = result.data

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meal-plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/meal-plans/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DeleteMealPlanButton mealPlanId={id} />
        </div>
      </div>

      <DragDropMealPlanner mealPlan={mealPlan} />
    </div>
  )
}
