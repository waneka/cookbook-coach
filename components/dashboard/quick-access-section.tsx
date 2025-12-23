import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Star, Plus, ArrowRight, Clock } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

interface ShoppingListSummary {
  id: string
  name: string
  itemCount: number
  checkedCount: number
}

interface QuickAccessSectionProps {
  shoppingLists: ShoppingListSummary[]
  recentRecipes: Recipe[]
}

export function QuickAccessSection({ shoppingLists, recentRecipes }: QuickAccessSectionProps) {
  const activeList = shoppingLists.find(list => list.itemCount > list.checkedCount)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Shopping Lists */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Lists
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/shopping-lists">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activeList ? (
            <Link href={`/shopping-lists/${activeList.id}`} className="block group">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium group-hover:underline">{activeList.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {activeList.checkedCount} of {activeList.itemCount} items checked
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {activeList.itemCount - activeList.checkedCount}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(activeList.checkedCount / activeList.itemCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Link>
          ) : shoppingLists.length > 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">All lists completed!</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/shopping-lists">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Lists
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No shopping lists yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/meal-plans">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate from Meal Plan
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Recipes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recent Recipes
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recipes">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRecipes.length > 0 ? (
            <div className="space-y-3">
              {recentRecipes.slice(0, 3).map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex gap-3 group"
                >
                  {recipe.image_url ? (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1 group-hover:underline">
                      {recipe.title}
                    </div>
                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No recipes yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
