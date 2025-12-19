import { MealPlannerContainer } from '@/components/meal-plans/meal-planner-container'
import { getMealPlanItemsByDateRange } from './actions'

export default async function MealPlansPage() {
  // Fetch items for a 3-month range (past 1 month + future 2 months)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setMonth(today.getMonth() - 1)
  const endDate = new Date(today)
  endDate.setMonth(today.getMonth() + 2)

  const result = await getMealPlanItemsByDateRange(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )

  const items = result.data || []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meal Planning</h1>
        <p className="text-muted-foreground">
          Plan your meals for the week
        </p>
      </div>

      <MealPlannerContainer
        initialItems={items}
        mode="calendar"
      />
    </div>
  )
}
