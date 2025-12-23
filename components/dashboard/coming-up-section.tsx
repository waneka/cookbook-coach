import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock } from 'lucide-react'
import type { MealPlanItemWithRecipe } from '@/types/meal-plan'

interface ComingUpSectionProps {
  upcomingMeals: {
    date: string
    items: MealPlanItemWithRecipe[]
  }[]
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const MEAL_TYPE_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
}

function formatDate(dateString: string) {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) {
    return 'Today'
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}

export function ComingUpSection({ upcomingMeals }: ComingUpSectionProps) {
  if (upcomingMeals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Coming Up</h2>
        </div>

        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No meals planned yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start planning your week! Add recipes to your calendar or ask your AI coach for suggestions.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/meal-plans">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Meals
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coach">Ask AI Coach</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Coming Up</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/meal-plans">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {upcomingMeals.map((day) => (
          <Card key={day.date} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(day.date)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">No meals planned</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/meal-plans">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal
                    </Link>
                  </Button>
                </div>
              ) : (
                day.items.map((item) => {
                  if (!item.recipe) return null

                  return (
                    <Link
                      key={item.id}
                      href={`/recipes/${item.recipe_id}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {item.recipe.image_url ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                          <Image
                            src={item.recipe.image_url}
                            alt={item.recipe.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">
                            {MEAL_TYPE_EMOJI[item.meal_type] || '🍽️'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">
                          {MEAL_TYPE_LABELS[item.meal_type] || item.meal_type}
                        </div>
                        <div className="font-medium text-sm line-clamp-2 group-hover:underline">
                          {item.recipe.title}
                        </div>
                        {(item.recipe.prep_time_minutes || item.recipe.cook_time_minutes) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {(item.recipe.prep_time_minutes || 0) + (item.recipe.cook_time_minutes || 0)} min
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  )
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
