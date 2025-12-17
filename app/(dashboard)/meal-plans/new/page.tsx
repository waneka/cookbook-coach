import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Meal plan creation will be implemented in Phase 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will feature a weekly calendar view where you can drag and drop recipes or get AI suggestions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
