import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MealPlanForm } from '@/components/meal-plans/meal-plan-form'

export default function NewMealPlanPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Meal Plan</h1>
        <p className="text-muted-foreground">
          Plan your meals for the week
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meal Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MealPlanForm />
        </CardContent>
      </Card>
    </div>
  )
}
