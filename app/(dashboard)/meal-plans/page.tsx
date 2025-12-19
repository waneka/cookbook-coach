import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { getMealPlans } from './actions'

export default async function MealPlansPage() {
  const result = await getMealPlans()
  const mealPlans = result.data || []

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Plans</h1>
          <p className="text-muted-foreground">
            View and manage your meal plans
          </p>
        </div>
        <Button asChild>
          <Link href="/meal-plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New Meal Plan
          </Link>
        </Button>
      </div>

      {mealPlans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No meal plans yet</CardTitle>
            <CardDescription>
              Create your first meal plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/meal-plans/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Meal Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mealPlans.map((plan) => (
            <Link key={plan.id} href={`/meal-plans/${plan.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-2">{plan.name}</CardTitle>
                  <CardDescription>
                    {formatDateRange(plan.start_date, plan.end_date)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
