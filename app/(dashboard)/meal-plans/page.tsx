import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function MealPlansPage() {
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

      <Card>
        <CardHeader>
          <CardTitle>No meal plans yet</CardTitle>
          <CardDescription>
            Create your first meal plan to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Meal plans will be implemented in Phase 4. You'll be able to create weekly plans and get AI assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
