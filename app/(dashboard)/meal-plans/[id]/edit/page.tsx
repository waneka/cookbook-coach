import { notFound } from 'next/navigation'
import { getMealPlan } from '../../actions'
import { MealPlanForm } from '@/components/meal-plans/meal-plan-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EditMealPlanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMealPlanPage({ params }: EditMealPlanPageProps) {
  const { id } = await params
  const result = await getMealPlan(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const mealPlan = result.data

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/meal-plans/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Meal Plan</h1>
          <p className="text-muted-foreground">
            Update your meal plan details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meal Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MealPlanForm initialData={mealPlan} mode="edit" />
        </CardContent>
      </Card>
    </div>
  )
}
