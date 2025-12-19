import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ShoppingCart, CheckCircle2, Archive } from 'lucide-react'
import { getShoppingLists } from './actions'

export default async function ShoppingListsPage() {
  const result = await getShoppingLists()
  const shoppingLists = result.data || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const activeLists = shoppingLists.filter((list) => list.status === 'active')
  const completedLists = shoppingLists.filter((list) => list.status === 'completed')
  const archivedLists = shoppingLists.filter((list) => list.status === 'archived')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Lists</h1>
          <p className="text-muted-foreground">
            Manage your shopping lists and generate them from meal plans
          </p>
        </div>
        <Button asChild>
          <Link href="/meal-plans">
            <Plus className="h-4 w-4 mr-2" />
            Generate from Meal Plan
          </Link>
        </Button>
      </div>

      {shoppingLists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No shopping lists yet</CardTitle>
            <CardDescription>
              Create a shopping list by generating one from a meal plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/meal-plans">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Meal Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Lists */}
          {activeLists.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Active Lists
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeLists.map((list) => (
                  <Link key={list.id} href={`/shopping-lists/${list.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <CardDescription>{formatDate(list.created_at)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(list.items) ? list.items.length : 0} items
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed Lists */}
          {completedLists.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed Lists
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedLists.map((list) => (
                  <Link key={list.id} href={`/shopping-lists/${list.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <CardDescription>{formatDate(list.created_at)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(list.items) ? list.items.length : 0} items
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Archived Lists */}
          {archivedLists.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archived Lists
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedLists.map((list) => (
                  <Link key={list.id} href={`/shopping-lists/${list.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <CardDescription>{formatDate(list.created_at)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(list.items) ? list.items.length : 0} items
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
